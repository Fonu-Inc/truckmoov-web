import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

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
  createDriver,
  createVehicle,
  deleteDevice,
  deleteDriver,
  deleteFuelTransaction,
  deleteMaintenanceProfile,
  deleteMaintenanceRecord,
  deleteVehicle,
  exportFleetCostBreakdown,
  exportFleetFinancialStatement,
  exportFuelTransactions,
  exportMaintenanceProfiles,
  exportMaintenanceRecords,
  exportVehicles,
  exportReport,
  getAlertStats,
  getAlerts,
  getAllVehicleHealth,
  getAuditLog,
  getDeliveryMetrics,
  getDevice,
  getDevices,
  getDispatchSearch,
  getDocumentAccessLog,
  getDocumentDownloadUrl,
  getDocuments,
  getDriver,
  getDrivers,
  getFleetAnalyticsDriverScores,
  getFleetAnalyticsEvents,
  getFleetAnalyticsFleetStatus,
  getFleetAnalyticsFuelLevels,
  getFleetAnalyticsJobPipeline,
  getFleetAnalyticsSummary,
  getFleetFinancialConfig,
  getFleetFinancialSummary,
  getFuelBudgetVsActual,
  getFuelEfficiency,
  getFuelMetrics,
  getFuelSummary,
  getFuelThresholds,
  getFuelTransactions,
  getGeofence,
  getJobs,
  getLegacyGpsDevices,
  getMaintenanceProfiles,
  getMaintenanceProfilesSummary,
  getMaintenanceRecord,
  getMaintenanceRecords,
  getMaintenanceRecordsSummary,
  getMaintenanceServiceCategories,
  getNearestVehicles,
  getReportsDashboard,
  getVehicle,
  getVehicleHealth,
  getVehicles,
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
  updateDeviceLifecycle,
  updateDriver,
  updateDriverContactChannels,
  updateDriverStatus,
  updateFleetFinancialConfig,
  updateFuelTransaction,
  updateMaintenanceRecord,
  updateVehicle,
  updateVehicleStatus,
  uploadDocument,
  getComplianceDocs,
  getComplianceSummary,
  createComplianceDoc,
  updateComplianceDoc,
  deleteComplianceDoc,
  setComplianceDocFileUrl,
  renewComplianceDoc,
  setComplianceDocReminder,
  sendComplianceReminders,
  exportComplianceDocs,
} from './requests'

export type * from './types'

// ─── Query keys ───────────────────────────────────────────────────────────────

import type {
  AlertsQuery,
  AuditLogQuery,
  DevicesQuery,
  DispatchSearchQuery,
  DocumentsQuery,
  DriversQuery,
  FleetAnalyticsDriverScoresQuery,
  FleetAnalyticsEventsQuery,
  FleetAnalyticsPeriodQuery,
  FleetFinancialConfigActionPayload,
  FleetFinancialSummaryQuery,
  FleetProfitabilityPayload,
  FuelBudgetVsActualQuery,
  FuelMetricsQuery,
  FuelQuery,
  JobsQuery,
  LegacyGpsDevicesQuery,
  MaintenanceProfilesQuery,
  MaintenanceRecordsQuery,
  NearestVehiclesQuery,
  ValidateDeviceAssignmentQuery,
  VehiclesQuery,
  ComplianceDocumentsQuery,
} from './types'

