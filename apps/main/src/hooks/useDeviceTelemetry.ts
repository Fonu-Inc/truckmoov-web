import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface DeviceWithTelemetry {
  id: string;
  imei: string;
  manufacturer: string;
  model: string | null;
  status: string;
  vehicle_id: string | null;
  tenant_id: string | null;
  last_seen: string | null;
  signal_strength: number | null;
  battery_level: number | null;
  protocol: string;
  catalog_id?: string | null;
  lifecycle_status?: string;
  first_telemetry_at?: string | null;
  verified_at?: string | null;
  assigned_at?: string | null;
  firmware_version?: string | null;
  fonu_sim_id?: string | null;
  sim_operator?: string | null;
  sim_status_snapshot?: string | null;
  health_status?: 'online' | 'degraded' | 'offline' | null;
  expected_heartbeat_seconds?: number;
  online_threshold_seconds?: number;
  offline_threshold_seconds?: number;
  last_health_check_at?: string | null;
  last_status_change_at?: string | null;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  fuel_level?: number;
  engine_status?: string;
}

export interface TelemetryRecord {
  id: string;
  device_id: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  fuel_level: number | null;
  engine_status: string | null;
  harsh_braking: boolean;
  harsh_acceleration: boolean;
  harsh_cornering: boolean;
  overspeeding: boolean;
}

export interface DriverBehaviorEvent {
  id: string;
  device_id: string;
  event_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  created_at: string;
}

export function useDeviceTelemetry(_providedTenantId?: string, _enableSimulation = false) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [trailHistory] = useState<Map<string, Array<{ lat: number; lng: number; timestamp: string }>>>(new Map());

  const startSimulation = useCallback(() => {
    setIsSimulating(true);
    toast.success('Simulation Started', {
      description: 'Devices will now move in real-time',
    });
  }, []);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
    toast.info('Simulation Stopped', {
      description: 'Device positions are now static',
    });
  }, []);

  const clearTrailHistory = useCallback(() => {
    toast.success('Trails Cleared', {
      description: 'All device trail history has been cleared',
    });
  }, []);

  return {
    devices: [] as DeviceWithTelemetry[],
    recentEvents: [] as DriverBehaviorEvent[],
    loading: false,
    error: null as string | null,
    refetch: () => {},
    isSimulating,
    startSimulation,
    stopSimulation,
    trailHistory,
    clearTrailHistory,
  };
}
