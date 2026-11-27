import type { SystemDeviceInventoryItem } from "@truckmoov/api/auth";
import {
  formatDayMonthTime,
  minutesBetween,
} from "@truckmoov/app-core/utils/time-utils";

// Assigned Devices table only uses Active, Inactive, Assigned and Unassigned (fork PlatformDeviceManagement).
export type DeviceBucket = "active" | "inactive" | "assigned" | "unassigned";

export const lifecycleStatuses = [
  {
    value: "all",
    label: "All Statuses",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
  {
    value: "assigned",
    label: "Assigned",
  },
  {
    value: "unassigned",
    label: "Unassigned",
  },
];

export const statusLabels: Record<DeviceBucket, string> = {
  active: "Active",
  inactive: "Inactive",
  assigned: "Assigned",
  unassigned: "Unassigned",
};

export const statusClasses: Record<DeviceBucket, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  assigned: "bg-primary/10 text-primary",
  unassigned: "bg-warning/10 text-warning",
};

const OUT_OF_SERVICE = [
  "inactive",
  "offline",
  "suspended",
];

/** Platform-side view of a device: the live record plus any local Edit Details / Record Assignment overrides. */
export type PlatformDevice = SystemDeviceInventoryItem & { statusOverride?: DeviceBucket };

export function normalizeDeviceStatus(device: PlatformDevice): DeviceBucket {
  if (device.statusOverride)
    return device.statusOverride;
  const lifecycle = device.lifecycleStatus ?? "";
  const operational = device.operationalStatus ?? "";
  if (OUT_OF_SERVICE.includes(operational) || OUT_OF_SERVICE.includes(lifecycle))
    return "inactive";
  if (operational === "active")
    return "active";
  if (lifecycle === "assigned" || operational === "assigned" || device.vehicleId)
    return "assigned";
  return "unassigned";
}

export function formatLastSeen(lastSeen: string | null) {
  if (!lastSeen)
    return "Never";
  const diffMins = minutesBetween(
    lastSeen,
    new Date(),
  ) ?? 0;
  if (diffMins < 1)
    return "Just now";
  if (diffMins < 60)
    return `${diffMins} min ago`;
  if (diffMins < 1440)
    return `${Math.floor(diffMins / 60)} hours ago`;
  return `${Math.floor(diffMins / 1440)} days ago`;
}

export const LAST_SEEN_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function seenWithinDays(lastSeen: string | null, days: number) {
  if (!lastSeen)
    return false;
  const mins = minutesBetween(
    lastSeen,
    new Date(),
  );
  return mins !== null && mins <= days * 1440;
}

const MAX_PROVISION_ATTEMPTS = 8;

type ProvisionFields = Pick<PlatformDevice, "provisionStatus" | "provisionAttempts" | "provisionNextAttemptAt" | "lifecycleStatus">;

/** Decommissioned devices are never re-registered, so they are not retryable. */
export function isRetryableProvisionFailure(device: Pick<ProvisionFields, "provisionStatus" | "lifecycleStatus">) {
  return device.provisionStatus === "failed" && device.lifecycleStatus !== "decommissioned";
}

/** Why a failed tracking-network registration is stuck; null when the device did not fail. */
export function provisionFailureMessage(device: ProvisionFields): string | null {
  if (!isRetryableProvisionFailure(device))
    return null;
  if (!device.provisionNextAttemptAt)
    return "Gave up registering with the tracking network";
  // Attempts reset to 0 on re-queue.
  if (device.provisionAttempts === 0)
    return `Retry queued, next attempt at ${formatDayMonthTime(device.provisionNextAttemptAt)}`;
  const attempt = Math.min(
    device.provisionAttempts ?? 1,
    MAX_PROVISION_ATTEMPTS,
  );
  return `Could not register with the tracking network, retrying at ${formatDayMonthTime(device.provisionNextAttemptAt)} (attempt ${attempt} of ${MAX_PROVISION_ATTEMPTS})`;
}
