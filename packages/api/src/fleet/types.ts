// ─── Shared ──────────────────────────────────────────────────────────────────

export type LatLng = {
  lat: number
  lng: number
}

export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'decommissioned'
export type VehicleType = 'truck' | 'van' | 'trailer'
export type FuelType = 'diesel' | 'petrol' | 'ev' | 'hybrid'

export type DeviceStatus =
  | 'registered'
  | 'configured'
  | 'assigned'
  | 'active'
  | 'faulty'
  | 'decommissioned'

export type DeviceLifecycleStatus =
  | 'registered'
  | 'config_pending'
  | 'configured'
  | 'verified_online'
  | 'assignable'
  | 'assigned'
  | 'faulty'
  | 'decommissioned'

export type DeviceLastSeenBucket = '5min' | '1hr' | '24hr' | '7day' | 'never'

export type DriverStatus = 'active' | 'available' | 'offline' | 'suspended' | 'inactive'
export type DriverCommunicationPreference = 'whatsapp' | 'sms' | 'email' | 'voice'

export type DeviceSetupRequestStatus =
  | 'pending_review'
  | 'in_progress'
  | 'provisioned'
  | 'assigned'
  | 'cancelled'

export type DeviceTrackerType = 'hardwired' | 'obd' | 'asset'

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
    status?: VehicleStatus
    assigned?: boolean
    type?: VehicleType
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

export type VehicleInput = {
  model: string
  plateNumber?: string
  registrationNumber?: string
  vin?: string
  make?: string
  year?: number
  type?: VehicleType
  fuelType?: FuelType
  capacity?: number
  status?: VehicleStatus
}

export type CreateVehiclePayload = {
  data: VehicleInput
}

export type UpdateVehiclePayload = {
  id: string
  data: Partial<VehicleInput>
}

export type ImportVehiclesPayload = {
  data: {
    items: VehicleInput[]
  }
}

export type UpdateVehicleStatusPayload = {
  id: string
  data: {
    status: VehicleStatus
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
    firmwareVersion: string
    installedAt?: string
  }
}

// ─── Devices ──────────────────────────────────────────────────────────────────

export type DevicesQuery = {
  params?: {
    query?: string
    manufacturer?: string
    status?: DeviceStatus
    lifecycleStatus?: DeviceLifecycleStatus
    assigned?: boolean
    lastSeenBucket?: DeviceLastSeenBucket
  }
}

export type DeviceInput = {
  imei: string
  manufacturer: string
  model: string
  firmwareVersion: string
  lifecycleStatus?: DeviceLifecycleStatus
}

export type CreateDevicePayload = {
  data: DeviceInput
}

export type UpdateDevicePayload = {
  id: string
  data: {
    manufacturer?: string
    model?: string
    firmwareVersion?: string
    lifecycleStatus?: DeviceLifecycleStatus
    signalStrength?: number | null
    batteryLevel?: number | null
    lastSeen?: string | null
  }
}

export type GeofenceShape = 'CIRCLE' | 'POLYGON'

export type GeofenceSchedule = {
  enabled: boolean
  timezone: string | null
  days: string[]
  startTime: string | null
  endTime: string | null
}

export type GeofenceSpeedLimit = {
  enabled?: boolean
  limitKph?: number | null
}

export type GeofenceCenter = {
  latitude: number
  longitude: number
}

export type GeofencePayload = {
  name: string
  coordinates: number[][]
  description?: string | null
  zoneType?: string
  shape?: GeofenceShape
  center?: GeofenceCenter | null
  radiusMeters?: number | null
  category?: string
  entryAlertsEnabled?: boolean
  exitAlertsEnabled?: boolean
  dwellAlertsEnabled?: boolean
  dwellMinutes?: number | null
  speedLimit?: GeofenceSpeedLimit
  schedule?: Partial<GeofenceSchedule>
  assignedVehicleIds?: string[]
}

