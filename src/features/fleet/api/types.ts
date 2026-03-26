// ─── Vehicles ────────────────────────────────────────────────────────────────

export type VehicleGpsDevice = {
 "imei": "string",
 "manufacturer": "string",
 "model": "string",
 "firmwareVersion": "string",
 "installedAt": "string"
}

export type VehicleType = "truck" | "van" | "trailer"

export type FleetStatus = "active" | "inactive"

export type Vehicle = {
 "id": string,
 "registrationNumber": string,
 "plateNumber": string,
 "vin": string,
 "make": string,
 "model": string,
 "year": number,
 "type": VehicleType,
 "capacity": number,
 "tenantId": string,
 "status": FleetStatus,
 "assignedDriverId": string,
 "gpsDevice": VehicleGpsDevice;
}

export type NearestVehicle = {
 "vehicleId": string,
 "plateNumber": string,
 "model": string,
 "assignedDriverId": string,
 "lat": number,
 "lng": number,
 "distanceKm": number
}

export type VehicleHealth = {
 "vehicleId": string,
 "plateNumber": string,
 "model": string,
 "assignedDriverId": string,
 "deviceId": string,
 "lastSeen": number,
 "healthy": boolean
}

// ─── Drivers ─────────────────────────────────────────────────────────────────

export type DriverContactChannels = {
 "whatsappNumber": string,
 "smsNumber": string,
 "voiceNumber": string
}

export type DriverStatus = "active" | "available" | "offline" | "suspended" | "active"

export type DriverCommunicationPreferences = "whatsapp" | "sms" | "email" | "voice";

export type Driver = {
 "id": string,
 "firstName": string,
 "lastName": string,
 "name": string,
 "phone": string,
 "email": string,
 "licenseNumber": string,
 "licenseExpiryDate": string,
 "tenantId": string,
 "status": DriverStatus,
 "communicationPreference": DriverCommunicationPreferences
 "assignedVehicleId": string,
 "contactChannels": DriverContactChannels,
 "createdAt": string,
 "updatedAt": string
}

// ─── Jobs & Dispatch ─────────────────────────────────────────────────────────

