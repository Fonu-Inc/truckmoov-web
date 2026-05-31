import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GeofenceAlert {
  id: string;
  deviceId: string;
  geofenceName: string;
  alertType: 'entry' | 'exit' | 'dwell';
  latitude?: number;
  longitude?: number;
  triggeredAt: Date;
  tenantId: string;
}

interface UseGeofenceAlertsOptions {
  autoConnect?: boolean;
  showToasts?: boolean;
  onAlert?: (alert: GeofenceAlert) => void;
}

export function useGeofenceAlerts(options: UseGeofenceAlertsOptions = {}) {
  const { autoConnect = true, showToasts = true, onAlert } = options;
  
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[GeofenceAlerts] Fetching alerts...');

      const { data, error } = await supabase
        .from('device_geofence_alerts')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const mappedAlerts: GeofenceAlert[] = (data || []).map(a => ({
        id: a.id,
        deviceId: a.device_id,
        geofenceName: a.geofence_name,
        alertType: a.alert_type as GeofenceAlert['alertType'],
        latitude: a.latitude ? Number(a.latitude) : undefined,
        longitude: a.longitude ? Number(a.longitude) : undefined,
        triggeredAt: new Date(a.triggered_at),
        tenantId: a.tenant_id,
      }));

      setAlerts(mappedAlerts);
      console.log('[GeofenceAlerts] Loaded', mappedAlerts.length, 'alerts');
    } catch (err) {
      console.error('[GeofenceAlerts] Error fetching alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!autoConnect) return;

    fetchAlerts();

    const channel = supabase
      .channel('geofence-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_geofence_alerts',
        },
        (payload) => {
          console.log('[GeofenceAlerts] New alert:', payload);
          
          const a = payload.new as any;
          const newAlert: GeofenceAlert = {
            id: a.id,
            deviceId: a.device_id,
            geofenceName: a.geofence_name,
            alertType: a.alert_type,
            latitude: a.latitude ? Number(a.latitude) : undefined,
            longitude: a.longitude ? Number(a.longitude) : undefined,
            triggeredAt: new Date(a.triggered_at),
            tenantId: a.tenant_id,
          };

          setAlerts(prev => [newAlert, ...prev].slice(0, 100));
          setUnreadCount(prev => prev + 1);
          onAlert?.(newAlert);

          if (showToasts) {
            const isEntry = newAlert.alertType === 'entry';
            toast[isEntry ? 'info' : 'warning'](`Geofence ${newAlert.alertType.toUpperCase()}`, {
              description: `Device ${newAlert.deviceId.slice(0, 8)}... ${isEntry ? 'entered' : 'exited'} ${newAlert.geofenceName}`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[GeofenceAlerts] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoConnect, fetchAlerts, onAlert, showToasts]);

  // Clear unread count
  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Get recent alerts (last hour)
  const recentAlerts = alerts.filter(
    a => a.triggeredAt > new Date(Date.now() - 60 * 60 * 1000)
  );

  // Get stats
  const stats = {
    total: alerts.length,
    entries: alerts.filter(a => a.alertType === 'entry').length,
    exits: alerts.filter(a => a.alertType === 'exit').length,
    recentCount: recentAlerts.length,
  };

  return {
    alerts,
    recentAlerts,
    stats,
    isLoading,
    isConnected,
    unreadCount,
    markAllRead,
    refresh: fetchAlerts,
  };
}



