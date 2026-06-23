import { axiosInstance } from '../lib/axios-instance'

import type {
  AccessLogListResponse,
  AlertStatsResponse,
  AlertsQuery,
  AssignDevicePayload,
  AssignDriverPayload,
  AuditLogQuery,
  BulkDeviceImportResponse,
  BulkDriverImportResponse,
  BulkVehicleImportResponse,
  CreateDevicePayload,
  CreateDriverPayload,
  CreateVehiclePayload,
  DeliveryMetricsResponse,
  DeviceAssignmentValidationResponse,
  DevicesQuery,
  DispatchSearchQuery,
  DispatchSearchResponse,
  DocumentsQuery,
  DownloadUrlResponse,
  DriversQuery,
  ExportReportPayload,
  FleetAlertListResponse,
  FleetAlertResponse,
  FleetAnalyticsDriverScoresResponse,
  FleetAnalyticsDriverScoresQuery,
  FleetAnalyticsEventsResponse,
  FleetAnalyticsEventsQuery,
  FleetAnalyticsFleetStatusResponse,
  FleetAnalyticsFuelLevelsResponse,
  FleetAnalyticsJobPipelineResponse,
  FleetAnalyticsPeriodQuery,
  FleetAnalyticsSummaryResponse,
  FleetDashboardResponse,
  FleetDeviceListResponse,
  FleetDeviceResponse,
  FleetDocumentListResponse,
  FleetDocumentResponse,
  FleetDriverListResponse,
  FleetDriverResponse,
  FleetJobListResponse,
  FuelConsumptionResponse,
  FuelEfficiencyResponse,
  FuelMetricsQuery,
  FuelQuery,
  FuelRecordListResponse,
  FuelRecordResponse,
  FuelThresholdListResponse,
  FuelThresholdResponse,
  GpsDeviceListResponse,
  ImportDevicesPayload,
  ImportDriversPayload,
  ImportVehiclesPayload,
  JobsQuery,
  LegacyGpsDevicesQuery,
  NearestVehicleListResponse,
  NearestVehiclesQuery,
  RecordFuelTransactionPayload,
  RegisterGeofencePayload,
  RegisterGpsDevicePayload,
  ReportLocationPayload,
  SetFuelThresholdPayload,
  UpdateDeviceLifecyclePayload,
  UpdateDevicePayload,
  UpdateDriverContactChannelsPayload,
  UpdateDriverPayload,
  UpdateDriverStatusPayload,
  UpdateFuelTransactionPayload,
  UpdateVehiclePayload,
  UpdateVehicleStatusPayload,
  UploadDocumentQuery,
  ValidateDeviceAssignmentQuery,
  VehicleDriverAssignmentResponse,
  VehicleListResponse,
  VehicleResponse,
  VehicleSummaryResponse,
  VehiclesQuery,
} from './types'

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function registerGeofence({ vehicleId, data }: RegisterGeofencePayload) {
  const { data: res } = await axiosInstance.post(`/fleet/routes/${vehicleId}/geofence`, data)
  return res
}

export async function getGeofence({ vehicleId }: { vehicleId: string }) {
  const { data } = await axiosInstance.get(`/fleet/routes/${vehicleId}/geofence`)
  return data
}

export async function reportLocation({ vehicleId, data }: ReportLocationPayload) {
  const { data: res } = await axiosInstance.post(`/fleet/routes/${vehicleId}/location`, data)
  return res
}

// ─── Vehicles — CRUD ──────────────────────────────────────────────────────────

export async function getVehicles(payload?: VehiclesQuery) {
  const { data } = await axiosInstance.get<VehicleListResponse>('/fleet/vehicles', { params: payload?.params })
  return data
}

export async function getVehiclesSummary() {
  const { data } = await axiosInstance.get<VehicleSummaryResponse>('/fleet/vehicles/summary')
  return data
}

export async function exportVehicles() {
  const { data } = await axiosInstance.get('/fleet/vehicles/export', {
    responseType: 'blob',
  })
  return data
}

export async function createVehicle({ data }: CreateVehiclePayload) {
  const { data: res } = await axiosInstance.post<VehicleResponse>('/fleet/vehicles', data)
  return res
}

