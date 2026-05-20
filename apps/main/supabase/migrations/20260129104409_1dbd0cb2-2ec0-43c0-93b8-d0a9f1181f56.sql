-- Create IoT SIM Cards table (Fonu-powered)
CREATE TABLE public.iot_sims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  iccid TEXT NOT NULL UNIQUE,
  imsi TEXT,
  msisdn TEXT NOT NULL,
  carrier TEXT NOT NULL DEFAULT 'MTN Nigeria',
  plan TEXT NOT NULL DEFAULT 'iot_basic',
  status TEXT NOT NULL DEFAULT 'registered',
  tenant_id TEXT,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  data_usage_mb NUMERIC NOT NULL DEFAULT 0,
  data_limit_mb NUMERIC NOT NULL DEFAULT 1000,
  sms_usage INTEGER NOT NULL DEFAULT 0,
  sms_limit INTEGER NOT NULL DEFAULT 0,
  monthly_cost_ngn NUMERIC NOT NULL DEFAULT 0,
  activation_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE,
  signal_strength INTEGER,
  network_type TEXT DEFAULT '4G',
  roaming BOOLEAN DEFAULT false,
  fonu_sim_id TEXT,
  fonu_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SIM Provisioning Requests (Approval Queue)
CREATE TABLE public.sim_provisioning_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT NOT NULL DEFAULT 'activation',
  sim_id UUID REFERENCES public.iot_sims(id) ON DELETE CASCADE,
  iccid TEXT,
  msisdn TEXT,
  tenant_id TEXT NOT NULL,
  tenant_name TEXT,
  requested_plan TEXT,
  requested_data_limit_mb NUMERIC,
  requested_by UUID,
  requested_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  fonu_request_id TEXT,
  fonu_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SIM Usage Signals table (from Fonu webhooks)
CREATE TABLE public.sim_usage_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sim_id UUID REFERENCES public.iot_sims(id) ON DELETE CASCADE,
  iccid TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  data_usage_mb NUMERIC,
  sms_count INTEGER,
  signal_strength INTEGER,
  network_type TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  raw_data JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.iot_sims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_provisioning_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_usage_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for iot_sims
CREATE POLICY "Authenticated users can view SIMs"
  ON public.iot_sims FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert SIMs"
  ON public.iot_sims FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update SIMs"
  ON public.iot_sims FOR UPDATE
  USING (true);

CREATE POLICY "Platform admins can delete SIMs"
  ON public.iot_sims FOR DELETE
  USING (public.is_platform_admin(auth.uid()));

-- RLS Policies for sim_provisioning_requests
CREATE POLICY "Authenticated users can view provisioning requests"
  ON public.sim_provisioning_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert provisioning requests"
  ON public.sim_provisioning_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update provisioning requests"
  ON public.sim_provisioning_requests FOR UPDATE
  USING (true);

-- RLS Policies for sim_usage_signals
CREATE POLICY "Authenticated users can view usage signals"
  ON public.sim_usage_signals FOR SELECT
  USING (true);

CREATE POLICY "System can insert usage signals"
  ON public.sim_usage_signals FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_iot_sims_tenant ON public.iot_sims(tenant_id);
CREATE INDEX idx_iot_sims_status ON public.iot_sims(status);
CREATE INDEX idx_iot_sims_iccid ON public.iot_sims(iccid);
CREATE INDEX idx_sim_provisioning_status ON public.sim_provisioning_requests(status);
CREATE INDEX idx_sim_usage_signals_sim_id ON public.sim_usage_signals(sim_id);
CREATE INDEX idx_sim_usage_signals_recorded ON public.sim_usage_signals(recorded_at);

-- Add updated_at trigger
CREATE TRIGGER update_iot_sims_updated_at
  BEFORE UPDATE ON public.iot_sims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sim_provisioning_requests_updated_at
  BEFORE UPDATE ON public.sim_provisioning_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();