import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import type { GeofenceEvent, VehicleGeofenceState, Geofence } from './useGeofences';

interface UseGeofenceRealtimeOptions {
  showToasts?: boolean;
  onEvent?: (event: GeofenceEvent) => void;
  onStateChange?: (state: VehicleGeofenceState) => void;
}

export function useGeofenceRealtime(options: UseGeofenceRealtimeOptions = {}) {
  const { showToasts = true, onEvent, onStateChange } = options;
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;

  const [recentEvents, setRecentEvents] = useState<GeofenceEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({ entries: 0, exits: 0 });

  // Fetch initial recent events
  const fetchRecentEvents = useCallback(async () => {
    if (!tenantId) return;

    const { data, error } = await supabase
      .from('geofence_events')
      .select(`
        *,
        geofence:geofences(id, name, category, color)
      `)
      .order('occurred_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setRecentEvents(data as GeofenceEvent[]);
      
      // Calculate stats
      const entries = data.filter((e: any) => e.event_type === 'ENTER').length;
      const exits = data.filter((e: any) => e.event_type === 'EXIT').length;
      setStats({ entries, exits });
    }
  }, [tenantId]);

  useEffect(() => {
    if (!user) return;

    fetchRecentEvents();

    // Subscribe to geofence events
    const eventsChannel = supabase
      .channel('geofence-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'geofence_events',
        },
        async (payload) => {
          console.log('[GeofenceRealtime] New event:', payload);

          // Fetch the full event with geofence data
          const { data: eventWithGeofence } = await supabase
            .from('geofence_events')
            .select(`
              *,
              geofence:geofences(id, name, category, color)
            `)
            .eq('id', payload.new.id)
            .single();

          if (eventWithGeofence) {
            const event = eventWithGeofence as GeofenceEvent;
            
            setRecentEvents((prev) => [event, ...prev.slice(0, 49)]);
            
            // Update stats
            setStats((prev) => ({
              entries: prev.entries + (event.event_type === 'ENTER' ? 1 : 0),
              exits: prev.exits + (event.event_type === 'EXIT' ? 1 : 0),
            }));

            // Show toast
            if (showToasts) {
              const isEntry = event.event_type === 'ENTER';
              const geofenceName = (event as any).geofence?.name || 'Unknown';
              const isRestricted = (event as any).geofence?.category === 'restricted';

              if (isRestricted && isEntry) {
                toast.error(`Restricted Zone Entry`, {
                  description: `Vehicle entered ${geofenceName}`,
                  duration: 5000,
                });
              } else {
                toast.info(`Geofence ${event.event_type}`, {
                  description: `Vehicle ${isEntry ? 'entered' : 'exited'} ${geofenceName}`,
                  duration: 4000,
                });
              }
            }

            // Callback
            onEvent?.(event);
          }
        }
      )
      .subscribe((status) => {
        console.log('[GeofenceRealtime] Events subscription:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to state changes
    const statesChannel = supabase
      .channel('geofence-states-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_geofence_states',
        },
        (payload) => {
          console.log('[GeofenceRealtime] State change:', payload);
          if (payload.new) {
            onStateChange?.(payload.new as VehicleGeofenceState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(statesChannel);
    };
  }, [user, showToasts, onEvent, onStateChange, fetchRecentEvents]);

  return {
    recentEvents,
    stats,
    isConnected,
    refresh: fetchRecentEvents,
  };
}