export async function getVehicle({ id }: { id: string }) {
  const { data } = await axiosInstance.get<VehicleResponse>(`/fleet/vehicles/${id}`)
  return data
}

export async function updateVehicle({ id, data }: UpdateVehiclePayload) {
  const { data: res } = await axiosInstance.patch<VehicleResponse>(`/fleet/vehicles/${id}`, data)
  return res
}

export async function deleteVehicle({ id }: { id: string }) {
  await axiosInstance.delete<VehicleResponse>(`/fleet/vehicles/${id}`)
}

export async function importVehicles({ data }: ImportVehiclesPayload) {
  const { data: res } = await axiosInstance.post<BulkVehicleImportResponse>('/fleet/vehicles/import', data)
  return res
}

// ─── Vehicles — status & assignment ──────────────────────────────────────────

export async function updateVehicleStatus({ id, data }: UpdateVehicleStatusPayload) {
  const { data: res } = await axiosInstance.patch<VehicleResponse>(`/fleet/vehicles/${id}/status`, data)
  return res
}

export async function assignDriverToVehicle({ id, data }: AssignDriverPayload) {
  const { data: res } = await axiosInstance.patch<VehicleDriverAssignmentResponse>(`/fleet/vehicles/${id}/assignment`, data)
  return res
}

export async function unassignDriverFromVehicle({ id }: { id: string }) {
  await axiosInstance.delete<VehicleResponse>(`/fleet/vehicles/${id}/assignment`)
}

export async function registerGpsDevice({ id, data }: RegisterGpsDevicePayload) {
  const { data: res } = await axiosInstance.patch<VehicleResponse>(`/fleet/vehicles/${id}/gps-device`, data)
  return res
}

// ─── Vehicles — health ────────────────────────────────────────────────────────

export async function getVehicleHealth({ vehicleId }: { vehicleId: string }) {
  const { data } = await axiosInstance.get(`/fleet/vehicles/${vehicleId}/health`)
  return data
}

export async function getAllVehicleHealth() {
  const { data } = await axiosInstance.get('/fleet/vehicles/health')
  return data
}

export async function getNearestVehicles({ params }: NearestVehiclesQuery) {
  const { data } = await axiosInstance.get<NearestVehicleListResponse>('/fleet/vehicles/nearest', { params })
  return data
}

// ─── Devices ──────────────────────────────────────────────────────────────────

export async function getDevices(payload?: DevicesQuery) {
  const { data } = await axiosInstance.get<FleetDeviceListResponse>('/fleet/devices', { params: payload?.params })
  return data
}

export async function createDevice({ data }: CreateDevicePayload) {
  const { data: res } = await axiosInstance.post<FleetDeviceResponse>('/fleet/devices', data)
  return res
}

export async function getDevice({ id }: { id: string }) {
  const { data } = await axiosInstance.get<FleetDeviceResponse>(`/fleet/devices/${id}`)
  return data
}

export async function updateDevice({ id, data }: UpdateDevicePayload) {
  const { data: res } = await axiosInstance.patch<FleetDeviceResponse>(`/fleet/devices/${id}`, data)
  return res
}

export async function deleteDevice({ id }: { id: string }) {
  await axiosInstance.delete<FleetDeviceResponse>(`/fleet/devices/${id}`)
}

export async function importDevices({ data }: ImportDevicesPayload) {
  const { data: res } = await axiosInstance.post<BulkDeviceImportResponse>('/fleet/devices/import', data)
  return res
}

export async function updateDeviceLifecycle({ id, data }: UpdateDeviceLifecyclePayload) {
  const { data: res } = await axiosInstance.patch<FleetDeviceResponse>(`/fleet/devices/${id}/lifecycle`, data)
  return res
}

export async function validateDeviceAssignment({ id, params }: ValidateDeviceAssignmentQuery) {
  const { data } = await axiosInstance.get<DeviceAssignmentValidationResponse>(`/fleet/devices/${id}/assignment/validate`, { params })
  return data
}

export async function assignDevice({ id, data }: AssignDevicePayload) {
  const { data: res } = await axiosInstance.patch<FleetDeviceResponse>(`/fleet/devices/${id}/assignment`, data)
  return res
}

