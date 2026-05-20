
-- Allow anon/unauthenticated users to view device_setup_requests by tenant_id
-- This enables the Quick Demo Access mode to display sample data
DROP POLICY IF EXISTS "Members can view own org requests" ON public.device_setup_requests;

CREATE POLICY "Members can view own org requests"
ON public.device_setup_requests FOR SELECT
USING (
  -- Authenticated users: org-level visibility
  public.is_org_member(auth.uid(), requesting_org_id)
  OR public.is_org_member(auth.uid(), configurator_org_id)
  OR public.has_cross_org_visibility(auth.uid(), requesting_org_id)
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  -- Fallback for demo/anon access: tenant-level visibility
  OR (auth.uid() IS NULL AND tenant_id IS NOT NULL)
);
