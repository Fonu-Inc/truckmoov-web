import type {
  DriverCommunicationPreference, DriverStatus, FleetDriver,
} from "@truckmoov/api/fleet";
import type { Driver } from "@/types";

export const DRIVER_STATUSES: DriverStatus[] = [
  "active",
  "available",
  "offline",
  "suspended",
];
export const COMMUNICATION_PREFERENCES: DriverCommunicationPreference[] = [
  "whatsapp",
  "sms",
  "email",
  "voice",
];

export type DriverRow = Omit<FleetDriver, "status" | "communicationPreference"> & {
  status?: DriverStatus;
  communicationPreference?: DriverCommunicationPreference;
};

export function readEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (typeof value === "string" && allowed.includes(value as T))
    return value as T;
  if (!value || typeof value !== "object")
    return undefined;

  for (const key of [
    "value",
    "name",
    "status",
    "key",
  ]) {
    const candidate = (value as Record<string, unknown>)[key];
    if (typeof candidate === "string" && allowed.includes(candidate.toLowerCase() as T))
      return candidate.toLowerCase() as T;
  }
  return undefined;
}

export function toDriverRow(driver: FleetDriver): DriverRow {
  return {
    ...driver,
    name: driver.name || [
      driver.firstName,
      driver.lastName,
    ].filter(Boolean).join(" "),
    status: readEnum(
      driver.status,
      DRIVER_STATUSES,
    ),
    communicationPreference: readEnum(
      driver.communicationPreference,
      COMMUNICATION_PREFERENCES,
    ),
  };
}

export function formatScore(score: number | null) {
  return score === null ? "Unscored" : `${Math.round(score)}%`;
}

/** Behaviour score (0–100, last 30 days of events); performanceScore is on-time delivery and is usually null. */
export function driverScore(row: DriverRow): number | null {
  return row.behaviorScore ?? row.performanceScore ?? null;
}

// Legacy `Driver` shape for DriverDetailsSheet. Values come from the server only —
// unscored drivers get rating 0 rather than an invented one.
export function toLocalDriver(row: DriverRow): Driver {
  const score = driverScore(row);
  const rating = score === null ? 0 : Math.max(
    0,
    Math.min(
      5,
      score / 20,
    ),
  ); // 0–100 → 0–5
  const totalTrips = row.trips ?? 0;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    licenseNumber: row.licenseNumber,
    licenseExpiry: row.licenseExpiryDate ? new Date(row.licenseExpiryDate) : new Date(),
    status: (row.status ?? "available") as Driver["status"],
    rating,
    totalTrips,
    communicationPreference: (row.preferredChannel ?? row.communicationPreference ?? "whatsapp") as Driver["communicationPreference"],
  };
}
