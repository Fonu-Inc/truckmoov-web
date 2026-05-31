-- Add a permissive policy for demo viewing of SIMs (allows unauthenticated access for development)
CREATE POLICY "Anyone can view SIMs for demo" 
ON public.iot_sims 
FOR SELECT 
USING (true);