import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { queryClient } from '../lib/query-client'
import {
  acknowledgeAlert,
  assignDevice,
  assignDriverToVehicle,
  computeFleetProfitability,
  completeMaintenanceProfile,
  completeMaintenanceRecord,
  createMaintenanceProfile,
  createMaintenanceRecord,
  createDevice,
  createDeviceSetupRequest,
  createDriver,
  createVehicle,
  createGeofence,
  deleteDevice,
  deleteDriver,
  deleteFuelTransaction,
  deleteMaintenanceProfile,
  deleteMaintenanceRecord,
  deleteMaintenanceReminderSchedule,
  deleteVehicle,
  downloadDeviceImportTemplate,
  downloadDriverImportTemplate,
  downloadVehicleImportTemplate,
  exportDevices,
  exportFleetAnalytics,
  exportFleetCostBreakdown,
  exportFleetFinancialStatement,
  exportFuelTransactions,
  exportMaintenanceProfiles,
  exportMaintenanceRecords,
  exportVehiclePL,
  exportVehicles,
  exportReport,
  getAlertStats,
  getAlerts,
  getAllVehicleHealth,
  getAuditLog,
  getCapacityUnits,
  getComplianceDocumentHistory,
  getDeliveryMetrics,
  getReportsActivityTrend,
  getReportsSummary,
  getVehicleActivity,
  getDevice,
  getDeviceCatalogManufacturers,
  getDeviceCatalogModels,
  getDeviceImportColumns,
  getDeviceSetupRequest,
  getDeviceSetupRequestTrackerTypes,
  getDeviceSetupRequests,
  getDevices,
  getDevicesFilters,
  getDevicesSummary,
  getDispatchSearch,
  getDocumentAccessLog,
  getDocumentDownloadUrl,
  getDocuments,
  getDriver,
  getDriverBehaviorById,
  getDriverBehaviorEvents,
  getDriverBehaviorRanking,
  getDriverBehaviorSummary,
  getDriverConsent,
  getDriverDetail,
  getDriverFatigueById,
  getDriverFatigueSummary,
  getDriverGeofenceAlerts,
  getDriverImportColumns,
  getDrivers,
  getDriversFilters,
  getDriversSummary,
  markGeofenceAlertsRead,
  patchDriverConsent,
  reinstateDriver,
  requestDriverConsent,
  runDriverFatigue,
  sendDriverMessage,
  suspendDriver,
  suspendDevice,
  reinstateDevice,
  getFleetAnalyticsDriverScores,
  getFleetAnalyticsEvents,
  getFleetAnalyticsFleetStatus,
  getFleetAnalyticsFuelLevels,
  getFleetAnalyticsJobPipeline,
  getFleetAnalyticsSummary,
  getFleetFinancialConfig,
  getFleetFinancialConfigs,
  getIntegrationHealth,
  getFleetFinancialStatement,
  getFleetComplianceAudit,
  getFleetFinancialSummary,
  getFleetFuelReport,
  getFleetProfitLoss,
  getFleetUtilizationReport,
  getFuelBudgets,
  getFuelBudgetVsActual,
  getFuelEfficiency,
  getFuelMetrics,
  getFuelSummary,
  getFuelThresholds,
  getFuelTransactions,
  getFuelTransactionsList,
  getFuelWeeklyAnalytics,
  getGeofence,
  getGeofences,
  getGeofenceZone,
  getLegacyGpsDevices,
  getMaintenanceProfiles,
  getMaintenanceProfilesSummary,
  getMaintenanceRecord,
  getMaintenanceRecords,
  getMaintenanceRecordsSummary,
  getMaintenanceReminderSchedule,
  getMaintenanceSettings,
  updateMaintenanceSettings,
  getMaintenanceServiceCategories,
  getNearestVehicles,
  getReportsDashboard,
  getSimCarriers,
  getSimDataBundles,
  getVehicleSafetyRadar,
  recommendDrivers,
  recommendVehicles,
  setGeofenceVehicles,
  updateDeviceSetupRequestStatus,
  upsertFuelBudget,
  getVehicle,
  getVehicleHealth,
  getVehicles,
  getVehiclesByTab,
  getVehiclesSummary,
  importDevices,
  importDrivers,
  importVehicles,
  recordFuelTransaction,
  registerGeofence,
  registerGpsDevice,
  reportLocation,
  resolveAlert,
  setFuelThreshold,
  sendMaintenanceReminders,
  startMaintenanceRecord,
  unassignDevice,
  unassignDriverFromVehicle,
  updateDevice,
  updateDeviceFirmware,
  updateDeviceLifecycle,
  updateDriver,
  updateDriverContactChannels,
  updateDriverStatus,
  updateFleetFinancialConfig,
  updateFuelTransaction,
  updateMaintenanceRecord,
  updateVehicle,
  updateVehicleStatus,
  updateGeofence,
  archiveGeofence,
  upsertMaintenanceReminderSchedule,
  uploadDocument,
  getVehicleImportColumns,
  getComplianceDocs,
  getComplianceSummary,
  getFleetStorageUsage,
  createComplianceDoc,
  updateComplianceDoc,
  deleteComplianceDoc,
  setComplianceDocFileUrl,
  renewComplianceDoc,
  setComplianceDocReminder,
  sendComplianceReminders,
  exportComplianceDocs,
  verifyAuditChain,
  getFleetOverview,
  getPublicTrack,
  getTrackingAlerts,
  getTrackingLive,
  getTrackingVehicles,
  shareVehicleLocation,
  getFleetGroups,
  createFleetGroup,
  updateFleetGroup,
  deleteFleetGroup,
  getDriverGroups,
  createDriverGroup,
  updateDriverGroup,
  deleteDriverGroup,
  getDriverLicenceReminders,
  setDriverLicenceReminder,
  deleteDriverLicenceReminder,
  getViolationRules,
  createViolationRule,
  updateViolationRule,
  deleteViolationRule,
  getViolations,
  setViolationStatus,
} from './requests'

export type * from './types'

// ─── Query keys ───────────────────────────────────────────────────────────────

import type {
  AlertsQuery,
  ViolationRuleEntity,
  ViolationsQuery,
  AuditLogQuery,
  ComplianceDocumentHistoryQuery,
  DeviceSetupRequestsQuery,
  DevicesQuery,
  DispatchSearchQuery,
  DocumentsQuery,
  DriverBehaviorEventsQuery,
  DriversQuery,
  FleetAnalyticsDriverScoresQuery,
  FleetAnalyticsEventsQuery,
  FleetAnalyticsPeriodQuery,
  FleetAnalyticsShortPeriodQuery,
  FleetFinancialConfigActionPayload,
  FleetFinancialStatementQuery,
  FleetAnalyticsRangeQuery,
  FleetFinancialSummaryQuery,
  FleetProfitabilityPayload,
  FuelBudgetVsActualQuery,
  FuelMetricsQuery,
  FuelQuery,
  FuelTransactionsQuery,
  DataBundlesQuery,
  DocumentDownloadUrlQuery,
  RecommendDriversQuery,
  RecommendVehiclesQuery,
  RenewComplianceDocumentPayload,
  LegacyGpsDevicesQuery,
  MaintenanceProfilesQuery,
  MaintenanceRecordsQuery,
  NearestVehiclesQuery,
  ValidateDeviceAssignmentQuery,
  VehiclesQuery,
  VehiclesTab,
  ComplianceDocumentsQuery,
  GeofencesQuery,
  TrackingAlertsQuery,
  TrackingVehiclesQuery,
  ReportsActivityTrendQuery,
  ReportsSummaryQuery,
  VehicleActivityQuery,
} from './types'

