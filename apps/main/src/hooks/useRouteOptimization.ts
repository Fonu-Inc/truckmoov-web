import { useState } from "react";

type Waypoint = {
  id: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  duration?: number;
  jobReference?: string;
};

type OptimizationResult = {
  optimized_waypoints: Waypoint[];
  analysis: {
    actual_savings_km: number;
    actual_savings_percentage: string;
  };
};

export function useRouteOptimization() {
  const [
    isOptimizing,
    setIsOptimizing,
  ] = useState(false);

  const optimizeRoute = async (waypoints: Waypoint[]): Promise<OptimizationResult | null> => {
    if (waypoints.length < 2)
      return null;
    setIsOptimizing(true);
    try {
      // Stub: return waypoints in original order with zero savings
      await new Promise(resolve => setTimeout(
        resolve,
        800,
      ));
      return {
        optimized_waypoints: waypoints,
        analysis: {
          actual_savings_km: 0,
          actual_savings_percentage: "0",
        },
      };
    }
    finally {
      setIsOptimizing(false);
    }
  };

  return {
    optimizeRoute, isOptimizing,
  };
}
