-- =====================================================
-- PHASE 2: Telemetry-Enhanced Maintenance & Fuel
-- =====================================================

-- =====================================================
-- EPIC 3: Device Capability Awareness
-- Story 3.1: Extend device_catalog with capability flags
-- =====================================================

-- Add telemetry capability flags to device_catalog
ALTER TABLE public.device_catalog 
ADD COLUMN IF NOT EXISTS supports_mileage boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS supports_engine_hours boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS supports_fuel_level boolean NOT NULL DEFAULT false;

-- Update existing entries with reasonable defaults based on supports_obd
UPDATE public.device_catalog 
SET 
  supports_mileage = supports_obd,
  supports_engine_hours = supports_obd,
  supports_fuel_level = supports_fuel
WHERE supports_mileage IS NOT DISTINCT FROM false;

-- =====================================================
-- EPIC 4: Maintenance — Telemetry Enhanced
-- Story 4.1: Engine-Hour-Based Maintenance
-- =====================================================

-- Add engine hours tracking to vehicles
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS current_engine_hours numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS engine_hours_source text DEFAULT 'manual';

-- Add engine hours interval to maintenance_profiles
ALTER TABLE public.maintenance_profiles 
ADD COLUMN IF NOT EXISTS interval_engine_hours integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS next_due_engine_hours integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_service_engine_hours integer DEFAULT NULL;

-- Add engine hours to device_telemetry
ALTER TABLE public.device_telemetry 
ADD COLUMN IF NOT EXISTS engine_hours numeric DEFAULT NULL;

-- =====================================================
-- Story 4.2: Maintenance Dispatch Rules
-- =====================================================

-- Create tenant maintenance config table for dispatch rules
CREATE TABLE IF NOT EXISTS public.tenant_maintenance_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL UNIQUE,
  dispatch_overdue_action text NOT NULL DEFAULT 'warn' CHECK (dispatch_overdue_action IN ('allow', 'warn', 'block')),
  dispatch_due_action text NOT NULL DEFAULT 'allow' CHECK (dispatch_due_action IN ('allow', 'warn', 'block')),
  warn_days_before integer NOT NULL DEFAULT 7,
  fuel_variance_threshold_percent numeric NOT NULL DEFAULT 15,
  fuel_alert_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on tenant_maintenance_config
ALTER TABLE public.tenant_maintenance_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant_maintenance_config
CREATE POLICY "Tenant admins can manage own config"
ON public.tenant_maintenance_config FOR ALL
USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Edge functions can read config"
ON public.tenant_maintenance_config FOR SELECT
USING (true);

-- =====================================================
-- Story 4.3: Maintenance Cost Tracking
-- =====================================================

-- Create maintenance_completions table for history and cost tracking
CREATE TABLE IF NOT EXISTS public.maintenance_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  profile_id uuid REFERENCES public.maintenance_profiles(id) ON DELETE SET NULL,
  vehicle_id uuid NOT NULL,
  service_type text NOT NULL,
  completion_date timestamptz NOT NULL DEFAULT now(),
  completion_mileage integer,
  completion_engine_hours integer,
  cost_ngn numeric DEFAULT 0,
  parts_cost_ngn numeric DEFAULT 0,
  labor_cost_ngn numeric DEFAULT 0,
  technician_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Tenant users can manage own completions"
ON public.maintenance_completions FOR ALL
USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- =====================================================
-- EPIC 5: Fuel Monitoring — Telemetry Based
-- Story 5.1: Fuel Level Ingestion
-- =====================================================

-- Create fuel_level_history table for telemetry-based tracking
CREATE TABLE IF NOT EXISTS public.fuel_level_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  vehicle_id uuid NOT NULL,
  device_id uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  fuel_level_percent numeric NOT NULL,
  fuel_level_liters numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  latitude numeric,
  longitude numeric,
  odometer numeric,
  source text NOT NULL DEFAULT 'telemetry' CHECK (source IN ('telemetry', 'manual'))
);

-- Enable RLS
ALTER TABLE public.fuel_level_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Tenant users can view own fuel history"
ON public.fuel_level_history FOR SELECT
USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "System can insert fuel history"
ON public.fuel_level_history FOR INSERT
WITH CHECK (true);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_fuel_level_history_vehicle_time 
ON public.fuel_level_history(vehicle_id, recorded_at DESC);

-- =====================================================
-- Story 5.2 & 5.3: Fuel Variance Detection & Alerts
-- =====================================================

