import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RouteWaypoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteDirection {
  legIndex: number;
  stepIndex: number;
  instruction: string;
  type: string;
  modifier?: string;
  distance: number;
  duration: number;
  name: string;
  location: [number, number];
}

export interface RouteData {
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
  legs: {
    legIndex: number;
    distance: number;
    duration: number;
    summary: string;
  }[];
}

export interface MapboxRouteResult {
  route: RouteData;
  directions: RouteDirection[];
  waypoints: any[];
}

export function useMapboxDirections() {
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState<MapboxRouteResult | null>(null);
  

  const getDirections = async (
    waypoints: RouteWaypoint[],
    profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling' = 'driving'
  ): Promise<MapboxRouteResult | null> => {
    if (waypoints.length < 2) {
      toast.error('Insufficient Waypoints', {
        description: 'At least 2 waypoints are required for directions',
      });
      return null;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('mapbox-directions', {
        body: { waypoints, profile },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to get directions');
      }

      setRouteData(data);

      const distanceKm = (data.route.distance / 1000).toFixed(1);
      const durationMin = Math.round(data.route.duration / 60);
      
      toast.success('Route Calculated', {
        description: `${distanceKm} km, ~${durationMin} minutes`,
      });

      return data;
    } catch (error) {
      console.error('Mapbox directions error:', error);
      toast.error('Directions Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
  };

  return {
    getDirections,
    isLoading,
    routeData,
    clearRoute,
  };
}