export const FLEET_QUERY_KEY = {
  vehicles: (payload?: VehiclesQuery) => ['fleet', 'vehicles', payload],
  vehiclesSummary: ['fleet', 'vehiclesSummary'],
  vehicle: (id: string) => ['fleet', 'vehicle', id],
  vehiclesHealth: ['fleet', 'vehiclesHealth'],
  vehicleHealth: (vehicleId: string) => ['fleet', 'vehicleHealth', vehicleId],
  nearestVehicles: (payload: NearestVehiclesQuery) => ['fleet', 'nearestVehicles', payload],
  geofence: (vehicleId: string) => ['fleet', 'geofence', vehicleId],
  devices: (payload?: DevicesQuery) => ['fleet', 'devices', payload],
  device: (id: string) => ['fleet', 'device', id],
  legacyGpsDevices: (payload?: LegacyGpsDevicesQuery) => ['fleet', 'legacyGpsDevices', payload],
  drivers: (payload?: DriversQuery) => ['fleet', 'drivers', payload],
  driver: (id: string) => ['fleet', 'driver', id],
  jobs: (payload?: JobsQuery) => ['fleet', 'jobs', payload],
  dispatchSearch: (payload?: DispatchSearchQuery) => ['fleet', 'dispatchSearch', payload],
  alertStats: ['fleet', 'alertStats'],
  alerts: (payload?: AlertsQuery) => ['fleet', 'alerts', payload],
  reportsDashboard: ['fleet', 'reportsDashboard'],
  deliveryMetrics: ['fleet', 'deliveryMetrics'],
  analyticsSummary: (payload?: FleetAnalyticsPeriodQuery) => ['fleet', 'analytics', 'summary', payload],
  analyticsFleetStatus: (payload?: FleetAnalyticsPeriodQuery) => ['fleet', 'analytics', 'fleetStatus', payload],
  analyticsJobPipeline: (payload?: FleetAnalyticsPeriodQuery) => ['fleet', 'analytics', 'jobPipeline', payload],
  analyticsFuelLevels: (payload?: FleetAnalyticsPeriodQuery) => ['fleet', 'analytics', 'fuelLevels', payload],
  analyticsDriverScores: (payload?: FleetAnalyticsDriverScoresQuery) => ['fleet', 'analytics', 'driverScores', payload],
  analyticsEvents: (payload?: FleetAnalyticsEventsQuery) => ['fleet', 'analytics', 'events', payload],
  financialSummary: (payload?: FleetFinancialSummaryQuery) => ['fleet', 'financials', 'summary', payload],
  financialConfig: (vehicleId: string) => ['fleet', 'financials', 'config', vehicleId],
  profitability: (payload: FleetProfitabilityPayload) => ['fleet', 'financials', 'profitability', payload],
  fuelTransactions: (payload?: FuelQuery) => ['fleet', 'fuelTransactions', payload],
  fuelSummary: ['fleet', 'fuelSummary'],
  fuelMetrics: (payload?: FuelMetricsQuery) => ['fleet', 'fuelMetrics', payload],
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
  documents: (payload: DocumentsQuery) => ['fleet', 'documents', payload],
  documentDownloadUrl: (id: string) => ['fleet', 'documentDownloadUrl', id],
  documentAccessLog: (id: string) => ['fleet', 'documentAccessLog', id],
  validateDeviceAssignment: (payload: ValidateDeviceAssignmentQuery) => [
    'fleet',
    'validateDeviceAssignment',
    payload,
  ],
  auditLog: (payload?: AuditLogQuery) => ['fleet', 'auditLog', payload],
  complianceDocs: (params?: ComplianceDocumentsQuery['params']) => ['fleet', 'complianceDocs', params],
  complianceSummary: ['fleet', 'complianceSummary'],
} as const

// ─── queryOptions factories ───────────────────────────────────────────────────

export function getVehiclesQueryOptions(payload?: VehiclesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.vehicles(payload),
    queryFn: () => getVehicles(payload),
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
  })
}

export function getJobsQueryOptions(payload?: JobsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.jobs(payload),
    queryFn: () => getJobs(payload),
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

export function getFleetAnalyticsFleetStatusQueryOptions(payload?: FleetAnalyticsPeriodQuery) {
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

export function getFleetAnalyticsFuelLevelsQueryOptions(payload?: FleetAnalyticsPeriodQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.analyticsFuelLevels(payload),
    queryFn: () => getFleetAnalyticsFuelLevels(payload),
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
  })
}

