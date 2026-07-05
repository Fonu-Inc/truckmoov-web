import { queryOptions, useQuery } from '@tanstack/react-query'

import {
  getDeviceConnectivity,
  getDeviceFirmware,
  getDeviceOverview,
  getDeviceTelemetry,
} from './requests'

export type * from './types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const TRACKING_QUERY_KEY = {
  deviceOverview: (deviceId: string) => ['tracking', 'device', deviceId, 'overview'],
  deviceConnectivity: (deviceId: string) => ['tracking', 'device', deviceId, 'connectivity'],
  deviceTelemetry: (deviceId: string, limit?: number) => ['tracking', 'device', deviceId, 'telemetry', limit],
  deviceFirmware: (deviceId: string) => ['tracking', 'device', deviceId, 'firmware'],
} as const

// ─── queryOptions factories ───────────────────────────────────────────────────

export function getDeviceOverviewQueryOptions(deviceId: string) {
  return queryOptions({
    queryKey: TRACKING_QUERY_KEY.deviceOverview(deviceId),
    queryFn: () => getDeviceOverview({ deviceId }),
    enabled: Boolean(deviceId),
  })
}

export function getDeviceConnectivityQueryOptions(deviceId: string) {
  return queryOptions({
    queryKey: TRACKING_QUERY_KEY.deviceConnectivity(deviceId),
    queryFn: () => getDeviceConnectivity({ deviceId }),
    enabled: Boolean(deviceId),
  })
}

export function getDeviceTelemetryQueryOptions(deviceId: string, limit?: number) {
  return queryOptions({
    queryKey: TRACKING_QUERY_KEY.deviceTelemetry(deviceId, limit),
    queryFn: () => getDeviceTelemetry({ deviceId, limit }),
    enabled: Boolean(deviceId),
  })
}

export function getDeviceFirmwareQueryOptions(deviceId: string) {
  return queryOptions({
    queryKey: TRACKING_QUERY_KEY.deviceFirmware(deviceId),
    queryFn: () => getDeviceFirmware({ deviceId }),
    enabled: Boolean(deviceId),
  })
}

// ─── useQuery hooks ────────────────────────────────────────────────────────────

export function useDeviceOverview(deviceId: string) {
  return useQuery(getDeviceOverviewQueryOptions(deviceId))
}

export function useDeviceConnectivity(deviceId: string) {
  return useQuery(getDeviceConnectivityQueryOptions(deviceId))
}

export function useDeviceTelemetry(deviceId: string, limit?: number) {
  return useQuery(getDeviceTelemetryQueryOptions(deviceId, limit))
}

export function useDeviceFirmware(deviceId: string) {
  return useQuery(getDeviceFirmwareQueryOptions(deviceId))
}