export const FLEET_QUERY_KEY = {
  trackingLive: ['fleet', 'tracking', 'live'] as const,
  trackingVehicles: (payload?: TrackingVehiclesQuery) => ['fleet', 'tracking', 'vehicles', payload],
  trackingAlerts: (payload?: TrackingAlertsQuery) => ['fleet', 'tracking', 'alerts', payload],
  publicTrack: (token: string) => ['track', token],
  overview: ['fleet', 'overview'] as const,
  vehiclesRoot: ['fleet', 'vehicles'],
  vehicles: (payload?: VehiclesQuery) => ['fleet', 'vehicles', payload],
  vehiclesTab: (tab: VehiclesTab, params?: VehiclesQuery['params']) => ['fleet', 'vehicles', 'tab', tab, params],
  vehiclesSummary: ['fleet', 'vehiclesSummary'],
  vehicle: (id: string) => ['fleet', 'vehicle', id],
  vehiclesHealth: ['fleet', 'vehiclesHealth'],
  vehicleHealth: (vehicleId: string) => ['fleet', 'vehicleHealth', vehicleId],
  nearestVehicles: (payload: NearestVehiclesQuery) => ['fleet', 'nearestVehicles', payload],
  geofence: (vehicleId: string) => ['fleet', 'geofence', vehicleId],
  geofencesRoot: ['fleet', 'geofences'] as const,
  geofences: (payload?: GeofencesQuery) => ['fleet', 'geofences', payload],
  fleetGroups: ['fleet', 'fleetGroups'],
  driverGroups: ['fleet', 'driverGroups'],
  driverLicenceReminders: ['fleet', 'driverLicenceReminders'],
  violationRules: ['fleet', 'violationRules'],
  violations: ['fleet', 'violations'],
  geofenceZone: (id: string) => ['fleet', 'geofences', id],
  devices: (payload?: DevicesQuery) => ['fleet', 'devices', payload],
  device: (id: string) => ['fleet', 'device', id],
  deviceSetupRequests: (payload?: DeviceSetupRequestsQuery) => ['fleet', 'deviceSetupRequests', payload],
  deviceSetupRequest: (id: string) => ['fleet', 'deviceSetupRequest', id],
  legacyGpsDevices: (payload?: LegacyGpsDevicesQuery) => ['fleet', 'legacyGpsDevices', payload],
  drivers: (payload?: DriversQuery) => ['fleet', 'drivers', payload],
  driver: (id: string) => ['fleet', 'driver', id],
  // TRU-FE-3 pre-wire query keys.
  driversRoot: ['fleet', 'drivers'],
  driversSummary: ['fleet', 'driversSummary'],
  driversFilters: ['fleet', 'driversFilters'],
  driverImportColumns: ['fleet', 'driverImportColumns'],
  driverConsent: (id: string) => ['fleet', 'driver', id, 'consent'],
  driverDetail: (id: string) => ['fleet', 'driver', id, 'detail'],
  driverBehaviorSummary: (periodDays?: number) => ['fleet', 'driversBehavior', 'summary', periodDays],
  driverBehaviorRanking: ['fleet', 'driversBehavior', 'ranking'],
  driverBehaviorEvents: (payload?: DriverBehaviorEventsQuery) => ['fleet', 'driversBehavior', 'events', payload],
  driverGeofenceAlerts: (periodDays?: number) => ['fleet', 'driversBehavior', 'geofenceAlerts', periodDays],
  driverBehaviorById: (id: string, periodDays?: number) => ['fleet', 'driver', id, 'behavior', periodDays],
  driverFatigueSummary: ['fleet', 'driversFatigue', 'summary'],
  driverFatigueById: (id: string) => ['fleet', 'driver', id, 'fatigue'],
  dispatchSearch: (payload?: DispatchSearchQuery) => ['fleet', 'dispatchSearch', payload],
  recommendDrivers: (payload?: RecommendDriversQuery) => ['fleet', 'recommendDrivers', payload],
  recommendVehicles: (payload?: RecommendVehiclesQuery) => ['fleet', 'recommendVehicles', payload],
  carriers: ['fleet', 'carriers'],
  dataBundles: (payload?: DataBundlesQuery) => ['fleet', 'dataBundles', payload],
  alertStats: ['fleet', 'alertStats'],
  alerts: (payload?: AlertsQuery) => ['fleet', 'alerts', payload],
  reportsDashboard: ['fleet', 'reportsDashboard'],
  deliveryMetrics: ['fleet', 'deliveryMetrics'],
  reportsSummary: (payload: ReportsSummaryQuery) => ['fleet', 'reports', 'summary', payload],
  reportsActivityTrend: (payload: ReportsActivityTrendQuery) => ['fleet', 'reports', 'activityTrend', payload],
  vehicleActivity: (payload?: VehicleActivityQuery) => ['fleet', 'reports', 'vehicleActivity', payload],
  analyticsSummary: (payload?: FleetAnalyticsPeriodQuery) => ['fleet', 'analytics', 'summary', payload],
  analyticsFleetStatus: (payload?: FleetAnalyticsShortPeriodQuery) => ['fleet', 'analytics', 'fleetStatus', payload],
  analyticsJobPipeline: (payload?: FleetAnalyticsPeriodQuery) => ['fleet', 'analytics', 'jobPipeline', payload],
  analyticsFuelLevels: (payload?: FleetAnalyticsShortPeriodQuery) => ['fleet', 'analytics', 'fuelLevels', payload],
  analyticsSafetyRadar: (payload?: FleetAnalyticsShortPeriodQuery) => ['fleet', 'analytics', 'safetyRadar', payload],
  analyticsDriverScores: (payload?: FleetAnalyticsDriverScoresQuery) => ['fleet', 'analytics', 'driverScores', payload],
  analyticsEvents: (payload?: FleetAnalyticsEventsQuery) => ['fleet', 'analytics', 'events', payload],
  profitLoss: (payload?: FleetAnalyticsRangeQuery) => ['fleet', 'financials', 'profitLoss', payload],
  utilizationReport: (payload?: FleetAnalyticsRangeQuery) => ['fleet', 'analytics', 'utilization', payload],
  fuelReport: (payload?: FleetAnalyticsRangeQuery) => ['fleet', 'analytics', 'fuelReport', payload],
  complianceAudit: (payload?: FleetAnalyticsRangeQuery) => ['fleet', 'analytics', 'complianceAudit', payload],
  financialSummary: (payload?: FleetFinancialSummaryQuery) => ['fleet', 'financials', 'summary', payload],
  financialStatement: (payload?: FleetFinancialStatementQuery) => ['fleet', 'financials', 'statement', payload],
  financialConfigs: ['fleet', 'financials', 'configs'],
  financialConfig: (vehicleId: string) => ['fleet', 'financials', 'config', vehicleId],
  profitability: (payload: FleetProfitabilityPayload) => ['fleet', 'financials', 'profitability', payload],
  fuelTransactions: (payload?: FuelQuery) => ['fleet', 'fuelTransactions', payload],
  fuelTransactionsList: (payload?: FuelTransactionsQuery) => ['fleet', 'fuelTransactionsList', payload],
  fuelWeekly: ['fleet', 'fuelWeekly'],
  fuelSummary: ['fleet', 'fuelSummary'],
  fuelMetrics: (payload?: FuelMetricsQuery) => ['fleet', 'fuelMetrics', payload],
  fuelBudgets: ['fleet', 'fuelBudgets'],
  integrationHealth: ['fleet', 'integrationHealth'],
  fuelBudgetVsActual: (payload?: FuelBudgetVsActualQuery) => ['fleet', 'fuelBudgetVsActual', payload],
  fuelEfficiency: ['fleet', 'fuelEfficiency'],
  fuelThresholds: ['fleet', 'fuelThresholds'],
  maintenanceProfiles: (payload?: MaintenanceProfilesQuery) => ['fleet', 'maintenanceProfiles', payload],
  maintenanceProfile: (id: string) => ['fleet', 'maintenanceProfile', id],
  maintenanceProfilesSummary: ['fleet', 'maintenanceProfilesSummary'],
  maintenanceServiceCategories: ['fleet', 'maintenanceServiceCategories'],
  maintenanceRecords: (payload?: MaintenanceRecordsQuery) => ['fleet', 'maintenanceRecords', payload],
  maintenanceRecord: (id: string) => ['fleet', 'maintenanceRecord', id],
  maintenanceRecordsSummary: ['fleet', 'maintenanceRecordsSummary'],
  maintenanceReminderSchedule: ['fleet', 'maintenanceReminderSchedule'],
  maintenanceSettings: ['fleet', 'maintenanceSettings'],
  documents: (payload: DocumentsQuery) => ['fleet', 'documents', payload],
  documentDownloadUrl: (id: string) => ['fleet', 'documentDownloadUrl', id],
  documentAccessLog: (id: string) => ['fleet', 'documentAccessLog', id],
  validateDeviceAssignment: (payload: ValidateDeviceAssignmentQuery) => [
    'fleet',
    'validateDeviceAssignment',
    payload,
  ],
  auditLog: (payload?: AuditLogQuery) => ['fleet', 'auditLog', payload],
  auditChainVerification: ['fleet', 'auditChainVerification'],
  complianceDocs: (params?: ComplianceDocumentsQuery['params']) => ['fleet', 'complianceDocs', params],
  complianceDocumentHistory: (params?: ComplianceDocumentHistoryQuery['params']) => [
    'fleet',
    'complianceDocumentHistory',
    params,
  ],
  complianceSummary: ['fleet', 'complianceSummary'],
  storageUsage: ['fleet', 'storageUsage'],
  capacityUnits: ['fleet', 'capacityUnits'],
  vehicleImportColumns: ['fleet', 'vehicleImportColumns'],
  // TRU-FE-4 pre-wire — endpoints in flight on backend, queries render loading / empty until they land.
  devicesSummary: ['fleet', 'devicesSummary'],
  devicesFilters: ['fleet', 'devicesFilters'],
  deviceImportColumns: ['fleet', 'deviceImportColumns'],
  deviceCatalogManufacturers: ['fleet', 'deviceCatalog', 'manufacturers'],
  deviceCatalogModels: (manufacturer?: string) => ['fleet', 'deviceCatalog', 'models', manufacturer],
  deviceSetupRequestTrackerTypes: ['fleet', 'deviceSetupRequestTrackerTypes'],
} as const

