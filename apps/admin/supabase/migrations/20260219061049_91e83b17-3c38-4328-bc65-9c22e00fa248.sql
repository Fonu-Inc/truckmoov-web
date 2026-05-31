
-- Phase 2: Migrate DB permission functions to org-scoped roles
-- These functions now check user_org_roles instead of user_roles

-- Helper: check if user has any of the specified org role keys
CREATE OR REPLACE FUNCTION public.has_any_org_role(_user_id uuid, _role_keys text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_org_roles
    WHERE user_id = _user_id
      AND role_key = ANY(_role_keys)
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'platform_admin'
  )
$$;

-- can_view_devices: ADMIN, OPS_MGR, DISPATCHER, FINANCE, VIEWER + platform_admin
CREATE OR REPLACE FUNCTION public.can_view_devices(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER', 'FINANCE', 'VIEWER'])
$$;

-- can_manage_devices: ADMIN, OPS_MGR + platform_admin
CREATE OR REPLACE FUNCTION public.can_manage_devices(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN', 'OPERATIONS_MANAGER'])
$$;

-- can_configure_devices: ADMIN, OPS_MGR + platform_admin
CREATE OR REPLACE FUNCTION public.can_configure_devices(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN', 'OPERATIONS_MANAGER'])
$$;

-- can_request_sim_activation: ADMIN only
CREATE OR REPLACE FUNCTION public.can_request_sim_activation(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN'])
$$;

-- can_approve_sim_requests: platform_admin only (unchanged logic)
CREATE OR REPLACE FUNCTION public.can_approve_sim_requests(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'platform_admin'
  )
$$;

-- can_configure_fonu: platform_admin only (unchanged)
CREATE OR REPLACE FUNCTION public.can_configure_fonu(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'platform_admin'
  )
$$;

-- can_view_sims: all org roles + platform_admin
CREATE OR REPLACE FUNCTION public.can_view_sims(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER', 'FINANCE', 'VIEWER'])
$$;

-- can_assign_sim_to_device: ADMIN only
CREATE OR REPLACE FUNCTION public.can_assign_sim_to_device(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN'])
$$;

-- can_manage_whatsapp: ADMIN + platform_admin
CREATE OR REPLACE FUNCTION public.can_manage_whatsapp(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN'])
$$;

-- can_send_whatsapp: ADMIN, OPS_MGR, DISPATCHER + platform_admin
CREATE OR REPLACE FUNCTION public.can_send_whatsapp(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER'])
$$;

-- can_view_whatsapp: all org roles + platform_admin
CREATE OR REPLACE FUNCTION public.can_view_whatsapp(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER', 'FINANCE', 'VIEWER'])
$$;

-- can_create_support_ticket: ADMIN, OPS_MGR + platform_admin
CREATE OR REPLACE FUNCTION public.can_create_support_ticket(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN', 'OPERATIONS_MANAGER'])
$$;

-- can_view_support_tickets: ADMIN, OPS_MGR, DISPATCHER + platform_admin
CREATE OR REPLACE FUNCTION public.can_view_support_tickets(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER'])
$$;

-- can_manage_all_support_tickets: platform_admin only (unchanged)
CREATE OR REPLACE FUNCTION public.can_manage_all_support_tickets(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'platform_admin'
  )
$$;

-- can_manage_accounting_integrations: ADMIN + platform_admin
CREATE OR REPLACE FUNCTION public.can_manage_accounting_integrations(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_org_role(_user_id, ARRAY['ADMIN'])
$$;
