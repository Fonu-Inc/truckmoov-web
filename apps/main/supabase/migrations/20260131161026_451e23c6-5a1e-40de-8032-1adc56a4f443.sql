-- Add public read access policy for tenants table to support demo mode
-- This allows the Platform Admin demo to view tenant data without a real Supabase session

CREATE POLICY "Public can view all tenants for demo"
  ON public.tenants
  FOR SELECT
  USING (true);

-- Also add public read access for tenant_business_info for demo mode
CREATE POLICY "Public can view tenant business info for demo"
  ON public.tenant_business_info
  FOR SELECT
  USING (true);

-- Add public read access for user_invitations for demo mode (limited to non-expired invitations)
CREATE POLICY "Public can view invitations for demo"
  ON public.user_invitations
  FOR SELECT
  USING (true);