function invalidateVehicles() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesRoot }),
    queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesSummary }),
  ])
}

// ─── queryOptions factories ───────────────────────────────────────────────────

export function getFleetOverviewQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.overview,
    queryFn: getFleetOverview,
  })
}

export function getVehiclesQueryOptions(payload?: VehiclesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.vehicles(payload),
    queryFn: () => getVehicles(payload),
  })
}

export function getVehiclesByTabQueryOptions<T extends VehiclesTab>(
  tab: T,
  params?: VehiclesQuery['params'],
) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.vehiclesTab(tab, params),
    queryFn: () => getVehiclesByTab(tab, params),
  })
}

export function getVehiclesSummaryQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.vehiclesSummary,
    queryFn: () => getVehiclesSummary(),
  })
}

export function getVehicleQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.vehicle(id),
    queryFn: () => getVehicle({ id }),
    enabled: Boolean(id),
  })
}

export function getVehiclesHealthQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.vehiclesHealth,
    queryFn: () => getAllVehicleHealth(),
  })
}

export function getVehicleHealthQueryOptions(vehicleId: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.vehicleHealth(vehicleId),
    queryFn: () => getVehicleHealth({ vehicleId }),
  })
}

export function getNearestVehiclesQueryOptions(payload: NearestVehiclesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.nearestVehicles(payload),
    queryFn: () => getNearestVehicles(payload),
  })
}

export function getGeofenceQueryOptions(vehicleId: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.geofence(vehicleId),
    queryFn: () => getGeofence({ vehicleId }),
  })
}

export function getDevicesQueryOptions(payload?: DevicesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.devices(payload),
    queryFn: () => getDevices(payload),
  })
}

export function getDeviceQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.device(id),
    queryFn: () => getDevice({ id }),
    enabled: Boolean(id),
  })
}

// TRU-FE-4 pre-wire query options.
export function getDevicesSummaryQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.devicesSummary,
    queryFn: getDevicesSummary,
  })
}

export function getDevicesFiltersQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.devicesFilters,
    queryFn: getDevicesFilters,
  })
}

export function getDeviceImportColumnsQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.deviceImportColumns,
    queryFn: getDeviceImportColumns,
  })
}

export function getDeviceCatalogManufacturersQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.deviceCatalogManufacturers,
    queryFn: getDeviceCatalogManufacturers,
  })
}

export function getDeviceCatalogModelsQueryOptions(manufacturer?: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.deviceCatalogModels(manufacturer),
    queryFn: () => getDeviceCatalogModels(manufacturer ? { manufacturer } : undefined),
  })
}

export function getDeviceSetupRequestTrackerTypesQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.deviceSetupRequestTrackerTypes,
    queryFn: getDeviceSetupRequestTrackerTypes,
  })
}

export function getGeofencesQueryOptions(payload?: GeofencesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.geofences(payload),
    queryFn: () => getGeofences(payload),
  })
}

export function getGeofenceZoneQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.geofenceZone(id),
    queryFn: () => getGeofenceZone({ id }),
    enabled: Boolean(id),
  })
}

export function getDeviceSetupRequestsQueryOptions(payload?: DeviceSetupRequestsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.deviceSetupRequests(payload),
    queryFn: () => getDeviceSetupRequests(payload),
  })
}

export function getDeviceSetupRequestQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.deviceSetupRequest(id),
    queryFn: () => getDeviceSetupRequest({ id }),
    enabled: Boolean(id),
  })
}

export function getLegacyGpsDevicesQueryOptions(payload?: LegacyGpsDevicesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.legacyGpsDevices(payload),
    queryFn: () => getLegacyGpsDevices(payload),
  })
}

export function getDriversQueryOptions(payload?: DriversQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.drivers(payload),
    queryFn: () => getDrivers(payload),
  })
}

export function getDriverQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driver(id),
    queryFn: () => getDriver({ id }),
    enabled: Boolean(id),
  })
}

// TRU-FE-3 pre-wire query options.
export function getDriversSummaryQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driversSummary,
    queryFn: getDriversSummary,
  })
}
export function getDriversFiltersQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driversFilters,
    queryFn: getDriversFilters,
  })
}
export function getDriverImportColumnsQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driverImportColumns,
    queryFn: getDriverImportColumns,
  })
}
export function getDriverConsentQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driverConsent(id),
    queryFn: () => getDriverConsent({ id }),
    enabled: Boolean(id),
  })
}
export function getDriverDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driverDetail(id),
    queryFn: () => getDriverDetail({ id }),
    enabled: Boolean(id),
  })
}
export function getDriverBehaviorSummaryQueryOptions(periodDays?: number) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driverBehaviorSummary(periodDays),
    queryFn: () => getDriverBehaviorSummary(periodDays ? { period_days: periodDays } : undefined),
  })
}
export function getDriverBehaviorRankingQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driverBehaviorRanking,
    queryFn: getDriverBehaviorRanking,
  })
}
export function getDriverBehaviorEventsQueryOptions(payload?: DriverBehaviorEventsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driverBehaviorEvents(payload),
    queryFn: () => getDriverBehaviorEvents(payload),
  })
}
export function getDriverGeofenceAlertsQueryOptions(periodDays?: number) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driverGeofenceAlerts(periodDays),
    queryFn: () => getDriverGeofenceAlerts(periodDays ? { period_days: periodDays } : undefined),
  })
}
export function getDriverBehaviorByIdQueryOptions(id: string, periodDays?: number) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driverBehaviorById(id, periodDays),
    queryFn: () => getDriverBehaviorById({ id, params: periodDays ? { period_days: periodDays } : undefined }),
    enabled: Boolean(id),
  })
}
export function getDriverFatigueSummaryQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driverFatigueSummary,
    queryFn: getDriverFatigueSummary,
  })
}
export function getDriverFatigueByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.driverFatigueById(id),
    queryFn: () => getDriverFatigueById({ id }),
    enabled: Boolean(id),
  })
}

