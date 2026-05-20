
-- Create trigger function to generate driver_behavior_events from telemetry boolean flags
CREATE OR REPLACE FUNCTION public.generate_behavior_events_from_telemetry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_device RECORD;
  v_driver_id text;
  v_severity text;
  v_speed numeric;
BEGIN
  -- Skip if no behavior flags are set
  IF NOT (COALESCE(NEW.harsh_braking, false) OR COALESCE(NEW.harsh_acceleration, false) 
       OR COALESCE(NEW.harsh_cornering, false) OR COALESCE(NEW.overspeeding, false)) THEN
    RETURN NEW;
  END IF;

  -- Get device info for driver lookup
  SELECT d.vehicle_id INTO v_device FROM devices d WHERE d.id = NEW.device_id;

  -- Try to resolve driver from vehicle assignment
  IF v_device.vehicle_id IS NOT NULL THEN
    SELECT dr.id::text INTO v_driver_id
    FROM drivers dr
    WHERE dr.assigned_vehicle_id = v_device.vehicle_id
      AND dr.status = 'active'
    LIMIT 1;
  END IF;

  v_speed := COALESCE(NEW.speed, 0);

  -- Generate event for harsh braking
  IF COALESCE(NEW.harsh_braking, false) THEN
    v_severity := CASE
      WHEN v_speed >= 100 THEN 'critical'
      WHEN v_speed >= 70 THEN 'high'
      WHEN v_speed >= 40 THEN 'medium'
      ELSE 'low'
    END;

    INSERT INTO driver_behavior_events (device_id, tenant_id, driver_id, event_type, severity, latitude, longitude, speed, event_data)
    VALUES (NEW.device_id, NEW.tenant_id, v_driver_id, 'harsh_braking', v_severity, NEW.latitude, NEW.longitude, v_speed,
      jsonb_build_object('heading', NEW.heading, 'engine_status', NEW.engine_status, 'source', 'telemetry_trigger'));
  END IF;

  -- Generate event for harsh acceleration
  IF COALESCE(NEW.harsh_acceleration, false) THEN
    v_severity := CASE
      WHEN v_speed >= 80 THEN 'high'
      WHEN v_speed >= 40 THEN 'medium'
      ELSE 'low'
    END;

    INSERT INTO driver_behavior_events (device_id, tenant_id, driver_id, event_type, severity, latitude, longitude, speed, event_data)
    VALUES (NEW.device_id, NEW.tenant_id, v_driver_id, 'harsh_acceleration', v_severity, NEW.latitude, NEW.longitude, v_speed,
      jsonb_build_object('heading', NEW.heading, 'engine_status', NEW.engine_status, 'source', 'telemetry_trigger'));
  END IF;

  -- Generate event for harsh cornering
  IF COALESCE(NEW.harsh_cornering, false) THEN
    v_severity := CASE
      WHEN v_speed >= 80 THEN 'critical'
      WHEN v_speed >= 50 THEN 'high'
      WHEN v_speed >= 30 THEN 'medium'
      ELSE 'low'
    END;

    INSERT INTO driver_behavior_events (device_id, tenant_id, driver_id, event_type, severity, latitude, longitude, speed, event_data)
    VALUES (NEW.device_id, NEW.tenant_id, v_driver_id, 'harsh_cornering', v_severity, NEW.latitude, NEW.longitude, v_speed,
      jsonb_build_object('heading', NEW.heading, 'engine_status', NEW.engine_status, 'source', 'telemetry_trigger'));
  END IF;

  -- Generate event for overspeeding
  IF COALESCE(NEW.overspeeding, false) THEN
    v_severity := CASE
      WHEN v_speed >= 140 THEN 'critical'
      WHEN v_speed >= 120 THEN 'high'
      WHEN v_speed >= 100 THEN 'medium'
      ELSE 'low'
    END;

    INSERT INTO driver_behavior_events (device_id, tenant_id, driver_id, event_type, severity, latitude, longitude, speed, event_data)
    VALUES (NEW.device_id, NEW.tenant_id, v_driver_id, 'overspeeding', v_severity, NEW.latitude, NEW.longitude, v_speed,
      jsonb_build_object('heading', NEW.heading, 'speed_limit_assumed', 100, 'source', 'telemetry_trigger'));
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to device_telemetry table
CREATE TRIGGER trg_generate_behavior_events
AFTER INSERT ON public.device_telemetry
FOR EACH ROW
EXECUTE FUNCTION public.generate_behavior_events_from_telemetry();

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_behavior_events_tenant_created 
ON public.driver_behavior_events (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_behavior_events_device 
ON public.driver_behavior_events (device_id, created_at DESC);
