-- Add permissive RLS policy for demo tenant to insert SIM requests
CREATE POLICY "Demo tenant can insert SIM requests"
ON public.sim_provisioning_requests
FOR INSERT
WITH CHECK (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');

-- Add permissive SELECT policy for demo tenant
CREATE POLICY "Demo tenant can view SIM requests"
ON public.sim_provisioning_requests
FOR SELECT
USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');