import { useState, useCallback } from 'react';

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

export function useGeofenceAlerts(_options: UseGeofenceAlertsOptions = {}) {
  const [alerts] = useState<GeofenceAlert[]>([]);
  const isLoading = false;
  const isConnected = false;
  const [unreadCount] = useState(0);

  const markAllRead = useCallback(() => {}, []);

  const recentAlerts: GeofenceAlert[] = [];

  const stats = {
    total: 0,
    entries: 0,
    exits: 0,
    recentCount: 0,
  };

  return {
    alerts,
    recentAlerts,
    stats,
    isLoading,
    isConnected,
    unreadCount,
    markAllRead,
    refresh: () => {},
  };
}
