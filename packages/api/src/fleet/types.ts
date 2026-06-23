// ─── Shared ──────────────────────────────────────────────────────────────────

export type LatLng = {
  lat: number
  lng: number
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export type RegisterGeofencePayload = {
  vehicleId: string
  data: {
    northeast: LatLng
    southwest: LatLng
  }
}

export type ReportLocationPayload = {
  vehicleId: string
  data: {
    lat: number
    lng: number
  }
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export type VehiclesQuery = {
  params?: {
    query?: string
    status?: 'active' | 'inactive' | 'maintenance' | 'decommissioned'
    assigned?: boolean
    type?: 'truck' | 'van' | 'trailer'
    yearFrom?: number
    yearTo?: number
  }
}

export type NearestVehiclesQuery = {
  params: {
    lat: number
    lng: number
    limit?: number
  }
}

export type CreateVehiclePayload = {
  data: {
    plateNumber: string
    registrationNumber: string
    vin: string
    make: string
    model: string
    year: number
    type: string
    capacity?: unknown
    status?: string
  }
}

export type UpdateVehiclePayload = {
  id: string
  data: Record<string, unknown>
}

export type ImportVehiclesPayload = {
  data: {
    items: Record<string, unknown>[]
  }
}

export type UpdateVehicleStatusPayload = {
  id: string
  data: {
    status: 'active' | 'inactive'
  }
}

export type AssignDriverPayload = {
  id: string
  data: {
    driverId: string
  }
}

export type RegisterGpsDevicePayload = {
  id: string
  data: {
    imei: string
    manufacturer: string
    model: string
    firmwareVersion?: string
    installedAt?: string
  }
}

// ─── Devices ──────────────────────────────────────────────────────────────────

export type DevicesQuery = {
  params?: {
    query?: string
    manufacturer?: string
    status?: 'registered' | 'configured' | 'assigned' | 'active' | 'faulty' | 'decommissioned'
    lifecycleStatus?: string
    assigned?: boolean
  }
}

export type CreateDevicePayload = {
  data: {
    imei: string
    manufacturer: string
    model: string
    firmwareVersion?: string
    lifecycleStatus?: string
  }
}

export type UpdateDevicePayload = {
  id: string
  data: Record<string, unknown>
}

export type ImportDevicesPayload = {
  data: {
    items: Record<string, unknown>[]
  }
}

export type UpdateDeviceLifecyclePayload = {
  id: string
  data: {
    lifecycleStatus: string
  }
}

export type AssignDevicePayload = {
  id: string
  data: {
    vehicleId: string
  }
}

export type ValidateDeviceAssignmentQuery = {
  id: string
  params: {
    vehicleId: string
  }
}

export type LegacyGpsDevicesQuery = {
  params?: {
    query?: string
    vehicleStatus?: 'active' | 'inactive'
  }
}

// ─── Drivers ──────────────────────────────────────────────────────────────────

export type DriversQuery = {
  params?: {
    query?: string
    status?: 'active' | 'available' | 'offline' | 'suspended' | 'inactive'
    assigned?: boolean
  }
}

export type CreateDriverPayload = {
  data: {
    firstName?: string
    lastName?: string
    name?: string
    phone: string
    email?: string
    licenseNumber: string
    licenseExpiryDate?: string
    status?: string
    communicationPreference?: string
  }
}

export type UpdateDriverPayload = {
  id: string
  data: Record<string, unknown>
}

export type ImportDriversPayload = {
  data: {
    items: Record<string, unknown>[]
  }
}

export type UpdateDriverStatusPayload = {
  id: string
  data: {
    status: string
  }
}

export type UpdateDriverContactChannelsPayload = {
  id: string
  data: {
    whatsappNumber?: string
    smsNumber?: string
    voiceNumber?: string
  }
}

// ─── Jobs & Dispatch ──────────────────────────────────────────────────────────

export type JobsQuery = {
  params?: {
    query?: string
    status?: string
  }
}

export type DispatchSearchQuery = {
  params?: {
    query?: string
    vehicleStatus?: string
    driverStatus?: string
    jobStatus?: string
    assignedOnly?: boolean
  }
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type AlertsQuery = {
  params?: {
    status?: 'open' | 'acknowledged' | 'resolved' | 'escalated'
    type?: string
    vehicleId?: string
  }
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ExportReportPayload = {
  entity: string
}

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export type RecordFuelTransactionPayload = {
  data: {
    vehicleId: string
    driverId?: string
    vehicleType?: string
    liters: number
    pricePerLiter: number
    station?: string
    odometer?: number
  }
}

export type FuelQuery = {
  params?: {
    vehicleId?: string
    driverId?: string
    station?: string
    from?: string
    to?: string
  }
}

export type UpdateFuelTransactionPayload = {
  id: string
  data: Record<string, unknown>
}

export type FuelMetricsQuery = {
  params?: {
    period?: 'weekly' | 'monthly'
  }
}

export type SetFuelThresholdPayload = {
  vehicleType: string
  data: {
    minKmPerLiter: number
  }
}

// Maintenance

export type MaintenanceRecordStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type MaintenanceRecordDisplayStatus = MaintenanceRecordStatus | 'overdue'
export type MaintenanceRecordPriority = 'low' | 'medium' | 'high' | 'critical'

export type MaintenanceRecordsQuery = {
  params?: {
    vehicleId?: string
    status?: MaintenanceRecordDisplayStatus
    priority?: MaintenanceRecordPriority
    maintenanceType?: string
    search?: string
  }
}

export type CreateMaintenanceRecordPayload = {
  data: {
    vehicleId: string
    maintenanceType: string
    description?: string | null
    priority: MaintenanceRecordPriority
    scheduledDate?: string | null
    technician?: string | null
    notes?: string | null
    cost?: number | null
    currency?: string
  }
}

export type UpdateMaintenanceRecordPayload = {
  id: string
  data: Partial<CreateMaintenanceRecordPayload['data']> & {
    status?: MaintenanceRecordStatus
    completedDate?: string | null
  }
}

export type MaintenanceRecordActionPayload = {
  id: string
}

export type SendMaintenanceRemindersPayload = {
  data: {
    recipientEmail: string
    daysBefore: number[]
  }
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type UploadDocumentQuery = {
  params: {
    entityType: string
    entityId: string
    docType: 'pod' | 'invoice' | 'permit' | 'other'
  }
}

export type DocumentsQuery = {
  params: {
    entityType: 'job' | 'vehicle' | 'driver'
    entityId: string
  }
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditLogQuery = {
  params?: {
    entityType?: 'job' | 'vehicle' | 'driver' | 'device' | 'fuel' | 'alert' | 'document' | 'geofence'
    entityId?: string
    action?: string
    limit?: number
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type FleetAnalyticsPeriodDays = 7 | 30 | 60 | 90

export type FleetAnalyticsPeriodQuery = {
  params?: {
    period_days?: FleetAnalyticsPeriodDays
  }
}

export type FleetAnalyticsDriverScoresQuery = {
  params?: {
    period_days?: FleetAnalyticsPeriodDays
    limit?: number
  }
}

export type FleetAnalyticsEventsQuery = {
  params?: {
    period_days?: FleetAnalyticsPeriodDays
    limit?: number
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }
}

// ─── Response entity types ────────────────────────────────────────────────────

export type VehicleGpsDevice = {
  imei: string
  manufacturer: string
  model: string
  firmwareVersion: string
  installedAt: string
}

export type Vehicle = {
  id: string
  registrationNumber: string
  plateNumber: string
  vin: string | null
  make: string | null
  model: string
  year: number | null
  type: 'truck' | 'van' | 'trailer' | string
  capacity: number | null
  tenantId: string
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned' | string
  assignedDriverId: string | null
  assignedDriverName?: string | null
  fuelLevelPercent?: number | null
  gpsDevice: VehicleGpsDevice | null
}

export type VehicleSummary = {
  total: number
  active: number
  inactive: number
  maintenance: number
  decommissioned: number
}

export type DriverContactChannels = {
  whatsappNumber: string | null
  smsNumber: string | null
  voiceNumber: string | null
}

export type FleetDriver = {
  id: string
  firstName: string
  lastName: string
  name: string
  phone: string
  email: string | null
  licenseNumber: string
  licenseExpiryDate: string | null
  tenantId: string
  status: Record<string, unknown>
  communicationPreference: Record<string, unknown>
  assignedVehicleId: string | null
  contactChannels: DriverContactChannels
  createdAt: string
  updatedAt: string
}

export type FleetDevice = {
  id: string
  imei: string
  manufacturer: string
  model: string
  firmwareVersion: string
  tenantId: string
  status: 'registered' | 'configured' | 'assigned' | 'active' | 'faulty' | 'decommissioned'
  lifecycleStatus: 'registered' | 'config_pending' | 'configured' | 'verified_online' | 'assignable' | 'assigned' | 'faulty' | 'decommissioned'
  vehicleId: string | null
  signalStrength: number | null
  batteryLevel: number | null
  lastSeen: string | null
  assignedAt: string | null
  createdAt: string
  updatedAt: string
}

export type GpsDevice = {
  id: string
  imei: string
  manufacturer: string
  model: string
  firmwareVersion: string
  installedAt: string | null
  tenantId: string
  status: 'registered' | 'configured' | 'assigned' | 'active' | 'faulty' | 'decommissioned'
  lifecycleStatus: 'registered' | 'config_pending' | 'configured' | 'verified_online' | 'assignable' | 'assigned' | 'faulty' | 'decommissioned'
  vehicleId: string | null
  vehicleRegistrationNumber: string | null
  vehicleStatus: 'active' | 'inactive' | null
  signalStrength: number | null
  batteryLevel: number | null
  lastSeen: string | null
  assignedAt: string | null
}

export type FleetJob = {
  jobId: string
  tenantId: string
  status: string
  updatedAt: string
}

export type FleetAlert = {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'acknowledged' | 'resolved' | 'escalated'
  vehicleId: string | null
  jobId: string | null
  details: Record<string, unknown>
  createdAt: string
  triggeredAt: string
  acknowledgedAt: string | null
  resolvedAt: string | null
  escalatedAt: string | null
  acknowledgedBy: string | null
  resolvedBy: string | null
}

export type FuelRecord = {
  id: string
  tenantId: string
  vehicleId: string
  driverId: string | null
  vehicleType: string | null
  liters: number
  pricePerLiter: number
  totalCost: number
  station: string | null
  odometer: number | null
  recordedAt: string
  recordedBy: string
  deletedAt: string | null
}

export type FuelConsumptionBucket = {
  label: string
  liters: number
  totalCost: number
  records: number
}

export type VehicleEfficiency = {
  vehicleId: string
  kmPerLiter: number | null
  belowThreshold: boolean
  threshold: number | null
}

export type FuelThreshold = {
  vehicleType: string
  minKmPerLiter: number
}

export type MaintenanceRecord = {
  id: string
  tenantId: string
  vehicleId: string
  maintenanceType: string
  description: string | null
  status: MaintenanceRecordStatus
  priority: MaintenanceRecordPriority
  scheduledDate: string | null
  completedDate: string | null
  cost: number | null
  currency: string
  technician: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type MaintenanceRecordsSummary = {
  total: number
  scheduled: number
  inProgress: number
  completed: number
  overdue: number
  totalCost: number
}

export type FleetDocument = {
  id: string
  tenantId: string
  entityType: 'job' | 'vehicle' | 'driver'
  entityId: string
  docType: 'pod' | 'invoice' | 'permit' | 'other'
  filename: string
  contentType: string
  sizeBytes: number
  uploadedBy: string
  uploadedAt: string
  expiresAt: string | null
}

export type FleetDownloadUrl = {
  url: string
  expiresIn: number
}

export type NearestVehicle = {
  vehicleId: string
  plateNumber: string
  model: string
  assignedDriverId: string | null
  lat: number
  lng: number
  distanceKm: number
}

export type VehicleDriverAssignment = {
  vehicle: Vehicle
  driver: FleetDriver
}

export type DeviceAssignmentValidation = {
  canAssign: boolean
  reason: string | null
}

export type BulkImportResult<T> = {
  created: number
  updated: number
  total: number
  records: T[]
}

export type FleetDashboard = {
  vehicles: Record<string, unknown>
  drivers: Record<string, unknown>
  jobs: Record<string, unknown>
  alerts: Record<string, unknown>
  generatedAt: string
}

export type DeliveryMetrics = {
  totalJobs: number
  delivered: number
  cancelled: number
  inProgress: number
  deliverySuccessRate: number
  averageCycleTimeMs: number | null
  vehicleUtilizationRate: number
  generatedAt: string
}

export type FleetAnalyticsSummary = {
  vehicles: {
    total: number
    active: number
    inactive: number
    maintenance: number
    decommissioned: number
  }
  drivers: {
    total: number
    active: number
    inactive: number
  }
  jobs: {
    total: number
    completed: number
    inProgress: number
    pending: number
  }
  safety: {
    totalEvents: number
    open: number
    critical: number
  }
  periodDays: number
}

export type FleetAnalyticsFleetStatus = {
  total: number
  byStatus: Record<string, number>
  breakdown: Array<{
    id: string
    plateNumber: string
    status: string
    type: string
    assignedDriverId: string | null
  }>
}

export type FleetAnalyticsJobPipeline = {
  total: number
  byStatus: {
    pending: number
    in_progress: number
    delivered: number
    [status: string]: number
  }
  periodDays: number
}

export type FleetAnalyticsFuelLevel = {
  vehicleId: string
  plateNumber: string
  fuelLevelPercent: number | null
  lastUpdated: string | null
}

export type FleetAnalyticsDriverScore = {
  driverId: string
  driverName: string
  incidents: number
  harshBraking: number
  overspeeding: number
  safetyScore: number
}

export type FleetAnalyticsEvent = {
  id: string
  type: string
  severity: string
  status: string
  vehicleId: string | null
  jobId: string | null
  details: Record<string, unknown>
  triggeredAt: string
}

import type { ServerResponse } from '../lib/types'

// ─── Response envelopes ───────────────────────────────────────────────────────

export type VehicleResponse = ServerResponse<Vehicle>
export type VehicleListResponse = ServerResponse<Vehicle[]>
export type VehicleSummaryResponse = ServerResponse<VehicleSummary>
export type FleetDriverResponse = ServerResponse<FleetDriver>
export type FleetDriverListResponse = ServerResponse<FleetDriver[]>
export type FleetDeviceResponse = ServerResponse<FleetDevice>
export type FleetDeviceListResponse = ServerResponse<FleetDevice[]>
export type GpsDeviceListResponse = ServerResponse<GpsDevice[]>
export type FleetJobListResponse = ServerResponse<FleetJob[]>
export type FleetAlertResponse = ServerResponse<FleetAlert>
export type FleetAlertListResponse = ServerResponse<FleetAlert[]>
export type AlertStatsResponse = ServerResponse<Record<string, unknown>>
export type FuelRecordResponse = ServerResponse<FuelRecord>
export type FuelRecordListResponse = ServerResponse<FuelRecord[]>
export type FuelConsumptionResponse = ServerResponse<FuelConsumptionBucket[]>
export type FuelEfficiencyResponse = ServerResponse<VehicleEfficiency[]>
export type FuelThresholdResponse = ServerResponse<FuelThreshold>
export type FuelThresholdListResponse = ServerResponse<FuelThreshold[]>
export type MaintenanceRecordResponse = ServerResponse<MaintenanceRecord>
export type MaintenanceRecordListResponse = ServerResponse<MaintenanceRecord[]>
export type MaintenanceRecordsSummaryResponse = ServerResponse<MaintenanceRecordsSummary>
export type MaintenanceStatusResponse = {
  status: boolean
  message: string
}
export type FleetDocumentResponse = ServerResponse<FleetDocument>
export type FleetDocumentListResponse = ServerResponse<FleetDocument[]>
export type DownloadUrlResponse = ServerResponse<FleetDownloadUrl>
export type AccessLogListResponse = ServerResponse<Record<string, unknown>[]>
export type NearestVehicleListResponse = ServerResponse<NearestVehicle[]>
export type VehicleDriverAssignmentResponse = ServerResponse<VehicleDriverAssignment>
export type DeviceAssignmentValidationResponse = ServerResponse<DeviceAssignmentValidation>
export type BulkVehicleImportResponse = ServerResponse<BulkImportResult<Vehicle>>
export type BulkDriverImportResponse = ServerResponse<BulkImportResult<FleetDriver>>
export type BulkDeviceImportResponse = ServerResponse<BulkImportResult<FleetDevice>>
export type FleetDashboardResponse = ServerResponse<FleetDashboard>
export type DeliveryMetricsResponse = ServerResponse<DeliveryMetrics>
export type DispatchSearchResponse = ServerResponse<Record<string, unknown>>
export type FleetJobStatusResponse = ServerResponse<unknown>
export type FleetAnalyticsSummaryResponse = ServerResponse<FleetAnalyticsSummary>
export type FleetAnalyticsFleetStatusResponse = ServerResponse<FleetAnalyticsFleetStatus>
export type FleetAnalyticsJobPipelineResponse = ServerResponse<FleetAnalyticsJobPipeline>
export type FleetAnalyticsFuelLevelsResponse = ServerResponse<FleetAnalyticsFuelLevel[]>
export type FleetAnalyticsDriverScoresResponse = ServerResponse<FleetAnalyticsDriverScore[]>
export type FleetAnalyticsEventsResponse = ServerResponse<FleetAnalyticsEvent[]>
