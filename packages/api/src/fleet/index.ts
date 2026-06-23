import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { queryClient } from '../lib/query-client'
import {
  acknowledgeAlert,
  assignDevice,
  assignDriverToVehicle,
  createDevice,
  createDriver,
  createVehicle,
  deleteDevice,
  deleteDriver,
  deleteFuelTransaction,
  deleteVehicle,
  exportFuelTransactions,
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
  getFuelEfficiency,
  getFuelMetrics,
  getFuelThresholds,
  getFuelTransactions,
  getGeofence,
  getJobs,
  getLegacyGpsDevices,
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
  unassignDevice,
  unassignDriverFromVehicle,
  updateDevice,
  updateDeviceLifecycle,
  updateDriver,
  updateDriverContactChannels,
  updateDriverStatus,
  updateFuelTransaction,
  updateVehicle,
  updateVehicleStatus,
  uploadDocument,
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
  FuelMetricsQuery,
  FuelQuery,
  JobsQuery,
  LegacyGpsDevicesQuery,
  NearestVehiclesQuery,
  ValidateDeviceAssignmentQuery,
  VehiclesQuery,
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
  fuelTransactions: (payload?: FuelQuery) => ['fleet', 'fuelTransactions', payload],
  fuelMetrics: (payload?: FuelMetricsQuery) => ['fleet', 'fuelMetrics', payload],
  fuelEfficiency: ['fleet', 'fuelEfficiency'],
  fuelThresholds: ['fleet', 'fuelThresholds'],
  documents: (payload: DocumentsQuery) => ['fleet', 'documents', payload],
  documentDownloadUrl: (id: string) => ['fleet', 'documentDownloadUrl', id],
  documentAccessLog: (id: string) => ['fleet', 'documentAccessLog', id],
  validateDeviceAssignment: (payload: ValidateDeviceAssignmentQuery) => [
    'fleet',
    'validateDeviceAssignment',
    payload,
  ],
  auditLog: (payload?: AuditLogQuery) => ['fleet', 'auditLog', payload],
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

export function getFuelTransactionsQueryOptions(payload?: FuelQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelTransactions(payload),
    queryFn: () => getFuelTransactions(payload),
  })
}

export function getFuelMetricsQueryOptions(payload?: FuelMetricsQuery) {
  return queryOptions({
    queryKey: FLEET_QUERY_KEY.fuelMetrics(payload),
    queryFn: () => getFuelMetrics(payload),
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

export function useFuelTransactions(payload?: FuelQuery) {
  return useQuery(getFuelTransactionsQueryOptions(payload))
}

export function useFuelMetrics(payload?: FuelMetricsQuery) {
  return useQuery(getFuelMetricsQueryOptions(payload))
}

export function useFuelEfficiency() {
  return useQuery(getFuelEfficiencyQueryOptions())
}

export function useFuelThresholds() {
  return useQuery(getFuelThresholdsQueryOptions())
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
    },
  })
}

export function useDeleteFuelTransaction() {
  return useMutation({
    mutationFn: deleteFuelTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelTransactions() })
      queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelMetrics() })
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

// ─── Re-export plain request functions for imperative use ─────────────────────

export { exportFuelTransactions, exportReport, exportVehicles }
