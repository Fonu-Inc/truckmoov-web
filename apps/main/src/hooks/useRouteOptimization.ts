import { useState } from 'react';
import { toast } from 'sonner';

export interface Waypoint {
  id: string;
  type: 'pickup' | 'delivery' | 'stop';
  address: string;
  lat: number;
  lng: number;
  jobReference?: string;
  estimatedArrival?: string;
  duration?: number;
  distance?: number;
  priority?: number;
  timeWindow?: { start: string; end: string };
}

export interface OptimizationResult {
  optimized_waypoints: Waypoint[];
  analysis: {
    optimized_order: number[];
    original_distance_km: number;
    new_distance_km: number;
    actual_savings_km: number;
    actual_savings_percentage: string;
    estimated_time_minutes?: number;
    reasoning: string;
    traffic_considerations?: string[];
    warnings?: string[];
  };
}

export interface OptimizationPreferences {
  minimizeDistance?: boolean;
  minimizeTime?: boolean;
  avoidTolls?: boolean;
  prioritizePickups?: boolean;
  ecoFriendly?: boolean;
}

function haversineKm(a: Waypoint, b: Waypoint) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function totalDistance(wps: Waypoint[]) {
  let d = 0;
  for (let i = 0; i < wps.length - 1; i++) d += haversineKm(wps[i], wps[i + 1]);
  return d;
}

/** Nearest-neighbor optimization that keeps pickup first and delivery last. */
function localOptimize(waypoints: Waypoint[]): OptimizationResult {
  const pickup = waypoints.find((w) => w.type === 'pickup') ?? waypoints[0];
  const delivery =
    waypoints.find((w) => w.type === 'delivery') ?? waypoints[waypoints.length - 1];
  const middle = waypoints.filter((w) => w !== pickup && w !== delivery);

  const ordered: Waypoint[] = [pickup];
  const remaining = [...middle];
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((w, i) => {
      const d = haversineKm(last, w);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }
  if (delivery !== pickup) ordered.push(delivery);

  const original = totalDistance(waypoints);
  const optimized = totalDistance(ordered);
  const savings = Math.max(0, original - optimized);
  const pct = original > 0 ? (savings / original) * 100 : 0;

  return {
    optimized_waypoints: ordered,
    analysis: {
      optimized_order: ordered.map((w) => waypoints.indexOf(w)),
      original_distance_km: original,
      new_distance_km: optimized,
      actual_savings_km: savings,
      actual_savings_percentage: pct.toFixed(1),
      estimated_time_minutes: Math.round((optimized / 50) * 60),
      reasoning:
        'Computed locally using a nearest-neighbor heuristic (pickup fixed first, delivery fixed last).',
    },
  };
}

export function useRouteOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastResult, setLastResult] = useState<OptimizationResult | null>(null);

  const optimizeRoute = async (
    waypoints: Waypoint[],
    _options?: {
      vehicleCapacity?: number;
      startTime?: string;
      preferences?: OptimizationPreferences;
    }
  ): Promise<OptimizationResult | null> => {
    if (waypoints.length < 2) {
      toast.error('Insufficient Waypoints', {
        description: 'At least 2 waypoints are required for optimization',
      });
      return null;
    }

    setIsOptimizing(true);
    try {
      const fallback = localOptimize(waypoints);
      setLastResult(fallback);
      toast.success('Route Optimized', {
        description: `Saved ${fallback.analysis.actual_savings_km.toFixed(1)} km (${fallback.analysis.actual_savings_percentage}% improvement)`,
      });
      return fallback;
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    optimizeRoute,
    isOptimizing,
    lastResult,
  };
}
