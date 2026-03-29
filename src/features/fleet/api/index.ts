import { queryOptions, useMutation } from "@tanstack/react-query"
import { acknowledgeAlert, alertStatistics, assignDriverToVehicle, auditLog, bulkCreateDrivers, bulkCreateVehicle, createDriver, createVehicle, deleteDriver, deleteFuelTransaction, deleteVehicle, deliveryMetrics, documentAccessLog, documentSecureUrl, findNearestVehicles, fuelEfficiency, fuelExport, fuelMetrics, fuelThreshold, getDriver, getVehicle, listAlerts, listDocuments, listDrivers, listFuelTransaction, listJobs, listVehicles, operationalDashboard, publishJobStatus, recordFuelTransaction, registerGpsOnVehicle, registerVehicleGeofence, reportExport, reportVehicleLivePosition, resolveAlert, searchDispatch, setDriverStatus, setFuelThreshold, setVehicleStatus, unassignDriverFromVehicle, updateDriver, updateDriverContactChannels, updateFuelTransaction, updateVehicle, uploadDocument, vehicleGeofence, vehicleHealth } from "./request"
import { queryClient } from "@/shared/providers/TanstackQueryProvider"
import { RequestPayloadExtractor } from "@/shared/types"

export const FLEET_QUERY_KEY = {
 vehicles: ["vehicles"],
 vehicle: (vehicleId: string) => ["vehicle", vehicleId],
 nearestVehicle: ["nearestVehicle"],
 vehicleHealth: ["vehicleHealth"],
 vehicleGeofence: ["vehicleGeofence"],
 drivers: ["drivers"],
 driver: (driverId: string) => ["driver", driverId],
 jobs: ["jobs"],
 dispatch: ["dispatch"],
 alertStatistics: ["alertStatistics"],
 alerts: ["alerts"],
 operationalDashboard: ["operationalDashboard"],
 deliveryMetrics: ["deliveryMetrics"],
 reportExport: ["reportExport"],
 fuelTransactions: ["fuelTransactions"],
 fuelMetrics: ["fuelMetrics"],
 fuelEfficiency: ["fuelEfficiency"],
 fuelThreshold: ["fuelThreshold"],
 documents: ["documents"],
 documentSecureUrl: (id: string) => ["documentSecureUrl", id],
 documentAccessLog: (id: string) => ["documentAccessLog", id],
 auditLog: ["auditLog"],
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

export function listVehiclesQueryOptions(payload: RequestPayloadExtractor<typeof listVehicles>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.vehicles, payload.params],
  queryFn: () => listVehicles(payload),
 })
}

export function useCreateVehicle() {
 return useMutation({
  mutationFn: createVehicle,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles })
  }
 })
}

export function useBulkCreateVehicle() {
 return useMutation({
  mutationFn: bulkCreateVehicle,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles })
  }
 })
}

export function getVehicleQueryOptions(payload: RequestPayloadExtractor<typeof getVehicle>) {
 return queryOptions({
  queryKey: FLEET_QUERY_KEY.vehicle(payload.id),
  queryFn: () => getVehicle(payload),
  enabled: !!payload.id
 })
}

export function useUpdateVehicle() {
 return useMutation({
  mutationFn: updateVehicle,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(variable.id) })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles })
  }
 })
}

export function useDeleteVehicle() {
 return useMutation({
  mutationFn: deleteVehicle,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(variable.id) })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles })
  }
 })
}

export function useSetVehicleStatus() {
 return useMutation({
  mutationFn: setVehicleStatus,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(variable.id) })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles })
  }
 })
}

export function useAssignDriverToVehicle() {
 return useMutation({
  mutationFn: assignDriverToVehicle,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(variable.id) })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers })
  }
 })
}

export function useUnassignDriverFromVehicle() {
 return useMutation({
  mutationFn: unassignDriverFromVehicle,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(variable.id) })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers })
  }
 })
}

export function useRegisterGpsOnVehicle() {
 return useMutation({
  mutationFn: registerGpsOnVehicle,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicle(variable.id) })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicles })
  }
 })
}

export function findNearestVehiclesQueryOptions(payload: RequestPayloadExtractor<typeof findNearestVehicles>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.nearestVehicle, payload.params],
  queryFn: () => findNearestVehicles(payload)
 })
}

export function vehicleHealthQueryOptions(payload: RequestPayloadExtractor<typeof vehicleHealth>) {
 return queryOptions({
  queryKey: FLEET_QUERY_KEY.vehicleHealth,
  queryFn: () => vehicleHealth(payload),
  enabled: !!payload.vehicleId
 })
}

export function vehicleGeofenceQueryOptions(payload: RequestPayloadExtractor<typeof vehicleGeofence>) {
 return queryOptions({
  queryKey: FLEET_QUERY_KEY.vehicleGeofence,
  queryFn: () => vehicleGeofence(payload),
  enabled: !!payload.vehicleId
 })
}

export function useRegisterVehicleGeofence() {
 return useMutation({
  mutationFn: registerVehicleGeofence,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.vehicleGeofence })
  }
 })
}

export function useReportVehicleLivePosition() {
 return useMutation({
  mutationFn: reportVehicleLivePosition,
 })
}

// ─── Drivers ─────────────────────────────────────────────────────────────────

export function listDriversQueryOptions(payload: RequestPayloadExtractor<typeof listDrivers>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.drivers, payload.params],
  queryFn: () => listDrivers(payload)
 })
}

export function useCreateDriver() {
 return useMutation({
  mutationFn: createDriver,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers })
  }
 })
}

export function useBulkCreateDrivers() {
 return useMutation({
  mutationFn: bulkCreateDrivers,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers })
  }
 })
}

