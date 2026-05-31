-- Add RLS policy to allow public updates to demo tenant drivers
CREATE POLICY "Public can update demo drivers"
ON public.drivers
FOR UPDATE
USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f'::text)
WITH CHECK (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f'::text);