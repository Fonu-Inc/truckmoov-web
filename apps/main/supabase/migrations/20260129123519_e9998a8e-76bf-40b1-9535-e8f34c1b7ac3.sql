-- Update can_manage_devices function to include platform_admin
CREATE OR REPLACE FUNCTION public.can_manage_devices(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('tenant_admin', 'operations_manager', 'platform_admin')
  )
$$;