
-- Allow public read of jobs for the demo tenant so job offers can display details
CREATE POLICY "Public read jobs for demo tenant"
ON public.jobs FOR SELECT
USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');
