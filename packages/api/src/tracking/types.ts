// ─── Device overview ──────────────────────────────────────────────────────────

export type DeviceHealth = 'online' | 'degraded' | 'offline' | 'unknown'

export type DeviceOverview = {
  device_id: string
  health: DeviceHealth
}

export type DeviceOverviewResponse = DeviceOverview

// ─── Device connectivity ──────────────────────────────────────────────────────

export type DeviceConnectivity = {
  device_id: string
  health: DeviceHealth
  sample_count_24h: number
  status_timeout_seconds: number
  heartbeat: {
    online_threshold_seconds: number
    offline_threshold_seconds: number
  }
  last_health_check: {
    at: string
    result: DeviceHealth
  } | null
}

export type DeviceConnectivityResponse = DeviceConnectivity

// ─── Device telemetry ─────────────────────────────────────────────────────────

export type TelemetryPoint = {
  event_id: string
  device_id: string
  imei: string
  observed_at: string
  fix_time: string
  signal_strength: number | null
  battery_level: number | null
  fuel_level: number | null
  latitude: number | null
  longitude: number | null
  speed_kph: number | null
  heading: number | null
  accuracy_m: number | null
  engine_on: boolean
  firmware_version: string | null
  vehicle_id: string | null
  tenant_id: string | null
}

export type TelemetryAggregates24h = {
  data_quality_pct: number
  sample_count: number
  window_start: string
  window_end: string
}

export type DeviceTelemetry = {
  device_id: string
  aggregates_24h: TelemetryAggregates24h
  history: TelemetryPoint[]
}

export type DeviceTelemetryResponse = DeviceTelemetry

// ─── Device firmware ──────────────────────────────────────────────────────────

export type FirmwareHistoryEntry = {
  version: string
  first_seen?: string
  last_seen?: string
  installed_at?: string
  is_current?: boolean
}

export type DeviceFirmware = {
  device_id: string
  history: FirmwareHistoryEntry[]
}

export type DeviceFirmwareResponse = DeviceFirmware

// ─── Query payloads ───────────────────────────────────────────────────────────

export type DeviceTelemetryQuery = {
  deviceId: string
  limit?: number
}
