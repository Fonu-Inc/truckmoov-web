import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

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
  const qc = useQueryClient();

  // CO2 Emission Logs
  const co2Logs = useQuery({
    queryKey: ['co2-emission-logs', user?.tenantId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('co2_emission_logs')
        .select('*')
        .gte('trip_date', thirtyDaysAgo)
        .order('trip_date', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Co2Log[];
    },
    enabled: !!user?.tenantId,
  });

  // Emission Profiles
  const emissionProfiles = useQuery({
    queryKey: ['vehicle-emission-profiles', user?.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_emission_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EmissionProfile[];
    },
    enabled: !!user?.tenantId,
  });

  // Eco Driving Scores
  const ecoScores = useQuery({
    queryKey: ['eco-driving-scores', user?.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eco_driving_scores')
        .select('*')
        .order('eco_score', { ascending: false });
      if (error) throw error;
      return data as EcoDrivingScore[];
    },
    enabled: !!user?.tenantId,
  });

  // Sustainability Targets
  const targets = useQuery({
    queryKey: ['sustainability-targets', user?.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fleet_sustainability_targets')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data as SustainabilityTarget | null;
    },
    enabled: !!user?.tenantId,
  });

  // EV Charging Sessions
  const evSessions = useQuery({
    queryKey: ['ev-charging-sessions', user?.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ev_charging_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as EvChargingSession[];
    },
    enabled: !!user?.tenantId,
  });

  // Save emission profile
  const saveProfile = useMutation({
    mutationFn: async (profile: Partial<EmissionProfile> & { vehicle_id: string; tenant_id: string }) => {
      const { data, error } = await supabase
        .from('vehicle_emission_profiles')
        .upsert(profile as any, { onConflict: 'tenant_id,vehicle_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicle-emission-profiles'] });
      toast.success('Emission profile saved');
    },
    onError: (e) => toast.error('Failed to save profile', { description: e.message }),
  });

  // Save sustainability target
  const saveTarget = useMutation({
    mutationFn: async (target: Partial<SustainabilityTarget> & { tenant_id: string }) => {
      const { data, error } = await supabase
        .from('fleet_sustainability_targets')
        .upsert(target, { onConflict: 'tenant_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sustainability-targets'] });
      toast.success('Sustainability target updated');
    },
    onError: (e) => toast.error('Failed to save target', { description: e.message }),
  });

  // Computed stats
  const totalCo2 = co2Logs.data?.reduce((sum, l) => sum + Number(l.co2_emitted_kg), 0) || 0;
  const totalDistance = co2Logs.data?.reduce((sum, l) => sum + Number(l.distance_km), 0) || 0;
  const avgCo2PerKm = totalDistance > 0 ? totalCo2 / totalDistance : 0;
  const evCount = emissionProfiles.data?.filter(p => p.is_zero_emission).length || 0;
  const totalProfiled = emissionProfiles.data?.length || 0;

  // Daily trend from logs
  const dailyTrend = co2Logs.data?.reduce((acc, l) => {
    const date = l.trip_date;
    if (!acc[date]) acc[date] = { date, co2: 0, distance: 0 };
    acc[date].co2 += Number(l.co2_emitted_kg);
    acc[date].distance += Number(l.distance_km);
    return acc;
  }, {} as Record<string, { date: string; co2: number; distance: number }>) || {};

  const trendData = Object.values(dailyTrend).sort((a, b) => a.date.localeCompare(b.date));

  return {
    co2Logs,
    emissionProfiles,
    ecoScores,
    targets,
    evSessions,
    saveProfile,
    saveTarget,
    totalCo2,
    totalDistance,
    avgCo2PerKm,
    evCount,
    totalProfiled,
    trendData,
  };
}
