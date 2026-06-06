import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useOrgDataScope } from '@/hooks/useOrgDataScope';

export interface RealtimeDevice {
  id: string;
  imei: string;
  manufacturer: string;
  model: string | null;
  status: string;
  vehicle_id: string | null;
  tenant_id: string;
  last_seen: string | null;
  signal_strength: number | null;
  battery_level: number | null;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  fuel_level?: number;
  engine_status?: string;
}

export interface RealtimeAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  deviceId?: string;
  driverId?: string;
  latitude?: number;
  longitude?: number;
}

export interface RealtimeDriver {
  id: string;
  name: string;
  phone: string;
  status: 'available' | 'active' | 'offline';
  rating: number;
  totalTrips: number;
  currentVehicleId?: string;
  lastLocation?: { lat: number; lng: number };
}

export interface RealtimeJob {
  id: string;
  reference: string;
  status: 'created' | 'in_progress' | 'completed' | 'cancelled';
  pickupAddress: string;
  deliveryAddress: string;
  cargoType: string;
  driverId?: string;
  vehicleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupervisorStats {
  totalDevices: number;
  activeDevices: number;
  totalAlerts: number;
  unacknowledgedAlerts: number;
  criticalAlerts: number;
  onlineDrivers: number;
  totalTrips: number;
  completedTrips: number;
}

export function useSupervisorData() {
  const [devices] = useState<RealtimeDevice[]>([]);
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [lastUpdate] = useState<Date>(new Date());

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    toast.success('Alert acknowledged');
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    toast.success('Alert dismissed');
  }, []);

  const acknowledgeAllAlerts = useCallback(() => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, acknowledged: true })));
    toast.success('All alerts acknowledged');
  }, []);

  const stats: SupervisorStats = {
    totalDevices: 0,
    activeDevices: 0,
    totalAlerts: 0,
    unacknowledgedAlerts: 0,
    criticalAlerts: 0,
    onlineDrivers: 0,
    totalTrips: 0,
    completedTrips: 0,
  };

  return {
    devices,
    alerts,
    stats,
    loading,
    error,
    lastUpdate,
    refetch: useCallback(async () => {}, []),
    acknowledgeAlert,
    dismissAlert,
    acknowledgeAllAlerts,
  };
}
