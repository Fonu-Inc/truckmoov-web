import type { SystemInstallationJob } from "@truckmoov/api/auth";
import type { InstallationRecord } from "./platformInstallations";
import {
  describe, expect, it,
} from "vitest";
import {
  filterInstallationRecords,
  filterInstallationsByFields,
  fromSystemInstallationJob,
  installationTotals,
  installerHasActiveAssignment,
  jobInstallationStatus,
} from "./platformInstallations";

// Ported from fleetflow's src/test/platformInstallations.test.ts — the cases that
// do not depend on its demo installer / booking / procurement stores.
const job: SystemInstallationJob = {
  id: "job-1",
  jobNumber: "INS-0001",
  tenantId: "tenant-1",
  customer: "Marina Freight Services",
  siteContactName: "Site lead",
  siteContactPhone: "+2348000000000",
  firstVehicle: null,
  firstDevice: null,
  location: {
    city: "Ikeja", state: "Lagos",
  },
  vehicleCount: 2,
  deviceCount: 2,
  scheduledDate: "2026-11-23",
  scheduledAt: "2026-11-23T08:00:00Z",
  scheduledUntil: "2026-11-23T12:00:00Z",
  status: "scheduled",
  completedAt: null,
  installer: null,
  issueTicket: null,
};
function records(jobs: Partial<SystemInstallationJob>[]) {
  return jobs.map((j, n) => fromSystemInstallationJob({
    ...job, id: `job-${n}`, ...j,
  }));
}
function installer(id: string) {
  return {
    id, code: id, fullName: "Ada Obi",
  };
}

describe(
  "platform installation lifecycle",
  () => {
    it(
      "marks an installer assigned to a job even when work is scheduled on another date",
      () => {
        expect(installerHasActiveAssignment(
          "assigned-installer",
          records([
            {
              installer: installer("assigned-installer"), status: "scheduled", scheduledDate: "2026-12-01",
            },
          ]),
        )).toBe(true);
      },
    );
    it(
      "marks an installer available when only completed or cancelled jobs remain",
      () => {
        const done = records([
          {
            installer: installer("free-installer"), status: "completed",
          },
          {
            installer: installer("free-installer"), status: "cancelled",
          },
        ]);
        expect(installerHasActiveAssignment(
          "free-installer",
          done,
        )).toBe(false);
        expect(installerHasActiveAssignment(
          "unassigned-installer",
          done,
        )).toBe(false);
      },
    );
    it(
      "counts installation totals directly from recorded lifecycle states",
      () => {
        const all = records([
          { status: "completed" },
          { status: "in_progress" },
          { status: "cancelled" },
          { status: "scheduled" },
        ]);
        expect(installationTotals(all)).toEqual({
          total: 4, completed: 1, inProgress: 1, cancelled: 1,
        });
        expect(installationTotals(all.map(r => ({
          ...r, status: "completed",
        })))).toEqual({
          total: 4, completed: 4, inProgress: 0, cancelled: 0,
        });
      },
    );
    it(
      "maps pending requests",
      () => expect(jobInstallationStatus("created")).toBe("pending"),
    );
    it(
      "keeps offers awaiting assignment until accepted",
      () => expect(jobInstallationStatus("offered")).toBe("awaiting_assignment"),
    );
    it(
      "keeps unaccepted API offers awaiting assignment",
      () => expect(jobInstallationStatus("assigned")).toBe("awaiting_assignment"),
    );
    it(
      "maps scheduled installations",
      () => expect(jobInstallationStatus("scheduled")).toBe("scheduled"),
    );
    it(
      "maps work in progress",
      () => expect(jobInstallationStatus("in_progress")).toBe("in_progress"),
    );
    it(
      "maps completed installations",
      () => expect(jobInstallationStatus("completed")).toBe("completed"),
    );
    it(
      "maps issues to requires attention",
      () => expect(jobInstallationStatus("issue_reported")).toBe("requires_attention"),
    );
    it(
      "maps overdue work to requires attention",
      () => expect(jobInstallationStatus("overdue")).toBe("requires_attention"),
    );
    it(
      "filters the existing records by search, status and source",
      () => {
        const all = records([{ status: "scheduled" }]);
        expect(filterInstallationRecords(
          all,
          job.customer,
          "scheduled",
          ["live"],
          "customer",
        ).map(r => r.id)).toEqual(["job-0"]);
        expect(filterInstallationRecords(
          all,
          "no matching customer",
          "all",
          [],
          "newest",
        )).toHaveLength(0);
      },
    );
    it(
      "names the assigned installer and keeps completion dates only for completed work",
      () => {
        const [
          assigned,
          completed,
        ] = records([
          { installer: installer("i1") },
          {
            status: "completed", completedAt: "2026-11-20T10:00:00Z",
          },
        ]);
        expect(assigned.installerName).toBe("Ada Obi");
        expect(assigned.completedAt).toBeUndefined();
        expect(completed.completedAt).toBe("2026-11-20T10:00:00Z");
      },
    );
  },
);

describe(
  "installation table field filters",
  () => {
    const base: InstallationRecord = {
      key: "k1", source: "live", id: "1", reference: "INST-1", customer: "A", fleet: "F", vehicleCount: 2, deviceCount: 3, scheduledDate: "2026-11-20", createdAt: "2026-11-01T00:00:00Z", status: "scheduled",
    };
    const rows: InstallationRecord[] = [
      {
        ...base, key: "ent-assigned", tenantType: "Enterprise", installerId: "i1", installerName: "Ada",
      },
      {
        ...base, key: "oo-unassigned", tenantType: "Owner-Operator", scheduledDate: "2026-12-05",
      },
      {
        ...base, key: "unknown", scheduledDate: "",
      },
    ];
    it(
      "filters by tenant type",
      () => {
        expect(filterInstallationsByFields(
          rows,
          { tenantType: "enterprise" },
        ).map(r => r.key)).toEqual(["ent-assigned"]);
        expect(filterInstallationsByFields(
          rows,
          { tenantType: "owner_operator" },
        ).map(r => r.key)).toEqual(["oo-unassigned"]);
      },
    );
    it(
      "filters by assigned or unassigned installer",
      () => {
        expect(filterInstallationsByFields(
          rows,
          { assignment: "assigned" },
        ).map(r => r.key)).toEqual(["ent-assigned"]);
        expect(filterInstallationsByFields(
          rows,
          { assignment: "unassigned" },
        ).map(r => r.key)).toEqual([
          "oo-unassigned",
          "unknown",
        ]);
      },
    );
    it(
      "filters by scheduled date range and excludes unrecorded dates",
      () => {
        expect(filterInstallationsByFields(
          rows,
          {
            scheduledFrom: "2026-11-01", scheduledTo: "2026-11-30",
          },
        ).map(r => r.key)).toEqual(["ent-assigned"]);
        expect(filterInstallationsByFields(
          rows,
          { scheduledFrom: "2026-12-01" },
        ).map(r => r.key)).toEqual(["oo-unassigned"]);
      },
    );
    it(
      "matches everything when no fields are set",
      () => {
        expect(filterInstallationsByFields(
          rows,
          {},
        )).toHaveLength(3);
      },
    );
  },
);
