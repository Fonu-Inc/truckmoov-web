
-- Create geofence evaluation trigger function
CREATE OR REPLACE FUNCTION public.telemetry_geofence_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_device RECORD;
  v_geofence_result jsonb;
BEGIN
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, vehicle_id, tenant_id 
  INTO v_device
  FROM devices 
  WHERE id = NEW.device_id;
  
  IF v_device.vehicle_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_geofence_result := public.evaluate_vehicle_geofences(
    p_tenant_id := v_device.tenant_id,
    p_vehicle_id := v_device.vehicle_id,
    p_latitude := NEW.latitude,
    p_longitude := NEW.longitude,
    p_speed := NEW.speed,
    p_telemetry_id := NEW.id
  );

  RETURN NEW;
END;
$$;

-- Create the geofence evaluation trigger
CREATE TRIGGER trg_evaluate_geofences
  AFTER INSERT ON public.device_telemetry
  FOR EACH ROW
  EXECUTE FUNCTION public.telemetry_geofence_trigger();
