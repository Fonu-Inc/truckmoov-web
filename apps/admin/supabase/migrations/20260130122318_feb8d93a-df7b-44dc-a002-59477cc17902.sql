
-- Allow tenant admins to insert roles for users in their tenant
CREATE POLICY "Tenant admins can insert tenant user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'tenant_admin'::app_role) 
  AND role != 'platform_admin'::app_role
  AND user_id IN (
    SELECT p.user_id FROM public.profiles p 
    WHERE p.tenant_id = get_user_tenant_id(auth.uid())
  )
);
