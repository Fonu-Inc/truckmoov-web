import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export interface VehicleDispatchScore {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  overall_score: number;
  maintenance_health_score: number;
  fuel_efficiency_score: number;
  driver_performance_score: number;
  reliability_score: number;
  is_dispatch_recommended: boolean;
  recommendation_reasons: string[];
  risk_warnings: string[];
  computed_at: string;
}

export function useVehicleDispatchScores() {
  const { user } = useAuthStore();

  const { data: dispatchScores, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicle-dispatch-scores', user?.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_dispatch_scores')
        .select('*')
        .order('overall_score', { ascending: false });

      if (error) throw error;
      return data as VehicleDispatchScore[];
    },
    enabled: !!user?.tenantId,
  });

  const getScoreForVehicle = (vehicleId: string) => {
    return dispatchScores?.find(s => s.vehicle_id === vehicleId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTopVehicles = (limit: number = 5) => {
    return dispatchScores
      ?.filter(s => s.is_dispatch_recommended)
      .slice(0, limit);
  };

  const getVehiclesWithWarnings = () => {
    return dispatchScores?.filter(s => s.risk_warnings.length > 0);
  };

  return {
    dispatchScores,
    isLoading,
    error,
    refetch,
    getScoreForVehicle,
    getScoreColor,
    getTopVehicles,
    getVehiclesWithWarnings,
  };
}



