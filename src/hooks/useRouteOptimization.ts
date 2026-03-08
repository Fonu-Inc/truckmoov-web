import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
}

export function useRouteOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastResult, setLastResult] = useState<OptimizationResult | null>(null);
  

  const optimizeRoute = async (
    waypoints: Waypoint[],
    options?: {
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
      const { data, error } = await supabase.functions.invoke('route-optimization', {
        body: {
          waypoints,
          vehicleCapacity: options?.vehicleCapacity,
          startTime: options?.startTime,
          preferences: options?.preferences || {
            minimizeDistance: true,
            minimizeTime: true,
          },
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
      }

      const result: OptimizationResult = {
        optimized_waypoints: data.optimized_waypoints,
        analysis: data.analysis,
      };

      setLastResult(result);

      const savings = parseFloat(result.analysis.actual_savings_percentage);
      toast.success('Route Optimized', {
        description: `Saved ${result.analysis.actual_savings_km?.toFixed(1) || '0'} km (${savings > 0 ? savings.toFixed(1) : '0'}% improvement)`,
      });

      return result;
    } catch (error) {
      console.error('Route optimization error:', error);
      toast.error('Optimization Failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return null;
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
