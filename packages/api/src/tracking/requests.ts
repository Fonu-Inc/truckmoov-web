import { axiosInstance } from '../lib/axios-instance'

import type {
  DeviceConnectivityResponse,
  DeviceFirmwareResponse,
  DeviceOverviewResponse,
  DeviceTelemetryQuery,
  DeviceTelemetryResponse,
} from './types'

// ─── Device detail — queries ──────────────────────────────────────────────────

export async function getDeviceOverview({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<DeviceOverviewResponse>(`/tracking/devices/${deviceId}/overview`)
  return data
}

export async function getDeviceConnectivity({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<DeviceConnectivityResponse>(`/tracking/devices/${deviceId}/connectivity`)
  return data
}

export async function getDeviceTelemetry({ deviceId, limit }: DeviceTelemetryQuery) {
  const { data } = await axiosInstance.get<DeviceTelemetryResponse>(`/tracking/devices/${deviceId}/telemetry`, {
    params: { limit },
  })
  return data
}

export async function getDeviceFirmware({ deviceId }: { deviceId: string }) {
  const { data } = await axiosInstance.get<DeviceFirmwareResponse>(`/tracking/devices/${deviceId}/firmware`)
  return data
}
