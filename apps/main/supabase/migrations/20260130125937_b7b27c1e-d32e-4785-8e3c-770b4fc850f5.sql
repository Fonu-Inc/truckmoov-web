-- Add new columns for enhanced SIM request workflow
ALTER TABLE public.sim_provisioning_requests 
ADD COLUMN IF NOT EXISTS number_of_sims integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS deployment_timeline text,
ADD COLUMN IF NOT EXISTS device_mapping_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS device_mapping_file_path text,
ADD COLUMN IF NOT EXISTS device_mapping_data jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS use_case text,
ADD COLUMN IF NOT EXISTS preferred_operator text;

-- Add index for tenant request lookups
CREATE INDEX IF NOT EXISTS idx_sim_requests_tenant_status 
ON public.sim_provisioning_requests(tenant_id, status, created_at DESC);

-- Comment for clarity
COMMENT ON COLUMN public.sim_provisioning_requests.device_mapping_data IS 'Parsed rows from uploaded CSV: [{device_name, device_type, imei, vehicle_id, notes}]';