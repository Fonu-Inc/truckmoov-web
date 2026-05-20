import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export interface DriverFuelEfficiency {
  id: string;
  tenant_id: string;
  driver_id: string;
  analysis_period_start: string;
  analysis_period_end: string;
  total_distance_km: number;
  total_fuel_consumed_liters: number;
  avg_fuel_efficiency_km_per_liter: number;
  fleet_avg_efficiency: number;
  efficiency_vs_fleet_percent: number;
  efficiency_rank: number;
  idle_time_hours: number;
  harsh_event_count: number;
  avg_speed_kmh: number;
  estimated_fuel_cost_ngn: number;
  potential_savings_ngn: number;
  trips_analyzed: number;
  data_completeness_percent: number;
}

export function useDriverFuelEfficiency() {
  const { user } = useAuthStore();

  const { data: efficiencyData, isLoading, error, refetch } = useQuery({
    queryKey: ['driver-fuel-efficiency', user?.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_fuel_efficiency')
        .select('*')
        .order('efficiency_rank', { ascending: true });

      if (error) throw error;
      return data as DriverFuelEfficiency[];
    },
    enabled: !!user?.tenantId,
  });

  const getEfficiencyIndicator = (efficiency: DriverFuelEfficiency) => {
    const vsFleet = efficiency.efficiency_vs_fleet_percent;
    if (vsFleet > 10) return { status: 'excellent', color: 'text-green-600' };
    if (vsFleet > 0) return { status: 'above_average', color: 'text-blue-600' };
    if (vsFleet > -10) return { status: 'average', color: 'text-yellow-600' };
    return { status: 'below_average', color: 'text-red-600' };
  };

  const getTotalPotentialSavings = () => {
    if (!efficiencyData) return 0;
    return efficiencyData.reduce((sum, d) => sum + (d.potential_savings_ngn || 0), 0);
  };

  const getFleetAverageEfficiency = () => {
    if (!efficiencyData || efficiencyData.length === 0) return 0;
    return efficiencyData[0]?.fleet_avg_efficiency || 0;
  };

  return {
    efficiencyData,
    isLoading,
    error,
    refetch,
    getEfficiencyIndicator,
    getTotalPotentialSavings,
    getFleetAverageEfficiency,
  };
}
