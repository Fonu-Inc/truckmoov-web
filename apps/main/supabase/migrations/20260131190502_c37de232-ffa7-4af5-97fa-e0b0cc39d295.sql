-- Create device health status enum
CREATE TYPE public.device_health_status AS ENUM ('online', 'degraded', 'offline');

-- Add heartbeat monitoring fields to devices table
ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS health_status public.device_health_status DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS expected_heartbeat_seconds integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS online_threshold_seconds integer DEFAULT 180,
ADD COLUMN IF NOT EXISTS offline_threshold_seconds integer DEFAULT 600,
ADD COLUMN IF NOT EXISTS last_health_check_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_status_change_at timestamp with time zone;

-- Create function to compute device health status
CREATE OR REPLACE FUNCTION public.compute_device_health_status(p_last_seen timestamp with time zone, p_online_threshold integer, p_offline_threshold integer)
RETURNS public.device_health_status
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  seconds_since_seen integer;
BEGIN
  IF p_last_seen IS NULL THEN
    RETURN 'offline';
  END IF;
  
  seconds_since_seen := EXTRACT(EPOCH FROM (now() - p_last_seen))::integer;
  
  IF seconds_since_seen <= p_online_threshold THEN
    RETURN 'online';
  ELSIF seconds_since_seen <= p_offline_threshold THEN
    RETURN 'degraded';
  ELSE
    RETURN 'offline';
  END IF;
END;
$$;

-- Create function for heartbeat monitor job to call
CREATE OR REPLACE FUNCTION public.update_device_health_status(p_device_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device RECORD;
  v_new_status public.device_health_status;
  v_status_changed boolean := false;
  v_previous_status public.device_health_status;
  v_seconds_offline integer;
BEGIN
  -- Get device with current state
  SELECT * INTO v_device 
  FROM public.devices 
  WHERE id = p_device_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Device not found');
  END IF;
  
  -- Compute new health status
  v_new_status := public.compute_device_health_status(
    v_device.last_seen,
    v_device.online_threshold_seconds,
    v_device.offline_threshold_seconds
  );
  
  v_previous_status := COALESCE(v_device.health_status, 'offline');
  
  -- Check for status transition
  IF v_previous_status IS DISTINCT FROM v_new_status THEN
    v_status_changed := true;
    
    -- Update device with new status
    UPDATE public.devices
    SET 
      health_status = v_new_status,
      last_health_check_at = now(),
      last_status_change_at = now(),
      updated_at = now()
    WHERE id = p_device_id;
    
    -- Calculate offline duration for alerts
    IF v_device.last_status_change_at IS NOT NULL THEN
      v_seconds_offline := EXTRACT(EPOCH FROM (now() - v_device.last_status_change_at))::integer;
    ELSE
      v_seconds_offline := 0;
    END IF;
    
  ELSE
    -- Just update health check time
    UPDATE public.devices
    SET 
      last_health_check_at = now(),
      updated_at = now()
    WHERE id = p_device_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'device_id', p_device_id,
    'tenant_id', v_device.tenant_id,
    'vehicle_id', v_device.vehicle_id,
    'previous_status', v_previous_status::text,
    'new_status', v_new_status::text,
    'status_changed', v_status_changed,
    'last_seen', v_device.last_seen,
    'seconds_offline', v_seconds_offline
  );
END;
$$;

-- Create function to batch process all devices
CREATE OR REPLACE FUNCTION public.run_heartbeat_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device RECORD;
  v_result jsonb;
  v_transitions jsonb[] := ARRAY[]::jsonb[];
  v_checked integer := 0;
  v_transitioned integer := 0;
BEGIN
  -- Process all non-decommissioned devices
  FOR v_device IN 
    SELECT id 
    FROM public.devices 
    WHERE lifecycle_status != 'decommissioned'
  LOOP
    v_result := public.update_device_health_status(v_device.id);
    v_checked := v_checked + 1;
    
    IF (v_result->>'status_changed')::boolean THEN
      v_transitioned := v_transitioned + 1;
      v_transitions := array_append(v_transitions, v_result);
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'devices_checked', v_checked,
    'devices_transitioned', v_transitioned,
    'transitions', to_jsonb(v_transitions)
  );
END;
$$;

-- Initialize health_status for existing devices based on last_seen
UPDATE public.devices
SET 
  health_status = public.compute_device_health_status(last_seen, 180, 600),
  last_health_check_at = now(),
  last_status_change_at = COALESCE(last_seen, created_at)
WHERE lifecycle_status != 'decommissioned';