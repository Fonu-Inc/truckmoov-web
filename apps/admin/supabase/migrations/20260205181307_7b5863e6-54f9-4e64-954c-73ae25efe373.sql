
-- Add public SELECT access for demo tenant on driver_messages
CREATE POLICY "Demo tenant public read driver_messages"
ON public.driver_messages FOR SELECT
USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');

-- Add public SELECT access for demo tenant on driver_call_logs
CREATE POLICY "Demo tenant public read driver_call_logs"
ON public.driver_call_logs FOR SELECT
USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');
