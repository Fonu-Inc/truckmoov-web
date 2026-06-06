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
  const efficiencyData: DriverFuelEfficiency[] = [];

  const getEfficiencyIndicator = (_efficiency: DriverFuelEfficiency) => {
    return { status: 'average', color: 'text-yellow-600' };
  };

  const getTotalPotentialSavings = () => 0;

  const getFleetAverageEfficiency = () => 0;

  return {
    efficiencyData,
    isLoading: false,
    error: null,
    refetch: () => {},
    getEfficiencyIndicator,
    getTotalPotentialSavings,
    getFleetAverageEfficiency,
  };
}
