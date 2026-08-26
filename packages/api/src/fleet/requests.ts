import { axiosInstance } from '../lib/axios-instance'

import type {
  AccessLogListResponse,
  AlertActionPayload,
  AlertStatsResponse,
  AlertsQuery,
  AssignDevicePayload,
  AssignDriverPayload,
  AuditChainVerificationResponse,
  AuditLogQuery,
  BulkDeviceImportResponse,
  BulkDriverImportResponse,
  BulkVehicleImportResponse,
  CreateMaintenanceRecordPayload,
  CreateDevicePayload,
  CreateDeviceSetupRequestPayload,
  CreateDriverPayload,
  CreateVehiclePayload,
  CreateGeofencePayload,
  DeliveryMetricsResponse,
  DeviceAssignmentValidationResponse,
  DeviceSetupRequestListResponse,
  DeviceSetupRequestResponse,
  DeviceSetupRequestsQuery,
  DevicesQuery,
  DispatchSearchQuery,
  DataBundlesQuery,
  DocumentDownloadUrlQuery,
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
  FleetAnalyticsShortPeriodQuery,
  FleetAnalyticsSummaryResponse,
  FleetArchiveResponse,
  FleetAuditLogResponse,
  IntegrationHealthResponse,
  FleetFinancialConfigActionPayload,
  FleetFinancialConfigListResponse,
  FleetFinancialConfigResponse,
  FleetFinancialStatementExportQuery,
  FleetFinancialStatementQuery,
  FleetFinancialStatementResponse,
  FleetFinancialSummaryQuery,
  FleetFinancialSummaryResponse,
  FleetProfitabilityPayload,
  FleetProfitabilityResponse,
  FleetDashboardResponse,
  FleetDeviceListResponse,
  FleetDeviceResponse,
  FleetDocumentListResponse,
  FleetDocumentResponse,
  FleetDriverListResponse,
  FleetDriverResponse,
  GeofenceListResponse,
  GeofenceResponse,
  GeofencesQuery,
  FuelBudgetListResponse,
  FuelBudgetResponse,
  FuelBudgetVsActualQuery,
  FuelBudgetVsActualResponse,
  FuelConsumptionResponse,
  FuelEfficiencyResponse,
  FuelMetricsQuery,
  FuelQuery,
  FuelRecordListResponse,
  FuelRecordResponse,
  FuelSummaryResponse,
  FuelThresholdListResponse,
  FuelThresholdResponse,
  GpsDeviceListResponse,
  ImportDevicesPayload,
  ImportDriversPayload,
  ImportVehiclesPayload,
  LegacyGpsDevicesQuery,
  MaintenanceRecordActionPayload,
  MaintenanceRecordListResponse,
  MaintenanceRecordResponse,
  MaintenanceRecordsQuery,
  MaintenanceRecordsSummaryResponse,
  MaintenanceProfileActionPayload,
  MaintenanceProfileListResponse,
  MaintenanceProfileResponse,
  MaintenanceProfilesQuery,
  MaintenanceProfilesSummaryResponse,
  MaintenanceServiceCategoriesResponse,
  MaintenanceStatusResponse,
  NearestVehicleListResponse,
  NearestVehiclesQuery,
  RecommendDriversQuery,
  RecommendedDriverListResponse,
  RecordFuelTransactionPayload,
  RegisterGeofencePayload,
  RegisterGpsDevicePayload,
  ReminderSendResponse,
  RenewComplianceDocumentPayload,
  ReportLocationPayload,
  SetGeofenceVehiclesPayload,
  SetFuelThresholdPayload,
  SimCarrierListResponse,
  SimDataBundleListResponse,
  UpdateDeviceLifecyclePayload,
  UpdateDeviceSetupRequestStatusPayload,
  UpdateDeviceFirmwarePayload,
  UpdateDevicePayload,
  UpdateDriverContactChannelsPayload,
  UpdateDriverPayload,
  UpdateDriverStatusPayload,
  UpdateFleetFinancialConfigPayload,
  UpdateFuelTransactionPayload,
  UpdateMaintenanceRecordPayload,
  UpdateVehiclePayload,
  UpdateVehicleStatusPayload,
  UpdateGeofencePayload,
  UploadDocumentQuery,
  UpsertFuelBudgetPayload,
  ValidateDeviceAssignmentQuery,
  VehicleDriverAssignmentResponse,
  VehicleHealthListResponse,
  VehicleHealthResponse,
  VehicleListResponse,
  VehicleSafetyRadarResponse,
  VehicleResponse,
  VehicleSummaryResponse,
  VehiclesQuery,
  ComplianceDocumentsQuery,
  ComplianceDocumentHistoryQuery,
  ComplianceDocumentListResponse,
  ComplianceDocumentSummaryResponse,
  ComplianceDocumentResponse,
  CreateComplianceDocumentPayload,
  CreateMaintenanceProfilePayload,
  UpdateComplianceDocumentPayload,
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

export async function exportVehicles(payload?: VehiclesQuery) {
  const { data } = await axiosInstance.get<Blob>('/fleet/vehicles/export', {
    params: payload?.params,
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
  const { data } = await axiosInstance.delete<VehicleResponse>(`/fleet/vehicles/${id}`)
  return data
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
  const { data } = await axiosInstance.delete<VehicleResponse>(`/fleet/vehicles/${id}/assignment`)
  return data
}

export async function registerGpsDevice({ id, data }: RegisterGpsDevicePayload) {
  const { data: res } = await axiosInstance.patch<VehicleResponse>(`/fleet/vehicles/${id}/gps-device`, data)
  return res
}

// ─── Vehicles — health ────────────────────────────────────────────────────────

export async function getVehicleHealth({ vehicleId }: { vehicleId: string }) {
  const { data } = await axiosInstance.get<VehicleHealthResponse>(`/fleet/vehicles/${vehicleId}/health`)
  return data
}

export async function getAllVehicleHealth() {
  const { data } = await axiosInstance.get<VehicleHealthListResponse>('/fleet/vehicles/health')
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

export async function getGeofences(payload?: GeofencesQuery) {
  const { data } = await axiosInstance.get<GeofenceListResponse>('/fleet/geofences', { params: payload?.params })
  return data
}

export async function getGeofenceZone({ id }: { id: string }) {
  const { data } = await axiosInstance.get<GeofenceResponse>(`/fleet/geofences/${id}`)
  return data
}

export async function createGeofence({ data: body }: CreateGeofencePayload) {
  const { data } = await axiosInstance.post<GeofenceResponse>('/fleet/geofences', body)
  return data
}

export async function updateGeofence({ id, data: body }: UpdateGeofencePayload) {
  const { data } = await axiosInstance.patch<GeofenceResponse>(`/fleet/geofences/${id}`, body)
  return data
}

export async function archiveGeofence({ id }: { id: string }) {
  const { data } = await axiosInstance.delete<FleetArchiveResponse>(`/fleet/geofences/${id}`)
  return data
}

export async function setGeofenceVehicles({ id, data: body }: SetGeofenceVehiclesPayload) {
  const { data } = await axiosInstance.put<GeofenceResponse>(`/fleet/geofences/${id}/vehicles`, body)
  return data
}

export async function exportDevices(payload?: DevicesQuery) {
  const { data } = await axiosInstance.get<Blob>('/fleet/devices/export', {
    params: payload?.params,
    responseType: 'blob',
  })
  return data
}

export async function downloadDeviceImportTemplate() {
  const { data } = await axiosInstance.get<Blob>('/fleet/devices/import-template', {
    responseType: 'blob',
  })
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

export async function updateDeviceFirmware({ id, data }: UpdateDeviceFirmwarePayload) {
  const { data: res } = await axiosInstance.patch<FleetDeviceResponse>(`/fleet/devices/${id}/firmware`, data)
  return res
}

export async function deleteDevice({ id }: { id: string }) {
  const { data } = await axiosInstance.delete<FleetDeviceResponse>(`/fleet/devices/${id}`)
  return data
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
  const { data } = await axiosInstance.delete<FleetDeviceResponse>(`/fleet/devices/${id}/assignment`)
  return data
}

// ─── Legacy GPS ───────────────────────────────────────────────────────────────

export async function getDeviceSetupRequests(payload?: DeviceSetupRequestsQuery) {
  const { data } = await axiosInstance.get<DeviceSetupRequestListResponse>('/fleet/device-setup-requests', {
    params: payload?.params,
  })
  return data
}

export async function createDeviceSetupRequest({ data: body }: CreateDeviceSetupRequestPayload) {
  const { data } = await axiosInstance.post<DeviceSetupRequestResponse>('/fleet/device-setup-requests', body)
  return data
}

export async function getDeviceSetupRequest({ id }: { id: string }) {
  const { data } = await axiosInstance.get<DeviceSetupRequestResponse>(`/fleet/device-setup-requests/${id}`)
  return data
}

export async function updateDeviceSetupRequestStatus({ id, data: body }: UpdateDeviceSetupRequestStatusPayload) {
  const { data } = await axiosInstance.patch<DeviceSetupRequestResponse>(
    `/fleet/device-setup-requests/${id}/status`,
    body,
  )
  return data
}

// ─── SIM catalog ──────────────────────────────────────────────────────────────

export async function getSimCarriers() {
  const { data } = await axiosInstance.get<SimCarrierListResponse>('/fleet/carriers')
  return data
}

export async function getSimDataBundles(payload?: DataBundlesQuery) {
  const { data } = await axiosInstance.get<SimDataBundleListResponse>('/fleet/data-bundles', {
    params: payload?.params,
  })
  return data
}

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
  const { data } = await axiosInstance.delete<FleetDriverResponse>(`/fleet/drivers/${id}`)
  return data
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

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export async function getDispatchSearch(payload?: DispatchSearchQuery) {
  const { data } = await axiosInstance.get<DispatchSearchResponse>('/fleet/dispatch/search', { params: payload?.params })
  return data
}

export async function recommendDrivers(payload?: RecommendDriversQuery) {
  const { data } = await axiosInstance.get<RecommendedDriverListResponse>('/fleet/dispatch/recommend-drivers', {
    params: payload?.params,
  })
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

export async function acknowledgeAlert({ id, params }: AlertActionPayload) {
  const { data } = await axiosInstance.post<FleetAlertResponse>(`/fleet/alerts/${id}/acknowledge`, null, { params })
  return data
}

export async function resolveAlert({ id, params }: AlertActionPayload) {
  const { data } = await axiosInstance.post<FleetAlertResponse>(`/fleet/alerts/${id}/resolve`, null, { params })
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

export async function getFleetAnalyticsFleetStatus(payload?: FleetAnalyticsShortPeriodQuery) {
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

export async function getFleetAnalyticsFuelLevels(payload?: FleetAnalyticsShortPeriodQuery) {
  const { data } = await axiosInstance.get<FleetAnalyticsFuelLevelsResponse>('/fleet/analytics/fuel-levels', {
    params: payload?.params,
  })
  return data
}

export async function getVehicleSafetyRadar(payload?: FleetAnalyticsShortPeriodQuery) {
  const { data } = await axiosInstance.get<VehicleSafetyRadarResponse>('/fleet/analytics/vehicle-safety-radar', {
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

export async function getFleetFinancialSummary(payload?: FleetFinancialSummaryQuery) {
  const { data } = await axiosInstance.get<FleetFinancialSummaryResponse>('/fleet/financials/summary', {
    params: payload?.params,
  })
  return data
}

export async function computeFleetProfitability({ data: body }: FleetProfitabilityPayload) {
  const { data } = await axiosInstance.post<FleetProfitabilityResponse>('/fleet/financials/profitability', body)
  return data
}

export async function exportFleetFinancialStatement(payload?: FleetFinancialStatementExportQuery) {
  const response = await axiosInstance.get<Blob>('/fleet/financials/statement/export', {
    params: payload?.params,
    responseType: 'blob',
  })
  return {
    blob: response.data,
    contentType: response.headers['content-type'] as string | undefined,
    contentDisposition: response.headers['content-disposition'] as string | undefined,
  }
}

export async function exportFleetCostBreakdown() {
  const response = await axiosInstance.get<Blob>('/fleet/financials/cost-breakdown/export', {
    responseType: 'blob',
  })
  return {
    blob: response.data,
    contentType: response.headers['content-type'] as string | undefined,
    contentDisposition: response.headers['content-disposition'] as string | undefined,
  }
}

export async function getFleetFinancialStatement(payload?: FleetFinancialStatementQuery) {
  const { data } = await axiosInstance.get<FleetFinancialStatementResponse>('/fleet/financials/statement', {
    params: payload?.params,
  })
  return data
}

export async function getFleetFinancialConfigs() {
  const { data } = await axiosInstance.get<FleetFinancialConfigListResponse>('/fleet/financials/configs')
  return data
}

export async function exportVehiclePL() {
  const response = await axiosInstance.get<Blob>('/fleet/financials/vehicle-pl/export', {
    responseType: 'blob',
  })
  return {
    blob: response.data,
    contentType: response.headers['content-type'] as string | undefined,
    contentDisposition: response.headers['content-disposition'] as string | undefined,
  }
}

export async function getFleetFinancialConfig({ vehicleId }: FleetFinancialConfigActionPayload) {
  const { data } = await axiosInstance.get<FleetFinancialConfigResponse>(`/fleet/financials/configs/${vehicleId}`)
  return data
}

export async function updateFleetFinancialConfig({ vehicleId, data: body }: UpdateFleetFinancialConfigPayload) {
  const { data } = await axiosInstance.put<FleetFinancialConfigResponse>(`/fleet/financials/configs/${vehicleId}`, body)
  return data
}

export async function exportReport({ entity }: ExportReportPayload) {
  const { data } = await axiosInstance.get<Blob>(`/fleet/reports/export/${entity}`, {
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
  const { data } = await axiosInstance.delete<FleetArchiveResponse>(`/fleet/fuel/${id}`)
  return data
}

export async function getFuelSummary() {
  const { data } = await axiosInstance.get<FuelSummaryResponse>('/fleet/fuel/summary')
  return data
}

export async function exportFuelTransactions() {
  const { data } = await axiosInstance.get<string>('/fleet/fuel/export')
  return data
}

export async function getFuelMetrics(payload?: FuelMetricsQuery) {
  const { data } = await axiosInstance.get<FuelConsumptionResponse>('/fleet/fuel/metrics', { params: payload?.params })
  return data
}

export async function getFuelBudgetVsActual(payload?: FuelBudgetVsActualQuery) {
  const { data } = await axiosInstance.get<FuelBudgetVsActualResponse>('/fleet/fuel/budget-vs-actual', {
    params: payload?.params,
  })
  return data
}

export async function getFuelBudgets() {
  const { data } = await axiosInstance.get<FuelBudgetListResponse>('/fleet/fuel/budgets')
  return data
}

export async function upsertFuelBudget({ vehicleId, data: body }: UpsertFuelBudgetPayload) {
  const { data } = await axiosInstance.put<FuelBudgetResponse>(`/fleet/fuel/budgets/${vehicleId}`, body)
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

// Maintenance

export async function getMaintenanceRecords(payload?: MaintenanceRecordsQuery) {
  const { data } = await axiosInstance.get<MaintenanceRecordListResponse>('/fleet/maintenance/records', {
    params: payload?.params,
  })
  return data
}

export async function getMaintenanceRecordsSummary() {
  const { data } = await axiosInstance.get<MaintenanceRecordsSummaryResponse>('/fleet/maintenance/records/summary')
  return data
}

export async function exportMaintenanceRecords() {
  const { data } = await axiosInstance.get<Blob>('/fleet/maintenance/records/export', {
    responseType: 'blob',
  })
  return data
}

export async function createMaintenanceRecord({ data }: CreateMaintenanceRecordPayload) {
  const { data: res } = await axiosInstance.post<MaintenanceRecordResponse>('/fleet/maintenance/records', data)
  return res
}

export async function getMaintenanceRecord({ id }: MaintenanceRecordActionPayload) {
  const { data } = await axiosInstance.get<MaintenanceRecordResponse>(`/fleet/maintenance/records/${id}`)
  return data
}

export async function updateMaintenanceRecord({ id, data }: UpdateMaintenanceRecordPayload) {
  const { data: res } = await axiosInstance.patch<MaintenanceRecordResponse>(`/fleet/maintenance/records/${id}`, data)
  return res
}

export async function deleteMaintenanceRecord({ id }: MaintenanceRecordActionPayload) {
  const { data } = await axiosInstance.delete<MaintenanceStatusResponse>(`/fleet/maintenance/records/${id}`)
  return data
}

export async function startMaintenanceRecord({ id }: MaintenanceRecordActionPayload) {
  const { data } = await axiosInstance.post<MaintenanceRecordResponse>(`/fleet/maintenance/records/${id}/start`)
  return data
}

export async function completeMaintenanceRecord({ id }: MaintenanceRecordActionPayload) {
  const { data } = await axiosInstance.post<MaintenanceRecordResponse>(`/fleet/maintenance/records/${id}/complete`)
  return data
}

export async function sendMaintenanceReminders() {
  const { data } = await axiosInstance.post<ReminderSendResponse>('/fleet/maintenance/reminders/send')
  return data
}

export async function getMaintenanceProfiles(payload?: MaintenanceProfilesQuery) {
  const { data } = await axiosInstance.get<MaintenanceProfileListResponse>('/fleet/maintenance/profiles', {
    params: payload?.params,
  })
  return data
}

export async function createMaintenanceProfile({ data }: CreateMaintenanceProfilePayload) {
  const { data: res } = await axiosInstance.post<MaintenanceProfileResponse>('/fleet/maintenance/profiles', data)
  return res
}

export async function deleteMaintenanceProfile({ id }: MaintenanceProfileActionPayload) {
  const { data } = await axiosInstance.delete<MaintenanceStatusResponse>(`/fleet/maintenance/profiles/${id}`)
  return data
}

export async function completeMaintenanceProfile({ id }: MaintenanceProfileActionPayload) {
  const { data } = await axiosInstance.post<MaintenanceProfileResponse>(`/fleet/maintenance/profiles/${id}/complete`)
  return data
}

export async function getMaintenanceProfilesSummary() {
  const { data } = await axiosInstance.get<MaintenanceProfilesSummaryResponse>('/fleet/maintenance/profiles/summary')
  return data
}

export async function getMaintenanceServiceCategories() {
  const { data } = await axiosInstance.get<MaintenanceServiceCategoriesResponse>('/fleet/maintenance/service-categories')
  return data
}

export async function exportMaintenanceProfiles() {
  const { data } = await axiosInstance.get<Blob>('/fleet/maintenance/profiles/export', {
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

export async function getDocumentDownloadUrl({ id, params }: DocumentDownloadUrlQuery) {
  const { data } = await axiosInstance.get<DownloadUrlResponse>(`/fleet/documents/${id}/download-url`, { params })
  return data
}

export async function getDocumentAccessLog({ id }: { id: string }) {
  const { data } = await axiosInstance.get<AccessLogListResponse>(`/fleet/documents/${id}/access-log`)
  return data
}

// ─── Compliance ───────────────────────────────────────────────────────────────

export async function getComplianceDocs({ params }: ComplianceDocumentsQuery = {}) {
  const { data } = await axiosInstance.get<ComplianceDocumentListResponse>('/fleet/compliance/documents', { params })
  return data
}

export async function getComplianceDocumentHistory({ params }: ComplianceDocumentHistoryQuery = {}) {
  const { data } = await axiosInstance.get<ComplianceDocumentListResponse>(
    '/fleet/compliance/documents/history',
    { params },
  )
  return data
}

export async function getComplianceSummary() {
  const { data } = await axiosInstance.get<ComplianceDocumentSummaryResponse>('/fleet/compliance/documents/summary')
  return data
}

export async function createComplianceDoc(payload: CreateComplianceDocumentPayload) {
  const { data } = await axiosInstance.post<ComplianceDocumentResponse>('/fleet/compliance/documents', payload)
  return data
}

export async function updateComplianceDoc(id: string, payload: UpdateComplianceDocumentPayload) {
  const { data } = await axiosInstance.patch<ComplianceDocumentResponse>(`/fleet/compliance/documents/${id}`, payload)
  return data
}

export async function deleteComplianceDoc(id: string) {
  const { data } = await axiosInstance.delete<FleetArchiveResponse>(`/fleet/compliance/documents/${id}`)
  return data
}

export async function setComplianceDocFileUrl(id: string, payload: { fileUrl: string; fileSize?: number }) {
  const { data } = await axiosInstance.post<ComplianceDocumentResponse>(
    `/fleet/compliance/documents/${id}/upload`,
    payload,
  )
  return data
}

export async function renewComplianceDoc(id: string, payload?: RenewComplianceDocumentPayload) {
  const { data } = await axiosInstance.post<ComplianceDocumentResponse>(
    `/fleet/compliance/documents/${id}/renew`,
    payload,
  )
  return data
}

export async function setComplianceDocReminder(id: string, reminderDays: number) {
  const { data } = await axiosInstance.patch<ComplianceDocumentResponse>(
    `/fleet/compliance/documents/${id}/reminder`,
    { reminderDays },
  )
  return data
}

export async function sendComplianceReminders() {
  const { data } = await axiosInstance.post<ReminderSendResponse>('/fleet/compliance/reminders/send')
  return data
}

export async function exportComplianceDocs() {
  const { data } = await axiosInstance.get<Blob>('/fleet/compliance/documents/export', { responseType: 'blob' })
  return data
}

// ─── Integrations ─────────────────────────────────────────────────────────────

export async function getIntegrationHealth() {
  const { data } = await axiosInstance.get<IntegrationHealthResponse>('/fleet/webhooks/health')
  return data
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function getAuditLog(payload?: AuditLogQuery) {
  const { data } = await axiosInstance.get<FleetAuditLogResponse>('/fleet/audit', { params: payload?.params })
  return data
}

export async function verifyAuditChain() {
  const { data } = await axiosInstance.get<AuditChainVerificationResponse>('/fleet/audit/verify')
  return data
}
