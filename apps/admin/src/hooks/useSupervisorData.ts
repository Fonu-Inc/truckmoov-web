import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useOrgDataScope } from '@/hooks/useOrgDataScope';
import { isFreshActivation } from "@/lib/freshActivation";

// Stabilize org scope arrays

// Lagos Express Logistics tenant UUID (for demo mode)
const DEMO_TENANT_ID = "f7f5af88-fd76-4439-aae3-0461be52f63f";

// Demo user IDs from authStore mockUsers
const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

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
  const [devices, setDevices] = useState<RealtimeDevice[]>([]);
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { user } = useAuthStore();
  const orgScope = useOrgDataScope();
  const assetOrgIdsKey = JSON.stringify(orgScope.assetOrgIds);
  const stableAssetOrgIds = useMemo(() => orgScope.assetOrgIds, [assetOrgIdsKey]);

  // Check if this is a demo user (mock login)
  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) && !isFreshActivation() : false;
  
  // For demo users, always use the demo tenant; otherwise use real tenant ID
  const tenantId = isDemoUser ? DEMO_TENANT_ID : (user?.tenantId ?? null);
  const isPlatformAdmin = user?.role === 'platform_admin';

  // Fetch devices with telemetry
  const fetchDevices = useCallback(async () => {
    // If no tenant and not platform admin, return empty
    if (!isPlatformAdmin && !tenantId) {
      setDevices([]);
      return;
    }

    // When multi-stakeholder is enabled, restrict to org's devices
    if (orgScope.multiStakeholderEnabled && stableAssetOrgIds.length === 0 && !isPlatformAdmin) {
      setDevices([]);
      return;
    }

    try {
      let query = supabase
        .from('devices')
        .select('*')
        .order('last_seen', { ascending: false });

      // Filter by tenant unless platform admin
      if (!isPlatformAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      // Apply org-level filter when multi-stakeholder is enabled
      if (orgScope.multiStakeholderEnabled && stableAssetOrgIds.length > 0 && !isPlatformAdmin) {
        query = query.in('owning_org_id', stableAssetOrgIds);
      }

      const { data: devicesData, error: devicesError } = await query;
      if (devicesError) throw devicesError;

      // Fetch latest telemetry for each device
      const devicesWithTelemetry = await Promise.all(
        (devicesData || []).map(async (device) => {
          const { data: telemetry } = await supabase
            .from('device_telemetry')
            .select('latitude, longitude, speed, heading, fuel_level, engine_status')
            .eq('device_id', device.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...device,
            latitude: telemetry?.latitude ? Number(telemetry.latitude) : undefined,
            longitude: telemetry?.longitude ? Number(telemetry.longitude) : undefined,
            speed: telemetry?.speed ? Number(telemetry.speed) : undefined,
            heading: telemetry?.heading,
            fuel_level: telemetry?.fuel_level ? Number(telemetry.fuel_level) : undefined,
            engine_status: telemetry?.engine_status,
          } as RealtimeDevice;
        })
      );

      setDevices(devicesWithTelemetry);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    }
  }, [tenantId, isPlatformAdmin, orgScope.multiStakeholderEnabled, stableAssetOrgIds]);

  // Fetch alerts from driver behavior events and geofence alerts
  const fetchAlerts = useCallback(async () => {
    // If no tenant and not platform admin, return empty
    if (!isPlatformAdmin && !tenantId) {
      setAlerts([]);
      return;
    }

    try {
      // Fetch driver behavior events as alerts
      let behaviorQuery = supabase
        .from('driver_behavior_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!isPlatformAdmin && tenantId) {
        behaviorQuery = behaviorQuery.eq('tenant_id', tenantId);
      }

      const { data: behaviorEvents, error: behaviorError } = await behaviorQuery;
      if (behaviorError) throw behaviorError;

      // Fetch geofence alerts
      let geofenceQuery = supabase
        .from('device_geofence_alerts')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (!isPlatformAdmin && tenantId) {
        geofenceQuery = geofenceQuery.eq('tenant_id', tenantId);
      }

      const { data: geofenceAlerts, error: geofenceError } = await geofenceQuery;
      if (geofenceError) throw geofenceError;

      // Combine and format alerts
      const formattedAlerts: RealtimeAlert[] = [
        ...(behaviorEvents || []).map((event) => ({
          id: event.id,
          type: event.event_type,
          severity: event.severity,
          message: `${event.event_type.replace(/_/g, ' ')} detected${event.speed ? ` at ${event.speed} km/h` : ''}`,
          timestamp: event.created_at,
          acknowledged: false,
          deviceId: event.device_id,
          driverId: event.driver_id || undefined,
          latitude: event.latitude ? Number(event.latitude) : undefined,
          longitude: event.longitude ? Number(event.longitude) : undefined,
        })),
        ...(geofenceAlerts || []).map((alert) => ({
          id: alert.id,
          type: alert.alert_type,
          severity: 'medium',
          message: `${alert.alert_type} - ${alert.geofence_name}`,
          timestamp: alert.triggered_at,
          acknowledged: false,
          deviceId: alert.device_id,
          latitude: alert.latitude ? Number(alert.latitude) : undefined,
          longitude: alert.longitude ? Number(alert.longitude) : undefined,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setAlerts(formattedAlerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  }, [tenantId, isPlatformAdmin]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    toast.success('Alert acknowledged');
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    toast.success('Alert dismissed');
  }, []);

  // Acknowledge all alerts
  const acknowledgeAllAlerts = useCallback(() => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, acknowledged: true })));
    toast.success('All alerts acknowledged');
  }, []);

  // Calculate stats
  const stats: SupervisorStats = {
    totalDevices: devices.length,
    activeDevices: devices.filter((d) => d.status === 'active').length,
    totalAlerts: alerts.length,
    unacknowledgedAlerts: alerts.filter((a) => !a.acknowledged).length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length,
    onlineDrivers: devices.filter((d) => d.status === 'active').length,
    totalTrips: 0,
    completedTrips: 0,
  };

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDevices(), fetchAlerts()]);
      setLoading(false);
    };
    init();
  }, [fetchDevices, fetchAlerts]);

  // Real-time subscriptions (only if tenant is set)
  useEffect(() => {
    if (!tenantId && !isPlatformAdmin) return;

    // Subscribe to telemetry updates
    const telemetryChannel = supabase
      .channel('supervisor-telemetry')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_telemetry',
        },
        (payload) => {
          // Only process if belongs to our tenant
          if (!isPlatformAdmin && payload.new.tenant_id !== tenantId) return;

          setDevices((prev) =>
            prev.map((device) =>
              device.id === payload.new.device_id
                ? {
                    ...device,
                    latitude: payload.new.latitude ? Number(payload.new.latitude) : device.latitude,
                    longitude: payload.new.longitude ? Number(payload.new.longitude) : device.longitude,
                    speed: payload.new.speed ? Number(payload.new.speed) : device.speed,
                    heading: payload.new.heading,
                    fuel_level: payload.new.fuel_level ? Number(payload.new.fuel_level) : device.fuel_level,
                    engine_status: payload.new.engine_status,
                    last_seen: payload.new.timestamp,
                  }
                : device
            )
          );
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    // Subscribe to behavior events (alerts)
    const behaviorChannel = supabase
      .channel('supervisor-behavior')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_behavior_events',
        },
        (payload) => {
          // Only process if belongs to our tenant
          if (!isPlatformAdmin && payload.new.tenant_id !== tenantId) return;

          const event = payload.new;
          const newAlert: RealtimeAlert = {
            id: event.id,
            type: event.event_type,
            severity: event.severity,
            message: `${event.event_type.replace(/_/g, ' ')} detected${event.speed ? ` at ${event.speed} km/h` : ''}`,
            timestamp: event.created_at,
            acknowledged: false,
            deviceId: event.device_id,
            latitude: event.latitude ? Number(event.latitude) : undefined,
            longitude: event.longitude ? Number(event.longitude) : undefined,
          };

          setAlerts((prev) => [newAlert, ...prev]);

          if (event.severity === 'high' || event.severity === 'critical') {
            toast.error(`Alert: ${event.event_type.replace(/_/g, ' ')}`);
          }
        }
      )
      .subscribe();

    // Subscribe to geofence alerts
    const geofenceChannel = supabase
      .channel('supervisor-geofence')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_geofence_alerts',
        },
        (payload) => {
          // Only process if belongs to our tenant
          if (!isPlatformAdmin && payload.new.tenant_id !== tenantId) return;

          const alert = payload.new;
          const newAlert: RealtimeAlert = {
            id: alert.id,
            type: alert.alert_type,
            severity: 'medium',
            message: `${alert.alert_type} - ${alert.geofence_name}`,
            timestamp: alert.triggered_at,
            acknowledged: false,
            deviceId: alert.device_id,
            latitude: alert.latitude ? Number(alert.latitude) : undefined,
            longitude: alert.longitude ? Number(alert.longitude) : undefined,
          };

          setAlerts((prev) => [newAlert, ...prev]);
          toast.warning(`Geofence: ${alert.alert_type}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(telemetryChannel);
      supabase.removeChannel(behaviorChannel);
      supabase.removeChannel(geofenceChannel);
    };
  }, [tenantId, isPlatformAdmin]);

  return {
    devices,
    alerts,
    stats,
    loading,
    error,
    lastUpdate,
    refetch: useCallback(async () => {
      await Promise.all([fetchDevices(), fetchAlerts()]);
    }, [fetchDevices, fetchAlerts]),
    acknowledgeAlert,
    dismissAlert,
    acknowledgeAllAlerts,
  };
}



