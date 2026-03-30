import { axiosInstance, ServerSuccessResponse } from "@/shared/utils/axios-instance";
import type { AcknowledgeAlertPayload, Alert, AlertStatisticsResponse, AssignDeviceToVehiclePayload, AssignDriverToVehiclePayload, AssignDriverToVehicleResponse, AuditLog, AuditLogPayload, BulkCreateDevicePayload, BulkCreateDriversPayload, BulkCreateDriversResponse, BulkCreateVehiclePayload, BulkCreateVehicleResponse, CreateDevicePayload, CreateDriverPayload, CreateVehiclePayload, DeleteDevicePayload, DeleteDriverPayload, DeleteFuelTransactionPayload, DeleteVehiclePayload, DeliveryMetrics, DeliveryMetricsPayload, Device, Document, DocumentAccessLog, DocumentAccessLogPayload, DocumentSecureUrl, DocumentSecureUrlPayload, Driver, FindNearestVehiclesPayload, FuelEffficiency, FuelEfficiencyPayload, FuelExportPayload, FuelMetrics, FuelMetricsPayload, FuelThreshold, FuelTransaction, GetDevicePayload, GetVehiclePayload, ListAlertsPayload, ListDevicesPayload, ListDocumentPayload, ListDriverPayload, ListFuelTransactionsPayload, ListVehiclesPayload, NearestVehicle, OperationalDashboard, OperationalDashboardPayload, RecordFuelTransactionPayload, RegisterGpsOnVehiclePayload, RegisterVehicleGeofencePayload, ReportExportPayload, ReportVehicleLivePositionPayload, ResolveAlertPayload, SetDeviceLifecyclePayload, SetDriverStatusPayload, SetFuelThresholdPayload, SetVehicleStatusPayload, UnassignDeviceToVehiclePayload, UnassignDriverFromVehiclePayload, UpdateDevicePayload, UpdateDriverContactChannelsPayload, UpdateDriverPayload, UpdateFuelTransactionPayload, UpdateVehiclePayload, UploadDocumentPayload, ValidateDeviceAssignmentPayload, ValidateDeviceAssignmentResponse, Vehicle, VehicleGeofencePayload, VehicleHealth, VehicleHealthPayload } from "./types";

// ─── Vehicles ────────────────────────────────────────────────────────────────

export async function listVehicles(payload: ListVehiclesPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Vehicle[]>>("/fleet/vehicles", {
  params: payload.params
 })
 return data;
}

export async function createVehicle(payload: CreateVehiclePayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Vehicle>>("/fleet/vehicles", payload.data)
 return data
}

export async function bulkCreateVehicle(payload: BulkCreateVehiclePayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<BulkCreateVehicleResponse>>("/fleet/vehicles/import", payload.data);
 return data;
}

export async function getVehicle(payload: GetVehiclePayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Vehicle>>(`/fleet/vehicles/${payload.id}`);
 return data;
}

export async function updateVehicle(payload: UpdateVehiclePayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<Vehicle>>(`/fleet/vehicles/${payload.id}`, payload.data);
 return data;
}

export async function deleteVehicle(payload: DeleteVehiclePayload) {
 const { data } = await axiosInstance.delete<ServerSuccessResponse<Vehicle>>(`fleet/vehicles/${payload.id}`);
 return data;
}

export async function setVehicleStatus(payload: SetVehicleStatusPayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<Vehicle>>(`/fleet/vehicles/${payload.id}/status`, payload.data);
 return data;
}

export async function assignDriverToVehicle(payload: AssignDriverToVehiclePayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<AssignDriverToVehicleResponse>>(`/fleet/vehicles/${payload.id}/assignment`, payload.data)
 return data;
}

export async function unassignDriverFromVehicle(payload: UnassignDriverFromVehiclePayload) {
 const { data } = await axiosInstance.delete<ServerSuccessResponse<Vehicle>>(`/fleet/vehicles/${payload.id}/assignment`)
 return data;
}

