
-- Trigger function that calls both geofence evaluation and behavior event generation
CREATE OR REPLACE FUNCTION public.process_telemetry_triggers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_device RECORD;
  v_geofence_result jsonb;
BEGIN
  -- 1. Generate driver behavior events (harsh braking, acceleration, etc.)
  -- The function already exists; call it directly
  PERFORM public.generate_behavior_events_from_telemetry();
  
  -- 2. Evaluate geofences if we have coordinates and a vehicle
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    SELECT id, vehicle_id, tenant_id 
    INTO v_device
    FROM devices 
    WHERE id = NEW.device_id;
    
    IF v_device.vehicle_id IS NOT NULL THEN
      v_geofence_result := public.evaluate_vehicle_geofences(
        p_tenant_id := v_device.tenant_id,
        p_vehicle_id := v_device.vehicle_id,
        p_latitude := NEW.latitude,
        p_longitude := NEW.longitude,
        p_speed := NEW.speed,
        p_telemetry_id := NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the single trigger on device_telemetry
CREATE TRIGGER trg_process_telemetry
  AFTER INSERT ON public.device_telemetry
  FOR EACH ROW
  EXECUTE FUNCTION public.process_telemetry_triggers();
