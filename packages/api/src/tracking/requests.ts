import type { ServerResponse } from '../lib/types'
import { axiosInstance } from '../lib/axios-instance'

import type {
  DeviceConnectivityResponse,
  DeviceFirmwareResponse,
  DeviceOverviewResponse,
  DeviceTelemetryQuery,
  DeviceTelemetryResponse,
  PublishTrackingAlertPayload,
  PublishTrackingAlertResponse,
  TripStatsResponse,
  TripWindow,
  VehicleLocationHistoryQuery,
  VehicleLocationHistoryResponse,
  VehicleLocationsResponse,
} from './types'

// ─── Device detail — queries ──────────────────────────────────────────────────

export async function getDeviceOverview({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<ServerResponse<DeviceOverviewResponse>>(`/tracking/devices/${deviceId}/overview`)
  return data.data
}

export async function getDeviceConnectivity({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<ServerResponse<DeviceConnectivityResponse>>(`/tracking/devices/${deviceId}/connectivity`)
  return data.data
}

export async function getDeviceTelemetry({ deviceId, limit }: DeviceTelemetryQuery) {
  const { data } = await axiosInstance.get<ServerResponse<DeviceTelemetryResponse>>(`/tracking/devices/${deviceId}/telemetry`, {
    params: { limit },
  })
  return data.data
}

export async function getDeviceFirmware({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<ServerResponse<DeviceFirmwareResponse>>(`/tracking/devices/${deviceId}/firmware`)
  return data.data
}

// ─── Vehicle locations — queries ──────────────────────────────────────────────

export async function getVehicleLocations() {
  const { data } = await axiosInstance.get<ServerResponse<VehicleLocationsResponse>>('/tracking/vehicles')
  return data.data
}

export async function getVehicleLocationHistory({ vehicleId, limit }: VehicleLocationHistoryQuery) {
  const { data } = await axiosInstance.get<ServerResponse<VehicleLocationHistoryResponse>>(
    `/tracking/vehicles/${vehicleId}/history`,
    { params: { limit } },
  )
  return data.data
}

export async function getTripStats({ trips }: { trips: TripWindow[] }) {
  const { data } = await axiosInstance.post<ServerResponse<TripStatsResponse>>('/tracking/trips/stats', { trips })
  return data.data
}

// ─── Alerts — mutations ───────────────────────────────────────────────────────

export async function publishTrackingAlert({ data: body }: PublishTrackingAlertPayload) {
  const { data } = await axiosInstance.post<ServerResponse<PublishTrackingAlertResponse>>('/tracking/alerts', body)
  return data.data
}
