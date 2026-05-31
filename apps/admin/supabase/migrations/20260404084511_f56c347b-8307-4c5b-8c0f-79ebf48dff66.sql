-- Create fuel type enum
CREATE TYPE public.vehicle_fuel_type AS ENUM (
  'diesel', 'petrol', 'cng', 'lpg', 'electric', 'hybrid_diesel', 'hybrid_petrol'
);

-- Create emission class enum
CREATE TYPE public.emission_class AS ENUM (
  'euro_1', 'euro_2', 'euro_3', 'euro_4', 'euro_5', 'euro_6', 'zero_emission', 'unknown'
);

-- Create calculation method enum
CREATE TYPE public.co2_calculation_method AS ENUM ('fuel_based', 'distance_based');

-- Vehicle Emission Profiles
CREATE TABLE public.vehicle_emission_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id UUID NOT NULL,
  fuel_type public.vehicle_fuel_type NOT NULL DEFAULT 'diesel',
  engine_size_cc INTEGER,
  emission_class public.emission_class NOT NULL DEFAULT 'unknown',
  co2_factor_kg_per_km NUMERIC(8,4) DEFAULT 0.21,
  co2_factor_kg_per_litre NUMERIC(8,4) DEFAULT 2.68,
  battery_capacity_kwh NUMERIC(8,2),
  electric_range_km NUMERIC(8,2),
  is_zero_emission BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, vehicle_id)
);

ALTER TABLE public.vehicle_emission_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for vehicle_emission_profiles"
  ON public.vehicle_emission_profiles FOR ALL
  TO authenticated
  USING (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()));

-- CO2 Emission Logs
CREATE TABLE public.co2_emission_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id UUID NOT NULL,
  driver_id UUID,
  job_id UUID,
  distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  fuel_consumed_litres NUMERIC(10,3),
  co2_emitted_kg NUMERIC(10,3) NOT NULL DEFAULT 0,
  calculation_method public.co2_calculation_method NOT NULL DEFAULT 'distance_based',
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.co2_emission_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for co2_emission_logs"
  ON public.co2_emission_logs FOR ALL
  TO authenticated
  USING (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()));

CREATE INDEX idx_co2_logs_tenant_date ON public.co2_emission_logs(tenant_id, trip_date);
CREATE INDEX idx_co2_logs_vehicle ON public.co2_emission_logs(vehicle_id, trip_date);

-- Eco Driving Scores
CREATE TABLE public.eco_driving_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  driver_id UUID NOT NULL,
  eco_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  idling_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  acceleration_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  speed_compliance_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  fuel_efficiency_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  co2_saved_kg NUMERIC(10,3) DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  total_distance_km NUMERIC(10,2) DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eco_driving_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for eco_driving_scores"
  ON public.eco_driving_scores FOR ALL
  TO authenticated
  USING (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()));

CREATE INDEX idx_eco_scores_driver ON public.eco_driving_scores(driver_id, period_start);

-- EV Charging Sessions
CREATE TABLE public.ev_charging_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id UUID NOT NULL,
  driver_id UUID,
  start_soc_percent NUMERIC(5,2),
  end_soc_percent NUMERIC(5,2),
  energy_kwh NUMERIC(8,2),
  charging_station TEXT,
  station_latitude NUMERIC(10,7),
  station_longitude NUMERIC(10,7),
  cost_ngn NUMERIC(10,2),
  duration_minutes INTEGER,
  charging_type TEXT DEFAULT 'ac_level_2',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ev_charging_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for ev_charging_sessions"
  ON public.ev_charging_sessions FOR ALL
  TO authenticated
  USING (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()));

-- Fleet Sustainability Targets
CREATE TABLE public.fleet_sustainability_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  baseline_co2_kg_per_month NUMERIC(12,2),
  target_co2_kg_per_month NUMERIC(12,2),
  target_co2_reduction_percent NUMERIC(5,2) DEFAULT 0,
  baseline_year INTEGER DEFAULT 2024,
  target_year INTEGER DEFAULT 2030,
  ev_adoption_target_percent NUMERIC(5,2) DEFAULT 0,
  current_ev_percent NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fleet_sustainability_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for fleet_sustainability_targets"
  ON public.fleet_sustainability_targets FOR ALL
  TO authenticated
  USING (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()));

-- Update timestamps trigger
CREATE TRIGGER update_vehicle_emission_profiles_updated_at
  BEFORE UPDATE ON public.vehicle_emission_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eco_driving_scores_updated_at
  BEFORE UPDATE ON public.eco_driving_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fleet_sustainability_targets_updated_at
  BEFORE UPDATE ON public.fleet_sustainability_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();