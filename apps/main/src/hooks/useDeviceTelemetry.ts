import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { mockDevices } from '@/data/mockData';
import { useOrgDataScope } from '@/hooks/useOrgDataScope';
import { filterValidUuids } from '@/lib/uuidUtils';
import { isFreshActivation } from "@/lib/freshActivation";

// Stabilize org scope arrays

// Lagos Express Logistics tenant UUID (for demo mode)
const DEMO_TENANT_ID = "f7f5af88-fd76-4439-aae3-0461be52f63f";

// Demo user IDs from authStore mockUsers
const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

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
  // Lifecycle fields
  catalog_id?: string | null;
  lifecycle_status?: string;
  first_telemetry_at?: string | null;
  verified_at?: string | null;
  assigned_at?: string | null;
  // SIM linking
  fonu_sim_id?: string | null;
  sim_operator?: string | null;
  sim_status_snapshot?: string | null;
  // Health status (heartbeat monitoring)
  health_status?: 'online' | 'degraded' | 'offline' | null;
  expected_heartbeat_seconds?: number;
  online_threshold_seconds?: number;
  offline_threshold_seconds?: number;
  last_health_check_at?: string | null;
  last_status_change_at?: string | null;
  // Latest telemetry
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

// GeofenceZone is now imported from useGeofences hook
// Geofence definitions are now stored in the database, not hardcoded

const MAX_TRAIL_POINTS = 50; // Keep last 50 positions per device

