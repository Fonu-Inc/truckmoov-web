-- =====================================================
-- SERVER-SIDE GEOFENCING: NORMALIZATION & HARDENING
-- =====================================================

-- 1.0 ENUMS
-- =====================================================
CREATE TYPE public.geofence_type AS ENUM ('CIRCLE', 'POLYGON');
CREATE TYPE public.geofence_status AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE public.geofence_state AS ENUM ('INSIDE', 'OUTSIDE');
CREATE TYPE public.geofence_event_type AS ENUM ('ENTER', 'EXIT');
CREATE TYPE public.geofence_category AS ENUM ('depot', 'delivery', 'restricted', 'customer', 'custom');

-- 1.1 GEOFENCES TABLE (Core Definition)
-- =====================================================
CREATE TABLE public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category public.geofence_category NOT NULL DEFAULT 'custom',
  geofence_type public.geofence_type NOT NULL DEFAULT 'CIRCLE',
  -- For CIRCLE: center point as GeoJSON Point
  -- For POLYGON: boundary as GeoJSON Polygon
  geometry JSONB NOT NULL,
  radius_meters INTEGER,  -- Only for CIRCLE type
  color TEXT DEFAULT '#3b82f6',
  status public.geofence_status NOT NULL DEFAULT 'ACTIVE',
  -- Alert configuration
  alert_on_entry BOOLEAN NOT NULL DEFAULT true,
  alert_on_exit BOOLEAN NOT NULL DEFAULT true,
  alert_on_dwell BOOLEAN NOT NULL DEFAULT false,
  dwell_threshold_minutes INTEGER DEFAULT 30,
  speed_limit_kmh INTEGER,
  -- Schedule (optional time-based activation)
  schedule_enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_days TEXT[], -- ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  schedule_start_time TIME,
  schedule_end_time TIME,
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_circle CHECK (
    geofence_type != 'CIRCLE' OR radius_meters IS NOT NULL
  ),
  CONSTRAINT valid_geometry CHECK (
    geometry ? 'type' AND geometry ? 'coordinates'
  )
);

-- 1.2 VEHICLE-GEOFENCE ASSIGNMENT (Many-to-Many)
-- =====================================================
CREATE TABLE public.vehicle_geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  geofence_id UUID NOT NULL REFERENCES public.geofences(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(vehicle_id, geofence_id)
);

-- 1.3 VEHICLE-GEOFENCE STATE (Current Position State)
-- =====================================================
CREATE TABLE public.vehicle_geofence_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  geofence_id UUID NOT NULL REFERENCES public.geofences(id) ON DELETE CASCADE,
  state public.geofence_state NOT NULL DEFAULT 'OUTSIDE',
  -- Debounce tracking
  consecutive_count INTEGER NOT NULL DEFAULT 0,
  pending_state public.geofence_state,
  -- Timestamps
  last_transition_at TIMESTAMPTZ,
  last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(vehicle_id, geofence_id)
);

