
-- Create a SECURITY DEFINER function that checks if a user can view an org
-- without triggering RLS on the organizations table itself
CREATE OR REPLACE FUNCTION public.user_can_view_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Direct membership
    SELECT 1 FROM public.user_org_memberships
    WHERE user_id = _user_id AND org_id = _org_id AND membership_status = 'active'
  )
  OR EXISTS (
    -- Platform admin
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'platform_admin'
  )
  OR EXISTS (
    -- Related org via org_relationships (from side)
    SELECT 1 FROM public.org_relationships r
    JOIN public.user_org_memberships m ON m.org_id = r.from_org_id
    WHERE m.user_id = _user_id AND m.membership_status = 'active'
      AND r.to_org_id = _org_id AND r.status = 'ACTIVE'
      AND (r.end_date IS NULL OR r.end_date >= CURRENT_DATE)
  )
  OR EXISTS (
    -- Related org via org_relationships (to side)
    SELECT 1 FROM public.org_relationships r
    JOIN public.user_org_memberships m ON m.org_id = r.to_org_id
    WHERE m.user_id = _user_id AND m.membership_status = 'active'
      AND r.from_org_id = _org_id AND r.status = 'ACTIVE'
      AND (r.end_date IS NULL OR r.end_date >= CURRENT_DATE)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.user_can_view_org FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_view_org TO authenticated;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users view own and related organizations" ON public.organizations;

-- Drop the demo tenant policy (will be merged into the new one)
DROP POLICY IF EXISTS "Demo tenant public read organizations" ON public.organizations;

-- Recreate with non-recursive approach
CREATE POLICY "Users view own and related organizations"
ON public.organizations FOR SELECT
USING (
  tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f'
  OR public.user_can_view_org(auth.uid(), id)
);
