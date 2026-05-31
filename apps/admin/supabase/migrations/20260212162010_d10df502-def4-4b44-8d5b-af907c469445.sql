
-- ============================================================================
-- Write Permission Controls: Org-type-aware RLS enforcement
-- ============================================================================

-- 1) Helper: get org type as text
CREATE OR REPLACE FUNCTION public.get_org_type(_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT organization_type::text FROM public.organizations WHERE id = _org_id LIMIT 1
$$;

-- 2) Helper: check if user belongs to an org of a given type
CREATE OR REPLACE FUNCTION public.user_has_org_type(_user_id uuid, _org_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_org_memberships uom
    JOIN public.organizations o ON uom.org_id = o.id
    WHERE uom.user_id = _user_id
      AND uom.membership_status = 'active'
      AND o.organization_type::text = _org_type
  )
$$;

-- 3) Refined can_write_org_entity that also checks org-type restrictions
CREATE OR REPLACE FUNCTION public.can_write_org_entity_v2(
  _user_id uuid,
  _entity_org_id uuid,
  _permission text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _is_platform_admin boolean;
  _is_member boolean;
  _has_perm boolean;
  _user_org_type text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin'
  ) INTO _is_platform_admin;
  IF _is_platform_admin THEN RETURN true; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_org_memberships
    WHERE user_id = _user_id AND org_id = _entity_org_id AND membership_status = 'active'
  ) INTO _is_member;
  IF NOT _is_member THEN RETURN false; END IF;

  SELECT public.has_org_permission(_user_id, _entity_org_id, _permission) INTO _has_perm;
  IF NOT _has_perm THEN RETURN false; END IF;

  SELECT o.organization_type::text INTO _user_org_type
  FROM public.user_org_memberships uom
  JOIN public.organizations o ON uom.org_id = o.id
  WHERE uom.user_id = _user_id AND uom.org_id = _entity_org_id AND uom.membership_status = 'active'
  LIMIT 1;

  -- ENTERPRISE cannot write to fleet assets
  IF _user_org_type = 'ENTERPRISE' AND _permission IN ('assets:manage', 'drivers:manage', 'vehicles:manage', 'devices:manage') THEN
    RETURN false;
  END IF;

  -- OWNER_OPERATOR cannot manage relationships or create sub-orgs
  IF _user_org_type = 'OWNER_OPERATOR' AND _permission IN ('relationships:manage', 'org:manage') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- 4) Replace vehicles write policies
DROP POLICY IF EXISTS vehicles_insert_policy ON public.vehicles;
CREATE POLICY vehicles_insert_policy ON public.vehicles FOR INSERT
  WITH CHECK (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (owning_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), owning_org_id, 'assets:manage'))
  );

DROP POLICY IF EXISTS vehicles_update_policy ON public.vehicles;
CREATE POLICY vehicles_update_policy ON public.vehicles FOR UPDATE
  USING (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (owning_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), owning_org_id, 'assets:manage'))
  );

DROP POLICY IF EXISTS vehicles_delete_policy ON public.vehicles;
CREATE POLICY vehicles_delete_policy ON public.vehicles FOR DELETE
  USING (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (owning_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), owning_org_id, 'assets:manage'))
  );

-- 5) Replace drivers write policies
DROP POLICY IF EXISTS drivers_insert_policy ON public.drivers;
CREATE POLICY drivers_insert_policy ON public.drivers FOR INSERT
  WITH CHECK (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (owning_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), owning_org_id, 'assets:manage'))
  );

DROP POLICY IF EXISTS drivers_update_policy ON public.drivers;
CREATE POLICY drivers_update_policy ON public.drivers FOR UPDATE
  USING (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (owning_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), owning_org_id, 'assets:manage'))
  );

DROP POLICY IF EXISTS drivers_delete_policy ON public.drivers;
CREATE POLICY drivers_delete_policy ON public.drivers FOR DELETE
  USING (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (owning_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), owning_org_id, 'assets:manage'))
  );

-- 6) Replace devices write policies
DROP POLICY IF EXISTS devices_insert_policy ON public.devices;
CREATE POLICY devices_insert_policy ON public.devices FOR INSERT
  WITH CHECK (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (owning_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), owning_org_id, 'assets:manage'))
  );

DROP POLICY IF EXISTS devices_update_policy ON public.devices;
CREATE POLICY devices_update_policy ON public.devices FOR UPDATE
  USING (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (owning_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), owning_org_id, 'assets:manage'))
  );

DROP POLICY IF EXISTS devices_delete_policy ON public.devices;
CREATE POLICY devices_delete_policy ON public.devices FOR DELETE
  USING (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (owning_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), owning_org_id, 'assets:manage'))
  );

-- 7) Tighten jobs insert
DROP POLICY IF EXISTS jobs_insert_policy ON public.jobs;
CREATE POLICY jobs_insert_policy ON public.jobs FOR INSERT
  WITH CHECK (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (job_owner_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), job_owner_org_id, 'jobs:create'))
  );

-- 8) Tighten jobs update
DROP POLICY IF EXISTS jobs_update_policy ON public.jobs;
CREATE POLICY jobs_update_policy ON public.jobs FOR UPDATE
  USING (
    (get_user_tenant_id(auth.uid()) = tenant_id)
    OR (job_owner_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), job_owner_org_id, 'jobs:manage'))
    OR (executing_org_id IS NOT NULL AND can_write_org_entity_v2(auth.uid(), executing_org_id, 'jobs:execute'))
  );

-- 9) Owner-Operator can accept/decline job_offers
DROP POLICY IF EXISTS job_offers_update_policy ON public.job_offers;
CREATE POLICY job_offers_update_policy ON public.job_offers FOR UPDATE
  USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'platform_admin'))
    OR is_org_member(auth.uid(), job_owner_org_id)
    OR (
      is_org_member(auth.uid(), target_org_id)
      AND has_org_permission(auth.uid(), target_org_id, 'accept_decline_offers')
    )
  );
