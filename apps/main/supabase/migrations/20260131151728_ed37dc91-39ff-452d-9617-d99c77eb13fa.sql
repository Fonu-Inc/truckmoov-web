-- =============================================
-- DEVICE CATALOG TABLE (Platform SuperAdmin Only)
-- =============================================

-- Create enum for catalog status
CREATE TYPE public.device_catalog_status AS ENUM ('supported', 'deprecated', 'blocked');

-- Create enum for protocol types
CREATE TYPE public.device_protocol_type AS ENUM ('tcp', 'http', 'mqtt', 'udp');

-- Create device_catalog table
CREATE TABLE public.device_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  protocol_type device_protocol_type NOT NULL DEFAULT 'tcp',
  default_port INTEGER,
  payload_schema_reference TEXT,
  supports_obd BOOLEAN NOT NULL DEFAULT false,
  supports_fuel BOOLEAN NOT NULL DEFAULT false,
  supports_sos BOOLEAN NOT NULL DEFAULT false,
  config_instructions TEXT,
  status device_catalog_status NOT NULL DEFAULT 'supported',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(manufacturer, model)
);

-- Enable RLS
ALTER TABLE public.device_catalog ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage catalog (full CRUD)
CREATE POLICY "Platform admins can manage device catalog"
ON public.device_catalog
FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- All authenticated users can view supported/deprecated catalog entries
CREATE POLICY "Authenticated users can view active catalog"
ON public.device_catalog
FOR SELECT
USING (status IN ('supported', 'deprecated'));

-- =============================================
-- UPDATE DEVICES TABLE FOR LIFECYCLE
-- =============================================

-- Create lifecycle status enum
CREATE TYPE public.device_lifecycle_status AS ENUM (
  'registered',
  'config_pending', 
  'configured',
  'verified_online',
  'assignable',
  'assigned',
  'faulty',
  'decommissioned'
);

-- Add new columns to devices table
ALTER TABLE public.devices
ADD COLUMN catalog_id UUID REFERENCES public.device_catalog(id),
ADD COLUMN lifecycle_status device_lifecycle_status NOT NULL DEFAULT 'registered',
ADD COLUMN first_telemetry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN fonu_sim_id TEXT,
ADD COLUMN sim_operator TEXT,
ADD COLUMN sim_status_snapshot TEXT,
ADD COLUMN last_sim_sync_at TIMESTAMP WITH TIME ZONE;

-- Create index for lifecycle status queries
CREATE INDEX idx_devices_lifecycle_status ON public.devices(lifecycle_status);
CREATE INDEX idx_devices_catalog_id ON public.devices(catalog_id);

-- =============================================
-- LIFECYCLE TRANSITION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.transition_device_lifecycle(
  p_device_id UUID,
  p_new_status device_lifecycle_status,
  p_actor_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device RECORD;
  v_valid_transition BOOLEAN := false;
BEGIN
  -- Get current device state
  SELECT * INTO v_device FROM public.devices WHERE id = p_device_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Device not found');
  END IF;
  
  -- Validate state transitions
  CASE v_device.lifecycle_status
    WHEN 'registered' THEN
      v_valid_transition := p_new_status = 'config_pending';
    WHEN 'config_pending' THEN
      v_valid_transition := p_new_status IN ('configured', 'faulty');
    WHEN 'configured' THEN
      v_valid_transition := p_new_status IN ('verified_online', 'faulty');
    WHEN 'verified_online' THEN
      v_valid_transition := p_new_status IN ('assignable', 'faulty');
    WHEN 'assignable' THEN
      v_valid_transition := p_new_status IN ('assigned', 'faulty');
    WHEN 'assigned' THEN
      v_valid_transition := p_new_status IN ('assignable', 'faulty', 'decommissioned');
    WHEN 'faulty' THEN
      v_valid_transition := p_new_status IN ('config_pending', 'decommissioned');
    WHEN 'decommissioned' THEN
      v_valid_transition := false; -- Terminal state
    ELSE
      v_valid_transition := false;
  END CASE;
  
  IF NOT v_valid_transition THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Invalid transition from %s to %s', v_device.lifecycle_status, p_new_status)
    );
  END IF;
  
  -- Perform the transition
  UPDATE public.devices
  SET 
    lifecycle_status = p_new_status,
    verified_at = CASE WHEN p_new_status = 'verified_online' THEN now() ELSE verified_at END,
    assigned_at = CASE WHEN p_new_status = 'assigned' THEN now() ELSE assigned_at END,
    updated_at = now()
  WHERE id = p_device_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_status', v_device.lifecycle_status,
    'new_status', p_new_status
  );
END;
$$;