export type Geofence = {
  id: string
  tenantId: string
  name: string
  description: string
  zoneType: string
  shape: GeofenceShape
  center: GeofenceCenter | null
  coordinates: number[][]
  radiusMeters: number | null
  status: GeofenceStatus
  category: string
  alerts: {
    entry: boolean
    exit: boolean
    dwell: boolean
    dwellMinutes: number | null
    speedLimit: GeofenceSpeedLimit
  }
  schedule: GeofenceSchedule
  assignedVehicleIds: string[]
  createdAt: string
  updatedAt: string
}

export type GeofenceStatus = 'ACTIVE' | 'ARCHIVED'

export type GeofencesQuery = { params?: { status?: GeofenceStatus } }
export type CreateGeofencePayload = { data: GeofencePayload }
export type UpdateGeofencePayload = {
  id: string
  data: Partial<GeofencePayload> & { status?: GeofenceStatus }
}
export type SetGeofenceVehiclesPayload = {
  id: string
  data: { vehicleIds: string[] }
}

export type CreateDeviceSetupRequestPayload = {
  data: {
    manufacturer: string
    model?: string
    trackerType: DeviceTrackerType
    quantity?: number
    simRequired?: boolean
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
    items: Array<Omit<DeviceInput, 'firmwareVersion'> & { firmwareVersion?: string }>
  }
}

export type UpdateDeviceLifecyclePayload = {
  id: string
  data: {
    lifecycleStatus: DeviceLifecycleStatus
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
    status?: DeviceSetupRequestStatus
  }
}

export type UpdateDeviceSetupRequestStatusPayload = {
  id: string
  data: {
    status: DeviceSetupRequestStatus
    note?: string
  }
}

// ─── SIM catalog ──────────────────────────────────────────────────────────────

export type SimCarrier = {
  id: string
  name: string
  code: string
  status: string
}

export type SimDataBundle = {
  id: string
  carrierId: string
  name: string
  planType: string
  dataAllowanceMb: number | null
  priceNgn: number
  status: string
}

export type DataBundlesQuery = {
  params?: {
    carrierId?: string
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
    status?: DriverStatus
    assigned?: boolean
  }
}

export type DriverInput = {
  licenseNumber: string
  name?: string
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  licenseExpiryDate?: string
  status?: DriverStatus
  communicationPreference?: DriverCommunicationPreference
}

export type CreateDriverPayload = {
  data: DriverInput
}

export type UpdateDriverPayload = {
  id: string
  data: Partial<DriverInput>
}

export type ImportDriversPayload = {
  data: {
    items: Array<DriverInput & {
      contactChannels?: {
        whatsappNumber?: string | null
        smsNumber?: string | null
        voiceNumber?: string | null
      }
    }>
  }
}

export type UpdateDriverStatusPayload = {
  id: string
  data: {
    status: DriverStatus
  }
}