export function getMaintenanceProfilesQueryOptions(payload?: MaintenanceProfilesQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.maintenanceProfiles(payload),
    queryFn: () => getMaintenanceProfiles(payload),
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

// ─── useQuery hooks ────────────────────────────────────────────────────────────

export function useVehicles(payload?: VehiclesQuery) {
  return useQuery(getVehiclesQueryOptions(payload))
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

export function useLegacyGpsDevices(payload?: LegacyGpsDevicesQuery) {
  return useQuery(getLegacyGpsDevicesQueryOptions(payload))
}

export function useDrivers(payload?: DriversQuery) {
  return useQuery(getDriversQueryOptions(payload))
}

export function useDriver(id: string) {
  return useQuery(getDriverQueryOptions(id))
}

export function useJobs(payload?: JobsQuery) {
  return useQuery(getJobsQueryOptions(payload))
}

export function useDispatchSearch(payload?: DispatchSearchQuery) {
  return useQuery(getDispatchSearchQueryOptions(payload))
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

export function useFleetAnalyticsFleetStatus(payload?: FleetAnalyticsPeriodQuery) {
  return useQuery(getFleetAnalyticsFleetStatusQueryOptions(payload))
}

export function useFleetAnalyticsJobPipeline(payload?: FleetAnalyticsPeriodQuery) {
  return useQuery(getFleetAnalyticsJobPipelineQueryOptions(payload))
}

export function useFleetAnalyticsFuelLevels(payload?: FleetAnalyticsPeriodQuery) {
  return useQuery(getFleetAnalyticsFuelLevelsQueryOptions(payload))
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
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesSummary })
    },
  })
}

export function useUpdateVehicle() {
  return useMutation({
    mutationFn: updateVehicle,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesSummary })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(id) })
    },
  })
}

export function useDeleteVehicle() {
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesSummary })
    },
  })
}

export function useImportVehicles() {
  return useMutation({
    mutationFn: importVehicles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesSummary })
    },
  })
}

export function useUpdateVehicleStatus() {
  return useMutation({
    mutationFn: updateVehicleStatus,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesSummary })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(id) })
    },
  })
}

export function useAssignDriverToVehicle() {
  return useMutation({
    mutationFn: assignDriverToVehicle,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesSummary })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(id) })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers() })
    },
  })
}

export function useUnassignDriverFromVehicle() {
  return useMutation({
    mutationFn: unassignDriverFromVehicle,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesSummary })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(id) })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers() })
    },
  })
}

export function useRegisterGpsDevice() {
  return useMutation({
    mutationFn: registerGpsDevice,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(id) })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.devices() })
    },
  })
}

export function useCreateDevice() {
  return useMutation({
    mutationFn: createDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.devices() })
    },
  })
}

export function useUpdateDevice() {
  return useMutation({
    mutationFn: updateDevice,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.devices() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
    },
  })
}

export function useDeleteDevice() {
  return useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.devices() })
    },
  })
}

export function useImportDevices() {
  return useMutation({
    mutationFn: importDevices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.devices() })
    },
  })
}

export function useUpdateDeviceLifecycle() {
  return useMutation({
    mutationFn: updateDeviceLifecycle,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.devices() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
    },
  })
}

export function useAssignDevice() {
  return useMutation({
    mutationFn: assignDevice,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.devices() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesSummary })
    },
  })
}

export function useUnassignDevice() {
  return useMutation({
    mutationFn: unassignDevice,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.devices() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.device(id) })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehiclesSummary })
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
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelTransactions() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelMetrics() })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelBudgetVsActual'] })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelEfficiency })
    },
  })
}

export function useUpdateFuelTransaction() {
  return useMutation({
    mutationFn: updateFuelTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelTransactions() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelMetrics() })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelBudgetVsActual'] })
    },
  })
}

export function useDeleteFuelTransaction() {
  return useMutation({
    mutationFn: deleteFuelTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelTransactions() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelMetrics() })
      queryClient.invalidateQueries({ queryKey: ['fleet', 'fuelBudgetVsActual'] })
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

export function useComplianceDocs(params?: ComplianceDocumentsQuery['params']) {
  return useQuery({
    queryKey: FLEET_QUERY_KEY.complianceDocs(params),
    queryFn: () => getComplianceDocs({ params }),
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
    mutationFn: ({ id, fileUrl }: { id: string; fileUrl: string }) => setComplianceDocFileUrl(id, fileUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'complianceDocs'] })
    },
  })
}

export function useRenewComplianceDoc() {
  return useMutation({
    mutationFn: renewComplianceDoc,
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

// ─── Re-export plain request functions for imperative use ─────────────────────

export {
  exportFleetCostBreakdown,
  exportFleetFinancialStatement,
  exportComplianceDocs,
  exportFuelTransactions,
  exportMaintenanceProfiles,
  exportMaintenanceRecords,
  exportReport,
  exportVehicles,
  getDocumentDownloadUrl,
  uploadDocument,
}
