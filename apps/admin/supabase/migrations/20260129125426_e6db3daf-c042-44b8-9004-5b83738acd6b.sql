-- Create security definer functions for SIM permission checks

-- Function to check if user can request SIM activation (Fleet Admin only)
CREATE OR REPLACE FUNCTION public.can_request_sim_activation(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'tenant_admin'
  )
$$;

-- Function to check if user can approve SIM requests (Platform SuperAdmin only)
CREATE OR REPLACE FUNCTION public.can_approve_sim_requests(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'platform_admin'
  )
$$;

-- Function to check if user can configure Fonu (Platform SuperAdmin only)
CREATE OR REPLACE FUNCTION public.can_configure_fonu(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'platform_admin'
  )
$$;

-- Function to check if user can view SIMs (all authorized roles except driver)
CREATE OR REPLACE FUNCTION public.can_view_sims(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('tenant_admin', 'operations_manager', 'dispatcher', 'platform_admin', 'viewer_finance', 'supervisor')
  )
$$;

-- Function to check if user can assign SIMs to devices (Fleet Admin only)
CREATE OR REPLACE FUNCTION public.can_assign_sim_to_device(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'tenant_admin'
  )
$$;

-- Drop existing policies on iot_sims table
DROP POLICY IF EXISTS "Authenticated users can view SIMs" ON public.iot_sims;
DROP POLICY IF EXISTS "Authenticated users can insert SIMs" ON public.iot_sims;
DROP POLICY IF EXISTS "Authenticated users can update SIMs" ON public.iot_sims;
DROP POLICY IF EXISTS "Platform admins can delete SIMs" ON public.iot_sims;

-- Create new RBAC-based policies for iot_sims
CREATE POLICY "Authorized users can view SIMs"
ON public.iot_sims FOR SELECT
USING (can_view_sims(auth.uid()));

CREATE POLICY "Platform admins can insert SIMs"
ON public.iot_sims FOR INSERT
WITH CHECK (can_approve_sim_requests(auth.uid()));

CREATE POLICY "Platform admins can update SIMs"
ON public.iot_sims FOR UPDATE
USING (can_approve_sim_requests(auth.uid()));

CREATE POLICY "Platform admins can delete SIMs"
ON public.iot_sims FOR DELETE
USING (can_approve_sim_requests(auth.uid()));

-- Drop existing policies on sim_provisioning_requests table
DROP POLICY IF EXISTS "Authenticated users can view provisioning requests" ON public.sim_provisioning_requests;
DROP POLICY IF EXISTS "Authenticated users can insert provisioning requests" ON public.sim_provisioning_requests;
DROP POLICY IF EXISTS "Authenticated users can update provisioning requests" ON public.sim_provisioning_requests;

-- Create new RBAC-based policies for sim_provisioning_requests
-- Fleet admins and platform admins can view requests
CREATE POLICY "Authorized users can view provisioning requests"
ON public.sim_provisioning_requests FOR SELECT
USING (
  can_request_sim_activation(auth.uid()) OR can_approve_sim_requests(auth.uid())
);

-- Fleet admins and platform admins can insert requests
CREATE POLICY "Authorized users can insert provisioning requests"
ON public.sim_provisioning_requests FOR INSERT
WITH CHECK (
  can_request_sim_activation(auth.uid()) OR can_approve_sim_requests(auth.uid())
);

-- Only platform admins can update requests (approve/reject)
CREATE POLICY "Platform admins can update provisioning requests"
ON public.sim_provisioning_requests FOR UPDATE
USING (can_approve_sim_requests(auth.uid()));

-- Drop existing policies on sim_usage_signals table
DROP POLICY IF EXISTS "Authenticated users can view usage signals" ON public.sim_usage_signals;

-- Create new policy for sim_usage_signals (viewable by authorized roles)
CREATE POLICY "Authorized users can view usage signals"
ON public.sim_usage_signals FOR SELECT
USING (can_view_sims(auth.uid()));