-- 1.4 GEOFENCE EVENTS (Audit Trail)
-- =====================================================
CREATE TABLE public.geofence_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  geofence_id UUID NOT NULL REFERENCES public.geofences(id) ON DELETE CASCADE,
  event_type public.geofence_event_type NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  speed NUMERIC,
  -- Link to telemetry that triggered this event
  telemetry_id UUID,
  -- Job milestone integration
  job_id UUID,
  milestone_type TEXT, -- 'ARRIVED_PICKUP', 'ARRIVED_DROPOFF'
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 TENANT GEOFENCE CONFIGURATION
-- =====================================================
CREATE TABLE public.tenant_geofence_config (
  tenant_id TEXT PRIMARY KEY,
  -- Debounce settings
  debounce_points INTEGER NOT NULL DEFAULT 2,  -- Consecutive points needed
  debounce_seconds INTEGER NOT NULL DEFAULT 30, -- Or time threshold
  -- Feature flags
  job_milestone_automation BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.6 ADD GEOFENCE REFERENCES TO JOBS
-- =====================================================
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS pickup_geofence_id UUID REFERENCES public.geofences(id);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS dropoff_geofence_id UUID REFERENCES public.geofences(id);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS arrived_pickup_at TIMESTAMPTZ;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS arrived_dropoff_at TIMESTAMPTZ;

-- =====================================================
-- 2.0 RBAC FUNCTIONS
-- =====================================================

-- Check if user can manage geofences (create/edit/archive)
CREATE OR REPLACE FUNCTION public.can_manage_geofences(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('tenant_admin', 'platform_admin')
  )
$$;

-- Check if user can assign vehicles to geofences
CREATE OR REPLACE FUNCTION public.can_assign_geofences(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('tenant_admin', 'operations_manager', 'platform_admin')
  )
$$;

-- Check if user can view geofence alerts/events
CREATE OR REPLACE FUNCTION public.can_view_geofence_alerts(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('tenant_admin', 'operations_manager', 'dispatcher', 'supervisor', 'platform_admin')
  )
$$;

-- =====================================================
-- 3.0 ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_geofence_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_geofence_config ENABLE ROW LEVEL SECURITY;

-- Geofences policies
CREATE POLICY "Users view own tenant geofences"
ON public.geofences FOR SELECT
USING (
  is_platform_admin(auth.uid()) OR 
  tenant_id = get_user_tenant_id(auth.uid())
);

CREATE POLICY "Tenant admins manage geofences"
ON public.geofences FOR INSERT
WITH CHECK (
  can_manage_geofences(auth.uid()) AND
  tenant_id = get_user_tenant_id(auth.uid())
);

CREATE POLICY "Tenant admins update geofences"
ON public.geofences FOR UPDATE
USING (
  can_manage_geofences(auth.uid()) AND
  (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))
);

CREATE POLICY "Tenant admins delete geofences"
ON public.geofences FOR DELETE
USING (
  can_manage_geofences(auth.uid()) AND
  (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))
);

-- Vehicle-Geofence assignment policies
CREATE POLICY "Users view own tenant vehicle geofences"
ON public.vehicle_geofences FOR SELECT
USING (
  is_platform_admin(auth.uid()) OR 
  tenant_id = get_user_tenant_id(auth.uid())
);

CREATE POLICY "Authorized users manage vehicle geofences"
ON public.vehicle_geofences FOR INSERT
WITH CHECK (
  can_assign_geofences(auth.uid()) AND
  tenant_id = get_user_tenant_id(auth.uid())
);

CREATE POLICY "Authorized users update vehicle geofences"
ON public.vehicle_geofences FOR UPDATE
USING (
  can_assign_geofences(auth.uid()) AND
  (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))
);

CREATE POLICY "Authorized users delete vehicle geofences"
ON public.vehicle_geofences FOR DELETE
USING (
  can_assign_geofences(auth.uid()) AND
  (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))
);

-- Vehicle geofence states (system-managed)
CREATE POLICY "Users view own tenant geofence states"
ON public.vehicle_geofence_states FOR SELECT
USING (
  is_platform_admin(auth.uid()) OR 
  tenant_id = get_user_tenant_id(auth.uid())
);

-- System can insert/update states (via triggers)
CREATE POLICY "System manages geofence states"
ON public.vehicle_geofence_states FOR ALL
USING (true)
WITH CHECK (true);

-- Geofence events (audit log)
CREATE POLICY "Users view own tenant geofence events"
ON public.geofence_events FOR SELECT
USING (
  can_view_geofence_alerts(auth.uid()) AND
  (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))
);

CREATE POLICY "System inserts geofence events"
ON public.geofence_events FOR INSERT
WITH CHECK (true);

-- Tenant geofence config
CREATE POLICY "Tenant admins manage geofence config"
ON public.tenant_geofence_config FOR ALL
USING (
  can_manage_geofences(auth.uid()) AND
  (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))
);