export async function unassignDevice({ id }: { id: string }) {
  await axiosInstance.delete<FleetDeviceResponse>(`/fleet/devices/${id}/assignment`)
}

// ─── Legacy GPS ───────────────────────────────────────────────────────────────

export async function getLegacyGpsDevices(payload?: LegacyGpsDevicesQuery) {
  const { data } = await axiosInstance.get<GpsDeviceListResponse>('/fleet/gps-devices', { params: payload?.params })
  return data
}

// ─── Drivers — CRUD ───────────────────────────────────────────────────────────

export async function getDrivers(payload?: DriversQuery) {
  const { data } = await axiosInstance.get<FleetDriverListResponse>('/fleet/drivers', { params: payload?.params })
  return data
}

export async function createDriver({ data }: CreateDriverPayload) {
  const { data: res } = await axiosInstance.post<FleetDriverResponse>('/fleet/drivers', data)
  return res
}

export async function getDriver({ id }: { id: string }) {
  const { data } = await axiosInstance.get<FleetDriverResponse>(`/fleet/drivers/${id}`)
  return data
}

export async function updateDriver({ id, data }: UpdateDriverPayload) {
  const { data: res } = await axiosInstance.patch<FleetDriverResponse>(`/fleet/drivers/${id}`, data)
  return res
}

export async function deleteDriver({ id }: { id: string }) {
  await axiosInstance.delete<FleetDriverResponse>(`/fleet/drivers/${id}`)
}

export async function importDrivers({ data }: ImportDriversPayload) {
  const { data: res } = await axiosInstance.post<BulkDriverImportResponse>('/fleet/drivers/import', data)
  return res
}

// ─── Drivers — status & channels ─────────────────────────────────────────────

export async function updateDriverStatus({ id, data }: UpdateDriverStatusPayload) {
  const { data: res } = await axiosInstance.patch<FleetDriverResponse>(`/fleet/drivers/${id}/status`, data)
  return res
}

export async function updateDriverContactChannels({ id, data }: UpdateDriverContactChannelsPayload) {
  const { data: res } = await axiosInstance.patch<FleetDriverResponse>(`/fleet/drivers/${id}/contact-channels`, data)
  return res
}

// ─── Jobs & dispatch ──────────────────────────────────────────────────────────

export async function getJobs(payload?: JobsQuery) {
  const { data } = await axiosInstance.get<FleetJobListResponse>('/fleet/jobs', { params: payload?.params })
  return data
}

