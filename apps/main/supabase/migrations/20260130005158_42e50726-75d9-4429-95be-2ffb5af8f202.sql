-- Create jobs table for dispatch/transport jobs
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'assigned', 'in_progress', 'completed', 'cancelled')),
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC,
  pickup_lng NUMERIC,
  delivery_address TEXT NOT NULL,
  delivery_lat NUMERIC,
  delivery_lng NUMERIC,
  cargo_type TEXT,
  cargo_weight NUMERIC,
  cargo_description TEXT,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  amount_ngn NUMERIC DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table for fleet alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('speed', 'geofence', 'fuel', 'maintenance', 'sos', 'device', 'driver')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for jobs
CREATE POLICY "Tenant users view own jobs" ON public.jobs
  FOR SELECT USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users insert own jobs" ON public.jobs
  FOR INSERT WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users update own jobs" ON public.jobs
  FOR UPDATE USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users delete own jobs" ON public.jobs
  FOR DELETE USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- RLS policies for alerts
CREATE POLICY "Tenant users view own alerts" ON public.alerts
  FOR SELECT USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users insert own alerts" ON public.alerts
  FOR INSERT WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users update own alerts" ON public.alerts
  FOR UPDATE USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- Add updated_at trigger for jobs
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_jobs_tenant_id ON public.jobs(tenant_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_alerts_tenant_id ON public.alerts(tenant_id);
CREATE INDEX idx_alerts_acknowledged ON public.alerts(acknowledged);