
-- Fix infinite recursion: make get_user_org_ids bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.user_org_memberships
  WHERE user_id = _user_id AND membership_status = 'active'
$$;
