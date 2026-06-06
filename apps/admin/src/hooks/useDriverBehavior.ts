import { useMemo } from 'react';

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

export function useDriverBehavior(_options: UseDriverBehaviorOptions = {}) {
  const events: DriverBehaviorEvent[] = [];

  const driverScores = useMemo((): DriverScore[] => [], []);

  const stats = useMemo(() => ({
    total: 0,
    last24h: 0,
    critical: 0,
    high: 0,
    averageScore: 0,
  }), []);

  return {
    events,
    driverScores,
    stats,
    isLoading: false,
    isConnected: false,
    error: null as string | null,
    refresh: () => {},
  };
}
