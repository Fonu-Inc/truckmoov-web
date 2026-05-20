import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface DriverBehaviorEvent {
  id: string;
  deviceId: string;
  driverId?: string;
  eventType: 'harsh_braking' | 'harsh_acceleration' | 'harsh_cornering' | 'overspeeding' | 'fatigue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  speed?: number;
  latitude?: number;
  longitude?: number;
  eventData?: Record<string, any>;
  createdAt: Date;
  tenantId: string;
}

export interface DriverScore {
  driverId: string;
  driverName?: string;
  overallScore: number;
  brakingScore: number;
  accelerationScore: number;
  corneringScore: number;
  speedingScore: number;
  totalEvents: number;
  eventBreakdown: {
    harshBraking: number;
    harshAcceleration: number;
    harshCornering: number;
    overspeeding: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  recentEvents: DriverBehaviorEvent[];
}

interface UseDriverBehaviorOptions {
  autoConnect?: boolean;
  onNewEvent?: (event: DriverBehaviorEvent) => void;
}

export function useDriverBehavior(options: UseDriverBehaviorOptions = {}) {
  const { autoConnect = true, onNewEvent } = options;
  const { user } = useAuthStore();

  const [events, setEvents] = useState<DriverBehaviorEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantId = user?.tenantId;

  const mapRow = useCallback((row: any): DriverBehaviorEvent => ({
    id: row.id,
    deviceId: row.device_id ?? '',
    driverId: row.driver_id ?? undefined,
    eventType: row.event_type as DriverBehaviorEvent['eventType'],
    severity: row.severity as DriverBehaviorEvent['severity'],
    speed: row.speed != null ? Number(row.speed) : undefined,
    latitude: row.latitude != null ? Number(row.latitude) : undefined,
    longitude: row.longitude != null ? Number(row.longitude) : undefined,
    eventData: row.event_data,
    createdAt: new Date(row.created_at),
    tenantId: row.tenant_id,
  }), []);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('driver_behavior_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setEvents((data || []).map(mapRow));
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('[DriverBehavior] Error fetching events:', err);
      setError('Failed to load behavior events');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, mapRow]);

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!autoConnect) return;
    fetchEvents();

    const channel = supabase
      .channel('driver-behavior-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_behavior_events',
          ...(tenantId ? { filter: `tenant_id=eq.${tenantId}` } : {}),
        },
        (payload) => {
          const mapped = mapRow(payload.new);
          setEvents((prev) => [mapped, ...prev.slice(0, 499)]);
          onNewEvent?.(mapped);

          if (mapped.severity === 'high' || mapped.severity === 'critical') {
            toast.error('Driver Behavior Alert', {
              description: `${mapped.eventType.replace(/_/g, ' ')} (${mapped.severity})`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoConnect, fetchEvents, tenantId, mapRow, onNewEvent]);

  const driverScores = useMemo((): DriverScore[] => {
    const driverEvents = new Map<string, DriverBehaviorEvent[]>();
    events.forEach(event => {
      const key = event.driverId || event.deviceId;
      driverEvents.set(key, [...(driverEvents.get(key) || []), event]);
    });

    const scores: DriverScore[] = [];
    driverEvents.forEach((list, driverId) => {
      const breakdown = {
        harshBraking: list.filter(e => e.eventType === 'harsh_braking').length,
        harshAcceleration: list.filter(e => e.eventType === 'harsh_acceleration').length,
        harshCornering: list.filter(e => e.eventType === 'harsh_cornering').length,
        overspeeding: list.filter(e => e.eventType === 'overspeeding').length,
      };
      const brakingScore = Math.max(0, 100 - breakdown.harshBraking * 5);
      const accelerationScore = Math.max(0, 100 - breakdown.harshAcceleration * 4);
      const corneringScore = Math.max(0, 100 - breakdown.harshCornering * 4);
      const speedingScore = Math.max(0, 100 - breakdown.overspeeding * 6);
      const overallScore = Math.round(brakingScore * 0.3 + accelerationScore * 0.2 + corneringScore * 0.2 + speedingScore * 0.3);

      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recent = list.filter(e => e.createdAt > cutoff);
      const older = list.filter(e => e.createdAt <= cutoff);
      let trend: DriverScore['trend'] = 'stable';
      if (recent.length < older.length * 0.7) trend = 'improving';
      else if (recent.length > older.length * 1.3) trend = 'declining';

      scores.push({
        driverId, overallScore, brakingScore, accelerationScore, corneringScore, speedingScore,
        totalEvents: list.length, eventBreakdown: breakdown, trend, recentEvents: list.slice(0, 10),
      });
    });
    return scores.sort((a, b) => b.overallScore - a.overallScore);
  }, [events]);

  const stats = useMemo(() => {
    const last24h = events.filter(e => e.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000));
    return {
      total: events.length,
      last24h: last24h.length,
      critical: events.filter(e => e.severity === 'critical').length,
      high: events.filter(e => e.severity === 'high').length,
      averageScore: driverScores.length > 0
        ? Math.round(driverScores.reduce((acc, d) => acc + d.overallScore, 0) / driverScores.length)
        : 0,
    };
  }, [events, driverScores]);

  return { events, driverScores, stats, isLoading, isConnected, error, refresh: fetchEvents };
}
