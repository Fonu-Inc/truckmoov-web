
-- ============================================================
-- PHASE 4: QUERY ISOLATION & ACCESS CONTROL
-- Reusable policy engine + RLS enforcement on core tables
-- ============================================================

-- 1) Core access resolver: can user READ an entity owned by a given org?
--    Grants read if:
--      a) User is platform_admin (legacy)
--      b) User belongs to the same org
--      c) User has CROSS_ORG role AND an active relationship to entity org
CREATE OR REPLACE FUNCTION public.can_read_org_entity(_user_id uuid, _entity_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    -- platform admin legacy bypass
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin')
    OR
    -- same org membership
    EXISTS (
      SELECT 1 FROM public.user_org_memberships
      WHERE user_id = _user_id AND org_id = _entity_org_id AND membership_status = 'active'
    )
    OR
    -- cross-org visibility via relationship
    public.has_cross_org_visibility(_user_id, _entity_org_id)
$$;

-- 2) Core access resolver: can user WRITE an entity owned by a given org?
--    Grants write ONLY if user belongs to the owning org AND has a write permission.
--    Cross-org users are read-only by design.
CREATE OR REPLACE FUNCTION public.can_write_org_entity(_user_id uuid, _entity_org_id uuid, _permission text DEFAULT 'assets:manage')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    -- platform admin legacy bypass
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin')
    OR
    -- same org + has the required permission
    (
      EXISTS (
        SELECT 1 FROM public.user_org_memberships
        WHERE user_id = _user_id AND org_id = _entity_org_id AND membership_status = 'active'
      )
      AND public.has_org_permission(_user_id, _entity_org_id, _permission)
    )
$$;

-- 3) Job-specific read: user can read a job if they belong to owner org OR executing org
CREATE OR REPLACE FUNCTION public.can_read_job(_user_id uuid, _job_owner_org_id uuid, _executing_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin')
    OR
    -- belongs to job owner org
    EXISTS (
      SELECT 1 FROM public.user_org_memberships
      WHERE user_id = _user_id AND org_id = _job_owner_org_id AND membership_status = 'active'
    )
    OR
    -- belongs to executing org
    (_executing_org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.user_org_memberships
      WHERE user_id = _user_id AND org_id = _executing_org_id AND membership_status = 'active'
    ))
    OR
    -- cross-org visibility to either
    public.has_cross_org_visibility(_user_id, _job_owner_org_id)
    OR
    (_executing_org_id IS NOT NULL AND public.has_cross_org_visibility(_user_id, _executing_org_id))
$$;

-- 4) Job-specific write: only executing org can modify execution, owner org can modify job details
CREATE OR REPLACE FUNCTION public.can_write_job_execution(_user_id uuid, _executing_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin')
    OR
    (
      _executing_org_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_org_memberships
        WHERE user_id = _user_id AND org_id = _executing_org_id AND membership_status = 'active'
      )
      AND public.has_org_permission(_user_id, _executing_org_id, 'execution:manage')
    )
$$;

-- 5) Tenant-fallback wrapper: for tables that still use tenant_id (transition period)
--    Returns true if user belongs to ANY org under the given tenant, or is platform_admin
CREATE OR REPLACE FUNCTION public.can_access_tenant_entity(_user_id uuid, _tenant_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin')
    OR
    -- legacy tenant match
    (public.get_user_tenant_id(_user_id) = _tenant_id)
    OR
    -- org-based: user belongs to an org under this tenant
    EXISTS (
      SELECT 1
      FROM public.user_org_memberships uom
      JOIN public.organizations o ON uom.org_id = o.id
      WHERE uom.user_id = _user_id
        AND uom.membership_status = 'active'
        AND o.tenant_id = _tenant_id
    )
$$;

-- ============================================================
-- 6) UPDATE RLS ON VEHICLES — org-scoped read/write
-- ============================================================

-- Drop existing vehicle policies to replace them
DROP POLICY IF EXISTS "Tenant users can view own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Tenant admins can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Tenant admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Tenant admins can delete vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Platform admins can view all vehicles" ON public.vehicles;

-- Read: tenant match OR org ownership OR cross-org visibility
CREATE POLICY "vehicles_select_policy" ON public.vehicles
FOR SELECT USING (
  public.can_access_tenant_entity(auth.uid(), tenant_id)
  OR (owning_org_id IS NOT NULL AND public.can_read_org_entity(auth.uid(), owning_org_id))
  OR (managing_org_id IS NOT NULL AND public.can_read_org_entity(auth.uid(), managing_org_id))
);

-- Insert: tenant match + write permission on owning org (or legacy tenant_admin)
CREATE POLICY "vehicles_insert_policy" ON public.vehicles
FOR INSERT WITH CHECK (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (owning_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), owning_org_id, 'assets:manage'))
);

-- Update: must own the asset's org (not cross-org)
CREATE POLICY "vehicles_update_policy" ON public.vehicles
FOR UPDATE USING (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (owning_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), owning_org_id, 'assets:manage'))
);

-- Delete: same as update
CREATE POLICY "vehicles_delete_policy" ON public.vehicles
FOR DELETE USING (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (owning_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), owning_org_id, 'assets:manage'))
);

