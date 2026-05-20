
-- ============================================================
-- DATA ISOLATION: Remove legacy tenant-only policies
-- that bypass org-based access control.
-- Org-based policies (using can_read_org_entity, can_write_org_entity,
-- can_read_job, etc.) remain and enforce isolation via
-- org_relationships + RBAC.
-- ============================================================

-- VEHICLES: Drop legacy tenant-only policies (org-based policies already exist)
DROP POLICY IF EXISTS "Tenant users view own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Tenant users insert own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Tenant users update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Tenant users delete own vehicles" ON public.vehicles;

-- DRIVERS: Drop legacy tenant-only policies
DROP POLICY IF EXISTS "Tenant users view own drivers" ON public.drivers;
DROP POLICY IF EXISTS "Tenant users insert own drivers" ON public.drivers;
DROP POLICY IF EXISTS "Tenant users update own drivers" ON public.drivers;
DROP POLICY IF EXISTS "Tenant users delete own drivers" ON public.drivers;

-- DEVICES: Drop legacy tenant-only policies (org-based + role-based policies exist)
DROP POLICY IF EXISTS "Tenant users view own devices" ON public.devices;
DROP POLICY IF EXISTS "Device managers can insert devices" ON public.devices;
DROP POLICY IF EXISTS "Device managers can update devices" ON public.devices;
DROP POLICY IF EXISTS "Device managers can delete devices" ON public.devices;

-- JOBS: Drop legacy tenant-only policies (org-based policies exist)
DROP POLICY IF EXISTS "Tenant users view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Tenant users insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Tenant users update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Tenant users delete own jobs" ON public.jobs;

-- COMPLIANCE_DOCUMENTS: Replace tenant-only policies with org-scoped ones
-- (org-based SELECT/INSERT/UPDATE already exist from prior migration)
DROP POLICY IF EXISTS "Tenant users view own compliance documents" ON public.compliance_documents;
DROP POLICY IF EXISTS "Tenant users insert own compliance documents" ON public.compliance_documents;
DROP POLICY IF EXISTS "Tenant users update own compliance documents" ON public.compliance_documents;
DROP POLICY IF EXISTS "Tenant users delete own compliance documents" ON public.compliance_documents;

-- Add org-scoped DELETE for compliance_documents (was missing)
CREATE POLICY "Org members delete compliance docs"
ON public.compliance_documents FOR DELETE TO authenticated
USING (
  org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

-- JOB_OFFERS: Drop legacy tenant-only policies (org-based policies exist)
DROP POLICY IF EXISTS "Tenant users view own org job offers" ON public.job_offers;
DROP POLICY IF EXISTS "Tenant users create job offers from own org" ON public.job_offers;
DROP POLICY IF EXISTS "Tenant users respond to job offers targeting own org" ON public.job_offers;

-- ============================================================
-- Update can_access_tenant_entity to be org-aware only
-- (remove the raw tenant_id match that bypasses org isolation)
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_access_tenant_entity(_user_id uuid, _tenant_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- platform admin global access
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin')
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
-- Tighten organizations SELECT: only see own org + related orgs
-- (not all orgs in the tenant)
-- ============================================================
DROP POLICY IF EXISTS "Tenant users can view own organizations" ON public.organizations;

CREATE POLICY "Users view own and related organizations"
ON public.organizations FOR SELECT TO authenticated
USING (
  -- platform admin sees all
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  OR
  -- member of this org
  id IN (SELECT public.get_user_org_ids(auth.uid()))
  OR
  -- contracted relationship (Enterprise sees providers, Aggregator sees OOs)
  id IN (
    SELECT to_org_id FROM public.org_relationships
    WHERE from_org_id IN (SELECT public.get_user_org_ids(auth.uid()))
      AND status = 'ACTIVE' AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    UNION
    SELECT from_org_id FROM public.org_relationships
    WHERE to_org_id IN (SELECT public.get_user_org_ids(auth.uid()))
      AND status = 'ACTIVE' AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  )
);
