import type { ServerResponse } from '../lib/types'

// ─── Device overview ──────────────────────────────────────────────────────────

export type DeviceHealth = 'online' | 'degraded' | 'offline'

export type DeviceOverview = {
  device_id: string
  imei: string
  health: DeviceHealth
  status: string
  last_seen: string | null
  signal_strength: number | null
  battery_level: number | null
  firmware_version: string | null
  vehicle_id: string | null
  latitude: number | null
  longitude: number | null
}

export type DeviceOverviewResponse = ServerResponse<DeviceOverview>

// ─── Device connectivity ──────────────────────────────────────────────────────

export type DeviceConnectivity = {
  device_id: string
  health: DeviceHealth
  last_contact: string | null
  reporting_interval_seconds: number
  sample_count_24h: number
  seconds_since_contact: number
  status_timeout_seconds: number
}

export type DeviceConnectivityResponse = ServerResponse<DeviceConnectivity>

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
  avg_interval_seconds: number
  data_quality_pct: number
  sample_count: number
  window_start: string
  window_end: string
}

export type DeviceTelemetry = {
  device_id: string
  aggregates_24h: TelemetryAggregates24h
  latest: TelemetryPoint | null
  history: TelemetryPoint[]
}

export type DeviceTelemetryResponse = ServerResponse<DeviceTelemetry>

// ─── Device firmware ──────────────────────────────────────────────────────────

export type FirmwareHistoryEntry = {
  version: string
  first_seen: string
  last_seen: string
}

export type DeviceFirmware = {
  device_id: string
  current_version: string
  reporting_interval_seconds: number
  history: FirmwareHistoryEntry[]
}

export type DeviceFirmwareResponse = ServerResponse<DeviceFirmware>

// ─── Query payloads ───────────────────────────────────────────────────────────

export type DeviceTelemetryQuery = {
  deviceId: string
  limit?: number
}
