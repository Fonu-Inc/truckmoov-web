// These are the `data` payloads; every tracking route wraps them in ServerResponse
// (requests.ts returns `data.data`).

export type DeviceHealth = 'online' | 'degraded' | 'offline' | 'unknown'

// ─── Device overview ──────────────────────────────────────────────────────────

export type DeviceSim = {
  device_id?: string
  iccid?: string
  msisdn?: string
  carrier?: string
  plan?: string
  status?: string
  data_limit_mb?: number
  data_usage_mb?: number
  expiry_date?: string
}

export type DeviceOverview = {
  device_id?: string
  imei?: string
  vehicle_id?: string
  health?: DeviceHealth
  last_seen?: string
  firmware_version?: string
  battery_level?: number | null
  signal_strength?: number | null
  latitude?: number | null
  longitude?: number | null
  sim?: DeviceSim | null
}

export type DeviceOverviewResponse = DeviceOverview

// ─── Device connectivity ──────────────────────────────────────────────────────

export type DeviceConnectivity = {
  device_id?: string
  health?: DeviceHealth
  last_contact?: string
  last_telemetry?: string
  seconds_since_contact?: number | null
  sample_count_24h?: number
  status_timeout_seconds?: number
  reporting_interval_seconds?: number | null
  heartbeat?: {
    online_threshold_seconds?: number
    offline_threshold_seconds?: number
    expected_interval_seconds?: number | null
  }
  last_health_check?: {
    at?: string
    result?: DeviceHealth
  }
}

export type DeviceConnectivityResponse = DeviceConnectivity

// ─── Device telemetry ─────────────────────────────────────────────────────────

export type TelemetryPoint = {
  event_id?: string
  device_id?: string
  imei?: string
  vehicle_id?: string
  tenant_id?: string
  observed_at?: string
  fix_time?: string | null
  protocol?: string
  firmware_version?: string
  signal_strength?: number | null
  battery_level?: number | null
  fuel_level?: number | null
  latitude?: number
  longitude?: number
  speed_kph?: number | null
  heading?: number | null
  accuracy_m?: number | null
  engine_on?: boolean | null
}

export type TelemetryAggregates24h = {
  sample_count?: number
  data_quality_pct?: number | null
  avg_interval_seconds?: number | null
  window_start?: string
  window_end?: string
}

export type DeviceTelemetry = {
  device_id?: string
  aggregates_24h?: TelemetryAggregates24h
  latest?: TelemetryPoint | null
  history?: TelemetryPoint[]
}

export type DeviceTelemetryResponse = DeviceTelemetry

// ─── Device firmware ──────────────────────────────────────────────────────────

export type FirmwareHistoryEntry = {
  version?: string
  first_seen?: string
  last_seen?: string
}

export type DeviceFirmware = {
  device_id?: string
  current_version?: string
  protocol?: string
  reporting_interval_seconds?: number | null
  history?: FirmwareHistoryEntry[]
}

export type DeviceFirmwareResponse = DeviceFirmware

// ─── Vehicle locations ────────────────────────────────────────────────────────

export type VehicleLocation = {
  event_id?: string
  vehicle_id?: string
  device_id?: string
  tenant_id?: string
  observed_at?: string
  fix_time?: string
  latitude?: number
  longitude?: number
  speed_kph?: number | null
  heading?: number | null
  accuracy_m?: number | null
}

export type VehicleLocationsResponse = {
  vehicles?: VehicleLocation[]
}

export type VehicleLocationHistoryResponse = {
  vehicle_id?: string
  history?: VehicleLocation[]
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type PublishTrackingAlertPayload = {
  data: {
    alert_type: string
    severity: string
    tenant_id?: string
    vehicle_id?: string
    job_id?: string
    details?: unknown | null
  }
}

export type PublishTrackingAlertResponse = {
  alert_id?: string
  event_id?: string
  subject?: string
  published?: boolean
}

// ─── Query payloads ───────────────────────────────────────────────────────────

export type DeviceTelemetryQuery = {
  deviceId: string
  limit?: number
}

export type VehicleLocationHistoryQuery = {
  vehicleId: string
  limit?: number
}
