-- Ensure platform admins can update any profile (needed for admin user management)
DROP POLICY IF EXISTS "Platform admins can update all profiles" ON public.profiles;
CREATE POLICY "Platform admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Recreate tenant-admin update policy with explicit role target
DROP POLICY IF EXISTS "Tenant admins can update tenant profiles" ON public.profiles;
CREATE POLICY "Tenant admins can update tenant profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'tenant_admin'::app_role)
  AND tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'tenant_admin'::app_role)
  AND (
    -- Allow updating profiles that stay in the same tenant
    (tenant_id IS NOT NULL AND tenant_id = get_user_tenant_id(auth.uid()))
    OR
    -- Allow removing user from tenant (setting tenant_id to null)
    tenant_id IS NULL
  )
);
