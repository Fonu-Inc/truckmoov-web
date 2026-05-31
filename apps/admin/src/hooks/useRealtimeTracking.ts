import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RealtimeVehicleLocation {
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
}

interface UseRealtimeTrackingOptions {
  tenantId?: string;
  autoConnect?: boolean;
  onLocationUpdate?: (location: RealtimeVehicleLocation) => void;
}

export function useRealtimeTracking(options: UseRealtimeTrackingOptions = {}) {
  const { tenantId, autoConnect = true, onLocationUpdate } = options;
  
  const [locations, setLocations] = useState<Map<string, RealtimeVehicleLocation>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch initial telemetry data
  const fetchInitialData = useCallback(async () => {
    try {
      console.log('[RealtimeTracking] Fetching initial telemetry data...');
      
      // Get the latest telemetry record for each device
      const { data, error } = await supabase
        .from('device_telemetry')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[RealtimeTracking] Error fetching initial data:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const locationMap = new Map<string, RealtimeVehicleLocation>();
        
        // Get only the latest record per device
        const latestByDevice = new Map<string, typeof data[0]>();
        for (const record of data) {
          if (!latestByDevice.has(record.device_id) && record.latitude && record.longitude) {
            latestByDevice.set(record.device_id, record);
          }
        }

        latestByDevice.forEach((record) => {
          const location: RealtimeVehicleLocation = {
            deviceId: record.device_id,
            latitude: Number(record.latitude),
            longitude: Number(record.longitude),
            speed: Number(record.speed || 0),
            heading: record.heading || 0,
            altitude: record.altitude ? Number(record.altitude) : undefined,
            accuracy: record.accuracy ? Number(record.accuracy) : undefined,
            fuelLevel: record.fuel_level ? Number(record.fuel_level) : undefined,
            engineStatus: record.engine_status || undefined,
            engineRpm: record.engine_rpm || undefined,
            batteryVoltage: record.battery_voltage ? Number(record.battery_voltage) : undefined,
            timestamp: new Date(record.timestamp),
            tenantId: record.tenant_id,
          };
          locationMap.set(record.device_id, location);
        });

        setLocations(locationMap);
        setLastUpdate(new Date());
        console.log('[RealtimeTracking] Loaded', locationMap.size, 'device locations');
      }
    } catch (err) {
      console.error('[RealtimeTracking] Failed to fetch initial data:', err);
      setConnectionError('Failed to load initial location data');
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!autoConnect) return;

    console.log('[RealtimeTracking] Setting up realtime subscription...');

    // Fetch initial data
    fetchInitialData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('device-telemetry-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_telemetry',
        },
        (payload) => {
          console.log('[RealtimeTracking] Received telemetry update:', payload);
          
          const record = payload.new as any;
          
          if (!record.latitude || !record.longitude) {
            console.log('[RealtimeTracking] Skipping record without coordinates');
            return;
          }

          const location: RealtimeVehicleLocation = {
            deviceId: record.device_id,
            latitude: Number(record.latitude),
            longitude: Number(record.longitude),
            speed: Number(record.speed || 0),
            heading: record.heading || 0,
            altitude: record.altitude ? Number(record.altitude) : undefined,
            accuracy: record.accuracy ? Number(record.accuracy) : undefined,
            fuelLevel: record.fuel_level ? Number(record.fuel_level) : undefined,
            engineStatus: record.engine_status || undefined,
            engineRpm: record.engine_rpm || undefined,
            batteryVoltage: record.battery_voltage ? Number(record.battery_voltage) : undefined,
            timestamp: new Date(record.timestamp),
            tenantId: record.tenant_id,
          };

          setLocations(prev => {
            const updated = new Map(prev);
            updated.set(record.device_id, location);
            return updated;
          });
          
          setLastUpdate(new Date());
          onLocationUpdate?.(location);
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeTracking] Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
          console.log('[RealtimeTracking] Connected to realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionError('Failed to connect to realtime updates');
          toast.error('Realtime connection error', {
            description: 'Unable to receive live location updates',
          });
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionError('Connection timed out');
        }
      });

    return () => {
      console.log('[RealtimeTracking] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [autoConnect, fetchInitialData, onLocationUpdate]);

  // Get all locations as array
  const getLocationsArray = useCallback(() => {
    return Array.from(locations.values());
  }, [locations]);

  // Get location for specific device
  const getDeviceLocation = useCallback((deviceId: string) => {
    return locations.get(deviceId);
  }, [locations]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchInitialData();
    toast.success('Location data refreshed');
  }, [fetchInitialData]);

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