export function getDriverQueryOptions(payload: RequestPayloadExtractor<typeof getDriver>) {
 return queryOptions({
  queryKey: FLEET_QUERY_KEY.driver(payload.id),
  queryFn: () => getDriver(payload),
  enabled: !!payload.id
 })
}

export function useUpdateDriver() {
 return useMutation({
  mutationFn: updateDriver,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driver(variable.id) })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers })
  }
 })
}

export function useDeleteDriver() {
 return useMutation({
  mutationFn: deleteDriver,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driver(variable.id) })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers })
  }
 })
}

export function useSetDriverStatus() {
 return useMutation({
  mutationFn: setDriverStatus,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driver(variable.id) })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers })
  }
 })
}

export function useUpdateDriverContactChannels() {
 return useMutation({
  mutationFn: updateDriverContactChannels,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.driver(variable.id) })
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.drivers })
  }
 })
}

// ─── Jobs & Dispatch ─────────────────────────────────────────────────────────

export function listJobsQueryOptions(payload: RequestPayloadExtractor<typeof listJobs>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.jobs, payload.params],
  queryFn: () => listJobs(payload)
 })
}

export function searchDispatchQueryOptions(payload: RequestPayloadExtractor<typeof searchDispatch>) {
 return queryOptions({
  queryKey: FLEET_QUERY_KEY.dispatch,
  queryFn: () => searchDispatch(payload)
 })
}

export function usePublishJobStatus() {
 return useMutation({
  mutationFn: publishJobStatus,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.jobs })
  }
 })
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export function alertStatisticsQueryOptions() {
 return queryOptions({
  queryKey: FLEET_QUERY_KEY.alertStatistics,
  queryFn: () => alertStatistics()
 })
}

export function listAlertsQueryOptions(payload: RequestPayloadExtractor<typeof listAlerts>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.alerts, payload.params],
  queryFn: () => listAlerts(payload)
 })
}

export function useAcknowledgeAlert() {
 return useMutation({
  mutationFn: acknowledgeAlert,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.alerts })
  }
 })
}

export function useResolveAlert() {
 return useMutation({
  mutationFn: resolveAlert,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.alerts })
  }
 })
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export function operationalDashboardQueryOptions(payload: RequestPayloadExtractor<typeof operationalDashboard>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.operationalDashboard, payload.params],
  queryFn: () => operationalDashboard(payload)
 })
}

export function deliveryMetricsQueryOptions(payload: RequestPayloadExtractor<typeof deliveryMetrics>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.deliveryMetrics, payload.params],
  queryFn: () => deliveryMetrics(payload)
 })
}

export function reportExportQueryOptions(payload: RequestPayloadExtractor<typeof reportExport>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.reportExport, payload.params],
  queryFn: () => reportExport(payload)
 })
}

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export function listFuelTransactionQueryOptions(payload: RequestPayloadExtractor<typeof listFuelTransaction>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.fuelTransactions, payload.params],
  queryFn: () => listFuelTransaction(payload)
 })
}

export function useRecordFuelTransaction() {
 return useMutation({
  mutationFn: recordFuelTransaction,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelTransactions })
  }
 })
}

export function fuelMetricsQueryOptions(payload: RequestPayloadExtractor<typeof fuelMetrics>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.fuelMetrics, payload.params],
  queryFn: () => fuelMetrics(payload)
 })
}

export function fuelEfficiencyQueryOptions(payload: RequestPayloadExtractor<typeof fuelEfficiency>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.fuelEfficiency, payload.params],
  queryFn: () => fuelEfficiency(payload)
 })
}

export function fuelThresholdQueryOptions() {
 return queryOptions({
  queryKey: FLEET_QUERY_KEY.fuelThreshold,
  queryFn: () => fuelThreshold()
 })
}

export function fuelExportQueryOptions(payload: RequestPayloadExtractor<typeof fuelExport>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.fuelThreshold, payload.params],
  queryFn: () => fuelExport(payload)
 })
}

export function useUpdateFuelTransaction() {
 return useMutation({
  mutationFn: updateFuelTransaction,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelTransactions })
  }
 })
}

export function useDeleteFuelTransaction() {
 return useMutation({
  mutationFn: deleteFuelTransaction,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelTransactions })
  }
 })
}

export function useSetFuelThreshold() {
 return useMutation({
  mutationFn: setFuelThreshold,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.fuelThreshold })
  }
 })
}

// ─── Documents ───────────────────────────────────────────────────────────────

export function listDocumentsQueryOptions(payload: RequestPayloadExtractor<typeof listDocuments>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.documents, payload.params],
  queryFn: () => listDocuments(payload)
 })
}

export function useUploadDocument() {
 return useMutation({
  mutationFn: uploadDocument,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.documents })
  }
 })
}

export function documentSecureUrlQueryOptions(payload: RequestPayloadExtractor<typeof documentSecureUrl>) {
 return queryOptions({
  queryKey: FLEET_QUERY_KEY.documentSecureUrl(payload.id),
  queryFn: () => documentSecureUrl(payload),
  enabled: !!payload.id
 })
}

export function documentAccessLogQueryOptions(payload: RequestPayloadExtractor<typeof documentAccessLog>) {
 return queryOptions({
  queryKey: FLEET_QUERY_KEY.documentAccessLog(payload.id),
  queryFn: () => documentAccessLog(payload),
  enabled: !!payload.id
 })
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export function auditLogQueryOptions(payload: RequestPayloadExtractor<typeof auditLog>) {
 return queryOptions({
  queryKey: [...FLEET_QUERY_KEY.auditLog, payload.params],
  queryFn: () => auditLog(payload)
 })
}
