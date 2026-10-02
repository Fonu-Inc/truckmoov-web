import type { SystemDeviceSetupStatus } from "@truckmoov/api/auth";

export const TRACKER_TYPE_LABELS: Record<string, string> = {
  hardwired: "Hardwired",
  obd: "OBD-II",
  obd2: "OBD-II",
  asset: "Battery / Portable",
};

export const KYC_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  verified: {
    label: "Verified",
    className: "bg-success/10 text-success border-success/30",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

export const STATUS_CONFIG: Record<SystemDeviceSetupStatus, { label: string; className: string }> = {
  pending_review: {
    label: "Pending Review",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  approved: {
    label: "Approved",
    className: "bg-success/10 text-success border-success/30",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-info/10 text-info border-info/30",
  },
  provisioned: {
    label: "Provisioned",
    className: "bg-success/10 text-success border-success/30",
  },
  assigned: {
    label: "Assigned",
    className: "bg-success/10 text-success border-success/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export type StatusBucket = "pending_review" | "approved" | "rejected";

export const STATUS_OPTIONS: { value: StatusBucket; label: string }[] = [
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const APPROVED_STATUSES: SystemDeviceSetupStatus[] = ["approved", "in_progress", "provisioned", "assigned"];

export function getStatusBucket(status: SystemDeviceSetupStatus): string {
  return APPROVED_STATUSES.includes(status) ? "approved" : status;
}

export type DeviceSetupFilters = {
  manufacturer: { enabled: boolean; value: string };
  organisation: { enabled: boolean; value: string };
};

export const EMPTY_FILTERS: DeviceSetupFilters = {
  manufacturer: { enabled: false, value: "" },
  organisation: { enabled: false, value: "" },
};

export function cloneFilters(filters: DeviceSetupFilters): DeviceSetupFilters {
  return {
    manufacturer: { ...filters.manufacturer },
    organisation: { ...filters.organisation },
  };
}

export function countActiveFilters(filters: DeviceSetupFilters) {
  const manufacturer = filters.manufacturer.enabled && filters.manufacturer.value;
  const organisation = filters.organisation.enabled && filters.organisation.value;
  return Number(Boolean(manufacturer)) + Number(Boolean(organisation));
}

export function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
