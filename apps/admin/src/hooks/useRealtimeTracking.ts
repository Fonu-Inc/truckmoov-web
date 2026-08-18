import {
  useCallback,
  useState,
} from "react";

export type RealtimeVehicleLocation = {
  deviceId: string;
  vehicleId?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude?: number;
  accuracy?: number;
  fuelLevel?: number;
  engineStatus?: string;
  engineRpm?: number;
  batteryVoltage?: number;
  timestamp: Date;
  tenantId: string;
};

type UseRealtimeTrackingOptions = {
  tenantId?: string;
  autoConnect?: boolean;
  onLocationUpdate?: (location: RealtimeVehicleLocation) => void;
};

export function useRealtimeTracking(_options: UseRealtimeTrackingOptions = {}) {
  const [locations] = useState<Map<string, RealtimeVehicleLocation>>(new Map());
  const [isConnected] = useState(false);
  const [connectionError] = useState<string | null>(null);
  const [lastUpdate] = useState<Date | null>(null);

  const getLocationsArray = useCallback(
    () => {
      return Array.from(locations.values());
    },
    [locations],
  );

  const getDeviceLocation = useCallback(
    (_deviceId: string) => {
      return undefined;
    },
    [],
  );

  const refresh = useCallback(
    async () => {},
    [],
  );

  return {
    locations: getLocationsArray(),
    locationsMap: locations,
    isConnected,
    connectionError,
    lastUpdate,
    getDeviceLocation,
    refresh,
  };
}