export function getRecommendDriversQueryOptions(payload?: RecommendDriversQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.recommendDrivers(payload),
    queryFn: () => recommendDrivers(payload),
  })
}

export function getRecommendVehiclesQueryOptions(payload?: RecommendVehiclesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.recommendVehicles(payload),
    queryFn: () => recommendVehicles(payload),
  })
}

export function getSimCarriersQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.carriers,
    queryFn: getSimCarriers,
  })
}

export function getSimDataBundlesQueryOptions(payload?: DataBundlesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.dataBundles(payload),
    queryFn: () => getSimDataBundles(payload),
  })
}

export function getDispatchSearchQueryOptions(payload?: DispatchSearchQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.dispatchSearch(payload),
    queryFn: () => getDispatchSearch(payload),
  })
}

export function getAlertStatsQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.alertStats,
    queryFn: () => getAlertStats(),
  })
}

export function getAlertsQueryOptions(payload?: AlertsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.alerts(payload),
    queryFn: () => getAlerts(payload),
  })
}

export function getReportsDashboardQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.reportsDashboard,
    queryFn: () => getReportsDashboard(),
  })
}

export function getReportsSummaryQueryOptions(payload: ReportsSummaryQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.reportsSummary(payload),
    queryFn: () => getReportsSummary(payload),
  })
}

export function getReportsActivityTrendQueryOptions(payload: ReportsActivityTrendQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.reportsActivityTrend(payload),
    queryFn: () => getReportsActivityTrend(payload),
    placeholderData: keepPreviousData,
  })
}

export function getVehicleActivityQueryOptions(payload?: VehicleActivityQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.vehicleActivity(payload),
    queryFn: () => getVehicleActivity(payload),
    placeholderData: keepPreviousData,
  })
}

export function getDeliveryMetricsQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.deliveryMetrics,
    queryFn: () => getDeliveryMetrics(),
  })
}

export function getFleetAnalyticsSummaryQueryOptions(payload?: FleetAnalyticsPeriodQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.analyticsSummary(payload),
    queryFn: () => getFleetAnalyticsSummary(payload),
  })
}

export function getFleetAnalyticsFleetStatusQueryOptions(payload?: FleetAnalyticsShortPeriodQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.analyticsFleetStatus(payload),
    queryFn: () => getFleetAnalyticsFleetStatus(payload),
  })
}

export function getFleetAnalyticsJobPipelineQueryOptions(payload?: FleetAnalyticsPeriodQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.analyticsJobPipeline(payload),
    queryFn: () => getFleetAnalyticsJobPipeline(payload),
  })
}

export function getFleetAnalyticsFuelLevelsQueryOptions(payload?: FleetAnalyticsShortPeriodQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.analyticsFuelLevels(payload),
    queryFn: () => getFleetAnalyticsFuelLevels(payload),
  })
}

export function getVehicleSafetyRadarQueryOptions(payload?: FleetAnalyticsShortPeriodQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.analyticsSafetyRadar(payload),
    queryFn: () => getVehicleSafetyRadar(payload),
  })
}

export function getFleetFinancialStatementQueryOptions(payload?: FleetFinancialStatementQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.financialStatement(payload),
    queryFn: () => getFleetFinancialStatement(payload),
  })
}

export function getFleetFinancialConfigsQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.financialConfigs,
    queryFn: getFleetFinancialConfigs,
  })
}

export function getFuelBudgetsQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelBudgets,
    queryFn: getFuelBudgets,
  })
}

export function getIntegrationHealthQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.integrationHealth,
    queryFn: getIntegrationHealth,
  })
}

export function getFleetAnalyticsDriverScoresQueryOptions(payload?: FleetAnalyticsDriverScoresQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.analyticsDriverScores(payload),
    queryFn: () => getFleetAnalyticsDriverScores(payload),
  })
}

export function getFleetAnalyticsEventsQueryOptions(payload?: FleetAnalyticsEventsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.analyticsEvents(payload),
    queryFn: () => getFleetAnalyticsEvents(payload),
  })
}

export function getFleetProfitLossQueryOptions(payload?: FleetAnalyticsRangeQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.profitLoss(payload),
    queryFn: () => getFleetProfitLoss(payload),
    placeholderData: keepPreviousData,
  })
}

export function getFleetUtilizationReportQueryOptions(payload?: FleetAnalyticsRangeQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.utilizationReport(payload),
    queryFn: () => getFleetUtilizationReport(payload),
    placeholderData: keepPreviousData,
  })
}

export function getFleetFuelReportQueryOptions(payload?: FleetAnalyticsRangeQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelReport(payload),
    queryFn: () => getFleetFuelReport(payload),
    placeholderData: keepPreviousData,
  })
}

export function getFleetComplianceAuditQueryOptions(payload?: FleetAnalyticsRangeQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.complianceAudit(payload),
    queryFn: () => getFleetComplianceAudit(payload),
    placeholderData: keepPreviousData,
  })
}

export function getFleetFinancialSummaryQueryOptions(payload?: FleetFinancialSummaryQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.financialSummary(payload),
    queryFn: () => getFleetFinancialSummary(payload),
  })
}

export function getFleetFinancialConfigQueryOptions(payload: FleetFinancialConfigActionPayload) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.financialConfig(payload.vehicleId),
    queryFn: () => getFleetFinancialConfig(payload),
    enabled: Boolean(payload.vehicleId),
  })
}

export function getFleetProfitabilityQueryOptions(payload: FleetProfitabilityPayload) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.profitability(payload),
    queryFn: () => computeFleetProfitability(payload),
  })
}

export function getFuelTransactionsQueryOptions(payload?: FuelQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelTransactions(payload),
    queryFn: () => getFuelTransactions(payload),
    placeholderData: keepPreviousData,
  })
}

export function getFuelTransactionsListQueryOptions(payload?: FuelTransactionsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelTransactionsList(payload),
    queryFn: () => getFuelTransactionsList(payload),
    placeholderData: keepPreviousData,
  })
}

export function getFuelWeeklyAnalyticsQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelWeekly,
    queryFn: getFuelWeeklyAnalytics,
  })
}

export function getFuelSummaryQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelSummary,
    queryFn: () => getFuelSummary(),
  })
}

export function getFuelMetricsQueryOptions(payload?: FuelMetricsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelMetrics(payload),
    queryFn: () => getFuelMetrics(payload),
  })
}

export function getFuelBudgetVsActualQueryOptions(payload?: FuelBudgetVsActualQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelBudgetVsActual(payload),
    queryFn: () => getFuelBudgetVsActual(payload),
  })
}

export function getFuelEfficiencyQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelEfficiency,
    queryFn: () => getFuelEfficiency(),
  })
}

export function getFuelThresholdsQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelThresholds,
    queryFn: () => getFuelThresholds(),
  })
}

export function getMaintenanceRecordsQueryOptions(payload?: MaintenanceRecordsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.maintenanceRecords(payload),
    queryFn: () => getMaintenanceRecords(payload),
    placeholderData: keepPreviousData,
  })
}

export function getMaintenanceProfilesQueryOptions(payload?: MaintenanceProfilesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.maintenanceProfiles(payload),
    queryFn: () => getMaintenanceProfiles(payload),
    placeholderData: keepPreviousData,
  })
}

export function getMaintenanceProfilesSummaryQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.maintenanceProfilesSummary,
    queryFn: () => getMaintenanceProfilesSummary(),
  })
}

export function getMaintenanceServiceCategoriesQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.maintenanceServiceCategories,
    queryFn: () => getMaintenanceServiceCategories(),
  })
}

export function getMaintenanceRecordsSummaryQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.maintenanceRecordsSummary,
    queryFn: () => getMaintenanceRecordsSummary(),
  })
}

export function getMaintenanceReminderScheduleQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.maintenanceReminderSchedule,
    queryFn: getMaintenanceReminderSchedule,
  })
}

