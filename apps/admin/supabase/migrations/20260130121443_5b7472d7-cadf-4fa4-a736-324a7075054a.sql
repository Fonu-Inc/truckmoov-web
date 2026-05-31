
-- Allow tenant admins to update profiles of users in their tenant
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
  AND tenant_id IS NOT NULL 
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- Allow tenant admins to view roles of users in their tenant
CREATE POLICY "Tenant admins can view tenant user roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'tenant_admin'::app_role) 
  AND user_id IN (
    SELECT p.user_id FROM public.profiles p 
    WHERE p.tenant_id = get_user_tenant_id(auth.uid())
  )
);

-- Allow tenant admins to update roles of users in their tenant (excluding platform_admin)
CREATE POLICY "Tenant admins can update tenant user roles"
ON public.user_roles
FOR UPDATE
USING (
  has_role(auth.uid(), 'tenant_admin'::app_role) 
  AND role != 'platform_admin'::app_role
  AND user_id IN (
    SELECT p.user_id FROM public.profiles p 
    WHERE p.tenant_id = get_user_tenant_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'tenant_admin'::app_role) 
  AND role != 'platform_admin'::app_role
  AND user_id IN (
    SELECT p.user_id FROM public.profiles p 
    WHERE p.tenant_id = get_user_tenant_id(auth.uid())
  )
);

-- Allow tenant admins to delete roles of users in their tenant (for removal)
CREATE POLICY "Tenant admins can delete tenant user roles"
ON public.user_roles
FOR DELETE
USING (
  has_role(auth.uid(), 'tenant_admin'::app_role) 
  AND role != 'platform_admin'::app_role
  AND user_id IN (
    SELECT p.user_id FROM public.profiles p 
    WHERE p.tenant_id = get_user_tenant_id(auth.uid())
  )
);
