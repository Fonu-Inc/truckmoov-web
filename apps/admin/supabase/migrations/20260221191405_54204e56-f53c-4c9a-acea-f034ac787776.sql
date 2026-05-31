
-- Add permissive RLS policy for tenant_ai_config to allow demo/anon access
-- This is needed because demo mode uses unauthenticated sessions
CREATE POLICY "Allow demo access to tenant_ai_config"
  ON public.tenant_ai_config
  FOR ALL
  USING (true)
  WITH CHECK (true);
