import { axiosInstance } from '../lib/axios-instance'

import type {
  DeviceConnectivityResponse,
  DeviceFirmwareResponse,
  DeviceOverviewResponse,
  DeviceTelemetryQuery,
  DeviceTelemetryResponse,
  PublishTrackingAlertPayload,
  PublishTrackingAlertResponse,
  VehicleLocationHistoryQuery,
  VehicleLocationHistoryResponse,
  VehicleLocationsResponse,
} from './types'

// ─── Device detail — queries ──────────────────────────────────────────────────

type Enveloped<T> = T | { status: boolean, message: string, data: T }

// Tracking is enveloped like every other service (services-go, 2026-10-01).
// ponytail: still accepts a bare body in case an older deploy answers; drop once settled.
function unwrap<T extends object>(body: Enveloped<T>): T {
  return 'data' in body && 'status' in body ? body.data : body as T
}

export async function getDeviceOverview({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<Enveloped<DeviceOverviewResponse>>(`/tracking/devices/${deviceId}/overview`)
  return unwrap(data)
}

export async function getDeviceConnectivity({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<Enveloped<DeviceConnectivityResponse>>(`/tracking/devices/${deviceId}/connectivity`)
  return unwrap(data)
}

export async function getDeviceTelemetry({ deviceId, limit }: DeviceTelemetryQuery) {
  const { data } = await axiosInstance.get<Enveloped<DeviceTelemetryResponse>>(`/tracking/devices/${deviceId}/telemetry`, {
    params: { limit },
  })
  return unwrap(data)
}

export async function getDeviceFirmware({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<Enveloped<DeviceFirmwareResponse>>(`/tracking/devices/${deviceId}/firmware`)
  return unwrap(data)
}

// ─── Vehicle locations — queries ──────────────────────────────────────────────

export async function getVehicleLocations() {
  const { data } = await axiosInstance.get<Enveloped<VehicleLocationsResponse>>('/tracking/vehicles')
  return unwrap(data)
}

export async function getVehicleLocationHistory({ vehicleId, limit }: VehicleLocationHistoryQuery) {
  const { data } = await axiosInstance.get<Enveloped<VehicleLocationHistoryResponse>>(
    `/tracking/vehicles/${vehicleId}/history`,
    { params: { limit } },
  )
  return unwrap(data)
}

// ─── Alerts — mutations ───────────────────────────────────────────────────────

export async function publishTrackingAlert({ data: body }: PublishTrackingAlertPayload) {
  const { data } = await axiosInstance.post<Enveloped<PublishTrackingAlertResponse>>('/tracking/alerts', body)
  return unwrap(data)
}