-- ============================================================
-- 7) UPDATE RLS ON DRIVERS — org-scoped
-- ============================================================
DROP POLICY IF EXISTS "Tenant users can view own drivers" ON public.drivers;
DROP POLICY IF EXISTS "Tenant admins can insert drivers" ON public.drivers;
DROP POLICY IF EXISTS "Tenant admins can update drivers" ON public.drivers;
DROP POLICY IF EXISTS "Tenant admins can delete drivers" ON public.drivers;
DROP POLICY IF EXISTS "Platform admins can view all drivers" ON public.drivers;

CREATE POLICY "drivers_select_policy" ON public.drivers
FOR SELECT USING (
  public.can_access_tenant_entity(auth.uid(), tenant_id)
  OR (owning_org_id IS NOT NULL AND public.can_read_org_entity(auth.uid(), owning_org_id))
);

CREATE POLICY "drivers_insert_policy" ON public.drivers
FOR INSERT WITH CHECK (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (owning_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), owning_org_id, 'assets:manage'))
);

CREATE POLICY "drivers_update_policy" ON public.drivers
FOR UPDATE USING (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (owning_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), owning_org_id, 'assets:manage'))
);

CREATE POLICY "drivers_delete_policy" ON public.drivers
FOR DELETE USING (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (owning_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), owning_org_id, 'assets:manage'))
);

-- ============================================================
-- 8) UPDATE RLS ON DEVICES — org-scoped
-- ============================================================
DROP POLICY IF EXISTS "Tenant users can view own devices" ON public.devices;
DROP POLICY IF EXISTS "Tenant admins can manage devices" ON public.devices;
DROP POLICY IF EXISTS "Platform admins can view all devices" ON public.devices;
DROP POLICY IF EXISTS "Allow telemetry inserts" ON public.devices;

CREATE POLICY "devices_select_policy" ON public.devices
FOR SELECT USING (
  public.can_access_tenant_entity(auth.uid(), tenant_id)
  OR (owning_org_id IS NOT NULL AND public.can_read_org_entity(auth.uid(), owning_org_id))
);

CREATE POLICY "devices_insert_policy" ON public.devices
FOR INSERT WITH CHECK (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (owning_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), owning_org_id, 'assets:manage'))
);

CREATE POLICY "devices_update_policy" ON public.devices
FOR UPDATE USING (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (owning_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), owning_org_id, 'assets:manage'))
);

CREATE POLICY "devices_delete_policy" ON public.devices
FOR DELETE USING (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (owning_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), owning_org_id, 'assets:manage'))
);

-- ============================================================
-- 9) UPDATE RLS ON JOBS — dual-org model
-- ============================================================
DROP POLICY IF EXISTS "Tenant users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Tenant admins can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Tenant admins can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Platform admins can view all jobs" ON public.jobs;

CREATE POLICY "jobs_select_policy" ON public.jobs
FOR SELECT USING (
  public.can_access_tenant_entity(auth.uid(), tenant_id)
  OR public.can_read_job(auth.uid(), job_owner_org_id, executing_org_id)
);

CREATE POLICY "jobs_insert_policy" ON public.jobs
FOR INSERT WITH CHECK (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (job_owner_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), job_owner_org_id, 'jobs:create'))
);

-- Update: job owner can edit job details, executing org can update execution fields
CREATE POLICY "jobs_update_policy" ON public.jobs
FOR UPDATE USING (
  public.get_user_tenant_id(auth.uid()) = tenant_id
  OR (job_owner_org_id IS NOT NULL AND public.can_write_org_entity(auth.uid(), job_owner_org_id, 'jobs:manage'))
  OR public.can_write_job_execution(auth.uid(), executing_org_id)
);

-- ============================================================
-- 10) UPDATE RLS ON JOB_OFFERS — org-scoped
-- ============================================================
DROP POLICY IF EXISTS "job_offers_select" ON public.job_offers;
DROP POLICY IF EXISTS "job_offers_insert" ON public.job_offers;
DROP POLICY IF EXISTS "job_offers_update" ON public.job_offers;

CREATE POLICY "job_offers_select_policy" ON public.job_offers
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  OR public.is_org_member(auth.uid(), job_owner_org_id)
  OR public.is_org_member(auth.uid(), target_org_id)
  OR public.has_cross_org_visibility(auth.uid(), job_owner_org_id)
  OR public.has_cross_org_visibility(auth.uid(), target_org_id)
);

CREATE POLICY "job_offers_insert_policy" ON public.job_offers
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  OR (public.is_org_member(auth.uid(), job_owner_org_id) AND public.has_org_permission(auth.uid(), job_owner_org_id, 'jobs:dispatch'))
);

-- Target org can accept/decline; owner org can cancel
CREATE POLICY "job_offers_update_policy" ON public.job_offers
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  OR public.is_org_member(auth.uid(), job_owner_org_id)
  OR (public.is_org_member(auth.uid(), target_org_id) AND public.has_org_permission(auth.uid(), target_org_id, 'execution:manage'))
);