-- =============================================
-- TELEMETRY VERIFICATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.verify_device_telemetry(
  p_device_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device RECORD;
  v_result jsonb;
BEGIN
  -- Get device with catalog info
  SELECT d.*, dc.manufacturer as catalog_manufacturer, dc.model as catalog_model
  INTO v_device 
  FROM public.devices d
  LEFT JOIN public.device_catalog dc ON d.catalog_id = dc.id
  WHERE d.id = p_device_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Device not found');
  END IF;
  
  -- Validate GPS data
  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid GPS coordinates');
  END IF;
  
  IF p_latitude < -90 OR p_latitude > 90 OR p_longitude < -180 OR p_longitude > 180 THEN
    RETURN jsonb_build_object('success', false, 'error', 'GPS coordinates out of range');
  END IF;
  
  -- Validate timestamp (not too old, not in future)
  IF p_timestamp < now() - INTERVAL '24 hours' OR p_timestamp > now() + INTERVAL '1 minute' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Timestamp out of acceptable range');
  END IF;
  
  -- Record first telemetry if not already set
  IF v_device.first_telemetry_at IS NULL THEN
    UPDATE public.devices
    SET first_telemetry_at = now(), updated_at = now()
    WHERE id = p_device_id;
  END IF;
  
  -- If device is in configured state, transition to verified_online
  IF v_device.lifecycle_status = 'configured' THEN
    UPDATE public.devices
    SET 
      lifecycle_status = 'verified_online',
      verified_at = now(),
      updated_at = now()
    WHERE id = p_device_id;
    
    -- Auto-transition to assignable
    UPDATE public.devices
    SET lifecycle_status = 'assignable', updated_at = now()
    WHERE id = p_device_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'verified', true,
      'message', 'Device verified and ready for assignment'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'verified', false,
    'current_status', v_device.lifecycle_status
  );
END;
$$;

-- =============================================
-- DEVICE ASSIGNMENT VALIDATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.can_assign_device_to_vehicle(
  p_device_id UUID,
  p_vehicle_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device RECORD;
  v_existing_device RECORD;
BEGIN
  -- Get device
  SELECT * INTO v_device FROM public.devices WHERE id = p_device_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_assign', false, 'reason', 'Device not found');
  END IF;
  
  -- Check lifecycle status - must be assignable or verified_online
  IF v_device.lifecycle_status NOT IN ('assignable', 'verified_online') THEN
    RETURN jsonb_build_object(
      'can_assign', false, 
      'reason', format('Device must be verified before assignment. Current status: %s', v_device.lifecycle_status)
    );
  END IF;
  
  -- Check if device is already assigned to another vehicle
  IF v_device.vehicle_id IS NOT NULL AND v_device.vehicle_id != p_vehicle_id THEN
    RETURN jsonb_build_object(
      'can_assign', false,
      'reason', 'Device is already assigned to another vehicle'
    );
  END IF;
  
  -- Check if vehicle already has a device
  SELECT * INTO v_existing_device 
  FROM public.devices 
  WHERE vehicle_id = p_vehicle_id AND id != p_device_id AND lifecycle_status = 'assigned';
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'can_assign', false,
      'reason', 'Vehicle already has an active device assigned'
    );
  END IF;
  
  RETURN jsonb_build_object('can_assign', true);
END;
$$;

-- =============================================
-- SEED INITIAL DEVICE CATALOG
-- =============================================

INSERT INTO public.device_catalog (manufacturer, model, protocol_type, default_port, supports_obd, supports_fuel, supports_sos, config_instructions, status) VALUES
('Teltonika', 'FMC130', 'tcp', 5001, true, true, true, '## Teltonika FMC130 Configuration

1. Connect device to Configurator
2. Set APN settings
3. Configure server IP and port
4. Enable ignition detection
5. Set reporting interval', 'supported'),
('Teltonika', 'FMB920', 'tcp', 5001, true, true, false, '## Teltonika FMB920 Configuration

1. Use Teltonika Configurator tool
2. Set GPRS settings
3. Configure data sending parameters', 'supported'),
('Teltonika', 'FMB140', 'tcp', 5001, true, true, true, '## Teltonika FMB140 Configuration

Advanced LTE Cat 1 tracker with CAN support.', 'supported'),
('Queclink', 'GL320MG', 'tcp', 5002, false, false, true, '## Queclink GL320MG Setup

Personal/asset tracker with long battery life.', 'supported'),
('Queclink', 'GV500', 'tcp', 5002, true, true, true, '## Queclink GV500 Configuration

Fleet management tracker with OBD-II support.', 'supported'),
('Meitrack', 'T366G', 'tcp', 5003, true, true, true, '## Meitrack T366G Setup

4G vehicle tracker with multiple I/O.', 'supported'),
('Meitrack', 'T355G', 'tcp', 5003, false, true, true, '## Meitrack T355G Configuration

Compact 4G tracker.', 'supported'),
('CalAmp', 'LMU-3030', 'tcp', 5004, true, true, true, '## CalAmp LMU-3030

Enterprise fleet tracker.', 'supported'),
('Digital Matter', 'Oyster3', 'http', 443, false, false, false, '## Digital Matter Oyster3

Battery-powered asset tracker.', 'supported'),
('Geotab', 'GO9', 'http', 443, true, true, true, '## Geotab GO9

Advanced telematics device with extensive diagnostics.', 'supported'),
('Concox', 'GT06N', 'tcp', 5005, false, true, true, '## Concox GT06N Setup

Budget-friendly GPS tracker.', 'supported'),
('Coban', 'GPS103', 'tcp', 5006, false, false, true, '## Coban GPS103

Legacy tracker - consider upgrade.', 'deprecated');

-- Update timestamp trigger
CREATE TRIGGER update_device_catalog_updated_at
BEFORE UPDATE ON public.device_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();