import type {
  SystemAuditLogEntry,
  SystemDeviceInventoryItem,
  SystemSimItem,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemActionHistoryQueryOptions,
  getSystemDevicesQueryOptions,
  getSystemInstallationJobsQueryOptions,
  getSystemSimsQueryOptions,
  getSystemTenantsQueryOptions,
} from "@truckmoov/api/auth";
import { useMemo } from "react";

export type SetupProblemKind =
  | "device-no-sim"
  | "sim-no-device"
  | "device-no-vehicle"
  | "install-unverified";

export type SetupProblem = {
  kind: SetupProblemKind;
  key: string;
  company: string;
  what: string;
  explanation: string;
  to: string;
  linkLabel: string;
};

const IN_SERVICE_LIFECYCLES = new Set([
  "configured",
  "verified_online",
  "assignable",
  "assigned",
]);

export function deviceLabel(device: SystemDeviceInventoryItem) {
  const model = [
    device.manufacturer,
    device.model,
  ].filter(Boolean).join(" ");
  const tail = device.imei.slice(-4);
  return `Tracker ${model || ""} ending ${tail}`.replace(/\s+/g, " ");
}

export function simLabel(sim: SystemSimItem) {
  const who = sim.carrier ? `${sim.carrier} SIM` : "SIM";
  if (sim.msisdn)
    return `${who} ${sim.msisdn}`;
  return `${who} ending ${sim.iccid.slice(-4)}`;
}

function nameOf(names: Map<string, string>, tenantId: string | null) {
  if (!tenantId)
    return "No company yet";
  return names.get(tenantId) ?? "Unknown company";
}

export function findSetupProblems(
  devices: SystemDeviceInventoryItem[],
  sims: SystemSimItem[],
  names: Map<string, string>,
): SetupProblem[] {
  const simDeviceIds = new Set(
    sims.map(s => s.deviceId).filter((id): id is string => !!id),
  );
  const problems: SetupProblem[] = [];

  for (const device of devices) {
    if (!device.tenantId)
      continue;
    const company = nameOf(
      names,
      device.tenantId,
    );
    const what = deviceLabel(device);
    if (IN_SERVICE_LIFECYCLES.has(device.lifecycleStatus) && !simDeviceIds.has(device.id)) {
      problems.push({
        kind: "device-no-sim",
        key: `nosim-${device.id}`,
        company,
        what,
        explanation: "This tracker has no SIM card linked to it, so it cannot send data.",
        to: "/devices",
        linkLabel: "Open devices",
      });
    }
    if (device.lifecycleStatus === "assigned" && !device.vehicleId) {
      problems.push({
        kind: "device-no-vehicle",
        key: `novehicle-${device.id}`,
        company,
        what,
        explanation: "This tracker is marked as installed but is not attached to any vehicle.",
        to: "/devices",
        linkLabel: "Open devices",
      });
    }
    if (device.lifecycleStatus === "assigned" && device.vehicleId && !device.lastSeen) {
      problems.push({
        kind: "install-unverified",
        key: `unverified-${device.id}`,
        company,
        what,
        explanation: "Installed on a vehicle but it has never sent a location. The installation may not be finished or checked.",
        to: "/installers",
        linkLabel: "Open installations",
      });
    }
  }

  for (const sim of sims) {
    if (sim.tenantId && !sim.deviceId && sim.status !== "suspended") {
      problems.push({
        kind: "sim-no-device",
        key: `nodevice-${sim.id}`,
        company: nameOf(
          names,
          sim.tenantId,
        ),
        what: simLabel(sim),
        explanation: "This SIM belongs to a company but is not in any tracker. It is being billed for nothing.",
        to: "/sims",
        linkLabel: "Open SIMs",
      });
    }
  }
  return problems;
}

export function latestByResource(
  history: SystemAuditLogEntry[],
  action: string,
) {
  const latest = new Map<string, SystemAuditLogEntry>();
  for (const entry of history) {
    if (entry.action === action && entry.resourceId && !latest.has(entry.resourceId))
      latest.set(
        entry.resourceId,
        entry,
      );
  }
  return latest;
}

export function actorName(entry: SystemAuditLogEntry | undefined) {
  if (!entry)
    return "Not recorded";
  return entry.actorName || entry.actorEmail || "Not recorded";
}

export function reasonText(entry: SystemAuditLogEntry | undefined) {
  return entry?.reason ? `Reason: ${entry.reason}` : "Reason not shown here";
}

export function useDevicesSimsData() {
  const devicesQuery = useQuery(getSystemDevicesQueryOptions());
  const simsQuery = useQuery(getSystemSimsQueryOptions());
  const tenantsQuery = useQuery(getSystemTenantsQueryOptions());
  const historyQuery = useQuery(getSystemActionHistoryQueryOptions({
    prefixes: [
      "system.sim.",
      "system.device.",
    ],
    limit: 500,
  }));
  const issuesQuery = useQuery(getSystemInstallationJobsQueryOptions({
    status: "issue_reported", limit: 1,
  }));
  const overdueQuery = useQuery(getSystemInstallationJobsQueryOptions({
    status: "overdue", limit: 1,
  }));

  const names = useMemo(
    () => new Map(
      (tenantsQuery.data?.data.tenants ?? []).map(t => [
        t.id,
        t.name,
      ]),
    ),
    [tenantsQuery.data],
  );
  const devices = useMemo(
    () => devicesQuery.data?.data.devices ?? [],
    [devicesQuery.data],
  );
  const sims = useMemo(
    () => simsQuery.data?.data.sims ?? [],
    [simsQuery.data],
  );
  const history = useMemo(
    () => historyQuery.data ?? [],
    [historyQuery.data],
  );

  return {
    devicesQuery,
    simsQuery,
    tenantsQuery,
    historyQuery,
    names,
    devices,
    sims,
    history,
    installProblems: {
      issues: issuesQuery.data?.data.total ?? null,
      overdue: overdueQuery.data?.data.total ?? null,
    },
  };
}