export type Job = {
 "jobId": string,
 "tenantId": string,
 "status": FleetStatus,
 "updatedAt": string
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export type AlertStatus = "open" | "acknowledged" | "resolved" | "excalated";
export type AlertSeverity = "low";

export type Alert = {
 "id": string,
 "type": string,
 "severity": AlertSeverity,
 "status": AlertStatus,
 "vehicleId": string,
 "jobId": string,
 "details": {},
 "triggeredAt": string,
 "acknowledgedAt": string,
 "resolvedAt": string,
 "escalatedAt": string,
 "acknowledgedBy": string,
 "resolvedBy": string
}

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export type FuelTransaction = {
 "id": string,
 "tenantId": string,
 "vehicleId": string,
 "driverId": string,
 "vehicleType": string,
 "liters": number,
 "pricePerLiter": number,
 "totalCost": number,
 "station": string,
 "odometer": number,
 "recordedAt": string,
 "recordedBy": string,
 "deletedAt": string
}

export type FuelMetrics = {
 "label": string,
 "liters": number,
 "totalCost": number,
 "records": number
}

export type FuelEffficiency = {
 "vehicleId": string,
 "kmPerLiter": number,
 "belowThreshold": boolean,
 "threshold": number
}

export type FuelThreshold = {
 "vehicleType": string,
 "minKmPerLiter": number
}

// ─── Documents ───────────────────────────────────────────────────────────────

export type DocumentEntityType = "job" | "vehicle" | "driver"
export type DocType = "pod"

export type Document = {
 "id": string,
 "tenantId": string,
 "entityType": DocumentEntityType,
 "entityId": string,
 "docType": DocType,
 "filename": string,
 "contentType": string,
 "sizeBytes": number,
 "uploadedBy": string,
 "uploadedAt": string,
 "expiresAt": string
}

export type DocumentAccessLogAction = "upload"

export type DocumentAccessLog = {
 "id": string,
 "docId": string,
 "action": DocumentAccessLogAction,
 "userId": string,
 "ip": string,
 "at": string,
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export type AuditLogEntityType = "job" | "vehicle" | "driver" | "alert" | "document" | "geofence";
export type AuditLog = {}


type GetParams = {
 query?: string;
 status?: FleetStatus;
 assigned?: boolean;
 tenantId?: string;
}

type BulkImportResponse<T> = {
 created: number;
 updated: number;
 total: number;
 records: T
}

// ─── Vehicle Payloads ─────────────────────────────────────────────────────────

export type ListVehiclesPayload = {
 params: GetParams
}

export type CreateVehicleData = Omit<Vehicle, "id" | "assignedDriverId" | "gpsDevice">

export type CreateVehiclePayload = {
 data: CreateVehicleData;
}

export type BulkCreateVehiclePayload = {
 data: {
  tenantId: string;
  items: CreateVehicleData[]
 }
}

export type BulkCreateVehicleResponse = BulkImportResponse<Vehicle[]>

export type GetVehiclePayload = {
 id: string;
}

export type UpdateVehiclePayload = {
 id: string;
 data: CreateVehicleData
}

export type DeleteVehiclePayload = {
 id: string;
}

export type SetVehicleStatusPayload = {
 id: string;
 data: {
  status: FleetStatus
 }
}

export type AssignDriverToVehiclePayload = {
 id: string;
 data: {
  driverId: string;
 }
}

export type AssignDriverToVehicleResponse = {
 vehicle: Vehicle;
 driver: Driver;
}

export type UnassignDriverFromVehiclePayload = {
 id: string
}

export type RegisterGpsOnVehiclePayload = {
 id: string;
 data: VehicleGpsDevice
}

export type FindNearestVehiclesPayload = {
 params: {
  lat: number;
  lng: number;
  limit: number;
 }
}

export type VehicleHealthPayload = {
 vehicleId: string
}

export type RegisterVehicleGeofencePayload = {
 vehicleId: string;
 data: {
  "northeast": {
   "lat": number,
   "lng": number
  },
  "southwest": {
   "lat": number,
   "lng": number
  }
 }
}

export type VehicleGeofencePayload = {
 vehicleId: string;
}

export type ReportVehicleLivePositionPayload = {
 vehicleId: string;
 data: {
  "lat": number,
  "lng": number
 }
}

// ─── Driver Payloads ─────────────────────────────────────────────────────────

export type ListDriverPayload = {
 params: {
  query?: string;
  status?: DriverStatus;
  assigned?: boolean;
  tenantId?: string;
 }
}

export type CreateDriverData = Omit<Driver, "id" | "assignedVehicleId" | "assignedVehicleId" | "contactChannels" | "createdAt" | "updatedAt">

export type CreateDriverPayload = {
 data: CreateDriverData
}

export type BulkCreateDriversPayload = {
 data: {
  tenantId: string;
  items: CreateDriverData[]
 }
}

export type BulkCreateDriversResponse = BulkImportResponse<Driver[]>

export type GetDriverPayload = {
 id: string;
}

export type UpdateDriverPayload = {
 id: string;
 data: CreateDriverData;
}

export type DeleteDriverPayload = {
 id: string;
}

export type SetDriverStatusPayload = {
 id: string;
 data: {
  status: FleetStatus;
 }
}

export type UpdateDriverContactChannelsPayload = {
 id: string;
 data: DriverContactChannels
}

// ─── Job & Dispatch Payloads ──────────────────────────────────────────────────

export type ListJobsPayload = {
 params: Omit<GetParams, "assigned">
}

export type SearchDispatchPayload = {
 params: {
  vehicleStatus: FleetStatus;
  driverStatus: FleetStatus;
  jobStatus: FleetStatus;
  assignedOnly: boolean;
  tenantId: string;
 }
}

export type SearchDispatchResponse = {
 vehicles: Vehicle[];
 drivers: Driver[];
 jobs: Job[];
}

export type PublishJobStatusPayload = {
 params: {
  tenant: string
 }
}

export type AlertStatisticsResponse = {
 "total": number,
 "byStatus": {},
 "byType": {},
 "bySeverity": {},
 "meanTimeToResolveMs": number
}

// ─── Alert Payloads ───────────────────────────────────────────────────────────

export type ListAlertsPayload = {
 params: {
  status: AlertStatus;
  type: string;
  vehicleId: string;
  tenantId: string;
 }
}

export type AcknowledgeAlertPayload = {
 id: string
}

export type ResolveAlertPayload = {
 id: string;
}

// ─── Report Payloads ─────────────────────────────────────────────────────────

export type OperationalDashboardPayload = {
 params: {
  tenantId: string;
 }
}

export type OperationalDashboard = {
 "vehicles": {
  "total": number,
  "active": number,
  "inactive": number,
  "assigned": number,
  "seenInLastHour": number
 },
 "drivers": {
  "total": number,
  "active": number,
  "inactive": number,
  "assigned": number
 },
 "jobs": {
  "total": number,
  "byStatus": {}
 },
 "alerts": {
  "open": number,
  "escalated": number
 },
 "generatedAt": string
}

export type DeliveryMetricsPayload = {
 params: {
  tenantId: string;
 }
}

export type DeliveryMetrics = {
 "totalJobs": number,
 "delivered": number,
 "cancelled": number,
 "inProgress": number,
 "deliverySuccessRate": number,
 "averageCycleTimeMs": number,
 "vehicleUtilizationRate": number,
 "generatedAt": string;
}

export type ReportExportPayload = {
 entity: string;
 params: {
  tenantId: string;
 }
}

// ─── Fuel Payloads ───────────────────────────────────────────────────────────

export type ListFuelTransactionsPayload = {
 params: {
  tenantId: string;
  vehicleId: string;
  driverId: string;
  station: string;
  from: string;
  to: string;
 }
}

type CreateFuelTransactionData = Omit<FuelTransaction, "id" | "recordedAt" | "totalCost" | "recordedBy" | "deletedAt">

export type RecordFuelTransactionPayload = {
 data: CreateFuelTransactionData;
}

export type FuelMetricsPayload = {
 params: {
  period: "weekly" | "monthly";
  tenantId: string;
 }
}

export type FuelEfficiencyPayload = {
 params: {
  tenantId: string
 }
}

export type FuelExportPayload = {
 params: {
  tenantId: string
 }
}

export type UpdateFuelTransactionPayload = {
 id: string;
 data: CreateFuelTransactionData
}

export type DeleteFuelTransactionPayload = {
 id: string;
}

export type SetFuelThresholdPayload = {
 vehicleType: string;
 data: Omit<FuelThreshold, "vehicleType">
}

// ─── Document Payloads ───────────────────────────────────────────────────────

export type ListDocumentPayload = {
 params: {
  entityType: DocumentEntityType;
  entityId: string;
  tenantId: string
 }
}

export type UploadDocumentPayload = {
 params: {
  entityType: DocumentEntityType;
  entityId: string;
  docType: DocType;
 }
}

export type DocumentSecureUrlPayload = {
 id: string;
 params: {
  tenantId: string;
 }
}

export type DocumentSecureUrl = {
 url: string;
 expiresIn: number
}

export type DocumentAccessLogPayload = {
 id: string;
 params: {
  tenantId: string;
 }
}

// ─── Audit Payloads ──────────────────────────────────────────────────────────

export type AuditLogPayload = {
 params: {
  entityType: AuditLogEntityType;
  entityId: string;
  action: string;
  limit: string;
  tenantId: string;
 }
}