export function getCapacityUnitsQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.capacityUnits,
    queryFn: getCapacityUnits,
  })
}

export function getVehicleImportColumnsQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.vehicleImportColumns,
    queryFn: getVehicleImportColumns,
  })
}

export function getMaintenanceRecordQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.maintenanceRecord(id),
    queryFn: () => getMaintenanceRecord({ id }),
    enabled: Boolean(id),
  })
}

export function getDocumentsQueryOptions(payload: DocumentsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.documents(payload),
    queryFn: () => getDocuments(payload),
  })
}

export function getDocumentDownloadUrlQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.documentDownloadUrl(id),
    queryFn: () => getDocumentDownloadUrl({ id }),
  })
}

export function getDocumentAccessLogQueryOptions(id: string) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.documentAccessLog(id),
    queryFn: () => getDocumentAccessLog({ id }),
  })
}

export function getValidateDeviceAssignmentQueryOptions(payload: ValidateDeviceAssignmentQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.validateDeviceAssignment(payload),
    queryFn: () =>
      import('./requests').then((m) => m.validateDeviceAssignment(payload)),
  })
}

export function getAuditLogQueryOptions(payload?: AuditLogQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.auditLog(payload),
    queryFn: () => getAuditLog(payload),
  })
}

export function getAuditChainVerificationQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.auditChainVerification,
    queryFn: verifyAuditChain,
  })
}

// ─── useQuery hooks ────────────────────────────────────────────────────────────

export function useFleetOverview() {
  return useQuery(getFleetOverviewQueryOptions())
}

export function useVehicles(payload?: VehiclesQuery) {
  return useQuery(getVehiclesQueryOptions(payload))
}

export function useVehiclesByTab<T extends VehiclesTab>(
  tab: T,
  params?: VehiclesQuery['params'],
) {
  return useQuery(getVehiclesByTabQueryOptions(tab, params))
}

export function useVehiclesSummary() {
  return useQuery(getVehiclesSummaryQueryOptions())
}

export function useVehicle(id: string) {
  return useQuery(getVehicleQueryOptions(id))
}

export function useVehiclesHealth() {
  return useQuery(getVehiclesHealthQueryOptions())
}

export function useVehicleHealth(vehicleId: string) {
  return useQuery(getVehicleHealthQueryOptions(vehicleId))
}

export function useNearestVehicles(payload: NearestVehiclesQuery) {
  return useQuery(getNearestVehiclesQueryOptions(payload))
}

export function useGeofence(vehicleId: string) {
  return useQuery(getGeofenceQueryOptions(vehicleId))
}

export function useDevices(payload?: DevicesQuery) {
  return useQuery(getDevicesQueryOptions(payload))
}

export function useDevice(id: string) {
  return useQuery(getDeviceQueryOptions(id))
}

// TRU-FE-4 pre-wire hooks.
export function useDevicesSummary() {
  return useQuery(getDevicesSummaryQueryOptions())
}

export function useDevicesFilters() {
  return useQuery(getDevicesFiltersQueryOptions())
}

export function useDeviceImportColumns() {
  return useQuery(getDeviceImportColumnsQueryOptions())
}

export function useDeviceCatalogManufacturers() {
  return useQuery(getDeviceCatalogManufacturersQueryOptions())
}

export function useDeviceCatalogModels(manufacturer?: string) {
  return useQuery(getDeviceCatalogModelsQueryOptions(manufacturer))
}

export function useDeviceSetupRequestTrackerTypes() {
  return useQuery(getDeviceSetupRequestTrackerTypesQueryOptions())
}

export function useGeofences(payload?: GeofencesQuery) {
  return useQuery(getGeofencesQueryOptions(payload))
}

export function useGeofenceZone(id: string) {
  return useQuery(getGeofenceZoneQueryOptions(id))
}

export function useDeviceSetupRequests(payload?: DeviceSetupRequestsQuery) {
  return useQuery(getDeviceSetupRequestsQueryOptions(payload))
}

export function useDeviceSetupRequest(id: string) {
  return useQuery(getDeviceSetupRequestQueryOptions(id))
}

export function useCreateDeviceSetupRequest() {
  return useMutation({
    mutationFn: createDeviceSetupRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'deviceSetupRequests'] })
    },
  })
}

export function useLegacyGpsDevices(payload?: LegacyGpsDevicesQuery) {
  return useQuery(getLegacyGpsDevicesQueryOptions(payload))
}

export function useDrivers(payload?: DriversQuery) {
  return useQuery(getDriversQueryOptions(payload))
}

export function useDriver(id: string) {
  return useQuery(getDriverQueryOptions(id))
}

// TRU-FE-3 pre-wire hooks (queries).
export function useDriversSummary() { return useQuery(getDriversSummaryQueryOptions()) }
export function useDriversFilters() { return useQuery(getDriversFiltersQueryOptions()) }
export function useDriverImportColumns() { return useQuery(getDriverImportColumnsQueryOptions()) }
export function useDriverConsent(id: string) { return useQuery(getDriverConsentQueryOptions(id)) }
export function useDriverDetail(id: string) { return useQuery(getDriverDetailQueryOptions(id)) }
export function useDriverBehaviorSummary(periodDays?: number) { return useQuery(getDriverBehaviorSummaryQueryOptions(periodDays)) }
export function useDriverBehaviorRanking() { return useQuery(getDriverBehaviorRankingQueryOptions()) }
export function useDriverBehaviorEvents(payload?: DriverBehaviorEventsQuery) { return useQuery(getDriverBehaviorEventsQueryOptions(payload)) }
export function useDriverGeofenceAlerts(periodDays?: number) { return useQuery(getDriverGeofenceAlertsQueryOptions(periodDays)) }
export function useDriverBehaviorById(id: string, periodDays?: number) { return useQuery(getDriverBehaviorByIdQueryOptions(id, periodDays)) }
export function useDriverFatigueSummary() { return useQuery(getDriverFatigueSummaryQueryOptions()) }
export function useDriverFatigueById(id: string) { return useQuery(getDriverFatigueByIdQueryOptions(id)) }

// TRU-FE-3 pre-wire hooks (mutations).
function invalidateDriverRoots(id?: string) {
  queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driversRoot })
  queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driversSummary })
  if (id)
    queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driver(id) })
}

export function useSuspendDriver() {
  return useMutation({
    mutationFn: suspendDriver,
    onSuccess: (_, vars) => invalidateDriverRoots(vars.id),
  })
}

export function useReinstateDriver() {
  return useMutation({
    mutationFn: reinstateDriver,
    onSuccess: (_, vars) => invalidateDriverRoots(vars.id),
  })
}

export function useRequestDriverConsent() {
  return useMutation({
    mutationFn: requestDriverConsent,
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driverConsent(vars.id) }),
  })
}

export function usePatchDriverConsent() {
  return useMutation({
    mutationFn: patchDriverConsent,
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driverConsent(vars.id) }),
  })
}

export function useSendDriverMessage() {
  return useMutation({ mutationFn: sendDriverMessage })
}

export function useMarkGeofenceAlertsRead() {
  return useMutation({
    mutationFn: markGeofenceAlertsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fleet', 'driversBehavior'] }),
  })
}

export function useRunDriverFatigue() {
  return useMutation({
    mutationFn: runDriverFatigue,
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driverFatigueById(vars.id) }),
  })
}

export function useDispatchSearch(payload?: DispatchSearchQuery) {
  return useQuery(getDispatchSearchQueryOptions(payload))
}

export function useRecommendDrivers(payload?: RecommendDriversQuery) {
  return useQuery(getRecommendDriversQueryOptions(payload))
}

export function useRecommendVehicles(payload?: RecommendVehiclesQuery) {
  return useQuery(getRecommendVehiclesQueryOptions(payload))
}

export function useSimCarriers() {
  return useQuery(getSimCarriersQueryOptions())
}

export function useSimDataBundles(payload?: DataBundlesQuery) {
  return useQuery(getSimDataBundlesQueryOptions(payload))
}

