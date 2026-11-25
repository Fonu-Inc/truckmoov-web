import type {
  InstallerJobStatus, SystemInstallationJob, SystemInstaller,
} from "@truckmoov/api/auth";

/**
 * Platform installation records — fleetflow's `lib/platformInstallations`, live
 * branch only. Fleetflow projects demo installer jobs, customer bookings and
 * procurement requests into one record; here every record comes from
 * GET /auth/system/installation-orders, the way fleetflow maps its live
 * `installer_jobs` rows.
 */
export type InstallationStatus = "pending" | "awaiting_assignment" | "assigned" | "scheduled" | "in_progress" | "completed" | "requires_attention" | "cancelled";
export const INSTALLATION_STATUS_LABEL: Record<InstallationStatus, string> = {
  pending: "Pending",
  awaiting_assignment: "Awaiting Assignment",
  assigned: "Awaiting Acceptance",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  requires_attention: "Requires Attention",
  cancelled: "Cancelled",
};

/** The API job statuses behind each installation status, for filtering on the server. Pending has none. */
export const JOB_STATUSES_BY_INSTALLATION_STATUS: Partial<Record<InstallationStatus, InstallerJobStatus[]>> = {
  awaiting_assignment: ["unassigned"],
  assigned: ["assigned"],
  scheduled: ["scheduled"],
  in_progress: ["in_progress"],
  requires_attention: [
    "overdue",
    "issue_reported",
  ],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

export type InstallationRecord = {
  key: string;
  source: "live";
  id: string;
  reference: string;
  customer: string;
  customerEmail?: string;
  fleet: string;
  vehicleCount: number | null;
  scheduledDate: string;
  createdAt: string;
  status: InstallationStatus;
  /** Recorded field-work dates; the API only records completion. */
  startedAt?: string;
  completedAt?: string;
  installerId?: string | null;
  installerName?: string;
  liveDetails?: Record<string, unknown>;
  tenantType?: string;
  deviceCount?: number | null;
};

/**
 * Fleetflow's job → installation status mapping, extended with this API's job
 * states: `unassigned` waits for an installer, `assigned` is an offer the
 * installer has not accepted yet (fleetflow's "offered"), and `overdue` /
 * `issue_reported` need attention.
 */
export function jobInstallationStatus(status: string): InstallationStatus {
  switch (status) {
    case "created": case "pending": return "pending";
    case "unassigned": case "awaiting_assignment": case "offered": return "awaiting_assignment";
    case "assigned": return "assigned";
    case "accepted": case "scheduled": return "scheduled";
    case "in_progress": return "in_progress";
    case "completed": case "active": return "completed";
    case "cancelled": return "cancelled";
    default: return "requires_attention";
  }
}

export function fromSystemInstallationJob(job: SystemInstallationJob): InstallationRecord {
  const status = jobInstallationStatus(job.status);
  return {
    key: `live:${job.id}`,
    source: "live",
    id: job.id,
    reference: job.jobNumber || job.id,
    customer: job.customer || "Customer not recorded",
    customerEmail: job.customerEmail ?? undefined,
    fleet: "-",
    vehicleCount: job.vehicleCount,
    deviceCount: job.deviceCount,
    tenantType: job.tenantType === "owner_operator"
      ? "Owner-Operator"
      : job.tenantType === "enterprise" ? "Enterprise" : undefined,
    createdAt: job.createdAt,
    scheduledDate: job.scheduledDate,
    status,
    startedAt: job.startedAt ?? undefined,
    completedAt: job.completedAt ?? undefined,
    installerId: job.installer?.id ?? null,
    installerName: job.installer?.fullName,
    liveDetails: {
      ...job,
      customer: {
        city: job.location.city,
        state: job.location.state,
        address: [
          job.location.city,
          job.location.state,
        ].filter(Boolean).join(", "),
        contactName: job.siteContactName,
        contactPhone: job.siteContactPhone,
      },
    },
  };
}

export function filterInstallationRecords(records: InstallationRecord[], search: string, status: string, sources: string[], sort: string) {
  const query = search.trim().toLowerCase();
  return records.filter(r => (!query || [
    r.reference,
    r.customer,
    r.fleet,
    r.installerName,
  ].some(v => v?.toLowerCase().includes(query)))
  && (status === "all" || r.status === status) && (!sources.length || sources.includes(r.source)))
    .sort((a, b) => sort === "customer"
      ? a.customer.localeCompare(b.customer)
      : sort === "scheduled" ? (a.scheduledDate || "9999").localeCompare(b.scheduledDate || "9999") : b.createdAt.localeCompare(a.createdAt));
}

export type InstallationTableFilters = {
  tenantType?: string;
  assignment?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  startedFrom?: string;
  startedTo?: string;
  completedFrom?: string;
  completedTo?: string;
  createdFrom?: string;
  createdTo?: string;
};

/** Date-only (YYYY-MM-DD) range check against values that may carry a time. */
function inDateRange(value: string | undefined, from?: string, to?: string) {
  const day = (value || "").slice(
    0,
    10,
  );
  if (from && (!day || day < from))
    return false;
  if (to && (!day || day > to))
    return false;
  return true;
}

/** Presentation-only table filters; records are never mutated. Empty/absent fields match everything. */
export function filterInstallationsByFields(records: InstallationRecord[], filters: InstallationTableFilters) {
  const tenantType = filters.tenantType?.toLowerCase();
  return records.filter((r) => {
    if (tenantType && (r.tenantType || "").toLowerCase().replace(
      /[\s-]+/g,
      "_",
    ) !== tenantType) {
      return false;
    }
    if (filters.assignment === "assigned" && !r.installerId && !r.installerName)
      return false;
    if (filters.assignment === "unassigned" && (r.installerId || r.installerName))
      return false;
    if (!inDateRange(
      r.scheduledDate,
      filters.scheduledFrom,
      filters.scheduledTo,
    )) {
      return false;
    }
    if (!inDateRange(
      r.startedAt,
      filters.startedFrom,
      filters.startedTo,
    )) {
      return false;
    }
    if (!inDateRange(
      r.completedAt,
      filters.completedFrom,
      filters.completedTo,
    )) {
      return false;
    }
    if (!inDateRange(
      r.createdAt,
      filters.createdFrom,
      filters.createdTo,
    )) {
      return false;
    }
    return true;
  });
}

export function installationTotals(records: InstallationRecord[]) {
  return {
    total: records.length,
    completed: records.filter(r => r.status === "completed").length,
    inProgress: records.filter(r => r.status === "in_progress").length,
    cancelled: records.filter(r => r.status === "cancelled").length,
  };
}

/** Occupancy is separate from account eligibility and includes work on other dates. */
export function installerHasActiveAssignment(installerId: string, records: InstallationRecord[]) {
  return records.some(record => record.installerId === installerId
    && record.status !== "completed" && record.status !== "cancelled");
}

export function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function canChangeInstallationAssignment(status: InstallationStatus) {
  return [
    "pending",
    "awaiting_assignment",
    "assigned",
    "scheduled",
  ].includes(status);
}

function recordLocation(record: InstallationRecord) {
  const live = objectValue(record.liveDetails?.customer);
  return {
    state: typeof live.state === "string" ? live.state : "",
    city: typeof live.city === "string" ? live.city : "",
  };
}

/** City/state matches are not measured distances; unknown locations remain unranked. */
function normalizeInstallationLocation(value: string) {
  return value.trim().toLowerCase().replace(
    /\s+state$/,
    "",
  ).replace(
    /^(abuja \(fct\)|fct - abuja)$/,
    "fct",
  );
}

/**
 * Fleetflow's `eligibleInstallers`. The API records no supported device or
 * vehicle types per installer, so only status and service area gate eligibility.
 */
export function eligibleInstallers(record: InstallationRecord, installers: SystemInstaller[]) {
  const { state } = recordLocation(record);
  const normalize = normalizeInstallationLocation;
  return installers.filter(i => i.status === "active" && (!state || normalize(i.state) === normalize(state) || i.serviceAreas.some(area => normalize(area) === normalize(state))));
}

/**
 * Fleetflow's installation waitlist: unassigned orders wait for automatic
 * assignment, and one whose location no active installer covers is flagged
 * "Requires Attention". Pass `null` until the installer list has loaded so
 * nothing is flagged early.
 */
export function waitlistRecords(records: InstallationRecord[], installers: SystemInstaller[] | null): InstallationRecord[] {
  return records
    .filter(r => r.status === "awaiting_assignment" && !r.installerId)
    .map(r => installers && eligibleInstallers(
      r,
      installers,
    ).length === 0
      ? {
          ...r, status: "requires_attention" as const,
        }
      : r);
}

export function installerScheduleConflict(record: InstallationRecord, installerId: string, records: InstallationRecord[]) {
  return records.some(other => other.key !== record.key && other.installerId === installerId
    && [
      "awaiting_assignment",
      "scheduled",
      "in_progress",
    ].includes(other.status)
    && !!record.scheduledDate && other.scheduledDate === record.scheduledDate);
}

export function rankInstallationInstallers(record: InstallationRecord, installers: SystemInstaller[]) {
  const {
    state, city,
  } = recordLocation(record);
  const normalize = normalizeInstallationLocation;
  return installers.map((installer) => {
    const sameState = !!state && !!installer.state && normalize(state) === normalize(installer.state);
    const sameCity = sameState && !!city && !!installer.city && normalize(city) === normalize(installer.city);
    const match = sameCity ? "Same city" : sameState ? "Same state" : (!city && !state) || (!installer.city && !installer.state) ? "Location not recorded" : "Other service area";
    return {
      installer, match, rank: sameCity ? 0 : sameState ? 1 : match === "Location not recorded" ? 3 : 2,
    };
  }).sort((a, b) => a.rank - b.rank || `${a.installer.firstName} ${a.installer.lastName}`.localeCompare(`${b.installer.firstName} ${b.installer.lastName}`));
}
