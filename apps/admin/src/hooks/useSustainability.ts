import { useAuthStore } from '@/stores/authStore';

export interface EmissionProfile {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  fuel_type: string;
  engine_size_cc: number | null;
  emission_class: string;
  co2_factor_kg_per_km: number;
  co2_factor_kg_per_litre: number;
  battery_capacity_kwh: number | null;
  electric_range_km: number | null;
  is_zero_emission: boolean;
}

export interface Co2Log {
  id: string;
  vehicle_id: string;
  driver_id: string | null;
  distance_km: number;
  fuel_consumed_litres: number | null;
  co2_emitted_kg: number;
  calculation_method: string;
  trip_date: string;
}

export interface EcoDrivingScore {
  id: string;
  driver_id: string;
  eco_score: number;
  idling_score: number;
  acceleration_score: number;
  speed_compliance_score: number;
  fuel_efficiency_score: number;
  co2_saved_kg: number;
  total_trips: number;
  total_distance_km: number;
  period_start: string;
  period_end: string;
}

export interface SustainabilityTarget {
  id: string;
  tenant_id: string;
  baseline_co2_kg_per_month: number | null;
  target_co2_kg_per_month: number | null;
  target_co2_reduction_percent: number;
  baseline_year: number;
  target_year: number;
  ev_adoption_target_percent: number;
  current_ev_percent: number;
  notes: string | null;
}

export interface EvChargingSession {
  id: string;
  vehicle_id: string;
  driver_id: string | null;
  start_soc_percent: number | null;
  end_soc_percent: number | null;
  energy_kwh: number | null;
  charging_station: string | null;
  cost_ngn: number | null;
  duration_minutes: number | null;
  charging_type: string;
  started_at: string;
  completed_at: string | null;
}

export function useSustainability() {
  const { user } = useAuthStore();

  const stubQuery = { data: [] as any[], isLoading: false, error: null, refetch: () => {} };
  const stubMutation = {
    mutate: (_arg: any) => {},
    mutateAsync: async (_arg: any) => {},
    isPending: false,
  };

  return {
    co2Logs: { ...stubQuery, data: undefined as Co2Log[] | undefined },
    emissionProfiles: { ...stubQuery, data: undefined as EmissionProfile[] | undefined },
    ecoScores: { ...stubQuery, data: undefined as EcoDrivingScore[] | undefined },
    targets: { ...stubQuery, data: null as SustainabilityTarget | null | undefined },
    evSessions: { ...stubQuery, data: undefined as EvChargingSession[] | undefined },
    saveProfile: stubMutation,
    saveTarget: stubMutation,
    totalCo2: 0,
    totalDistance: 0,
    avgCo2PerKm: 0,
    evCount: 0,
    totalProfiled: 0,
    trendData: [] as { date: string; co2: number; distance: number }[],
  };
}