export async function getDispatchSearch(payload?: DispatchSearchQuery) {
  const { data } = await axiosInstance.get<DispatchSearchResponse>('/fleet/dispatch/search', { params: payload?.params })
  return data
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function getAlertStats() {
  const { data } = await axiosInstance.get<AlertStatsResponse>('/fleet/alerts/stats')
  return data
}

export async function getAlerts(payload?: AlertsQuery) {
  const { data } = await axiosInstance.get<FleetAlertListResponse>('/fleet/alerts', { params: payload?.params })
  return data
}

export async function acknowledgeAlert({ id }: { id: string }) {
  const { data } = await axiosInstance.post<FleetAlertResponse>(`/fleet/alerts/${id}/acknowledge`)
  return data
}

export async function resolveAlert({ id }: { id: string }) {
  const { data } = await axiosInstance.post<FleetAlertResponse>(`/fleet/alerts/${id}/resolve`)
  return data
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getReportsDashboard() {
  const { data } = await axiosInstance.get<FleetDashboardResponse>('/fleet/reports/dashboard')
  return data
}

export async function getDeliveryMetrics() {
  const { data } = await axiosInstance.get<DeliveryMetricsResponse>('/fleet/reports/delivery-metrics')
  return data
}

export async function getFleetAnalyticsSummary(payload?: FleetAnalyticsPeriodQuery) {
  const { data } = await axiosInstance.get<FleetAnalyticsSummaryResponse>('/fleet/analytics/summary', {
    params: payload?.params,
  })
  return data
}

export async function getFleetAnalyticsFleetStatus(payload?: FleetAnalyticsPeriodQuery) {
  const { data } = await axiosInstance.get<FleetAnalyticsFleetStatusResponse>('/fleet/analytics/fleet-status', {
    params: payload?.params,
  })
  return data
}

export async function getFleetAnalyticsJobPipeline(payload?: FleetAnalyticsPeriodQuery) {
  const { data } = await axiosInstance.get<FleetAnalyticsJobPipelineResponse>('/fleet/analytics/job-pipeline', {
    params: payload?.params,
  })
  return data
}

export async function getFleetAnalyticsFuelLevels(payload?: FleetAnalyticsPeriodQuery) {
  const { data } = await axiosInstance.get<FleetAnalyticsFuelLevelsResponse>('/fleet/analytics/fuel-levels', {
    params: payload?.params,
  })
  return data
}

export async function getFleetAnalyticsDriverScores(payload?: FleetAnalyticsDriverScoresQuery) {
  const { data } = await axiosInstance.get<FleetAnalyticsDriverScoresResponse>('/fleet/analytics/driver-scores', {
    params: payload?.params,
  })
  return data
}

export async function getFleetAnalyticsEvents(payload?: FleetAnalyticsEventsQuery) {
  const { data } = await axiosInstance.get<FleetAnalyticsEventsResponse>('/fleet/analytics/events', {
    params: payload?.params,
  })
  return data
}

export async function exportReport({ entity }: ExportReportPayload) {
  const { data } = await axiosInstance.get(`/fleet/reports/export/${entity}`, {
    responseType: 'blob',
  })
  return data
}

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export async function recordFuelTransaction({ data }: RecordFuelTransactionPayload) {
  const { data: res } = await axiosInstance.post<FuelRecordResponse>('/fleet/fuel', data)
  return res
}

export async function getFuelTransactions(payload?: FuelQuery) {
  const { data } = await axiosInstance.get<FuelRecordListResponse>('/fleet/fuel', { params: payload?.params })
  return data
}

export async function updateFuelTransaction({ id, data }: UpdateFuelTransactionPayload) {
  const { data: res } = await axiosInstance.patch<FuelRecordResponse>(`/fleet/fuel/${id}`, data)
  return res
}

export async function deleteFuelTransaction({ id }: { id: string }) {
  await axiosInstance.delete<FuelRecordResponse>(`/fleet/fuel/${id}`)
}

export async function getFuelMetrics(payload?: FuelMetricsQuery) {
  const { data } = await axiosInstance.get<FuelConsumptionResponse>('/fleet/fuel/metrics', { params: payload?.params })
  return data
}

export async function getFuelEfficiency() {
  const { data } = await axiosInstance.get<FuelEfficiencyResponse>('/fleet/fuel/efficiency')
  return data
}

export async function getFuelThresholds() {
  const { data } = await axiosInstance.get<FuelThresholdListResponse>('/fleet/fuel/thresholds')
  return data
}

export async function setFuelThreshold({ vehicleType, data }: SetFuelThresholdPayload) {
  const { data: res } = await axiosInstance.put<FuelThresholdResponse>(`/fleet/fuel/thresholds/${vehicleType}`, data)
  return res
}

export async function exportFuelTransactions() {
  const { data } = await axiosInstance.get('/fleet/fuel/export', {
    responseType: 'blob',
  })
  return data
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function uploadDocument(file: File, { params }: UploadDocumentQuery) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axiosInstance.post<FleetDocumentResponse>('/fleet/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params,
  })
  return data
}

export async function getDocuments({ params }: DocumentsQuery) {
  const { data } = await axiosInstance.get<FleetDocumentListResponse>('/fleet/documents', { params })
  return data
}

export async function getDocumentDownloadUrl({ id }: { id: string }) {
  const { data } = await axiosInstance.get<DownloadUrlResponse>(`/fleet/documents/${id}/download-url`)
  return data
}

export async function getDocumentAccessLog({ id }: { id: string }) {
  const { data } = await axiosInstance.get<AccessLogListResponse>(`/fleet/documents/${id}/access-log`)
  return data
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function getAuditLog(payload?: AuditLogQuery) {
  const { data } = await axiosInstance.get('/fleet/audit', { params: payload?.params })
  return data
}