export type UpdateDriverContactChannelsPayload = {
  id: string
  data: {
    whatsappNumber?: string | null
    smsNumber?: string | null
    voiceNumber?: string | null
  }
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export type DispatchSearchQuery = {
  params?: {
    query?: string
    vehicleStatus?: 'active' | 'inactive'
    driverStatus?: DriverStatus
    jobStatus?: string
    assignedOnly?: boolean
  }
}

export type RecommendDriversQuery = {
  params?: {
    requiredCapacity?: number
    vehicleType?: VehicleType
    pickupLat?: number
    pickupLng?: number
    limit?: number
  }
}

export type RecommendedDriver = {
  driverId: string
  driverName: string
  status: string
  assignedVehicleId: string | null
  vehicle: {
    id: string
    plateNumber: string
    type: string | null
    capacity: number | null
    status: string
  } | null
  score: number
  distanceKm: number | null
  reasons: string[]
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type AlertsQuery = {
  params?: {
    status?: 'open' | 'acknowledged' | 'resolved' | 'escalated'
    type?: string
    vehicleId?: string
  }
}

export type AlertActionPayload = {
  id: string
  params?: {
    by?: string
  }
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ExportReportPayload = {
  entity: string
}

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export type FuelTransactionInput = {
  vehicleId: string
  liters: number
  pricePerLiter: number
  driverId?: string | null
  vehicleType?: string | null
  fuelType?: FuelType | null
  station?: string | null
  odometer?: number | null
}

export type RecordFuelTransactionPayload = {
  data: FuelTransactionInput
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
  data: Partial<FuelTransactionInput>
}

export type FuelBudgetPeriodType = 'daily' | 'weekly' | 'monthly'

export type FuelMetricsQuery = {
  params?: {
    period?: FuelBudgetPeriodType
    from?: string
    to?: string
  }
}

export type FuelBudgetVsActualQuery = {
  params?: {
    from?: string
    to?: string
  }
}

export type FuelBudget = {
  id: string
  vehicleId: string
  scope: 'vehicle' | 'fleet'
  periodType: FuelBudgetPeriodType
  amountNgn: number
}

/** Use `vehicleId: 'all'` for the fleet-wide budget. */
export type UpsertFuelBudgetPayload = {
  vehicleId: string
  data: {
    periodType: FuelBudgetPeriodType
    amountNgn: number
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
    status?: MaintenanceRecordStatus
    priority: MaintenanceRecordPriority
    scheduledDate?: string | null
    completedDate?: string | null
    technician?: string | null
    notes?: string | null
    cost?: number | null
    currency?: string
  }
}

export type UpdateMaintenanceRecordPayload = {
  id: string
  data: Partial<CreateMaintenanceRecordPayload['data']> & {
  }
}

export type MaintenanceRecordActionPayload = {
  id: string
}

// `POST /maintenance/reminders/send` takes no body.

export type MaintenanceProfileLifecycleStatus = 'overdue' | 'due' | 'upcoming' | 'completed'
export type MaintenanceProfileIntervalType = 'date' | 'mileage' | 'both' | 'months'
export type MaintenanceProfileMileageSource = 'telemetry' | 'manual'

export type MaintenanceProfilesQuery = {
  params?: {
    vehicleId?: string
    lifecycleStatus?: MaintenanceProfileLifecycleStatus
    nextDueDateFrom?: string
    nextDueDateTo?: string
    currentMileageMin?: number
    currentMileageMax?: number
  }
}

export type CreateMaintenanceProfilePayload = {
  data: {
    vehicleId: string
    serviceType: string
    serviceLabel: string
    intervalType: MaintenanceProfileIntervalType
    mileageSource: MaintenanceProfileMileageSource
    intervalDays?: number | null
    intervalMonths?: number | null
    intervalKm?: number | null
    lastServiceDate?: string | null
    lastServiceMileage?: number | null
    currentMileage?: number | null
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
    entityType: 'job' | 'vehicle' | 'driver'
    entityId: string
    docType: 'pod' | 'invoice' | 'permit' | 'other'
    uploadedBy?: string
  }
}

export type DocumentDownloadUrlQuery = {
  id: string
  params?: {
    userId?: string
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

// ponytail: the OpenAPI response has no schema; tighten this when the server publishes one.
export type AuditChainVerificationResponse = ServerResponse<unknown>

// ─── Analytics ────────────────────────────────────────────────────────────────

export type FleetAnalyticsPeriodDays = 7 | 30 | 60 | 90

/** `fleet-status`, `fuel-levels` and `vehicle-safety-radar` accept a different set. */
export type FleetAnalyticsShortPeriodDays = 1 | 2 | 7 | 30 | 90

export type FleetAnalyticsPeriodQuery = {
  params?: {
    period_days?: FleetAnalyticsPeriodDays
  }
}

export type FleetAnalyticsShortPeriodQuery = {
  params?: {
    period_days?: FleetAnalyticsShortPeriodDays
  }
}

export type VehicleSafetyRadar = {
  braking: number
  acceleration: number
  speedControl: number
  cornering: number
  periodDays: number
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
    periodMonths?: number
    from?: string
    to?: string
    search?: string
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
    periodMonths?: number
    from?: string
    to?: string
  }
}

export type FleetFinancialStatementQuery = {
  params?: {
    periodMonths?: number
    title?: string
    companyName?: string
    preparedBy?: string
    notes?: string
    accentColor?: string
    includeCoverPage?: boolean
    includeFleetSummary?: boolean
    includePerVehicleBreakdown?: boolean
  }
}

export type FleetFinancialStatementExportFormat = 'pdf' | 'csv' | 'xlsx'

export type FleetFinancialStatementExportQuery = {
  params?: FleetFinancialStatementQuery['params'] & {
    format?: FleetFinancialStatementExportFormat
  }
}

export type FleetFinancialConfigActionPayload = {
  vehicleId: string
}

export type DriverWageAllocationMethod = 'fixed_monthly' | 'per_trip' | 'per_kilometer' | 'hybrid'
export type DepreciationMethod = 'straight_line' | 'declining_balance'

export type UpdateFleetFinancialConfigPayload = {
  vehicleId: string
  data: {
    monthlyWagesNgn?: number | null
    monthlyInsuranceNgn?: number | null
    monthlyDepreciationNgn?: number | null
    monthlyParkingNgn?: number | null
    monthlyOtherNgn?: number | null
    fuelEstimateNgnPerMonth?: number | null
    maintenanceEstimateNgnPerMonth?: number | null
    driverWageAllocationMethod?: DriverWageAllocationMethod | null
    monthlyDriverWageNgn?: number | null
    assetPurchasePriceNgn?: number | null
    assetPurchaseDate?: string | null
    assetUsefulLifeMonths?: number | null
    assetSalvageValueNgn?: number | null
    depreciationMethod?: DepreciationMethod | null
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

export type VehicleTrip = {
  from?: string
  to?: string
  date?: string
  distanceKm?: number
  durationMinutes?: number
  status?: string
}

export type Vehicle = {
  id: string
  registrationNumber: string
  plateNumber: string
  vin: string | null
  make: string | null
  model: string
  year: number | null
  type: VehicleType | null
  fuelType?: FuelType | null
  capacity: number | null
  tenantId: string
  status: VehicleStatus
  assignedDriverId: string | null
  assignedDriverName?: string | null
  fuelLevelPercent?: number | null
  gpsDevice: VehicleGpsDevice | null
  devices?: FleetDevice[]
  maintenanceRecords?: MaintenanceRecord[]
  trips?: VehicleTrip[]
}

export type VehicleHealth = {
  vehicleId: string
  plateNumber: string
  model: string
  assignedDriverId: string | null
  deviceId: string | null
  /** Unix millis. */
  lastSeen: number | null
  healthy: boolean
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

export type DeviceProvisionStatus = 'pending' | 'registered' | 'failed'

export type FleetDevice = {
  id: string
  imei: string
  manufacturer: string
  model: string
  firmwareVersion: string
  tenantId: string
  status: DeviceStatus
  lifecycleStatus: DeviceLifecycleStatus
  vehicleId: string | null
  signalStrength: number | null
  batteryLevel: number | null
  lastSeen: string | null
  assignedAt: string | null
  traccarDeviceId: string | null
  provisionStatus: DeviceProvisionStatus
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
  status: DeviceStatus
  lifecycleStatus: DeviceLifecycleStatus
  vehicleId: string | null
  vehicleRegistrationNumber: string | null
  vehicleStatus: 'active' | 'inactive' | null
  signalStrength: number | null
  batteryLevel: number | null
  lastSeen: string | null
  assignedAt: string | null
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

export type FleetAlertStats = {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  bySeverity: Record<string, number>
  meanTimeToResolveMs: number | null
}

export type FuelRecord = {
  id: string
  tenantId: string
  vehicleId: string
  driverId: string | null
  vehicleType: string | null
  fuelType: 'diesel' | 'petrol' | string
  liters: number
  pricePerLiter: number
  totalCost: number
  station: string | null
  odometer: number | null
  recordedAt: string
  recordedBy: string
  deletedAt: string | null
  vehiclePlateNumber: string | null
  driverName: string | null
  auditTrail: Array<{ at: string; by: string; action: string }>
}

export type FuelConsumptionBucket = {
  label: string
  liters: number
  totalCost: number
  records: number
  byFuelType: Record<string, {
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
  vehicleRegistrationNumber?: string | null
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
  serviceLabel: string
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

export type FleetDocumentAccessLogEntry = {
  id: string
  docId: string
  action: 'upload' | 'download'
  userId: string
  ip: string
  at: string
}

export type FleetAuditLogEntry = {
  id: string
  tenantId: string
  entityType: 'job' | 'vehicle' | 'driver' | 'device' | 'fuel' | 'alert' | 'document' | 'geofence'
  entityId: string
  action: string
  actorId: string
  metadata: Record<string, unknown>
  occurredAt: string
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
  vehicles: {
    total: number
    active: number
    inactive: number
    assigned: number
    seenInLastHour: number
  }
  drivers: {
    total: number
    active: number
    inactive: number
    assigned: number
  }
  jobs: {
    total: number
    byStatus: Record<string, number>
  }
  alerts: {
    open: number
    escalated: number
  }
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
  periodDays: number
}

export type FleetAnalyticsJobPipeline = {
  total: number
  byStatus: Record<string, number>
  periodDays: number
}

export type FleetAnalyticsFuelLevel = {
  vehicleId: string
  plateNumber: string
  fuelLevelPercent: number | null
  lastUpdated: string | null
}

/** `/analytics/fuel-levels` wraps the list — it is not a bare array. */
export type FleetAnalyticsFuelLevels = {
  periodDays: number
  vehicles: FleetAnalyticsFuelLevel[]
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

export type FleetCostBreakdown = {
  fuel: number
  maintenance: number
  wages: number
  insurance: number
  depreciation: number
  other: number
}

export type FleetProfitabilityTier = 'excellent' | 'good' | 'marginal' | 'loss_making'

export type FleetTierDistribution = Record<FleetProfitabilityTier, number>

export type FleetFinancialSummary = {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  avgMarginPercent: number
  avgScore: number
  vehicleCount: number
  costBreakdown: FleetCostBreakdown
  tierDistribution: FleetTierDistribution
}

export type FleetProfitabilityVehicle = {
  vehicleId: string
  plateNumber: string
  name: string
  revenue: number
  fuelCost: number
  maintenanceCost: number
  fixedCosts: number
  totalCost: number
  profit: number
  marginPercent: number
  tier: FleetProfitabilityTier
  status: FleetProfitabilityTier
  score: number
  costBreakdown: FleetCostBreakdown
  jobCount: number
  kmDriven: number
}

export type FleetFinancialStatement = {
  generatedAt: string
  periodMonths: number
  summary: FleetFinancialSummary
  vehicles: FleetProfitabilityVehicle[]
}

export type FleetFinancialConfig = {
  id: string
  tenantId: string
  vehicleId: string
  monthlyWagesNgn: number | null
  monthlyInsuranceNgn: number | null
  monthlyDepreciationNgn: number | null
  monthlyParkingNgn: number | null
  monthlyOtherNgn: number | null
  fuelEstimateNgnPerMonth: number | null
  maintenanceEstimateNgnPerMonth: number | null
  driverWageAllocationMethod: DriverWageAllocationMethod | null
  monthlyDriverWageNgn: number | null
  assetPurchasePriceNgn: number | null
  assetPurchaseDate: string | null
  assetUsefulLifeMonths: number | null
  assetSalvageValueNgn: number | null
  depreciationMethod: DepreciationMethod | null
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
export type FleetAlertResponse = ServerResponse<FleetAlert>
export type FleetAlertListResponse = ServerResponse<FleetAlert[]>
export type AlertStatsResponse = ServerResponse<FleetAlertStats>
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
/** Deletes and "send reminders" routes reply with the standard envelope. */
export type MaintenanceStatusResponse = ServerResponse<Record<string, unknown> | null>
export type ReminderSendResponse = ServerResponse<{ queued: number; message: string }>
export type FleetDocumentResponse = ServerResponse<FleetDocument>
export type FleetDocumentListResponse = ServerResponse<FleetDocument[]>
export type DownloadUrlResponse = ServerResponse<FleetDownloadUrl>
export type AccessLogListResponse = ServerResponse<FleetDocumentAccessLogEntry[]>
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
export type DispatchSearchResult = {
  vehicles: Vehicle[]
  drivers: FleetDriver[]
}
export type DispatchSearchResponse = ServerResponse<DispatchSearchResult>
export type FleetAnalyticsSummaryResponse = ServerResponse<FleetAnalyticsSummary>
export type FleetAnalyticsFleetStatusResponse = ServerResponse<FleetAnalyticsFleetStatus>
export type FleetAnalyticsJobPipelineResponse = ServerResponse<FleetAnalyticsJobPipeline>
export type FleetAnalyticsFuelLevelsResponse = ServerResponse<FleetAnalyticsFuelLevels>
export type FleetAnalyticsDriverScoresResponse = ServerResponse<FleetAnalyticsDriverScore[]>
export type FleetAnalyticsEventsResponse = ServerResponse<FleetAnalyticsEvent[]>
export type FleetFinancialSummaryResponse = ServerResponse<FleetFinancialSummary>
export type FleetProfitabilityResponse = ServerResponse<FleetProfitabilityVehicle[]>
export type FleetFinancialConfigResponse = ServerResponse<FleetFinancialConfig>
export type FleetFinancialConfigListResponse = ServerResponse<FleetFinancialConfig[]>
export type FleetFinancialStatementResponse = ServerResponse<FleetFinancialStatement>
export type SimCarrierListResponse = ServerResponse<SimCarrier[]>
export type SimDataBundleListResponse = ServerResponse<SimDataBundle[]>
export type RecommendedDriverListResponse = ServerResponse<RecommendedDriver[]>
export type VehicleSafetyRadarResponse = ServerResponse<VehicleSafetyRadar>
export type FuelBudgetListResponse = ServerResponse<FuelBudget[]>
export type FuelBudgetResponse = ServerResponse<FuelBudget>
export type VehicleHealthResponse = ServerResponse<VehicleHealth>
export type VehicleHealthListResponse = ServerResponse<VehicleHealth[]>
export type FleetAuditLogResponse = ServerResponse<FleetAuditLogEntry[]>

export type IntegrationHealthEntry = {
  source: string
  lastReceived: string | null
  successCount: number
  failureCount: number
  healthy: boolean
}
export type IntegrationHealthResponse = ServerResponse<IntegrationHealthEntry[]>
/** Archive / soft-delete routes reply with an envelope whose `data` may be null. */
export type FleetArchiveResponse = ServerResponse<Record<string, unknown> | null>

// ─── Compliance ───────────────────────────────────────────────────────────────

export type ComplianceDocument = {
  id: string
  tenantId: string
  vehicleId: string | null
  documentType: string
  documentName: string
  issueDate: string | null
  expiryDate: string | null
  reminderDays: number
  fileUrl: string | null
  fileSize: number | null
  notes: string | null
  status: ComplianceDocumentStatus
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

export type ComplianceDocumentStatus = 'valid' | 'expiring' | 'expired'

export type ComplianceDocumentsQuery = {
  params?: {
    vehicleId?: string
    documentType?: string
    status?: ComplianceDocumentStatus
    search?: string
  }
}

export type ComplianceDocumentHistoryQuery = {
  params?: {
    vehicleId?: string
    documentType?: string
  }
}

export type CreateComplianceDocumentPayload = {
  vehicleId?: string | null
  documentName: string
  documentType: string
  issueDate?: string | null
  expiryDate?: string | null
  reminderDays?: number
  fileUrl?: string | null
  fileSize?: number | null
  notes?: string | null
}

export type UpdateComplianceDocumentPayload = Partial<CreateComplianceDocumentPayload>

export type RenewComplianceDocumentPayload = {
  expiryDate?: string
  fileUrl?: string
  fileSize?: number
}

export type ComplianceDocumentResponse = ServerResponse<ComplianceDocument>
export type ComplianceDocumentListResponse = ServerResponse<ComplianceDocument[]>
export type ComplianceDocumentSummaryResponse = ServerResponse<ComplianceDocumentSummary>
