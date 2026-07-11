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

export type GeofenceShape = 'CIRCLE' | 'POLYGON'

export type GeofenceSchedule = {
  enabled: boolean
  timezone: string
  days: string[]
  startTime: string
  endTime: string
}

export type GeofencePayload = {
  name: string
  description: string
  zoneType: string
  shape: GeofenceShape
  center: { latitude: number; longitude: number }
  coordinates: number[][]
  radiusMeters: number
  category: string
  entryAlertsEnabled: boolean
  exitAlertsEnabled: boolean
  dwellAlertsEnabled: boolean
  dwellMinutes: number
  speedLimit: { enabled: boolean; limitKph: number }
  schedule: GeofenceSchedule
  assignedVehicleIds: string[]
}

export type Geofence = {
  id: string
  tenantId: string
  name: string
  description: string
  zoneType: string
  shape: GeofenceShape
  center: { latitude: number; longitude: number }
  coordinates: number[][]
  radiusMeters: number
  status: 'ACTIVE' | 'ARCHIVED' | string
  category: string
  alerts: {
    entry: boolean
    exit: boolean
    dwell: boolean
    dwellMinutes: number
    speedLimit: { enabled: boolean; limitKph: number }
  }
  schedule: GeofenceSchedule
  assignedVehicleIds: string[]
  createdAt: string
  updatedAt: string
}

export type GeofencesQuery = { params?: { status?: 'ACTIVE' | 'ARCHIVED' } }
export type CreateGeofencePayload = { data: GeofencePayload }
export type UpdateGeofencePayload = { id: string; data: GeofencePayload }

export type CreateDeviceSetupRequestPayload = {
  data: {
    manufacturer: string
    model?: string
    trackerType: string
    quantity: number
    simRequired: boolean
    carrierId?: string
    planType?: string
    bundleId?: string
    vehicleId?: string
    state?: string
    city?: string
    preferredDate?: string
    preferredTime?: string
    useCase: string
    notes?: string
    organisationName?: string
    requestingEmail?: string
  }
}

