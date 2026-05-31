
-- Remove duplicate/stale geofence trigger (old one)
DROP TRIGGER IF EXISTS tr_evaluate_geofences ON public.device_telemetry;
DROP FUNCTION IF EXISTS public.trigger_geofence_evaluation();

-- Remove the broken combined trigger
DROP TRIGGER IF EXISTS trg_process_telemetry ON public.device_telemetry;
DROP FUNCTION IF EXISTS public.process_telemetry_triggers();
