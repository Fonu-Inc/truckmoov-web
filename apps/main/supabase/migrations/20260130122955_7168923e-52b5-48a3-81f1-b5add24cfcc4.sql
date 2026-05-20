
-- Drop the existing policy that's too restrictive
DROP POLICY IF EXISTS "Tenant admins can update tenant profiles" ON public.profiles;

-- Create a new policy that allows tenant admins to:
-- 1. Update profiles of users in their tenant (including setting tenant_id to null for removal)
CREATE POLICY "Tenant admins can update tenant profiles"
ON public.profiles
FOR UPDATE
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
