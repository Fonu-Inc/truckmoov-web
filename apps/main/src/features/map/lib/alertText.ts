import type { TrackingAlert, TrackingAlertFrame, TrackingGeofenceEvent } from "@truckmoov/api/fleet";

const FALLBACK_VEHICLE = "A vehicle";
const FALLBACK_ZONE = "a zone";

const ZONE_SENTENCES: Record<string, (vehicle: string, zone: string) => string> = {
  geofence_entry: (vehicle, zone) => `${vehicle} entered ${zone}`,
  geofence_exit: (vehicle, zone) => `${vehicle} left ${zone}`,
  geofence_dwell: (vehicle, zone) => `${vehicle} has stayed in ${zone} longer than allowed`,
};

const PLAIN_SENTENCES: Record<string, (vehicle: string) => string> = {
  route_deviation: vehicle => `${vehicle} is off its route`,
  unauthorized_usage: vehicle => `${vehicle} is being used without permission`,
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function zoneNameOf(details: Record<string, unknown> | null | undefined): string | null {
  return text(details?.zoneName) ?? text(details?.zone_name) ?? text(details?.geofence_name) ?? text(details?.geofenceName);
}

function humanise(type: string): string {
  const words = type.replace(/[_.]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "New alert";
}

/** Reads an alert.triggered frame as it actually arrives, not as the list endpoint shapes it. */
export function alertFromFrame(frame: TrackingAlertFrame, now = new Date()): TrackingAlert {
  const { alert_id, alert_type, severity, vehicle_id, job_id, details, ...flat } = frame;
  const merged = { ...flat, ...(details ?? {}) };
  const triggeredAt = text(merged.at) ?? now.toISOString();
  return {
    id: text(alert_id) ?? `${alert_type ?? "alert"}-${vehicle_id ?? "fleet"}-${triggeredAt}`,
    type: text(alert_type) ?? "alert",
    severity: text(severity) ?? "medium",
    vehicleId: text(vehicle_id),
    geofenceId: text(merged.zoneId) ?? text(merged.zone_id) ?? text(merged.geofence_id),
    details: { ...merged, ...(job_id ? { jobId: job_id } : {}) },
    triggeredAt,
  };
}

export function alertHeadline(alert: TrackingAlert, vehicleName?: string | null): string {
  const explicit = text(alert.title) ?? text(alert.message);
  if (explicit) return explicit;
  const vehicle = vehicleName || FALLBACK_VEHICLE;
  const zoneSentence = ZONE_SENTENCES[alert.type];
  if (zoneSentence) return zoneSentence(vehicle, zoneNameOf(alert.details) ?? FALLBACK_ZONE);
  const plain = PLAIN_SENTENCES[alert.type];
  return plain ? plain(vehicle) : humanise(alert.type);
}

export function alertTime(alert: TrackingAlert): string | undefined {
  return alert.triggeredAt ?? alert.createdAt;
}

export function geofenceEventVehicleId(event: TrackingGeofenceEvent): string | undefined {
  return event.vehicle_id ?? event.vehicleId;
}

export function geofenceEventName(event: TrackingGeofenceEvent): string | null {
  return text(event.geofence_name) ?? text(event.geofenceName) ?? text(event.zoneName);
}