export function useDeviceTelemetry(providedTenantId?: string, enableSimulation = false) {
  const { user } = useAuthStore();
  const orgScope = useOrgDataScope();
  // Strip demo/non-UUID placeholders so .in('owning_org_id', ...) doesn't 400.
  const validAssetOrgIds = useMemo(() => filterValidUuids(orgScope.assetOrgIds), [orgScope.assetOrgIds]);
  const assetOrgIdsKey = JSON.stringify(validAssetOrgIds);
  const stableAssetOrgIds = useMemo(() => validAssetOrgIds, [assetOrgIdsKey]);
  const [devices, setDevices] = useState<DeviceWithTelemetry[]>([]);
  const [recentEvents, setRecentEvents] = useState<DriverBehaviorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [trailHistory, setTrailHistory] = useState<Map<string, Array<{ lat: number; lng: number; timestamp: string }>>>(new Map());
  
  // Check if this is a demo user (mock login)
  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) && !isFreshActivation() : false;
  
  // Resolve tenant ID
  const tenantId = providedTenantId || (isDemoUser ? DEMO_TENANT_ID : user?.tenantId);

  const fetchDevices = useCallback(async () => {
    // For demo users, use DEMO_TENANT_ID to fetch from database
    const effectiveTenantId = isDemoUser ? DEMO_TENANT_ID : tenantId;
    const isPlatformAdmin = user?.role === 'platform_admin';
    
    if (!effectiveTenantId) {
      setDevices([]);
      setLoading(false);
      return;
    }

    // When multi-stakeholder is enabled and the user has no asset orgs,
    // skip the DB call — but for demo users fall back to mock devices so
    // Owner-Operator / Enterprise demo dashboards still render inventory.
    if (orgScope.multiStakeholderEnabled && stableAssetOrgIds.length === 0 && !isPlatformAdmin) {
      if (isDemoUser) {
        const { demoDevicesWithTelemetry } = await import('@/lib/demoDeviceData');
        setDevices(demoDevicesWithTelemetry);
      } else {
        setDevices([]);
      }
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('devices')
        .select('*')
        .order('last_seen', { ascending: false });

      // Filter by tenant if a specific tenant ID is provided.
      // Platform admins see ALL devices across tenants (including unassigned).
      if (effectiveTenantId && !isPlatformAdmin) {
        query = query.eq('tenant_id', effectiveTenantId);
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
            latitude: telemetry?.latitude,
            longitude: telemetry?.longitude,
            speed: telemetry?.speed,
            heading: telemetry?.heading,
            fuel_level: telemetry?.fuel_level,
            engine_status: telemetry?.engine_status,
          } as DeviceWithTelemetry;
        })
      );

      // Frontend demo fallback: when no devices exist, surface mock inventory
      if (devicesWithTelemetry.length === 0) {
        const { demoDevicesWithTelemetry } = await import('@/lib/demoDeviceData');
        setDevices(demoDevicesWithTelemetry);
      } else {
        setDevices(devicesWithTelemetry);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  }, [tenantId, isDemoUser, orgScope.multiStakeholderEnabled, stableAssetOrgIds, user?.role]);

  const fetchRecentEvents = useCallback(async () => {
    try {
      let query = supabase
        .from('driver_behavior_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error: eventsError } = await query;

      if (eventsError) throw eventsError;

      const events = data || [];
      if (events.length === 0) {
        const { demoBehaviorEvents } = await import('@/lib/demoDeviceData');
        setRecentEvents(demoBehaviorEvents);
      } else {
        setRecentEvents(events);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      const { demoBehaviorEvents } = await import('@/lib/demoDeviceData');
      setRecentEvents(demoBehaviorEvents);
    }
  }, [tenantId]);

  // Update trail history when device positions change
  const updateTrailHistory = useCallback((deviceId: string, lat: number, lng: number) => {
    setTrailHistory((prevHistory) => {
      const newHistory = new Map(prevHistory);
      const deviceTrail = newHistory.get(deviceId) || [];
      
      // Add new point
      const newPoint = { lat, lng, timestamp: new Date().toISOString() };
      const updatedTrail = [...deviceTrail, newPoint].slice(-MAX_TRAIL_POINTS);
      
      newHistory.set(deviceId, updatedTrail);
      return newHistory;
    });
  }, []);

  // Clear trail history
  const clearTrailHistory = useCallback(() => {
    setTrailHistory(new Map());
    toast.success('Trails Cleared', {
      description: 'All device trail history has been cleared',
    });
  }, []);

  // Simulate device movement - updates positions locally for smooth animation
  const simulateMovement = useCallback(() => {
    setDevices((prevDevices) => {
      const updatedDevices = prevDevices.map((device) => {
        if (!device.latitude || !device.longitude) return device;
        
        // Only move active/assigned devices
        if (!['active', 'assigned', 'assignable', 'verified_online'].includes(device.lifecycle_status || device.status)) return device;

        // Random movement within ~100m
        const latDelta = (Math.random() - 0.5) * 0.002;
        const lngDelta = (Math.random() - 0.5) * 0.002;
        
        // Random heading change
        const newHeading = ((device.heading || 0) + (Math.random() - 0.5) * 30 + 360) % 360;
        
        // Random speed change
        const baseSpeed = device.speed || 40;
        const newSpeed = Math.max(0, Math.min(120, baseSpeed + (Math.random() - 0.5) * 20));

        const newLat = device.latitude + latDelta;
        const newLng = device.longitude + lngDelta;

        // Update trail history
        updateTrailHistory(device.id, newLat, newLng);

        return {
          ...device,
          latitude: newLat,
          longitude: newLng,
          heading: newHeading,
          speed: newSpeed,
          last_seen: new Date().toISOString(),
        };
      });
      
      return updatedDevices;
    });
  }, [updateTrailHistory]);

  // Start/stop simulation
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

  // Run simulation interval
  useEffect(() => {
    if (!isSimulating || !enableSimulation) return;

    const interval = setInterval(() => {
      simulateMovement();
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isSimulating, enableSimulation, simulateMovement]);

  useEffect(() => {
    fetchDevices();
    fetchRecentEvents();

    // Subscribe to real-time telemetry updates
    const telemetryChannel = supabase
      .channel('device-telemetry-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_telemetry',
        },
        (payload) => {
          console.log('New telemetry received:', payload);
          
          // Update the device with new telemetry
          setDevices((prevDevices) =>
            prevDevices.map((device) =>
              device.id === payload.new.device_id
                ? {
                    ...device,
                    latitude: payload.new.latitude,
                    longitude: payload.new.longitude,
                    speed: payload.new.speed,
                    heading: payload.new.heading,
                    fuel_level: payload.new.fuel_level,
                    engine_status: payload.new.engine_status,
                    last_seen: payload.new.timestamp,
                  }
                : device
            )
          );
        }
      )
      .subscribe();

    // Subscribe to device updates (health status changes)
    const deviceChannel = supabase
      .channel('device-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
        },
        (payload) => {
          console.log('Device status update:', payload);
          
          // Update the device with new health status
          setDevices((prevDevices) =>
            prevDevices.map((device) =>
              device.id === payload.new.id
                ? {
                    ...device,
                    health_status: payload.new.health_status,
                    last_health_check_at: payload.new.last_health_check_at,
                    last_status_change_at: payload.new.last_status_change_at,
                    last_seen: payload.new.last_seen,
                  }
                : device
            )
          );

          // Show toast for health status transitions
          const oldHealth = payload.old?.health_status;
          const newHealth = payload.new?.health_status;
          if (oldHealth && newHealth && oldHealth !== newHealth) {
            if (newHealth === 'offline') {
              toast.error('Device Offline', {
                description: `Device ${payload.new.imei} went offline`,
              });
            } else if (oldHealth === 'offline' && newHealth !== 'offline') {
              toast.success('Device Back Online', {
                description: `Device ${payload.new.imei} is back online`,
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to behavior events
    const eventsChannel = supabase
      .channel('behavior-events-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_behavior_events',
        },
        (payload) => {
          console.log('New behavior event:', payload);
          
          const event = payload.new as DriverBehaviorEvent;
          setRecentEvents((prev) => [event, ...prev.slice(0, 49)]);

          // Show toast for high severity events
          if (event.severity === 'high' || event.severity === 'critical') {
            toast.error('Driver Alert', {
              description: `${event.event_type.replace('_', ' ')} detected`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(telemetryChannel);
      supabase.removeChannel(deviceChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [fetchDevices, fetchRecentEvents, tenantId]);

  return {
    devices,
    recentEvents,
    loading,
    error,
    refetch: fetchDevices,
    isSimulating,
    startSimulation,
    stopSimulation,
    trailHistory,
    clearTrailHistory,
    // Geofences are now loaded from database via useGeofences hook
  };
}
