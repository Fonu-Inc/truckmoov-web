import type { SystemDeviceInventoryItem } from "@truckmoov/api/auth";

export type DeviceBucket = "active" | "inactive" | "assigned" | "unassigned" | "configured" | "registered";

export const statusOptions = [
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
  {
    value: "configured",
    label: "Configured",
  },
  {
    value: "registered",
    label: "Registered",
  },
];

export const statusLabels: Record<DeviceBucket, string> = {
  active: "Active",
  inactive: "Inactive",
  assigned: "Assigned",
  unassigned: "Unassigned",
  configured: "Configured",
  registered: "Registered",
};

export const statusClasses: Record<DeviceBucket, string> = {
  active: "border-transparent bg-success/10 text-success hover:bg-success/10",
  inactive: "border-transparent bg-muted text-muted-foreground hover:bg-muted",
  assigned: "border-transparent bg-primary/10 text-primary hover:bg-primary/10",
  unassigned: "border-transparent bg-warning/10 text-warning hover:bg-warning/10",
  configured: "border-transparent bg-info/10 text-info hover:bg-info/10",
  registered: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary",
};

const OUT_OF_SERVICE = [
  "suspended",
  "faulty",
  "decommissioned",
  "inactive",
];

const ACTIVE_LIFECYCLES = [
  "verified_online",
  "assignable",
];

export function normalizeDeviceStatus(device: SystemDeviceInventoryItem): DeviceBucket {
  const lifecycle = device.lifecycleStatus ?? "";
  const operational = device.operationalStatus ?? "";
  if (OUT_OF_SERVICE.includes(lifecycle) || OUT_OF_SERVICE.includes(operational))
    return "inactive";
  if (lifecycle === "assigned" || device.vehicleId)
    return "assigned";
  if (ACTIVE_LIFECYCLES.includes(lifecycle) || operational === "active")
    return "active";
  if (lifecycle === "configured")
    return "configured";
  return "registered";
}

export function formatLastSeen(lastSeen: string | null) {
  if (!lastSeen)
    return "Never";
  const minutes = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000);
  if (minutes < 1)
    return "Just now";
  if (minutes < 60)
    return `${minutes} min ago`;
  if (minutes < 1440)
    return `${Math.floor(minutes / 60)} hours ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}

export function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case "registered":
    case "verified_online":
      return "border-info/30 bg-info/10 text-info hover:bg-info/10";
    case "config_pending":
    case "suspended":
      return "border-warning/30 bg-warning/10 text-warning hover:bg-warning/10";
    case "configured":
      return "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10";
    case "assignable":
    case "assigned":
    case "active":
      return "border-success/30 bg-success/10 text-success hover:bg-success/10";
    case "faulty":
      return "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10";
    default:
      return "border-border bg-muted text-muted-foreground hover:bg-muted";
  }
}

export const LAST_SEEN_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export type DeviceFilterKey = "lastSeen" | "tenant" | "manufacturer";

export type DeviceFilterDraft = Record<DeviceFilterKey, {
  enabled: boolean;
  value: string;
}>;

export const emptyFilters: DeviceFilterDraft = {
  lastSeen: {
    enabled: false,
    value: "",
  },
  tenant: {
    enabled: false,
    value: "",
  },
  manufacturer: {
    enabled: false,
    value: "",
  },
};

function activeValue(filter: DeviceFilterDraft[DeviceFilterKey]) {
  return filter.enabled && filter.value ? filter.value : null;
}

function matchesLastSeen(device: SystemDeviceInventoryItem, range: string | null) {
  const days = range ? LAST_SEEN_DAYS[range] : 0;
  if (!days)
    return true;
  if (!device.lastSeen)
    return false;
  return Date.now() - new Date(device.lastSeen).getTime() <= days * 86400000;
}

function matchesStatus(device: SystemDeviceInventoryItem, status: string) {
  if (status === "all")
    return true;
  if (status === "unassigned")
    return !device.vehicleId;
  return normalizeDeviceStatus(device) === status;
}

export function matchesFilters(
  device: SystemDeviceInventoryItem,
  status: string,
  filters: DeviceFilterDraft,
) {
  const manufacturer = activeValue(filters.manufacturer);
  const tenant = activeValue(filters.tenant);
  return (
    matchesStatus(device, status)
    && (!manufacturer || device.manufacturer === manufacturer)
    && (!tenant || (!!device.tenantId && device.tenantName === tenant))
    && matchesLastSeen(
      device,
      activeValue(filters.lastSeen),
    )
  );
}