export async function registerGpsOnVehicle(payload: RegisterGpsOnVehiclePayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<Vehicle>>(`/fleet/vehicles/${payload.id}/gps-device`, payload.data)
 return data;
}

export async function findNearestVehicles(payload: FindNearestVehiclesPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<NearestVehicle[]>>("/fleet/vehicles/nearest", {
  params: payload.params
 })
 return data
}

export async function vehicleHealth(payload: VehicleHealthPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<VehicleHealth>>(`/fleet/vehicles/${payload.vehicleId}/health`)
 return data;
}

export async function vehicleGeofence(payload: VehicleGeofencePayload) {
 const { data } = await axiosInstance.get(`/fleet/routes/${payload.vehicleId}/geofence`)
 return data
}

export async function registerVehicleGeofence(payload: RegisterVehicleGeofencePayload) {
 const { data } = await axiosInstance.post(`/fleet/routes/${payload.vehicleId}/geofence`, payload.data)
 return data;
}

export async function reportVehicleLivePosition(payload: ReportVehicleLivePositionPayload) {
 const { data } = await axiosInstance.post(`/fleet/routes/${payload.vehicleId}/location`, payload.data);
 return data;
}


// ─── Drivers ─────────────────────────────────────────────────────────────────

export async function listDrivers(payload: ListDriverPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Driver[]>>('/fleet/drivers', {
  params: payload.params
 })
 return data
}

export async function createDriver(payload: CreateDriverPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Driver>>("/fleet/drivers", payload.data)
 return data;
}

export async function bulkCreateDrivers(payload: BulkCreateDriversPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<BulkCreateDriversResponse>>("/fleet/drivers/import", payload.data);
 return data;
}

export async function getDriver(payload: GetVehiclePayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Driver>>(`/fleet/drivers/${payload.id}`);
 return data;
}

export async function updateDriver(payload: UpdateDriverPayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<Driver>>(`/fleet/drivers/${payload.id}`, payload.data);
 return data;
}

export async function deleteDriver(payload: DeleteDriverPayload) {
 const { data } = await axiosInstance.delete<ServerSuccessResponse<Driver>>(`/fleet/drivers/${payload.id}`);
 return data
}

export async function setDriverStatus(payload: SetDriverStatusPayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<Driver>>(`/fleet/drivers/${payload.id}/status`, payload.data);
 return data;
}

export async function updateDriverContactChannels(payload: UpdateDriverContactChannelsPayload) {
 const { data } = await axiosInstance.patch(`/fleet/drivers/${payload.id}/contact-channels`, payload.data)
 return data;
}

// ─── Device ────────────────────────────────────────────────────────────────

export async function listDevices(payload: ListDevicesPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Device[]>>("/fleet/devices", {
  params: payload.params
 })
 return data
}

export async function createDevice(payload: CreateDevicePayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Device>>("/fleet/devices", payload.data);
 return data;
}

export async function bulkCreateDevice(payload: BulkCreateDevicePayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<BulkCreateDevicePayload>>("/fleet/devices/import", payload.data);
 return data;
}

export async function getDevice(payload: GetDevicePayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Device>>(`/fleet/devices/${payload.id}`);
 return data
}

export async function updateDevice(payload: UpdateDevicePayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<Device>>(`/fleet/devices/${payload.id}`, payload.data);
 return data;
}

export async function deleteDevice(payload: DeleteDevicePayload) {
 const { data } = await axiosInstance.delete<ServerSuccessResponse<Device>>(`/fleet/devices/${payload.id}`);
 return data;
}

export async function setDeviceLifeCycle(payload: SetDeviceLifecyclePayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<Device>>(`/fleet/devices/${payload.id}/lifecycle`, payload.data)
 return data
}

export async function validateDeviceAssignment(payload: ValidateDeviceAssignmentPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<ValidateDeviceAssignmentResponse>>(`/fleet/devices/${payload.id}/assignment/validate`, {
  params: payload.params
 })
 return data
}

