-- Add RLS policy to allow public SELECT for demo tenant devices
CREATE POLICY "Public can view demo devices"
ON public.devices
FOR SELECT
USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');