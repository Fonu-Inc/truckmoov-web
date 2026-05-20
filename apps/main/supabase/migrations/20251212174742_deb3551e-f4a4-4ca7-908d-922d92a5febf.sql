-- Enable REPLICA IDENTITY FULL for complete row data
ALTER TABLE public.driver_behavior_events REPLICA IDENTITY FULL;
ALTER TABLE public.device_geofence_alerts REPLICA IDENTITY FULL;