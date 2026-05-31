-- Create devices table for storing IoT device information
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imei TEXT NOT NULL UNIQUE,
  manufacturer TEXT NOT NULL DEFAULT 'generic',
  model TEXT,
  firmware_version TEXT,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'configured', 'assigned', 'active', 'faulty', 'decommissioned')),
  vehicle_id UUID,
  sim_id UUID,
  tenant_id TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE,
  signal_strength INTEGER,
  battery_level INTEGER,
  protocol TEXT DEFAULT 'http' CHECK (protocol IN ('http', 'mqtt', 'websocket', 'sdk')),
  device_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create device telemetry table for real-time data
CREATE TABLE public.device_telemetry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Location data
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  altitude NUMERIC(8, 2),
  speed NUMERIC(6, 2),
  heading INTEGER,
  accuracy NUMERIC(6, 2),
  -- Vehicle telemetry
  fuel_level NUMERIC(5, 2),
  odometer NUMERIC(12, 2),
  engine_status TEXT,
  engine_rpm INTEGER,
  coolant_temp INTEGER,
  battery_voltage NUMERIC(5, 2),
  -- Driver behavior
  harsh_braking BOOLEAN DEFAULT FALSE,
  harsh_acceleration BOOLEAN DEFAULT FALSE,
  harsh_cornering BOOLEAN DEFAULT FALSE,
  overspeeding BOOLEAN DEFAULT FALSE,
  -- Raw data
  raw_data JSONB DEFAULT '{}'
);

-- Create driver behavior events table
CREATE TABLE public.driver_behavior_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  driver_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding', 'fatigue', 'distraction', 'seatbelt')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  speed NUMERIC(6, 2),
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create geofence alerts table
CREATE TABLE public.device_geofence_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  geofence_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('enter', 'exit', 'dwell')),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_geofence_alerts ENABLE ROW LEVEL SECURITY;

-- Devices policies
CREATE POLICY "Authenticated users can view devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert devices" ON public.devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update devices" ON public.devices FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete devices" ON public.devices FOR DELETE USING (true);

-- Telemetry policies
CREATE POLICY "Authenticated users can view telemetry" ON public.device_telemetry FOR SELECT USING (true);
CREATE POLICY "Public can insert telemetry" ON public.device_telemetry FOR INSERT WITH CHECK (true);

-- Driver behavior policies
CREATE POLICY "Authenticated users can view behavior events" ON public.driver_behavior_events FOR SELECT USING (true);
CREATE POLICY "Public can insert behavior events" ON public.driver_behavior_events FOR INSERT WITH CHECK (true);

-- Geofence alerts policies
CREATE POLICY "Authenticated users can view geofence alerts" ON public.device_geofence_alerts FOR SELECT USING (true);
CREATE POLICY "Public can insert geofence alerts" ON public.device_geofence_alerts FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_devices_tenant ON public.devices(tenant_id);
CREATE INDEX idx_devices_status ON public.devices(status);
CREATE INDEX idx_devices_imei ON public.devices(imei);
CREATE INDEX idx_telemetry_device ON public.device_telemetry(device_id);
CREATE INDEX idx_telemetry_timestamp ON public.device_telemetry(timestamp DESC);
CREATE INDEX idx_behavior_device ON public.driver_behavior_events(device_id);
CREATE INDEX idx_geofence_device ON public.device_geofence_alerts(device_id);

-- Update timestamp trigger
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for telemetry
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_telemetry;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_behavior_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_geofence_alerts;