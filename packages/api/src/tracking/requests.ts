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

// ponytail: the device-detail routes are documented unwrapped, but dev answered with the
// ServerResponse envelope on 2026-10-01 (and bare earlier the same day). Accept both
// until the backend settles on one.
function unwrap<T extends object>(body: T | { status: boolean, message: string, data: T }): T {
  return 'data' in body && 'status' in body ? body.data : body as T
}

export async function getDeviceOverview({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<DeviceOverviewResponse | { status: boolean, message: string, data: DeviceOverviewResponse }>(`/tracking/devices/${deviceId}/overview`)
  return unwrap(data)
}

export async function getDeviceConnectivity({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<DeviceConnectivityResponse | { status: boolean, message: string, data: DeviceConnectivityResponse }>(`/tracking/devices/${deviceId}/connectivity`)
  return unwrap(data)
}

export async function getDeviceTelemetry({ deviceId, limit }: DeviceTelemetryQuery) {
  const { data } = await axiosInstance.get<DeviceTelemetryResponse | { status: boolean, message: string, data: DeviceTelemetryResponse }>(`/tracking/devices/${deviceId}/telemetry`, {
    params: { limit },
  })
  return unwrap(data)
}

export async function getDeviceFirmware({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<DeviceFirmwareResponse | { status: boolean, message: string, data: DeviceFirmwareResponse }>(`/tracking/devices/${deviceId}/firmware`)
  return unwrap(data)
}

// ─── Vehicle locations — queries ──────────────────────────────────────────────

export async function getVehicleLocations() {
  const { data } = await axiosInstance.get<VehicleLocationsResponse>('/tracking/vehicles')
  return data
}

export async function getVehicleLocationHistory({ vehicleId, limit }: VehicleLocationHistoryQuery) {
  const { data } = await axiosInstance.get<VehicleLocationHistoryResponse>(
    `/tracking/vehicles/${vehicleId}/history`,
    { params: { limit } },
  )
  return data
}

// ─── Alerts — mutations ───────────────────────────────────────────────────────

export async function publishTrackingAlert({ data: body }: PublishTrackingAlertPayload) {
  const { data } = await axiosInstance.post<PublishTrackingAlertResponse>('/tracking/alerts', body)
  return data
}
