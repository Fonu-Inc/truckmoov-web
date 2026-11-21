import type { SystemInstallationJob } from "@truckmoov/api/auth";

/**
 * Platform installation records — fleetflow's `lib/platformInstallations`, live
 * branch only. Fleetflow projects demo installer jobs, customer bookings and
 * procurement requests into one record; here every record comes from
 * GET /auth/system/installation-orders, the way fleetflow maps its live
 * `installer_jobs` rows.
 */
export type InstallationStatus = "pending" | "awaiting_assignment" | "scheduled" | "in_progress" | "completed" | "requires_attention" | "cancelled";
export const INSTALLATION_STATUS_LABEL: Record<InstallationStatus, string> = {
  pending: "Pending",
  awaiting_assignment: "Awaiting Assignment",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  requires_attention: "Requires Attention",
  cancelled: "Cancelled",
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
    case "unassigned": case "assigned": case "awaiting_assignment": case "offered": return "awaiting_assignment";
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
    fleet: "—",
    vehicleCount: job.vehicleCount,
    deviceCount: job.deviceCount,
    // The API does not record the tenant type, creation time or start time yet.
    tenantType: undefined,
    createdAt: "",
    scheduledDate: job.scheduledDate,
    status,
    completedAt: status === "completed" ? job.completedAt ?? undefined : undefined,
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
