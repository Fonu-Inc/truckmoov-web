import type { GeofenceCategory, GeofenceEditorFormState } from "./types";

export const geofenceCategoryColors: Record<GeofenceCategory, string> = {
 depot: "#3b82f6",
 delivery: "#22c55e",
 restricted: "#ef4444",
 customer: "#8b5cf6",
 custom: "#f59e0b",
};

export const geofenceCategoryLabels: Record<GeofenceCategory, string> = {
 depot: "Depot",
 delivery: "Delivery Zone",
 restricted: "Restricted Area",
 customer: "Customer Site",
 custom: "Custom Zone",
};

export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function createDefaultGeofenceForm(): GeofenceEditorFormState {
 return {
  name: "",
  category: "custom",
  geofenceType: "CIRCLE",
  center: [6.5244, 3.3792],
  radiusMeters: 500,
  color: geofenceCategoryColors.custom,
  alertOnEntry: true,
  alertOnExit: true,
  alertOnDwell: false,
  dwellThresholdMinutes: 30,
  speedLimitKmh: null,
  scheduleEnabled: false,
  scheduleDays: [],
  scheduleStartTime: "08:00",
  scheduleEndTime: "17:00",
  assignedVehicleIds: [],
 };
}
