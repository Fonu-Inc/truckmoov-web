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
  | 'suspended'
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

// GET /fleet/vehicles now accepts a `tabs` request header. No header (or
// `tabs: vehicles`) returns the vehicle list unchanged; other values return a
// tab-specific summary. Server silently falls back to the vehicles list on
// unknown values — always trust the echoed `response.tab`, not the value sent.
// The header path is a page-shell convenience: filtering/pagination still go
// to the per-resource endpoints (`/fleet/maintenance/…`, `/fleet/fuel/…`, …).
export type VehiclesTab = 'vehicles' | 'maintenance' | 'fuel' | 'compliance' | 'financials' | 'analytics'

// ponytail: unknown-typed payloads until the live shapes come back — see
// getVehiclesByTab / plan file. Tighten these once the server response is in.
export type MaintenanceTabPayload = { summary: unknown, items: unknown[] }
export type FuelTabPayload = { summary: unknown, items: unknown[] }
export type ComplianceTabPayload = { summary: unknown, items: unknown[] }
// financials + analytics return summary only — no `items` per the endpoint contract.
export type FinancialsTabPayload = { summary: unknown }
export type AnalyticsTabPayload = { summary: unknown }

export type VehiclesTabResponse<T extends VehiclesTab> =
  T extends 'vehicles' ? VehicleListResponse & { tab?: 'vehicles' } :
    T extends 'maintenance' ? { status: boolean, message: string, tab: 'maintenance', data: MaintenanceTabPayload } :
      T extends 'fuel' ? { status: boolean, message: string, tab: 'fuel', data: FuelTabPayload } :
        T extends 'compliance' ? { status: boolean, message: string, tab: 'compliance', data: ComplianceTabPayload } :
          T extends 'financials' ? { status: boolean, message: string, tab: 'financials', data: FinancialsTabPayload } :
            T extends 'analytics' ? { status: boolean, message: string, tab: 'analytics', data: AnalyticsTabPayload } :
              never

export type NearestVehiclesQuery = {
  params: {
    lat: number
    lng: number
    limit?: number
  }
}

export type CapacityUnit = 'kg' | 'lb' | 'tons' | 'm3' | 'pallets'

export type CapacityUnitInfo = {
  value: CapacityUnit
  label: string
  measures: 'weight' | 'volume' | 'count'
}

export type CapacityUnitsResponse = ServerResponse<{
  units: CapacityUnitInfo[]
  default: CapacityUnit
}>

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
  capacityUnit?: CapacityUnit
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
  file: File
  // Reuse the same key when retrying the same file so the server can dedupe.
  idempotencyKey: string
}

export type VehicleImportColumn = {
  header: string
  required: boolean
  example: string
  note?: string
}

export type VehicleImportColumnsResponse = ServerResponse<{
  columns: VehicleImportColumn[]
}>

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
    /** Includes the two non-lifecycle statuses from TRU-FE-4 § 3: `unassigned` = vehicleId is null; `unregistered` = provisionStatus != "registered". */
    status?: DeviceStatus | 'unassigned' | 'unregistered'
    lifecycleStatus?: DeviceLifecycleStatus
    assigned?: boolean
    lastSeenBucket?: DeviceLastSeenBucket
  }
}

