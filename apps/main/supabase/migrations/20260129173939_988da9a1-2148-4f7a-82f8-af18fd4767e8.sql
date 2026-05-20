-- Add a permissive policy for public read access to tenant_business_info
CREATE POLICY "Anyone can view business info for demo" 
ON public.tenant_business_info 
FOR SELECT 
USING (true);