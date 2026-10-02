import type {
  DeviceCatalogFeature, DeviceCatalogStatus,
} from "@truckmoov/api/auth";
import {
  AlertTriangle, Fuel, Gauge,
} from "lucide-react";

export type CatalogStatusFilter = "all" | DeviceCatalogStatus;

export const CATALOG_STATUSES: DeviceCatalogStatus[] = [
  "supported",
  "deprecated",
  "blocked",
];

export const STATUS_LABEL: Record<DeviceCatalogStatus, string> = {
  supported: "Supported",
  deprecated: "Deprecated",
  blocked: "Blocked",
};

export const STATUS_BADGE_CLASS: Record<DeviceCatalogStatus, string> = {
  supported: "border-success/40 bg-success/15 text-success hover:bg-success/15",
  deprecated: "border-warning/40 bg-warning/15 text-warning hover:bg-warning/15",
  blocked: "border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/15",
};

export const PROTOCOL_BADGE_CLASS: Record<string, string> = {
  TCP: "border-info/30 bg-info/10 text-info hover:bg-info/10",
  HTTP: "border-success/30 bg-success/10 text-success hover:bg-success/10",
  MQTT: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  UDP: "border-warning/30 bg-warning/10 text-warning hover:bg-warning/10",
};

export const FEATURE_OPTIONS: Array<{
  value: DeviceCatalogFeature;
  label: string;
  title: string;
  icon: typeof Gauge;
  className: string;
}> = [
  {
    value: "obd2",
    label: "OBD-II",
    title: "OBD Support",
    icon: Gauge,
    className: "text-info",
  },
  {
    value: "fuel",
    label: "Fuel",
    title: "Fuel Monitoring",
    icon: Fuel,
    className: "text-warning",
  },
  {
    value: "sos",
    label: "SOS",
    title: "SOS Button",
    icon: AlertTriangle,
    className: "text-destructive",
  },
];
