export type GeofenceCategory = "depot" | "delivery" | "restricted" | "customer" | "custom";

export type GeofenceShape = "CIRCLE" | "POLYGON";

export type GeofenceStatus = "ACTIVE" | "ARCHIVED";

export type GeofenceEditorMode = "create" | "edit" | null;

export type GeofenceCoordinates = [number, number];

export interface GeofenceModalVehicle {
 id: string;
 registrationNumber: string;
 make: string;
 model: string;
}

export interface GeofenceEditorFormState {
 name: string;
 category: GeofenceCategory;
 geofenceType: GeofenceShape;
 center: GeofenceCoordinates;
 radiusMeters: number;
 color: string;
 alertOnEntry: boolean;
 alertOnExit: boolean;
 alertOnDwell: boolean;
 dwellThresholdMinutes: number;
 speedLimitKmh: number | null;
 scheduleEnabled: boolean;
 scheduleDays: string[];
 scheduleStartTime: string;
 scheduleEndTime: string;
 assignedVehicleIds: string[];
}

export interface GeofenceModalZone extends GeofenceEditorFormState {
 id: string;
 status: GeofenceStatus;
}