export function useAlertStats() {
  return useQuery(getAlertStatsQueryOptions())
}

export function useAlerts(payload?: AlertsQuery) {
  return useQuery(getAlertsQueryOptions(payload))
}

export function useReportsDashboard() {
  return useQuery(getReportsDashboardQueryOptions())
}

export function useDeliveryMetrics() {
  return useQuery(getDeliveryMetricsQueryOptions())
}

export function useFleetAnalyticsSummary(payload?: FleetAnalyticsPeriodQuery) {
  return useQuery(getFleetAnalyticsSummaryQueryOptions(payload))
}

export function useFleetAnalyticsFleetStatus(payload?: FleetAnalyticsShortPeriodQuery) {
  return useQuery(getFleetAnalyticsFleetStatusQueryOptions(payload))
}

export function useFleetAnalyticsJobPipeline(payload?: FleetAnalyticsPeriodQuery) {
  return useQuery(getFleetAnalyticsJobPipelineQueryOptions(payload))
}

export function useFleetAnalyticsFuelLevels(payload?: FleetAnalyticsShortPeriodQuery) {
  return useQuery(getFleetAnalyticsFuelLevelsQueryOptions(payload))
}

export function useVehicleSafetyRadar(payload?: FleetAnalyticsShortPeriodQuery) {
  return useQuery(getVehicleSafetyRadarQueryOptions(payload))
}

export function useFleetFinancialStatement(payload?: FleetFinancialStatementQuery) {
  return useQuery(getFleetFinancialStatementQueryOptions(payload))
}

export function useFleetFinancialConfigs() {
  return useQuery(getFleetFinancialConfigsQueryOptions())
}

export function useFuelBudgets() {
  return useQuery(getFuelBudgetsQueryOptions())
}

export function useIntegrationHealth() {
  return useQuery(getIntegrationHealthQueryOptions())
}

export function useFleetAnalyticsDriverScores(payload?: FleetAnalyticsDriverScoresQuery) {
  return useQuery(getFleetAnalyticsDriverScoresQueryOptions(payload))
}

export function useFleetAnalyticsEvents(payload?: FleetAnalyticsEventsQuery) {
  return useQuery(getFleetAnalyticsEventsQueryOptions(payload))
}

export function useFleetFinancialSummary(payload?: FleetFinancialSummaryQuery) {
  return useQuery(getFleetFinancialSummaryQueryOptions(payload))
}

export function useFleetFinancialConfig(payload: FleetFinancialConfigActionPayload) {
  return useQuery(getFleetFinancialConfigQueryOptions(payload))
}

export function useFleetProfitability(payload: FleetProfitabilityPayload) {
  return useQuery(getFleetProfitabilityQueryOptions(payload))
}

export function useFuelTransactions(payload?: FuelQuery) {
  return useQuery(getFuelTransactionsQueryOptions(payload))
}

export function useFuelTransactionsList(payload?: FuelTransactionsQuery) {
  return useQuery(getFuelTransactionsListQueryOptions(payload))
}

export function useFuelWeeklyAnalytics() {
  return useQuery(getFuelWeeklyAnalyticsQueryOptions())
}

export function useFuelSummary() {
  return useQuery(getFuelSummaryQueryOptions())
}

export function useFuelMetrics(payload?: FuelMetricsQuery) {
  return useQuery(getFuelMetricsQueryOptions(payload))
}

export function useFuelBudgetVsActual(payload?: FuelBudgetVsActualQuery) {
  return useQuery(getFuelBudgetVsActualQueryOptions(payload))
}

export function useFuelEfficiency() {
  return useQuery(getFuelEfficiencyQueryOptions())
}

export function useFuelThresholds() {
  return useQuery(getFuelThresholdsQueryOptions())
}

export function useMaintenanceRecords(payload?: MaintenanceRecordsQuery) {
  return useQuery(getMaintenanceRecordsQueryOptions(payload))
}

export function useMaintenanceProfiles(payload?: MaintenanceProfilesQuery) {
  return useQuery(getMaintenanceProfilesQueryOptions(payload))
}

export function useMaintenanceProfilesSummary() {
  return useQuery(getMaintenanceProfilesSummaryQueryOptions())
}

export function useMaintenanceServiceCategories() {
  return useQuery(getMaintenanceServiceCategoriesQueryOptions())
}

export function useMaintenanceRecordsSummary() {
  return useQuery(getMaintenanceRecordsSummaryQueryOptions())
}

export function useMaintenanceReminderSchedule() {
  return useQuery(getMaintenanceReminderScheduleQueryOptions())
}

export function useMaintenanceSettings() {
  return useQuery({ queryKey: FLEET_QUERY_KEY.maintenanceSettings, queryFn: getMaintenanceSettings })
}

export function useUpdateMaintenanceSettings() {
  return useMutation({
    mutationFn: updateMaintenanceSettings,
    onSuccess: (res) => {
      queryClient.setQueryData(FLEET_QUERY_KEY.maintenanceSettings, res)
    },
  })
}

export function useCapacityUnits() {
  return useQuery(getCapacityUnitsQueryOptions())
}

export function useVehicleImportColumns() {
  return useQuery(getVehicleImportColumnsQueryOptions())
}

export function useMaintenanceRecord(id: string) {
  return useQuery(getMaintenanceRecordQueryOptions(id))
}

export function useDocuments(payload: DocumentsQuery) {
  return useQuery(getDocumentsQueryOptions(payload))
}

export function useDocumentDownloadUrl(id: string) {
  return useQuery(getDocumentDownloadUrlQueryOptions(id))
}

export function useDocumentAccessLog(id: string) {
  return useQuery(getDocumentAccessLogQueryOptions(id))
}

export function useAuditLog(payload?: AuditLogQuery) {
  return useQuery(getAuditLogQueryOptions(payload))
}

export function useAuditChainVerification() {
  return useQuery(getAuditChainVerificationQueryOptions())
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useRegisterGeofence() {
  return useMutation({
    mutationFn: registerGeofence,
    onSuccess: (_, { vehicleId }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.geofence(vehicleId) })
    },
  })
}

export function useReportLocation() {
  return useMutation({ mutationFn: reportLocation })
}

export function useCreateVehicle() {
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      return invalidateVehicles()
    },
  })
}

export function useCreateGeofence() {
  return useMutation({
    mutationFn: createGeofence,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fleet', 'geofences'] }),
  })
}

export function useUpdateGeofence() {
  return useMutation({
    mutationFn: updateGeofence,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fleet', 'geofences'] }),
  })
}

export function useArchiveGeofence() {
  return useMutation({
    mutationFn: archiveGeofence,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fleet', 'geofences'] }),
  })
}

export function useUpdateVehicle() {
  return useMutation({
    mutationFn: updateVehicle,
    onSuccess: (_, { id }) => {
      return Promise.all([
        invalidateVehicles(),
        queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(id) }),
      ])
    },
  })
}

export function useDeleteVehicle() {
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      return invalidateVehicles()
    },
  })
}

export function useImportVehicles() {
  return useMutation({
    mutationFn: importVehicles,
    onSuccess: () => {
      return invalidateVehicles()
    },
  })
}

export function useUpdateVehicleStatus() {
  return useMutation({
    mutationFn: updateVehicleStatus,
    onSuccess: (_, { id }) => {
      return Promise.all([
        invalidateVehicles(),
        queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(id) }),
      ])
    },
  })
}

export function useAssignDriverToVehicle() {
  return useMutation({
    mutationFn: assignDriverToVehicle,
    onSuccess: (_, { id }) => {
      invalidateVehicles()
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(id) })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers() })
    },
  })
}

export function useUnassignDriverFromVehicle() {
  return useMutation({
    mutationFn: unassignDriverFromVehicle,
    onSuccess: (_, { id }) => {
      invalidateVehicles()
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(id) })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers() })
    },
  })
}

function invalidateDevices() {
  queryClient.invalidateQueries({ queryKey: ['fleet', 'devices'] })
  queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.devicesSummary })
}

