-- Create driver fatigue alerts table
CREATE TABLE public.driver_fatigue_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  driver_id TEXT,
  driver_name TEXT,
  device_id TEXT NOT NULL,
  fatigue_score NUMERIC(3,1) NOT NULL CHECK (fatigue_score >= 0 AND fatigue_score <= 10),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  driving_duration_minutes INTEGER,
  rest_compliance_score NUMERIC(3,1),
  indicators JSONB DEFAULT '[]'::jsonb,
  recommendations TEXT[],
  ai_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_fatigue_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view fatigue alerts for their tenant"
ON public.driver_fatigue_alerts
FOR SELECT
USING (true);

CREATE POLICY "System can insert fatigue alerts"
ON public.driver_fatigue_alerts
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_fatigue_alerts_tenant ON public.driver_fatigue_alerts(tenant_id);
CREATE INDEX idx_fatigue_alerts_device ON public.driver_fatigue_alerts(device_id);
CREATE INDEX idx_fatigue_alerts_created ON public.driver_fatigue_alerts(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_fatigue_alerts;