export async function assignDeviceToVehicle(payload: AssignDeviceToVehiclePayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<Device>>(`/fleet/devices/${payload.id}/assignment`, payload.data)
 return data;
}

export async function unassignDeviceToVehicle(payload: UnassignDeviceToVehiclePayload) {
 const { data } = await axiosInstance.delete<ServerSuccessResponse<Device>>(`/fleet/devices/${payload.id}/assignment`)
 return data;
}


// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function alertStatistics() {
 const { data } = await axiosInstance.get<ServerSuccessResponse<AlertStatisticsResponse>>("/fleet/alerts/stats");
 return data
}

export async function listAlerts(payload: ListAlertsPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Alert>>("/fleet/alerts", {
  params: payload.params
 })
 return data;
}

export async function acknowledgeAlert(payload: AcknowledgeAlertPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Alert>>(`/fleet/alerts/${payload.id}/acknowledge`);
 return data;
}

export async function resolveAlert(payload: ResolveAlertPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Alert>>(`/fleet/alerts/${payload.id}/resolve`);
 return data;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function operationalDashboard(payload: OperationalDashboardPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<OperationalDashboard>>("/fleet/reports/dashboard", {
  params: payload.params
 })
 return data;
}

export async function deliveryMetrics(payload: DeliveryMetricsPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<DeliveryMetrics>>("/fleet/reports/delivery-metrics", {
  params: payload.params
 })
 return data;
}

export async function reportExport(payload: ReportExportPayload) {
 const { data } = await axiosInstance.get(`/fleet/reports/export/${payload.entity}`, {
  params: payload.params
 })
 return data;
}

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export async function listFuelTransaction(payload: ListFuelTransactionsPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<FuelTransaction>>("/fleet/fuel", {
  params: payload.params
 })
 return data;
}

export async function recordFuelTransaction(payload: RecordFuelTransactionPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<FuelTransaction>>("/fleet/fuel", payload.data)
 return data;
}

export async function fuelMetrics(payload: FuelMetricsPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<FuelMetrics>>("/fleet/fuel/metrics", {
  params: payload.params
 })
 return data;
}

export async function fuelEfficiency(payload: FuelEfficiencyPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<FuelEffficiency>>("/fleet/fuel/efficiency", {
  params: payload.params
 })
 return data;
}

export async function fuelThreshold() {
 const { data } = await axiosInstance.get<ServerSuccessResponse<FuelThreshold>>("/fleet/fuel/thresholds");
 return data;
}

export async function fuelExport(payload: FuelExportPayload) {
 const { data } = await axiosInstance.get("/fleet/fuel/export", {
  params: payload.params
 })
 return data
}

export async function updateFuelTransaction(payload: UpdateFuelTransactionPayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<FuelTransaction>>(`/fleet/fuel/${payload.id}`, payload.data)
 return data;
}

export async function deleteFuelTransaction(payload: DeleteFuelTransactionPayload) {
 const { data } = await axiosInstance.delete(`/fleet/fuel/${payload.id}`)
 return data
}

export async function setFuelThreshold(payload: SetFuelThresholdPayload) {
 const { data } = await axiosInstance.put(`/fleet/fuel/thresholds/${payload.vehicleType}`, payload.data)
 return data;
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function listDocuments(payload: ListDocumentPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Document>>("/fleet/documents", {
  params: payload.params
 })
 return data;
}

export async function uploadDocument(payload: UploadDocumentPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Document>>("/fleet/documents", undefined, {
  params: payload.params
 })
 return data;
}

export async function documentSecureUrl(payload: DocumentSecureUrlPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<DocumentSecureUrl>>(`/fleet/documents/${payload.id}/download-url`, {
  params: payload.params
 })
 return data;
}

export async function documentAccessLog(payload: DocumentAccessLogPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<DocumentAccessLog>>(`/fleet/documents/${payload.id}/access-log`, {
  params: payload.params
 })
 return data;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export async function auditLog(payload: AuditLogPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<AuditLog>>("/fleet/audit", {
  params: payload.params
 })
 return data;
}