export function useRegisterGpsDevice() {
  return useMutation({
    mutationFn: registerGpsDevice,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(id) })
      invalidateDevices()
    },
  })
}

export function useCreateDevice() {
  return useMutation({
    mutationFn: createDevice,
    onSuccess: () => {
      invalidateDevices()
    },
  })
}

export function useUpdateDevice() {
  return useMutation({
    mutationFn: updateDevice,
    onSuccess: (_, { id }) => {
      invalidateDevices()
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
    },
  })
}

export function useUpdateDeviceFirmware() {
  return useMutation({
    mutationFn: updateDeviceFirmware,
    onSuccess: (_, { id }) => {
      invalidateDevices()
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
    },
  })
}

export function useDeleteDevice() {
  return useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      invalidateDevices()
    },
  })
}

export function useImportDevices() {
  return useMutation({
    mutationFn: importDevices,
    onSuccess: () => {
      invalidateDevices()
    },
  })
}

export function useSuspendDevice() {
  return useMutation({
    mutationFn: suspendDevice,
    onSuccess: (_, { id }) => {
      invalidateDevices()
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
    },
  })
}

export function useReinstateDevice() {
  return useMutation({
    mutationFn: reinstateDevice,
    onSuccess: (_, { id }) => {
      invalidateDevices()
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
    },
  })
}

export function useUpdateDeviceLifecycle() {
  return useMutation({
    mutationFn: updateDeviceLifecycle,
    onSuccess: (_, { id }) => {
      invalidateDevices()
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
    },
  })
}

export function useAssignDevice() {
  return useMutation({
    mutationFn: assignDevice,
    onSuccess: (_, { id }) => {
      invalidateDevices()
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
      invalidateVehicles()
    },
  })
}

export function useUnassignDevice() {
  return useMutation({
    mutationFn: unassignDevice,
    onSuccess: (_, { id }) => {
      invalidateDevices()
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
      invalidateVehicles()
    },
  })
}

export function useCreateDriver() {
  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers() })
    },
  })
}

export function useUpdateDriver() {
  return useMutation({
    mutationFn: updateDriver,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driver(id) })
    },
  })
}

export function useDeleteDriver() {
  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers() })
    },
  })
}

export function useImportDrivers() {
  return useMutation({
    mutationFn: importDrivers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers() })
    },
  })
}

export function useUpdateDriverStatus() {
  return useMutation({
    mutationFn: updateDriverStatus,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driver(id) })
    },
  })
}

export function useUpdateDriverContactChannels() {
  return useMutation({
    mutationFn: updateDriverContactChannels,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driver(id) })
    },
  })
}

export function useAcknowledgeAlert() {
  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.alerts() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.alertStats })
    },
  })
}

export function useResolveAlert() {
  return useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.alerts() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.alertStats })
    },
  })
}

export function useRecordFuelTransaction() {
  return useMutation({
    mutationFn: recordFuelTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelTransactions'] })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelTransactionsList'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelWeekly })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelSummary })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelMetrics'] })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelBudgetVsActual'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelEfficiency })
    },
  })
}

export function useUpdateFuelTransaction() {
  return useMutation({
    mutationFn: updateFuelTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelTransactions'] })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelTransactionsList'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelWeekly })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelSummary })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelMetrics'] })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelBudgetVsActual'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelEfficiency })
    },
  })
}

export function useDeleteFuelTransaction() {
  return useMutation({
    mutationFn: deleteFuelTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelTransactions'] })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelTransactionsList'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelWeekly })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelSummary })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelMetrics'] })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelBudgetVsActual'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelEfficiency })
    },
  })
}

export function useSetFuelThreshold() {
  return useMutation({
    mutationFn: setFuelThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelThresholds })
    },
  })
}

export function useUpdateFleetFinancialConfig() {
  return useMutation({
    mutationFn: updateFleetFinancialConfig,
    onSuccess: (_, { vehicleId }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.financialConfig(vehicleId) })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'financials'] })
    },
  })
}

function invalidateMaintenanceRecords(id?: string) {
  queryClient.invalidateQueries({ queryKey: ['fleet', 'maintenanceRecords'] })
  queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.maintenanceRecordsSummary })
  if (id) {
    queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.maintenanceRecord(id) })
  }
}

function invalidateMaintenanceProfiles(id?: string) {
  queryClient.invalidateQueries({ queryKey: ['fleet', 'maintenanceProfiles'] })
  queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.maintenanceProfilesSummary })
  if (id) {
    queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.maintenanceProfile(id) })
  }
}

export function useCreateMaintenanceProfile() {
  return useMutation({
    mutationFn: createMaintenanceProfile,
    onSuccess: () => {
      invalidateMaintenanceProfiles()
    },
  })
}

export function useDeleteMaintenanceProfile() {
  return useMutation({
    mutationFn: deleteMaintenanceProfile,
    onSuccess: (_, { id }) => {
      invalidateMaintenanceProfiles(id)
    },
  })
}

export function useCompleteMaintenanceProfile() {
  return useMutation({
    mutationFn: completeMaintenanceProfile,
    onSuccess: (_, { id }) => {
      invalidateMaintenanceProfiles(id)
    },
  })
}

export function useCreateMaintenanceRecord() {
  return useMutation({
    mutationFn: createMaintenanceRecord,
    onSuccess: () => {
      invalidateMaintenanceRecords()
    },
  })
}

export function useUpdateMaintenanceRecord() {
  return useMutation({
    mutationFn: updateMaintenanceRecord,
    onSuccess: (_, { id }) => {
      invalidateMaintenanceRecords(id)
    },
  })
}

export function useDeleteMaintenanceRecord() {
  return useMutation({
    mutationFn: deleteMaintenanceRecord,
    onSuccess: (_, { id }) => {
      invalidateMaintenanceRecords(id)
    },
  })
}

export function useStartMaintenanceRecord() {
  return useMutation({
    mutationFn: startMaintenanceRecord,
    onSuccess: (_, { id }) => {
      invalidateMaintenanceRecords(id)
    },
  })
}

export function useCompleteMaintenanceRecord() {
  return useMutation({
    mutationFn: completeMaintenanceRecord,
    onSuccess: (_, { id }) => {
      invalidateMaintenanceRecords(id)
    },
  })
}

export function useSendMaintenanceReminders() {
  return useMutation({
    mutationFn: sendMaintenanceReminders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.maintenanceReminderSchedule })
    },
  })
}

export function useUpsertMaintenanceReminderSchedule() {
  return useMutation({
    mutationFn: upsertMaintenanceReminderSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.maintenanceReminderSchedule })
    },
  })
}

export function useDeleteMaintenanceReminderSchedule() {
  return useMutation({
    mutationFn: deleteMaintenanceReminderSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.maintenanceReminderSchedule })
    },
  })
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: ({ file, query }: { file: File; query: Parameters<typeof uploadDocument>[1] }) =>
      uploadDocument(file, query),
    onSuccess: (_, { query }) => {
      queryClient.invalidateQueries({
        queryKey: FLEET_QUERY_KEY.documents({
          params: {
            entityType: query.params.entityType as 'job' | 'vehicle' | 'driver',
            entityId: query.params.entityId,
          },
        }),
      })
    },
  })
}

// ─── Compliance hooks ─────────────────────────────────────────────────────────

export function getComplianceDocumentHistoryQueryOptions(
  params?: ComplianceDocumentHistoryQuery['params'],
) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.complianceDocumentHistory(params),
    queryFn: () => getComplianceDocumentHistory({ params }),
  })
}

export function useComplianceDocumentHistory(params?: ComplianceDocumentHistoryQuery['params']) {
  return useQuery(getComplianceDocumentHistoryQueryOptions(params))
}

export function useComplianceDocs(params?: ComplianceDocumentsQuery['params']) {
  return useQuery({
    queryKey: FLEET_QUERY_KEY.complianceDocs(params),
    queryFn: () => getComplianceDocs({ params }),
    placeholderData: keepPreviousData,
  })
}

