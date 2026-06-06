import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { GeofenceEvent, VehicleGeofenceState, Geofence } from './useGeofences';

interface UseGeofenceRealtimeOptions {
  showToasts?: boolean;
  onEvent?: (event: GeofenceEvent) => void;
  onStateChange?: (state: VehicleGeofenceState) => void;
}

export function useGeofenceRealtime(_options: UseGeofenceRealtimeOptions = {}) {
  const recentEvents: GeofenceEvent[] = [];
  const isConnected = false;
  const [stats] = useState({ entries: 0, exits: 0 });

  return {
    recentEvents,
    stats,
    isConnected,
    refresh: () => {},
  };
}
