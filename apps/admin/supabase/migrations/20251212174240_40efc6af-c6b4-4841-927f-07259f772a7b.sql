-- Enable REPLICA IDENTITY FULL for complete row data during updates
ALTER TABLE public.device_telemetry REPLICA IDENTITY FULL;