-- Create fuel_anomaly_events table
CREATE TABLE IF NOT EXISTS public.fuel_anomaly_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  vehicle_id uuid NOT NULL,
  device_id uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  anomaly_type text NOT NULL CHECK (anomaly_type IN ('sudden_drop', 'abnormal_consumption', 'suspected_theft', 'sensor_error')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  fuel_drop_percent numeric,
  fuel_drop_liters numeric,
  expected_consumption numeric,
  actual_consumption numeric,
  variance_percent numeric,
  confidence_score numeric,
  detected_at timestamptz NOT NULL DEFAULT now(),
  location_lat numeric,
  location_lng numeric,
  alert_id uuid,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fuel_anomaly_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Tenant users can view own anomalies"
ON public.fuel_anomaly_events FOR SELECT
USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users can update own anomalies"
ON public.fuel_anomaly_events FOR UPDATE
USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "System can insert anomalies"
ON public.fuel_anomaly_events FOR INSERT
WITH CHECK (true);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_fuel_anomaly_vehicle_time 
ON public.fuel_anomaly_events(vehicle_id, detected_at DESC);

-- =====================================================
-- Enhanced complete_maintenance_profile function
-- Now records to maintenance_completions table
-- =====================================================

CREATE OR REPLACE FUNCTION public.complete_maintenance_profile(
  p_profile_id uuid,
  p_completion_mileage integer DEFAULT NULL,
  p_completion_engine_hours integer DEFAULT NULL,
  p_completion_cost numeric DEFAULT NULL,
  p_parts_cost numeric DEFAULT NULL,
  p_labor_cost numeric DEFAULT NULL,
  p_technician text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile maintenance_profiles%ROWTYPE;
  v_next_due_date timestamptz;
  v_next_due_mileage integer;
  v_next_due_engine_hours integer;
  v_total_cost numeric;
BEGIN
  -- Get the profile
  SELECT * INTO v_profile FROM maintenance_profiles WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Calculate total cost
  v_total_cost := COALESCE(p_completion_cost, 0) + COALESCE(p_parts_cost, 0) + COALESCE(p_labor_cost, 0);

  -- Record the completion
  INSERT INTO maintenance_completions (
    tenant_id, profile_id, vehicle_id, service_type,
    completion_mileage, completion_engine_hours, cost_ngn,
    parts_cost_ngn, labor_cost_ngn, technician_name, notes
  ) VALUES (
    v_profile.tenant_id, p_profile_id, v_profile.vehicle_id, v_profile.service_type,
    p_completion_mileage, p_completion_engine_hours, v_total_cost,
    p_parts_cost, p_labor_cost, p_technician, p_notes
  );

  -- Calculate next due date based on interval
  IF v_profile.interval_days IS NOT NULL THEN
    v_next_due_date := now() + (v_profile.interval_days || ' days')::interval;
  ELSIF v_profile.interval_months IS NOT NULL THEN
    v_next_due_date := now() + (v_profile.interval_months || ' months')::interval;
  END IF;

  -- Calculate next due mileage
  IF v_profile.interval_km IS NOT NULL AND p_completion_mileage IS NOT NULL THEN
    v_next_due_mileage := p_completion_mileage + v_profile.interval_km;
  ELSIF v_profile.interval_km IS NOT NULL AND v_profile.next_due_mileage IS NOT NULL THEN
    v_next_due_mileage := v_profile.next_due_mileage + v_profile.interval_km;
  END IF;

  -- Calculate next due engine hours
  IF v_profile.interval_engine_hours IS NOT NULL AND p_completion_engine_hours IS NOT NULL THEN
    v_next_due_engine_hours := p_completion_engine_hours + v_profile.interval_engine_hours;
  ELSIF v_profile.interval_engine_hours IS NOT NULL AND v_profile.next_due_engine_hours IS NOT NULL THEN
    v_next_due_engine_hours := v_profile.next_due_engine_hours + v_profile.interval_engine_hours;
  END IF;

  -- Update the profile
  UPDATE maintenance_profiles
  SET 
    last_service_date = now(),
    last_service_mileage = COALESCE(p_completion_mileage, last_service_mileage),
    last_service_engine_hours = COALESCE(p_completion_engine_hours, last_service_engine_hours),
    next_due_date = v_next_due_date,
    next_due_mileage = v_next_due_mileage,
    next_due_engine_hours = v_next_due_engine_hours,
    lifecycle_status = 'upcoming',
    due_alert_sent = false,
    overdue_alert_sent = false,
    updated_at = now()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'next_due_date', v_next_due_date,
    'next_due_mileage', v_next_due_mileage,
    'next_due_engine_hours', v_next_due_engine_hours,
    'cost_recorded', v_total_cost
  );
END;
$$;

-- =====================================================
-- Function to check dispatch eligibility based on maintenance
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_vehicle_dispatch_eligibility(
  p_vehicle_id uuid,
  p_tenant_id text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config tenant_maintenance_config%ROWTYPE;
  v_overdue_count integer;
  v_due_count integer;
  v_result jsonb;
BEGIN
  -- Get tenant config, use defaults if not found
  SELECT * INTO v_config FROM tenant_maintenance_config WHERE tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    v_config.dispatch_overdue_action := 'warn';
    v_config.dispatch_due_action := 'allow';
  END IF;

  -- Count overdue maintenance profiles
  SELECT COUNT(*) INTO v_overdue_count
  FROM maintenance_profiles
  WHERE vehicle_id = p_vehicle_id
    AND is_archived = false
    AND lifecycle_status = 'overdue';

  -- Count due maintenance profiles
  SELECT COUNT(*) INTO v_due_count
  FROM maintenance_profiles
  WHERE vehicle_id = p_vehicle_id
    AND is_archived = false
    AND lifecycle_status = 'due';

  -- Build result
  v_result := jsonb_build_object(
    'eligible', true,
    'overdue_count', v_overdue_count,
    'due_count', v_due_count,
    'warnings', jsonb_build_array()
  );

  -- Check overdue rules
  IF v_overdue_count > 0 THEN
    IF v_config.dispatch_overdue_action = 'block' THEN
      v_result := jsonb_set(v_result, '{eligible}', 'false');
      v_result := jsonb_set(v_result, '{block_reason}', to_jsonb('Vehicle has ' || v_overdue_count || ' overdue maintenance item(s)'));
    ELSIF v_config.dispatch_overdue_action = 'warn' THEN
      v_result := jsonb_set(v_result, '{warnings}', v_result->'warnings' || to_jsonb('⚠️ Vehicle has ' || v_overdue_count || ' overdue maintenance item(s)'));
    END IF;
  END IF;

  -- Check due rules
  IF v_due_count > 0 AND v_config.dispatch_due_action = 'warn' THEN
    v_result := jsonb_set(v_result, '{warnings}', v_result->'warnings' || to_jsonb('🔔 Vehicle has ' || v_due_count || ' maintenance item(s) due now'));
  ELSIF v_due_count > 0 AND v_config.dispatch_due_action = 'block' THEN
    v_result := jsonb_set(v_result, '{eligible}', 'false');
    v_result := jsonb_set(v_result, '{block_reason}', to_jsonb('Vehicle has ' || v_due_count || ' maintenance item(s) due'));
  END IF;

  RETURN v_result;
END;
$$;

-- =====================================================
-- Trigger to sync engine hours from telemetry to vehicles
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_vehicle_engine_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle_id uuid;
BEGIN
  -- Only process if engine_hours is present
  IF NEW.engine_hours IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the vehicle_id from the device
  SELECT vehicle_id INTO v_vehicle_id
  FROM devices
  WHERE id = NEW.device_id;

  IF v_vehicle_id IS NOT NULL THEN
    UPDATE vehicles
    SET 
      current_engine_hours = NEW.engine_hours,
      engine_hours_source = 'telemetry',
      updated_at = now()
    WHERE id = v_vehicle_id
      AND (current_engine_hours IS NULL OR NEW.engine_hours > current_engine_hours);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for engine hours sync
DROP TRIGGER IF EXISTS trg_sync_engine_hours ON device_telemetry;
CREATE TRIGGER trg_sync_engine_hours
  AFTER INSERT ON device_telemetry
  FOR EACH ROW
  WHEN (NEW.engine_hours IS NOT NULL)
  EXECUTE FUNCTION sync_vehicle_engine_hours();

-- =====================================================
-- Trigger to record fuel level history from telemetry
-- =====================================================

CREATE OR REPLACE FUNCTION public.record_fuel_level_from_telemetry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device devices%ROWTYPE;
  v_catalog device_catalog%ROWTYPE;
  v_last_fuel numeric;
  v_fuel_drop numeric;
  v_config tenant_maintenance_config%ROWTYPE;
BEGIN
  -- Only process if fuel_level is present
  IF NEW.fuel_level IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get device info
  SELECT * INTO v_device FROM devices WHERE id = NEW.device_id;
  IF NOT FOUND OR v_device.vehicle_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if device supports fuel level
  IF v_device.catalog_id IS NOT NULL THEN
    SELECT * INTO v_catalog FROM device_catalog WHERE id = v_device.catalog_id;
    IF FOUND AND NOT v_catalog.supports_fuel_level THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Record fuel level
  INSERT INTO fuel_level_history (
    tenant_id, vehicle_id, device_id, fuel_level_percent,
    recorded_at, latitude, longitude, odometer
  ) VALUES (
    NEW.tenant_id, v_device.vehicle_id, NEW.device_id, NEW.fuel_level,
    NEW.timestamp, NEW.latitude, NEW.longitude, NEW.odometer
  );

  -- Check for sudden fuel drop
  SELECT fuel_level_percent INTO v_last_fuel
  FROM fuel_level_history
  WHERE vehicle_id = v_device.vehicle_id
    AND recorded_at < NEW.timestamp
  ORDER BY recorded_at DESC
  LIMIT 1;

  IF v_last_fuel IS NOT NULL AND NEW.fuel_level < v_last_fuel THEN
    v_fuel_drop := v_last_fuel - NEW.fuel_level;
    
    -- Get tenant config for threshold
    SELECT * INTO v_config FROM tenant_maintenance_config WHERE tenant_id = NEW.tenant_id;
    
    -- Default threshold is 15%
    IF v_fuel_drop >= COALESCE(v_config.fuel_variance_threshold_percent, 15) THEN
      -- Record anomaly
      INSERT INTO fuel_anomaly_events (
        tenant_id, vehicle_id, device_id, anomaly_type, severity,
        fuel_drop_percent, location_lat, location_lng, confidence_score
      ) VALUES (
        NEW.tenant_id, v_device.vehicle_id, NEW.device_id, 'sudden_drop',
        CASE 
          WHEN v_fuel_drop >= 30 THEN 'critical'
          WHEN v_fuel_drop >= 20 THEN 'high'
          ELSE 'medium'
        END,
        v_fuel_drop, NEW.latitude, NEW.longitude,
        CASE 
          WHEN v_fuel_drop >= 30 THEN 0.9
          WHEN v_fuel_drop >= 20 THEN 0.8
          ELSE 0.7
        END
      );

      -- Create alert
      INSERT INTO alerts (
        tenant_id, vehicle_id, device_id, type, severity, message, metadata
      ) VALUES (
        NEW.tenant_id, v_device.vehicle_id, NEW.device_id,
        'SUDDEN_FUEL_DROP', 
        CASE WHEN v_fuel_drop >= 20 THEN 'high' ELSE 'medium' END,
        format('Sudden fuel drop detected: %.1f%% decrease', v_fuel_drop),
        jsonb_build_object(
          'fuel_drop_percent', v_fuel_drop,
          'previous_level', v_last_fuel,
          'current_level', NEW.fuel_level,
          'latitude', NEW.latitude,
          'longitude', NEW.longitude
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for fuel level recording
DROP TRIGGER IF EXISTS trg_record_fuel_level ON device_telemetry;
CREATE TRIGGER trg_record_fuel_level
  AFTER INSERT ON device_telemetry
  FOR EACH ROW
  WHEN (NEW.fuel_level IS NOT NULL)
  EXECUTE FUNCTION record_fuel_level_from_telemetry();

-- =====================================================
-- Update compute_maintenance_lifecycle_status to include engine hours
-- =====================================================

CREATE OR REPLACE FUNCTION public.compute_maintenance_lifecycle_status(
  p_next_due_date timestamptz,
  p_next_due_mileage integer,
  p_next_due_engine_hours integer,
  p_current_mileage integer,
  p_current_engine_hours integer,
  p_due_soon_days integer DEFAULT 7,
  p_due_soon_km integer DEFAULT 500,
  p_due_soon_hours integer DEFAULT 50
)
RETURNS maintenance_lifecycle_status
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_is_overdue boolean := false;
  v_is_due boolean := false;
BEGIN
  -- Check date-based status
  IF p_next_due_date IS NOT NULL THEN
    IF p_next_due_date < now() THEN
      v_is_overdue := true;
    ELSIF p_next_due_date <= (now() + (p_due_soon_days || ' days')::interval) THEN
      v_is_due := true;
    END IF;
  END IF;

  -- Check mileage-based status
  IF p_next_due_mileage IS NOT NULL AND p_current_mileage IS NOT NULL THEN
    IF p_current_mileage >= p_next_due_mileage THEN
      v_is_overdue := true;
    ELSIF p_current_mileage >= (p_next_due_mileage - p_due_soon_km) THEN
      v_is_due := true;
    END IF;
  END IF;

  -- Check engine hours-based status
  IF p_next_due_engine_hours IS NOT NULL AND p_current_engine_hours IS NOT NULL THEN
    IF p_current_engine_hours >= p_next_due_engine_hours THEN
      v_is_overdue := true;
    ELSIF p_current_engine_hours >= (p_next_due_engine_hours - p_due_soon_hours) THEN
      v_is_due := true;
    END IF;
  END IF;

  -- Return appropriate status
  IF v_is_overdue THEN
    RETURN 'overdue'::maintenance_lifecycle_status;
  ELSIF v_is_due THEN
    RETURN 'due'::maintenance_lifecycle_status;
  ELSE
    RETURN 'upcoming'::maintenance_lifecycle_status;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_vehicle_dispatch_eligibility TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_maintenance_lifecycle_status(timestamptz, integer, integer, integer, integer, integer, integer, integer) TO authenticated;