export type UpdateDeviceFirmwarePayload = {
  id: string
  data: {
    firmwareVersion: string
  }
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

export type DeviceSetupRequestsQuery = {
  params?: {
    query?: string
    status?: 'pending_review' | 'in_progress' | 'provisioned' | 'assigned' | 'cancelled' | string
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

export type FuelBudgetVsActualQuery = {
  params?: {
    from?: string
    to?: string
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

export type MaintenanceProfileLifecycleStatus = 'overdue' | 'due' | 'upcoming' | 'completed'
export type MaintenanceProfileIntervalType = 'date' | 'mileage' | 'both' | 'months'
export type MaintenanceProfileMileageSource = 'telemetry' | 'manual' | string

export type MaintenanceProfilesQuery = {
  params?: {
    vehicleId?: string
    lifecycleStatus?: MaintenanceProfileLifecycleStatus
    nextDueDateFrom?: string
    nextDueDateTo?: string
    search?: string
  }
}

export type CreateMaintenanceProfilePayload = {
  data: {
    vehicleId: string
    serviceType: string
    serviceLabel?: string | null
    intervalType: MaintenanceProfileIntervalType
    intervalDays?: number | null
    intervalMonths?: number | null
    intervalKm?: number | null
    lastServiceDate?: string | null
    lastServiceMileage?: number | null
    currentMileage?: number | null
    mileageSource?: MaintenanceProfileMileageSource
    nextDueDate?: string | null
    nextDueMileage?: number | null
  }
}

export type MaintenanceProfileActionPayload = {
  id: string
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

export type FleetProfitabilityPayload = {
  data: {
    periodMonths: number
    search?: string
    status?: FleetProfitabilityTier
    marginFrom?: number
    marginTo?: number
    revenueFrom?: number
    revenueTo?: number
    netProfitFrom?: number
    netProfitTo?: number
    scoreFrom?: number
    scoreTo?: number
  }
}

export type FleetFinancialSummaryQuery = {
  params?: {
    from?: string
    to?: string
  }
}

export type FleetFinancialStatementExportFormat = 'pdf' | 'csv' | 'xlsx'

export type FleetFinancialStatementExportQuery = {
  params: {
    periodMonths: number
    format: FleetFinancialStatementExportFormat
    title?: string
    companyName?: string
    period?: string
    preparedBy?: string
    notes?: string
    accentColor?: string
    includeCoverPage?: boolean
    includeFleetSummary?: boolean
    includePerVehicleBreakdown?: boolean
  }
}

export type FleetFinancialConfigActionPayload = {
  vehicleId: string
}

export type UpdateFleetFinancialConfigPayload = {
  vehicleId: string
  data: {
    fuelEstimateNgnPerMonth?: number
    maintenanceEstimateNgnPerMonth?: number
    monthlyWagesNgn?: number
    monthlyInsuranceNgn?: number
    monthlyDepreciationNgn?: number
    monthlyOtherNgn?: number
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
  byFuelType?: Record<string, {
    liters: number
    totalCost: number
    records: number
  }>
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

export type FuelSummary = {
  totalLitres: number
  totalCostNgn: number
  avgPricePerLitre: number
  transactionCount: number
}

export type FuelBudgetVsActualItem = {
  vehicleId: string
  periodType: string
  budgetedNgn: number
  actualNgn: number
  variance: number
  utilizationPct: number
}

export type FuelBudgetVsActual = {
  windowStart: string
  windowEnd: string
  windowDays: number
  vehicles: FuelBudgetVsActualItem[]
  fleet: FuelBudgetVsActualItem
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

export type MaintenanceProfile = {
  id: string
  tenantId: string
  vehicleId: string
  serviceType: string
  serviceLabel: string | null
  intervalType: MaintenanceProfileIntervalType
  intervalDays: number | null
  intervalMonths: number | null
  intervalKm: number | null
  lastServiceDate: string | null
  lastServiceMileage: number | null
  currentMileage: number | null
  mileageSource: MaintenanceProfileMileageSource
  nextDueDate: string | null
  nextDueMileage: number | null
  createdAt: string
  updatedAt: string
  lifecycleStatus: MaintenanceProfileLifecycleStatus
}

export type MaintenanceProfilesSummary = {
  total: number
  overdue: number
  due: number
  upcoming: number
  completed: number
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

export type DeviceSetupRequestTimelineItem = {
  status: string
  at: string
  note: string | null
}

export type DeviceSetupRequest = {
  id: string
  tenantId: string
  requestedByUserId: string
  organisationName: string
  requestingEmail: string
  manufacturer: string
  model: string
  trackerType: string
  quantity: number
  simRequired: boolean
  carrierId: string | null
  planType: string | null
  bundleId: string | null
  vehicleId: string | null
  state: string | null
  city: string | null
  preferredDate: string | null
  preferredTime: string | null
  useCase: string | null
  notes: string | null
  status: string
  timeline: DeviceSetupRequestTimelineItem[]
  createdAt: string
  updatedAt: string
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

export type FleetFinancialSummary = {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  avgMarginPercent: number
  avgScore?: number
  vehicleCount: number
  costBreakdown?: {
    fuel: number
    maintenance: number
    wages: number
    insurance: number
    depreciation: number
    other?: number
  }
}

export type FleetProfitabilityTier = 'excellent' | 'good' | 'marginal' | 'loss-making' | string

export type FleetProfitabilityVehicle = {
  vehicleId: string
  plateNumber: string
  name?: string
  make?: string | null
  model?: string | null
  kmDriven?: number
  revenue: number
  fuelCost: number
  maintenanceCost: number
  fixedCosts: number
  totalCost: number
  profit: number
  marginPercent: number
  tier: FleetProfitabilityTier
  score: number
  costBreakdown: {
    fuel?: number
    maintenance?: number
    wages?: number
    insurance?: number
    depreciation?: number
    other?: number
    [key: string]: number | undefined
  }
  jobCount: number
}

export type FleetFinancialConfig = {
  id: string
  tenantId: string
  vehicleId: string
  fuelEstimateNgnPerMonth?: number
  maintenanceEstimateNgnPerMonth?: number
  monthlyWagesNgn: number
  monthlyInsuranceNgn: number
  monthlyDepreciationNgn: number
  monthlyOtherNgn: number
  createdAt: string
  updatedAt: string
}

import type { ServerResponse } from '../lib/types'

// ─── Response envelopes ───────────────────────────────────────────────────────

export type VehicleResponse = ServerResponse<Vehicle>
export type VehicleListResponse = ServerResponse<Vehicle[]>
export type GeofenceResponse = ServerResponse<Geofence>
export type GeofenceListResponse = ServerResponse<Geofence[]>
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
export type FuelSummaryResponse = ServerResponse<FuelSummary>
export type FuelBudgetVsActualResponse = ServerResponse<FuelBudgetVsActual>
export type MaintenanceRecordResponse = ServerResponse<MaintenanceRecord>
export type MaintenanceRecordListResponse = ServerResponse<MaintenanceRecord[]>
export type MaintenanceRecordsSummaryResponse = ServerResponse<MaintenanceRecordsSummary>
export type MaintenanceProfileResponse = ServerResponse<MaintenanceProfile>
export type MaintenanceProfileListResponse = ServerResponse<MaintenanceProfile[]>
export type MaintenanceProfilesSummaryResponse = ServerResponse<MaintenanceProfilesSummary>
export type MaintenanceServiceCategoriesResponse = ServerResponse<string[]>
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
export type DeviceSetupRequestResponse = ServerResponse<DeviceSetupRequest>
export type DeviceSetupRequestListResponse = ServerResponse<DeviceSetupRequest[]>
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
export type FleetFinancialSummaryResponse = ServerResponse<FleetFinancialSummary>
export type FleetProfitabilityResponse = ServerResponse<FleetProfitabilityVehicle[]>
export type FleetFinancialConfigResponse = ServerResponse<FleetFinancialConfig>

// ─── Compliance ───────────────────────────────────────────────────────────────

export type ComplianceDocument = {
  id: string
  tenantId: string
  vehicleId: string | null
  documentType: string
  documentName: string
  documentNumber?: string
  issueDate: string | null
  expiryDate: string | null
  reminderDays: number
  fileUrl: string | null
  fileSize: number | null
  notes: string | null
  status: 'valid' | 'expiring' | 'expired'
  createdAt: string
  updatedAt: string
}

export type ComplianceDocumentSummary = {
  total: number
  valid: number
  expiringSoon: number
  expired: number
  complianceRatePercent: number
}

export type ComplianceDocumentsQuery = {
  params?: { vehicleId?: string; documentType?: string; status?: string; search?: string }
}

export type CreateComplianceDocumentPayload = {
  vehicleId?: string | null
  documentName: string
  documentType: string
  documentNumber?: string
  issueDate?: string | null
  expiryDate?: string | null
  reminderDays?: number
  fileUrl?: string | null
  fileSize?: number | null
  notes?: string | null
}

export type UpdateComplianceDocumentPayload = Partial<CreateComplianceDocumentPayload>

export type ComplianceDocumentResponse = ServerResponse<ComplianceDocument>
export type ComplianceDocumentListResponse = ServerResponse<ComplianceDocument[]>
export type ComplianceDocumentSummaryResponse = ServerResponse<ComplianceDocumentSummary>