export function useFleetStorageUsage() {
  return useQuery({
    queryKey: FLEET_QUERY_KEY.storageUsage,
    queryFn: () => getFleetStorageUsage(),
  })
}

export function useComplianceSummary() {
  return useQuery({
    queryKey: FLEET_QUERY_KEY.complianceSummary,
    queryFn: () => getComplianceSummary(),
  })
}

export function useCreateComplianceDoc() {
  return useMutation({
    mutationFn: createComplianceDoc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'complianceDocs'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.complianceSummary })
    },
  })
}

export function useUpdateComplianceDoc() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateComplianceDoc>[1] }) =>
      updateComplianceDoc(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'complianceDocs'] })
    },
  })
}

export function useDeleteComplianceDoc() {
  return useMutation({
    mutationFn: deleteComplianceDoc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'complianceDocs'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.complianceSummary })
    },
  })
}

export function useSetComplianceDocFileUrl() {
  return useMutation({
    mutationFn: ({ id, fileUrl, fileSize }: { id: string; fileUrl: string; fileSize?: number | null }) =>
      setComplianceDocFileUrl(id, { fileUrl, fileSize }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'complianceDocs'] })
    },
  })
}

export function useRenewComplianceDoc() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: RenewComplianceDocumentPayload }) =>
      renewComplianceDoc(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'complianceDocs'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.complianceSummary })
    },
  })
}

export function useSetComplianceDocReminder() {
  return useMutation({
    mutationFn: ({ id, reminderDays }: { id: string; reminderDays: number }) =>
      setComplianceDocReminder(id, reminderDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'complianceDocs'] })
    },
  })
}

export function useSendComplianceReminders() {
  return useMutation({ mutationFn: sendComplianceReminders })
}

export function useUpdateDeviceSetupRequestStatus() {
  return useMutation({
    mutationFn: updateDeviceSetupRequestStatus,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'deviceSetupRequests'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.deviceSetupRequest(id) })
    },
  })
}

export function useSetGeofenceVehicles() {
  return useMutation({
    mutationFn: setGeofenceVehicles,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'geofences'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.geofenceZone(id) })
    },
  })
}

export function useUpsertFuelBudget() {
  return useMutation({
    mutationFn: upsertFuelBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelBudgets })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelBudgetVsActual'] })
    },
  })
}

// ─── Re-export plain request functions for imperative use ─────────────────────

export {
  downloadDeviceImportTemplate,
  downloadDriverImportTemplate,
  downloadVehicleImportTemplate,
  exportComplianceDocs,
  exportDevices,
  exportFleetAnalytics,
  exportFleetCostBreakdown,
  exportFleetFinancialStatement,
  exportFuelTransactions,
  exportMaintenanceProfiles,
  exportMaintenanceRecords,
  exportReport,
  exportVehiclePL,
  exportVehicles,
  getDocumentDownloadUrl,
  uploadDocument,
}

// ─── Live tracking (TRU-FE-6) ─────────────────────────────────────────────────
// Socket-driven: REST paints once, the realtime socket moves it. Never poll these.

export function getTrackingLiveQueryOptions() {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.trackingLive,
    queryFn: getTrackingLive,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export function useTrackingLive() {
  return useQuery(getTrackingLiveQueryOptions())
}

export function getTrackingVehiclesQueryOptions(payload?: TrackingVehiclesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.trackingVehicles(payload),
    queryFn: () => getTrackingVehicles(payload),
    enabled: Boolean(payload?.params?.query),
    placeholderData: keepPreviousData,
  })
}

export function useTrackingVehicles(payload?: TrackingVehiclesQuery) {
  return useQuery(getTrackingVehiclesQueryOptions(payload))
}

export function getTrackingAlertsQueryOptions(payload?: TrackingAlertsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.trackingAlerts(payload),
    queryFn: () => getTrackingAlerts(payload),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export function useTrackingAlerts(payload?: TrackingAlertsQuery, enabled = true) {
  return useQuery({ ...getTrackingAlertsQueryOptions(payload), enabled })
}

export function useShareVehicleLocation() {
  return useMutation({ mutationFn: shareVehicleLocation })
}

export function usePublicTrack(token: string) {
  return useQuery({
    queryKey: FLEET_QUERY_KEY.publicTrack(token),
    queryFn: () => getPublicTrack(token),
    enabled: Boolean(token),
    retry: false,
  })
}

// ─── Fleets (vehicle groups) ──────────────────────────────────────────────────

export function getFleetGroupsQueryOptions() {
  return queryOptions({ queryKey: FLEET_QUERY_KEY.fleetGroups, queryFn: getFleetGroups })
}

export function useFleetGroups() {
  return useQuery(getFleetGroupsQueryOptions())
}

function invalidateFleetGroups() {
  queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fleetGroups })
}

export function useCreateFleetGroup() {
  return useMutation({ mutationFn: createFleetGroup, onSuccess: invalidateFleetGroups })
}

export function useUpdateFleetGroup() {
  return useMutation({ mutationFn: updateFleetGroup, onSuccess: invalidateFleetGroups })
}

export function useDeleteFleetGroup() {
  return useMutation({ mutationFn: deleteFleetGroup, onSuccess: invalidateFleetGroups })
}

export function getDriverGroupsQueryOptions() {
  return queryOptions({ queryKey: FLEET_QUERY_KEY.driverGroups, queryFn: getDriverGroups })
}

export function useDriverGroups() {
  return useQuery(getDriverGroupsQueryOptions())
}

function invalidateDriverGroups() {
  queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driverGroups })
}

export function useCreateDriverGroup() {
  return useMutation({ mutationFn: createDriverGroup, onSuccess: invalidateDriverGroups })
}

export function useUpdateDriverGroup() {
  return useMutation({ mutationFn: updateDriverGroup, onSuccess: invalidateDriverGroups })
}

export function useDeleteDriverGroup() {
  return useMutation({ mutationFn: deleteDriverGroup, onSuccess: invalidateDriverGroups })
}

export function getDriverLicenceRemindersQueryOptions() {
  return queryOptions({ queryKey: FLEET_QUERY_KEY.driverLicenceReminders, queryFn: getDriverLicenceReminders })
}

export function useDriverLicenceReminders() {
  return useQuery(getDriverLicenceRemindersQueryOptions())
}

function invalidateDriverLicenceReminders() {
  queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driverLicenceReminders })
}

export function useSetDriverLicenceReminder() {
  return useMutation({ mutationFn: setDriverLicenceReminder, onSuccess: invalidateDriverLicenceReminders })
}

export function useDeleteDriverLicenceReminder() {
  return useMutation({ mutationFn: deleteDriverLicenceReminder, onSuccess: invalidateDriverLicenceReminders })
}

export function getViolationRulesQueryOptions(entity?: ViolationRuleEntity) {
  return queryOptions({ queryKey: [...FLEET_QUERY_KEY.violationRules, entity ?? 'all'], queryFn: () => getViolationRules(entity) })
}

export function useViolationRules(entity?: ViolationRuleEntity) {
  return useQuery(getViolationRulesQueryOptions(entity))
}

function invalidateViolationRules() {
  queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.violationRules })
}

export function useCreateViolationRule() {
  return useMutation({ mutationFn: createViolationRule, onSuccess: invalidateViolationRules })
}

export function useUpdateViolationRule() {
  return useMutation({ mutationFn: updateViolationRule, onSuccess: invalidateViolationRules })
}

export function useDeleteViolationRule() {
  return useMutation({ mutationFn: deleteViolationRule, onSuccess: invalidateViolationRules })
}

export function getViolationsQueryOptions(query: ViolationsQuery) {
  return queryOptions({ queryKey: [...FLEET_QUERY_KEY.violations, query.entity, query.periodDays ?? 30], queryFn: () => getViolations(query) })
}

export function useViolations(query: ViolationsQuery) {
  return useQuery(getViolationsQueryOptions(query))
}

export function useSetViolationStatus() {
  return useMutation({
    mutationFn: setViolationStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.violations }),
  })
}
