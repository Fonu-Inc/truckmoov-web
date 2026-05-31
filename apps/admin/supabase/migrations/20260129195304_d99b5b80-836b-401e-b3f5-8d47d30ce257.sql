-- Create a security definer function to get user's tenant_id without recursion
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Tenant admins can view tenant profiles" ON public.profiles;

-- Recreate without self-referencing subquery
CREATE POLICY "Tenant admins can view tenant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (tenant_id IS NOT NULL) 
  AND (tenant_id = get_user_tenant_id(auth.uid()))
  AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'supervisor'))
);