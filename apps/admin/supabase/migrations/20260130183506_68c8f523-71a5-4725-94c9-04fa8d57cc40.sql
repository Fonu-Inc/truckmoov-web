-- Create sim_activation_batches table for tracking activation jobs
CREATE TABLE public.sim_activation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.sim_provisioning_requests(id) ON DELETE SET NULL,
  tenant_id TEXT NOT NULL,
  tenant_name TEXT,
  
  -- Batch configuration
  activation_mode TEXT NOT NULL DEFAULT 'single' CHECK (activation_mode IN ('single', 'bulk')),
  quantity INTEGER NOT NULL DEFAULT 1,
  operator TEXT,
  data_limit_gb NUMERIC,
  requested_plan TEXT,
  
  -- Device mapping reference
  device_mapping_file_path TEXT,
  device_mapping_data JSONB DEFAULT '[]'::jsonb,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  sims_activated INTEGER DEFAULT 0,
  sims_failed INTEGER DEFAULT 0,
  
  -- Fonu integration
  fonu_batch_id TEXT,
  fonu_response JSONB,
  
  -- Audit
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Notes
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.sim_activation_batches ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage all batches
CREATE POLICY "Platform admins can manage activation batches"
ON public.sim_activation_batches
FOR ALL
USING (is_platform_admin(auth.uid()));

-- Tenant users can view their own batches
CREATE POLICY "Tenant users can view own activation batches"
ON public.sim_activation_batches
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_activation_batches_request_id ON public.sim_activation_batches(request_id);
CREATE INDEX idx_activation_batches_tenant_id ON public.sim_activation_batches(tenant_id);
CREATE INDEX idx_activation_batches_status ON public.sim_activation_batches(status);