export type DeviceInput = {
  imei: string
  /** Optional Device Name (TRU-FE-4 § 6). Falls back to `manufacturer + model` in listings when null. */
  name?: string | null
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
    /** TRU-FE-4 § 6 — Device Name (optional). */
    name?: string | null
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
  /** TRU-FE-6 §7: vehicles inside the zone right now (not the assigned ones). */
  vehiclesInside?: number
  /** Detail only. */
  occupants?: { vehicleId: string, enteredAt: string }[]
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

export type SuspendDevicePayload = { id: string, data?: { reason?: string } }
export type ReinstateDevicePayload = { id: string }

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

// TRU-FE-3 § 1 — new filter bands and preferred-channel filter.
export type DriverScoreBand = 'excellent' | 'strong' | 'fair' | 'poor' | 'unscored'
export type DriverTripBand = '0' | '1-50' | '51-200' | '201-500' | '500+'

export type DriversQuery = {
  params?: {
    query?: string
    status?: DriverStatus
    assigned?: boolean
    scoreBand?: DriverScoreBand
    tripBand?: DriverTripBand
    preferredChannel?: DriverCommunicationPreference
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

// TRU-FE-3 — pre-wire types. Endpoints are 404 today; shapes are best-guess per spec
// and get tightened when BE ships.

// § 2
export type DriversSummary = {
  total: number
  active: number
  available: number
  offline: number
  suspended: number
  allowance?: VehicleAllowance | null
}

// § 3
export type DriversFilterOption = { value: string, label: string }
export type DriversFilters = {
  scoreBands: DriversFilterOption[]
  tripBands: DriversFilterOption[]
  channels: DriversFilterOption[]
  statuses: DriversFilterOption[]
}

// § 5
export type SuspendDriverPayload = { id: string, data?: { reason?: string } }
export type ReinstateDriverPayload = { id: string }

// § 6
export type DriverConsentChannel = 'whatsapp' | 'sms'
export type DriverConsentState = 'opted_in' | 'opted_out' | 'pending' | 'unknown'
export type DriverConsentEntry = {
  state: DriverConsentState
  canSend: boolean
  source: string | null
  requestedAt: string | null
  respondedAt: string | null
}
export type DriverConsent = {
  whatsapp: DriverConsentEntry
  sms: DriverConsentEntry
}
export type RequestDriverConsentPayload = { id: string, channel: DriverConsentChannel }
export type PatchDriverConsentPayload = {
  id: string
  channel: DriverConsentChannel
  data: { state: 'opted_in' | 'opted_out', source: string }
}

// § 7
export type SendDriverMessagePayload = {
  id: string
  channel: DriverConsentChannel
  data: { message: string }
}
export type SendDriverMessageResult = {
  messageId?: string
  channel: DriverConsentChannel
  status: string
}

// § 8
export type DriverLicenseState = 'valid' | 'expiring' | 'expired' | 'unknown'
export type DriverLicense = {
  number: string | null
  expiryDate: string | null
  daysUntilExpiry: number | null
  state: DriverLicenseState
}
export type DriverScoreDimension = {
  key: string
  label: string
  weightPercent: number
  score: number | null
  events: number
}
export type DriverScoreBreakdown = {
  overall: number | null
  eventsRecorded: number
  windowDays: number
  dimensions: DriverScoreDimension[]
}
export type DriverDetailTrip = {
  id: string
  startedAt: string
  endedAt: string | null
  distanceKm: number | null
  onTime: boolean | null
}
export type DriverDetail = {
  driver: FleetDriver
  header: {
    behaviorScore: number | null
    fatigueScore: number | null
    alertCount: number
  }
  scoreBreakdown: DriverScoreBreakdown
  contact: {
    consent: DriverConsent
  }
  license: DriverLicense
  safety: Record<string, unknown>
  trips: DriverDetailTrip[]
}

// § 9
export type DriverBehaviorSeverity = 'low' | 'medium' | 'high' | 'critical'
// ponytail: the spec documents no response bodies for /fleet/drivers/behavior/*;
// these shapes are from dev responses (2026-10-01). Geofence alerts were empty there,
// so DriverGeofenceAlert is unverified.
export type DriverBehaviorSummary = {
  averageScore: number | null
  eventsLast24h: number
  criticalLast24h: number
  driversScored: number
  driversTotal: number
  zoneEntries: number
  zoneExits: number
  unreadGeofenceAlerts: number
  periodDays: number
}
export type DriverBehaviorCounts = {
  hardBrake: number
  hardAccel: number
  sharpTurn: number
  speeding: number
  total: number
  critical: number
}
export type DriverBehaviorScores = {
  overall: number | null
  braking: number
  acceleration: number
  cornering: number
  speed: number
  counts: DriverBehaviorCounts
}
/** Same bands as the roster's scoreBand; drivers with no events are `unscored`. */
export type DriverBehaviorBand = 'excellent' | 'strong' | 'fair' | 'poor' | 'unscored'
export type DriverBehaviorRankingItem = {
  driverId: string
  driverName: string
  /** Null for unscored drivers, who are listed after the scored ones. */
  rank: number | null
  eventsRecorded: number
  scores: DriverBehaviorScores
  band: DriverBehaviorBand
}
export type DriverBehaviorRanking = {
  periodDays: number
  weights: Record<string, number>
  items: DriverBehaviorRankingItem[]
}
export type DriverBehaviorEvent = {
  id: string
  driverId: string
  vehicleId: string | null
  severity: DriverBehaviorSeverity
  type: string
  speedKph: number | null
  latitude: number | null
  longitude: number | null
  occurredAt: string
}
export type DriverBehaviorEventsResult = {
  total: number
  criticalCount: number
  items: DriverBehaviorEvent[]
}
export type DriverBehaviorEventsQuery = {
  params?: {
    period_days?: number
    severity?: DriverBehaviorSeverity
    driverId?: string
    limit?: number
  }
}
export type DriverGeofenceAlert = {
  id: string
  vehicleId: string
  driverId: string | null
  geofenceId: string
  type: 'entry' | 'exit' | 'dwell'
  at: string
  read: boolean
}
export type DriverGeofenceAlertsResult = {
  total: number
  unread: number
  items: DriverGeofenceAlert[]
}
export type MarkGeofenceAlertsReadPayload = { data: { alertIds: string[] } }
export type MarkGeofenceAlertsReadResult = { markedRead: number, ignored: number }
export type DriverBehavior = {
  periodDays: number
  eventsRecorded: number
  scores: DriverBehaviorScores
  recentEvents: Omit<DriverBehaviorEvent, 'driverId' | 'vehicleId' | 'latitude' | 'longitude'>[]
}

// § 10
export type DriverFatigueDataQuality = 'partial' | 'good' | 'full'
export type DriverFatigueRiskLevel = 'low' | 'medium' | 'high' | 'critical'
/** One run of the fatigue model (also the POST …/fatigue/run response). Shapes verified on dev 2026-10-01. */
export type DriverFatigueAnalysis = {
  id: string
  driverId: string
  driverName: string
  score: number
  riskLevel: DriverFatigueRiskLevel
  drivingMinutes: number | null
  restCompliance: number | null
  indicators: string[]
  recommendations: string[]
  analysis: string
  dataQuality: DriverFatigueDataQuality
  analyzedAt: string
}
export type DriverFatigueSummary = {
  averageScore: number | null
  averageRestCompliance: number | null
  criticalAlerts: number
  highRiskAlerts: number
  totalAnalyses: number
  byRisk: Record<DriverFatigueRiskLevel, number>
  driversAnalyzed: number
  driversTotal: number
  recent: DriverFatigueAnalysis[]
}
export type DriverFatigue = {
  current: DriverFatigueAnalysis | null
  history: DriverFatigueAnalysis[]
}
export type RunDriverFatiguePayload = {
  id: string
  data?: { drivingMinutes?: number, breakMinutes?: number }
}

// § 4 companion (import/export)
export type DriverImportColumn = {
  header: string
  required: boolean
  example: string
  note?: string
}
export type DriverImportColumns = { columns: DriverImportColumn[] }

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
    /** Tonnes. Prefer requiredWeightKg, which wins when both are sent. */
    requiredCapacity?: number
    requiredWeightKg?: number
    vehicleType?: VehicleType
    pickupLat?: number
    pickupLng?: number
    limit?: number
  }
}

export type RecommendVehiclesQuery = {
  params?: {
    requiredWeightKg?: number
    vehicleType?: VehicleType
    fuelType?: string
    pickupLat?: number
    pickupLng?: number
    limit?: number
  }
}

/** GET /fleet/dispatch/recommend-vehicles row. Vehicles on an active job or in maintenance are ranked low, not left out. */
export type RecommendedVehicle = {
  vehicleId: string
  plateNumber: string
  make: string | null
  model: string | null
  type: string | null
  fuelType: string | null
  status: string
  capacityWeightKg: number | null
  score: number
  distanceKm: number | null
  reasons: string[]
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

export type ReportPeriod = 'daily' | 'weekly'
export type ReportTrendRange = 'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_year'

export type ReportsSummary = {
  period: { from: string, to: string }
  operations: { jobsCreated: number, jobsCompleted: number, jobsInProgress: number, jobsCancelled: number }
  fleet: { vehiclesAdded: number, driversAdded: number, vehiclesInMaintenance: number, activeVehicles: number, totalVehicles: number }
  administration: { documentsUploaded: number, driverCommunications: number, fuelEntries: number }
  revenueNgn: number
}

export type ReportsActivityTrendPoint = {
  label: string
  from: string
  to: string
  created: number
  completed: number
}

export type ReportVehicleTrip = {
  id: string
  reference: string
  status: string
  date: string
  vehicle: string | null
  driver: string | null
  from: string | null
  to: string | null
  amountNgn: number
}

export type VehicleActivity = {
  totals: { trips: number, completed: number, open: number, locationsServed: number, tripValueNgn: number }
  statuses: string[]
  items: ReportVehicleTrip[]
  page: number
  limit: number
  total: number
}

export type ReportsSummaryQuery = { params: { period: ReportPeriod } }
export type ReportsActivityTrendQuery = { params: { range: ReportTrendRange } }
export type VehicleActivityQuery = {
  params?: { search?: string, status?: string, page?: number, limit?: number }
}

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export type FuelTransactionInput = {
  vehicleId?: string
  /** Free-text registration; server rejects with `field: 'vehicleRegistration'` if unknown. */
  vehicleRegistration?: string
  liters: number
  pricePerLiter: number
  driverId?: string | null
  /** Free-text name; unknown name is silently accepted and stored driverless. */
  driverName?: string | null
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

export type FuelTransactionsQuery = {
  params?: {
    query?: string
    fuelType?: FuelType
    litresFrom?: number
    litresTo?: number
    totalFrom?: number
    totalTo?: number
    vehicleId?: string
    from?: string
    to?: string
  }
}

export type FuelWeeklyDay = {
  day: 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'
  /** Keyed by fuel type name. */
  litres: Record<string, number>
  totalLitres: number
}

export type FuelWeeklyAnalytics = {
  fuelTypes: string[]
  days: FuelWeeklyDay[]
}

export type FuelWeeklyAnalyticsResponse = ServerResponse<FuelWeeklyAnalytics>

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

/** Validated set — backend returns 400 for any other value. Absent/empty defaults to 30. */
export type FleetAnalyticsPeriodDays = 1 | 2 | 7 | 30 | 90

/** `fleet-status`, `fuel-levels` and `vehicle-safety-radar` accept the same set. */
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

/** Each axis is null when nothing was scored in the period. */
export type VehicleSafetyRadar = {
  braking: number | null
  acceleration: number | null
  speedControl: number | null
  cornering: number | null
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
    /** Canonical name for fleet totals section. `includeFleetSummary` is accepted as a deprecated alias. */
    includeSummary?: boolean
    /** Canonical name for per-vehicle P&L section. `includePerVehicleBreakdown` is accepted as a deprecated alias. */
    includeVehiclePL?: boolean
    /** Per-vehicle cost categories (fuel, maintenance, wages, insurance, depreciation, other). New in this release. */
    includeCostBreakdown?: boolean
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
  capacityUnit?: CapacityUnit | null
  capacityWeightKg?: number | null
  capacityVolumeM3?: number | null
  capacityPallets?: number | null
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

export type VehicleAllowance = {
  /** `null` means unlimited. */
  limit: number | null
  used: number
  remaining: number | null
  usedPercent: number | null
  unlimited: boolean
}

export type VehicleSummary = {
  total: number
  active: number
  inactive: number
  maintenance: number
  decommissioned: number
  allowance?: VehicleAllowance | null
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
  status: DriverStatus
  communicationPreference: DriverCommunicationPreference | null
  assignedVehicleId: string | null
  contactChannels: DriverContactChannels
  // TRU-FE-3 § 1 — server-driven enrichment fields. Null on legacy rows / no telemetry.
  behaviorScore?: number | null
  scoreBand?: DriverScoreBand | null
  trips?: number | null
  tripBand?: DriverTripBand | null
  preferredChannel?: DriverCommunicationPreference | null
  performanceScore?: number | null
  createdAt: string
  updatedAt: string
}

export type DeviceProvisionStatus = 'pending' | 'registered' | 'failed'

export type FleetDevice = {
  id: string
  imei: string
  /** Optional Device Name (TRU-FE-4 § 3). Null on legacy rows — fall back to `manufacturer + model`. */
  name?: string | null
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
  /** A tenant can reinstate only its own suspensions; a platform one stays until an admin lifts it. */
  suspendedBy?: 'tenant' | 'platform' | null
  suspendedAt?: string | null
  suspensionReason?: string | null
  preSuspensionLifecycleStatus?: DeviceLifecycleStatus | null
  createdAt: string
  updatedAt: string
}

// TRU-FE-4 § 1 — status cards + allowance bar
export type DevicesSummary = {
  total: number
  active: number
  registered: number
  assigned: number
  unassigned: number
  configured: number
  suspended: number
  allowance?: VehicleAllowance | null
}

// TRU-FE-4 § 2 — dropdown data
export type DevicesFilterOption = { value: string, label: string }
export type DevicesFilters = {
  statuses: DevicesFilterOption[]
  manufacturers: string[]
  lastSeen: DevicesFilterOption[]
}

// TRU-FE-4 § 5 — import format explainer JSON
export type DeviceImportColumn = {
  header: string
  required: boolean
  example: string
  note?: string
}
export type DeviceImportColumns = { columns: DeviceImportColumn[] }

// TRU-FE-4 § 7 — catalog dropdowns
export type DeviceCatalogManufacturers = { manufacturers: string[] }
export type DeviceCatalogModel = {
  manufacturer: string
  model: string
  protocol: string
  defaultPort: number
}
export type DeviceCatalogModels = { models: DeviceCatalogModel[] }

// TRU-FE-4 § 8 — tracker types
export type DeviceSetupRequestTrackerType = {
  value: DeviceTrackerType
  label: string
  description?: string
}
export type DeviceSetupRequestTrackerTypes = { trackerTypes: DeviceSetupRequestTrackerType[] }

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

export type BulkImportSkipped = {
  line: number
  message: string
}

export type BulkImportResult<T> = {
  created: number
  updated: number
  total: number
  records: T[]
  /** Rows the server could not import; partial success is normal. */
  skipped?: BulkImportSkipped[]
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

/** `unscored`: no revenue and no cost in the period; score is null and it is left out of avgScore. */
export type FleetProfitabilityTier = 'excellent' | 'good' | 'marginal' | 'loss_making' | 'unscored'

export type FleetTierDistribution = Record<FleetProfitabilityTier, number>

export type FleetFinancialSummary = {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  avgMarginPercent: number
  avgScore: number | null
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
  score: number | null
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
export type DevicesSummaryResponse = ServerResponse<DevicesSummary>
export type DevicesFiltersResponse = ServerResponse<DevicesFilters>
export type DeviceImportColumnsResponse = ServerResponse<DeviceImportColumns>
export type DeviceCatalogManufacturersResponse = ServerResponse<DeviceCatalogManufacturers>
export type DeviceCatalogModelsResponse = ServerResponse<DeviceCatalogModels>
export type DeviceSetupRequestTrackerTypesResponse = ServerResponse<DeviceSetupRequestTrackerTypes>
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
/** POST /fleet/compliance/reminders/send — mails the caller's expiring/expired documents. */
export type SendComplianceRemindersPayload = {
  data: { recipientEmail: string, leadDays?: MaintenanceReminderLeadDays }
}

export type ReminderSendResponse = ServerResponse<{
  queued: number
  message: string
  recipient?: string
  /** Vehicles due within the schedule's leadDays window right now. */
  dueInWindow?: number
}>

export type MaintenanceReminderLeadDays = 7 | 14 | 30 | 60 | 90

export type MaintenanceReminderSchedule = {
  recipientEmail: string
  leadDays: MaintenanceReminderLeadDays
  enabled: boolean
  lastRunAt: string | null
  lastSentCount: number | null
}

export type MaintenanceReminderScheduleResponse = ServerResponse<{
  schedule: MaintenanceReminderSchedule | null
  leadDayOptions: MaintenanceReminderLeadDays[]
}>

// ponytail: dueInWindow placement is from the TRU-FE-2 § 6 prose — POST /schedule 404s on
// dev-api (2026-09-23), so re-check the envelope once it deploys.
export type UpsertMaintenanceReminderScheduleResponse = ServerResponse<{
  schedule: MaintenanceReminderSchedule
  /** What the next run would cover right now (overdue work always included). */
  dueInWindow?: number
}>

export type UpsertMaintenanceReminderSchedulePayload = {
  data: {
    recipientEmail: string
    leadDays: MaintenanceReminderLeadDays
    enabled?: boolean
  }
}
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
// TRU-FE-3 pre-wire response envelopes.
export type DriversSummaryResponse = ServerResponse<DriversSummary>
export type DriversFiltersResponse = ServerResponse<DriversFilters>
export type DriverConsentResponse = ServerResponse<DriverConsent>
export type DriverConsentEntryResponse = ServerResponse<DriverConsentEntry>
export type SendDriverMessageResponse = ServerResponse<SendDriverMessageResult>
export type DriverDetailResponse = ServerResponse<DriverDetail>
export type DriverBehaviorSummaryResponse = ServerResponse<DriverBehaviorSummary>
export type DriverBehaviorRankingResponse = ServerResponse<DriverBehaviorRanking>
export type DriverBehaviorEventsResponse = ServerResponse<DriverBehaviorEventsResult>
export type DriverGeofenceAlertsResponse = ServerResponse<DriverGeofenceAlertsResult>
export type MarkGeofenceAlertsReadResponse = ServerResponse<MarkGeofenceAlertsReadResult>
export type DriverBehaviorResponse = ServerResponse<DriverBehavior>
export type DriverFatigueSummaryResponse = ServerResponse<DriverFatigueSummary>
export type DriverFatigueResponse = ServerResponse<DriverFatigue>
export type DriverFatigueRunResponse = ServerResponse<DriverFatigueAnalysis>
export type DriverImportColumnsResponse = ServerResponse<DriverImportColumns>
export type BulkDeviceImportResponse = ServerResponse<BulkImportResult<FleetDevice>>
export type FleetDashboardResponse = ServerResponse<FleetDashboard>
export type DeliveryMetricsResponse = ServerResponse<DeliveryMetrics>
export type ReportsSummaryResponse = ServerResponse<ReportsSummary>
export type ReportsActivityTrendResponse = ServerResponse<ReportsActivityTrendPoint[]>
export type VehicleActivityResponse = ServerResponse<VehicleActivity>
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
export type RecommendedVehicleListResponse = ServerResponse<RecommendedVehicle[]>
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
    issuedFrom?: string
    issuedTo?: string
    expiringFrom?: string
    expiringTo?: string
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

// ─── Overview ─────────────────────────────────────────────────────────────────

export type FleetOverviewCards = {
  totalVehicles: number
  totalJobs: number
  totalDrivers: number
  revenueThisMonthNgn: number
}

export type FleetOverviewMapWaypoint = {
  sequence: number
  type: 'pickup' | 'dropoff'
  address: string
  latitude: number
  longitude: number
}

export type FleetOverviewMapJob = {
  jobId: string
  reference: string
  status: string
  assignedDriverId: string | null
  assignedVehicleId: string | null
  waypoints: FleetOverviewMapWaypoint[]
  routeShape: string | null
  routeEncoding: string | null
}

export type FleetOverviewMap = {
  jobs: FleetOverviewMapJob[]
  counts: {
    activeDeliveries: number
    stops: number
    pickups: number
    dropoffs: number
  }
}

export type FleetOverviewJobItem = {
  id: string
  reference: string
  status: string
  pickupAddress: string
  dropoffAddress: string
  amountNgn: number
  createdAt: string
}

export type FleetOverviewVehicleItem = {
  id: string
  plateNumber: string
  make: string
  model: string
  year: number
  status: string
}

export type FleetOverviewDriverItem = {
  id: string
  name: string
  phone: string
  licenseNumber: string
  status: string
  performanceScore: number
}

export type FleetOverviewUtilizationRegion = {
  region: string
  inUse: number
  idle: number
  total: number
  utilizationPercent: number
}

export type FleetOverviewAlertItem = {
  id: string
  type: string
  severity: string
  status: string
  details: string
  vehicleId: string | null
  triggeredAt: string
}

export type FleetOverviewActivityItem = {
  id: string
  action: string
  entityType: string
  entityId: string
  summary: string
  occurredAt: string
}

export type FleetOverviewChatItem = {
  id: string
  contactName: string
  channel: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export type FleetOverview = {
  cards: FleetOverviewCards
  map: FleetOverviewMap
  jobs: { total: number; items: FleetOverviewJobItem[] }
  vehicles: { total: number; items: FleetOverviewVehicleItem[] }
  drivers: { total: number; items: FleetOverviewDriverItem[] }
  fleetUtilization: FleetOverviewUtilizationRegion[]
  alerts: {
    total: number
    thresholdHours: number
    items: FleetOverviewAlertItem[]
  }
  recentActivity: FleetOverviewActivityItem[]
  recentChats: FleetOverviewChatItem[]
  generatedAt: string
}

export type FleetOverviewResponse = ServerResponse<FleetOverview>

// ─── Live tracking (TRU-FE-6) ─────────────────────────────────────────────────
// ponytail: typed from the ticket spec — every /fleet/tracking/* route 404s on dev-api
// (probed 2026-09-23). Re-check field names once it deploys.

export type TrackingStatus = 'offline' | 'in_progress' | 'active' | 'idle'

export type TrackingCounts = Record<TrackingStatus, number>

export type TrackingPosition = {
  lat: number
  lng: number
  speedKph: number | null
  heading: number | null
  fixedAt: string
}

export type TrackingVehicle = {
  vehicleId: string
  plateNumber?: string | null
  registrationNumber?: string | null
  make?: string | null
  model?: string | null
  driverId?: string | null
  driverName?: string | null
  driverPhone?: string | null
  fuelLevelPercent?: number | null
  // The live payload sends `fuelLevel`; `fuelLevelPercent` is kept for older rows.
  fuelLevel?: number | null
  status: TrackingStatus
  /** Null until the vehicle has ever reported. */
  position: TrackingPosition | null
  /** Null when it isn't carrying an active job. */
  job: {
    id: string
    reference: string
    status: string
    pickupAddress?: string | null
    deliveryAddress?: string | null
    // The live payload sends `dropoffAddress`.
    dropoffAddress?: string | null
    deadline?: string | null
  } | null
}

export type TrackingSnapshot = {
  vehicles: TrackingVehicle[]
  /** Fleet-wide, computed before any search filter. */
  counts: TrackingCounts
  activeJobStatuses: string[]
  offlineAfterMinutes: number
  frameIntervalMs: number
  generatedAt: string
}

export type TrackingSnapshotResponse = ServerResponse<TrackingSnapshot>

export type TrackingVehiclesQuery = { params?: { query?: string } }

export type TrackingAlertsQuery = { params?: { limit?: number } }

export type TrackingAlert = {
  id: string
  type: string
  severity: string
  vehicleId?: string | null
  geofenceId?: string | null
  message?: string | null
  title?: string | null
  createdAt: string
}

export type TrackingAlertsResponse = ServerResponse<{ total: number, items: TrackingAlert[] }>

export type ShareVehicleLocationPayload = { id: string }

export type VehicleLocationShare = {
  /** Returned once, never again — copy it on receipt. Null when alreadyShared. */
  url: string | null
  alreadyShared: boolean
  expiresAt: string
  jobReference: string | null
}

export type VehicleLocationShareResponse = ServerResponse<VehicleLocationShare>

/** GET /track/:token (public). No driver, plate or tenant — by design. */
export type PublicTrack = {
  position: TrackingPosition | null
  job: { reference?: string | null, status?: string | null, deliveryAddress?: string | null, dropoffAddress?: string | null, deadline?: string | null } | null
  expiresAt: string
}

// Socket frames (realtime gateway)
export type TrackingPositionsFrame = { positions: ({ vehicleId: string } & TrackingPosition)[] }
export type TrackingGeofenceEvent = { vehicleId: string, geofenceId: string, geofenceName?: string, at?: string }