-- =====================================================
-- 4.0 SERVER-SIDE GEOFENCE EVALUATION ENGINE
-- =====================================================

-- 4.1 Helper: Check if point is inside circle
CREATE OR REPLACE FUNCTION public.point_in_circle(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_center_lat NUMERIC,
  p_center_lng NUMERIC,
  p_radius_meters INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  R CONSTANT NUMERIC := 6371000; -- Earth radius in meters
  dLat NUMERIC;
  dLng NUMERIC;
  a NUMERIC;
  c NUMERIC;
  distance NUMERIC;
BEGIN
  -- Haversine formula
  dLat := radians(p_center_lat - p_lat);
  dLng := radians(p_center_lng - p_lng);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(p_lat)) * cos(radians(p_center_lat)) *
       sin(dLng/2) * sin(dLng/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  distance := R * c;
  
  RETURN distance <= p_radius_meters;
END;
$$;

-- 4.2 Helper: Check if point is inside polygon (ray casting)
CREATE OR REPLACE FUNCTION public.point_in_polygon(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_polygon JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  coords JSONB;
  n INTEGER;
  i INTEGER;
  j INTEGER;
  xi NUMERIC;
  yi NUMERIC;
  xj NUMERIC;
  yj NUMERIC;
  inside BOOLEAN := false;
BEGIN
  -- Get coordinates array (first ring for polygon)
  coords := p_polygon->'coordinates'->0;
  n := jsonb_array_length(coords);
  
  j := n - 1;
  FOR i IN 0..(n-1) LOOP
    xi := (coords->i->0)::numeric;
    yi := (coords->i->1)::numeric;
    xj := (coords->j->0)::numeric;
    yj := (coords->j->1)::numeric;
    
    IF ((yi > p_lat) != (yj > p_lat)) AND
       (p_lng < (xj - xi) * (p_lat - yi) / (yj - yi) + xi) THEN
      inside := NOT inside;
    END IF;
    
    j := i;
  END LOOP;
  
  RETURN inside;
END;
$$;

-- 4.3 Helper: Check if point is inside geofence
CREATE OR REPLACE FUNCTION public.point_in_geofence(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_geofence geofences
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  center_lat NUMERIC;
  center_lng NUMERIC;
BEGIN
  IF p_geofence.geofence_type = 'CIRCLE' THEN
    center_lat := (p_geofence.geometry->'coordinates'->1)::numeric;
    center_lng := (p_geofence.geometry->'coordinates'->0)::numeric;
    RETURN point_in_circle(p_lat, p_lng, center_lat, center_lng, p_geofence.radius_meters);
  ELSIF p_geofence.geofence_type = 'POLYGON' THEN
    RETURN point_in_polygon(p_lat, p_lng, p_geofence.geometry);
  END IF;
  
  RETURN false;
END;
$$;

-- 4.4 Main Evaluation Function (called on telemetry insert)
CREATE OR REPLACE FUNCTION public.evaluate_vehicle_geofences(
  p_vehicle_id UUID,
  p_tenant_id TEXT,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_speed NUMERIC DEFAULT NULL,
  p_telemetry_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config tenant_geofence_config%ROWTYPE;
  v_geofence geofences%ROWTYPE;
  v_state vehicle_geofence_states%ROWTYPE;
  v_is_inside BOOLEAN;
  v_new_state geofence_state;
  v_events JSONB := '[]'::jsonb;
  v_transition_occurred BOOLEAN;
  v_job jobs%ROWTYPE;
BEGIN
  -- Skip if no valid coordinates
  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RETURN jsonb_build_object('evaluated', false, 'reason', 'No coordinates');
  END IF;

  -- Get tenant config (use defaults if not configured)
  SELECT * INTO v_config FROM tenant_geofence_config WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    v_config.debounce_points := 2;
    v_config.debounce_seconds := 30;
    v_config.job_milestone_automation := true;
  END IF;

  -- Iterate through all ACTIVE geofences assigned to this vehicle
  FOR v_geofence IN
    SELECT g.*
    FROM geofences g
    JOIN vehicle_geofences vg ON vg.geofence_id = g.id
    WHERE vg.vehicle_id = p_vehicle_id
      AND vg.is_active = true
      AND g.status = 'ACTIVE'
      AND g.tenant_id = p_tenant_id
  LOOP
    -- Check if vehicle is inside this geofence
    v_is_inside := point_in_geofence(p_latitude, p_longitude, v_geofence);
    v_new_state := CASE WHEN v_is_inside THEN 'INSIDE'::geofence_state ELSE 'OUTSIDE'::geofence_state END;
    
    -- Get or create state record
    SELECT * INTO v_state
    FROM vehicle_geofence_states
    WHERE vehicle_id = p_vehicle_id AND geofence_id = v_geofence.id;
    
    IF NOT FOUND THEN
      -- First evaluation - create initial state
      INSERT INTO vehicle_geofence_states (
        tenant_id, vehicle_id, geofence_id, state, consecutive_count, last_evaluated_at
      ) VALUES (
        p_tenant_id, p_vehicle_id, v_geofence.id, v_new_state, 1, now()
      );
      -- Don't fire event on first evaluation
      CONTINUE;
    END IF;
    
    -- Debounce logic
    v_transition_occurred := false;
    
    IF v_new_state = v_state.state THEN
      -- Same state - reset debounce counter
      UPDATE vehicle_geofence_states
      SET consecutive_count = 0, pending_state = NULL, last_evaluated_at = now()
      WHERE id = v_state.id;
      
    ELSIF v_state.pending_state = v_new_state THEN
      -- State change matches pending - increment counter
      IF v_state.consecutive_count + 1 >= v_config.debounce_points THEN
        -- Debounce threshold met - commit transition
        v_transition_occurred := true;
        
        UPDATE vehicle_geofence_states
        SET 
          state = v_new_state,
          pending_state = NULL,
          consecutive_count = 0,
          last_transition_at = now(),
          last_evaluated_at = now()
        WHERE id = v_state.id;
      ELSE
        -- Increment counter
        UPDATE vehicle_geofence_states
        SET consecutive_count = consecutive_count + 1, last_evaluated_at = now()
        WHERE id = v_state.id;
      END IF;
      
    ELSE
      -- New potential state change - start debounce
      UPDATE vehicle_geofence_states
      SET pending_state = v_new_state, consecutive_count = 1, last_evaluated_at = now()
      WHERE id = v_state.id;
    END IF;
    
    -- Handle confirmed transition
    IF v_transition_occurred THEN
      -- Create geofence event
      INSERT INTO geofence_events (
        tenant_id, vehicle_id, geofence_id, event_type,
        latitude, longitude, speed, telemetry_id, occurred_at
      ) VALUES (
        p_tenant_id, p_vehicle_id, v_geofence.id,
        CASE WHEN v_new_state = 'INSIDE' THEN 'ENTER'::geofence_event_type ELSE 'EXIT'::geofence_event_type END,
        p_latitude, p_longitude, p_speed, p_telemetry_id, now()
      );
      
      -- Create alert (only if configured)
      IF (v_new_state = 'INSIDE' AND v_geofence.alert_on_entry) OR
         (v_new_state = 'OUTSIDE' AND v_geofence.alert_on_exit) THEN
        INSERT INTO alerts (
          tenant_id, vehicle_id, type, severity, message, metadata
        ) VALUES (
          p_tenant_id, p_vehicle_id,
          CASE WHEN v_new_state = 'INSIDE' THEN 'GEOFENCE_ENTER' ELSE 'GEOFENCE_EXIT' END,
          CASE WHEN v_geofence.category = 'restricted' THEN 'high' ELSE 'medium' END,
          format('%s %s geofence: %s',
            'Vehicle',
            CASE WHEN v_new_state = 'INSIDE' THEN 'entered' ELSE 'exited' END,
            v_geofence.name
          ),
          jsonb_build_object(
            'geofence_id', v_geofence.id,
            'geofence_name', v_geofence.name,
            'geofence_category', v_geofence.category,
            'latitude', p_latitude,
            'longitude', p_longitude,
            'event_type', CASE WHEN v_new_state = 'INSIDE' THEN 'ENTER' ELSE 'EXIT' END
          )
        );
      END IF;
      
      -- Job milestone automation
      IF v_config.job_milestone_automation AND v_new_state = 'INSIDE' THEN
        -- Check for pickup geofence match
        UPDATE jobs
        SET arrived_pickup_at = now(), status = 
          CASE WHEN status = 'assigned' THEN 'in_progress' ELSE status END
        WHERE vehicle_id = p_vehicle_id
          AND pickup_geofence_id = v_geofence.id
          AND arrived_pickup_at IS NULL
          AND status IN ('assigned', 'pending');
          
        -- Check for dropoff geofence match
        UPDATE jobs
        SET arrived_dropoff_at = now()
        WHERE vehicle_id = p_vehicle_id
          AND dropoff_geofence_id = v_geofence.id
          AND arrived_dropoff_at IS NULL
          AND arrived_pickup_at IS NOT NULL
          AND status = 'in_progress';
      END IF;
      
      -- Add to events array for return
      v_events := v_events || jsonb_build_object(
        'geofence_id', v_geofence.id,
        'geofence_name', v_geofence.name,
        'event_type', CASE WHEN v_new_state = 'INSIDE' THEN 'ENTER' ELSE 'EXIT' END
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'evaluated', true,
    'vehicle_id', p_vehicle_id,
    'events', v_events,
    'event_count', jsonb_array_length(v_events)
  );
END;
$$;

-- 4.5 Trigger on device_telemetry to auto-evaluate
CREATE OR REPLACE FUNCTION public.trigger_geofence_evaluation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device devices%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Get device to find vehicle_id
  SELECT * INTO v_device FROM devices WHERE id = NEW.device_id;
  
  IF NOT FOUND OR v_device.vehicle_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Evaluate geofences for this vehicle
  v_result := evaluate_vehicle_geofences(
    v_device.vehicle_id,
    v_device.tenant_id,
    NEW.latitude,
    NEW.longitude,
    NEW.speed,
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS tr_evaluate_geofences ON device_telemetry;
CREATE TRIGGER tr_evaluate_geofences
AFTER INSERT ON device_telemetry
FOR EACH ROW
EXECUTE FUNCTION trigger_geofence_evaluation();

-- =====================================================
-- 5.0 INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_geofences_tenant_status ON geofences(tenant_id, status);
CREATE INDEX idx_vehicle_geofences_vehicle ON vehicle_geofences(vehicle_id) WHERE is_active = true;
CREATE INDEX idx_vehicle_geofences_geofence ON vehicle_geofences(geofence_id);
CREATE INDEX idx_geofence_states_vehicle ON vehicle_geofence_states(vehicle_id);
CREATE INDEX idx_geofence_events_vehicle ON geofence_events(vehicle_id, occurred_at DESC);
CREATE INDEX idx_geofence_events_geofence ON geofence_events(geofence_id, occurred_at DESC);
CREATE INDEX idx_jobs_pickup_geofence ON jobs(pickup_geofence_id) WHERE pickup_geofence_id IS NOT NULL;
CREATE INDEX idx_jobs_dropoff_geofence ON jobs(dropoff_geofence_id) WHERE dropoff_geofence_id IS NOT NULL;

-- =====================================================
-- 6.0 ENABLE REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_geofence_states;

-- =====================================================
-- 7.0 UPDATE TIMESTAMP TRIGGER
-- =====================================================
CREATE TRIGGER update_geofences_updated_at
BEFORE UPDATE ON public.geofences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_geofence_config_updated_at
BEFORE UPDATE ON public.tenant_geofence_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();