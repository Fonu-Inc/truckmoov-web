
-- ================================================================
-- WAYBILL MODULE: Org-Scoped RBAC
-- ================================================================

-- 1) Helper: Get user's org type for their active org
CREATE OR REPLACE FUNCTION public.get_user_org_type(_user_id uuid, _org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.organization_type::text
  FROM public.user_org_memberships uom
  JOIN public.organizations o ON o.id = uom.org_id
  WHERE uom.user_id = _user_id
    AND uom.org_id = _org_id
    AND uom.membership_status = 'active'
  LIMIT 1
$$;

-- 2) Helper: Check if user can access a specific org's waybill data
-- Handles: own org, aggregator children, platform admin
CREATE OR REPLACE FUNCTION public.can_access_waybill_org(_user_id uuid, _target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Platform admin: full access
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin')
    OR
    -- Direct org member
    EXISTS (
      SELECT 1 FROM public.user_org_memberships
      WHERE user_id = _user_id AND org_id = _target_org_id AND membership_status = 'active'
    )
    OR
    -- Aggregator: can see child org data
    EXISTS (
      SELECT 1
      FROM public.user_org_memberships uom
      JOIN public.organizations o ON o.id = uom.org_id
      JOIN public.org_relationships r ON r.from_org_id = uom.org_id
      WHERE uom.user_id = _user_id
        AND uom.membership_status = 'active'
        AND o.organization_type = 'AGGREGATOR'
        AND r.to_org_id = _target_org_id
        AND r.status = 'ACTIVE'
        AND (r.end_date IS NULL OR r.end_date >= CURRENT_DATE)
    )
$$;

-- 3) Helper: Check waybill write permission based on org type
-- Enterprise = no write; Owner-Operator/Fleet/Aggregator = write for own org
CREATE OR REPLACE FUNCTION public.can_write_waybill(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Platform admin can configure but NOT generate invoices (handled at API level)
    -- Direct member of non-Enterprise org
    EXISTS (
      SELECT 1
      FROM public.user_org_memberships uom
      JOIN public.organizations o ON o.id = uom.org_id
      WHERE uom.user_id = _user_id
        AND uom.org_id = _org_id
        AND uom.membership_status = 'active'
        AND o.organization_type IN ('FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR')
    )
$$;

-- ================================================================
-- 4) Replace tenant-only RLS with org-scoped RLS on waybill_records
-- ================================================================

-- Drop existing tenant-only policies
DROP POLICY IF EXISTS "Tenant users can view own waybills" ON public.waybill_records;
DROP POLICY IF EXISTS "Tenant users can insert waybills" ON public.waybill_records;
DROP POLICY IF EXISTS "Tenant users can update own waybills" ON public.waybill_records;
DROP POLICY IF EXISTS "System can insert waybills" ON public.waybill_records;
DROP POLICY IF EXISTS "System can update waybills" ON public.waybill_records;

-- New org-scoped SELECT: own org, aggregator children, or platform admin
CREATE POLICY "Org-scoped waybill read"
  ON public.waybill_records FOR SELECT TO authenticated
  USING (
    public.get_user_tenant_id(auth.uid()) = tenant_id
    AND (
      org_id IS NULL  -- legacy records without org
      OR public.can_access_waybill_org(auth.uid(), org_id)
    )
  );

-- INSERT: only non-Enterprise org members
CREATE POLICY "Org-scoped waybill insert"
  ON public.waybill_records FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_tenant_id(auth.uid()) = tenant_id
    AND (org_id IS NULL OR public.can_write_waybill(auth.uid(), org_id))
  );

-- UPDATE: only non-Enterprise org members
CREATE POLICY "Org-scoped waybill update"
  ON public.waybill_records FOR UPDATE TO authenticated
  USING (
    public.get_user_tenant_id(auth.uid()) = tenant_id
    AND (org_id IS NULL OR public.can_write_waybill(auth.uid(), org_id))
  );

-- System/webhook insert (anon for WhatsApp webhook intake)
CREATE POLICY "Anon waybill insert" ON public.waybill_records
  FOR INSERT TO anon
  WITH CHECK (true);

-- ================================================================
-- 5) Replace RLS on waybill_invoices
-- ================================================================

DROP POLICY IF EXISTS "Tenant users can view own invoices" ON public.waybill_invoices;
DROP POLICY IF EXISTS "Tenant users can insert invoices" ON public.waybill_invoices;
DROP POLICY IF EXISTS "Tenant users can update own invoices" ON public.waybill_invoices;

-- SELECT: own org + aggregator children + Enterprise (read-only for contracted jobs)
CREATE POLICY "Org-scoped invoice read"
  ON public.waybill_invoices FOR SELECT TO authenticated
  USING (
    public.get_user_tenant_id(auth.uid()) = tenant_id
    AND (
      org_id IS NULL
      OR public.can_access_waybill_org(auth.uid(), org_id)
    )
  );

-- INSERT: non-Enterprise only (no platform_admin billing)
CREATE POLICY "Org-scoped invoice insert"
  ON public.waybill_invoices FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_tenant_id(auth.uid()) = tenant_id
    AND (org_id IS NULL OR public.can_write_waybill(auth.uid(), org_id))
  );

-- UPDATE: non-Enterprise only
CREATE POLICY "Org-scoped invoice update"
  ON public.waybill_invoices FOR UPDATE TO authenticated
  USING (
    public.get_user_tenant_id(auth.uid()) = tenant_id
    AND (org_id IS NULL OR public.can_write_waybill(auth.uid(), org_id))
  );

-- ================================================================
-- 6) Replace RLS on invoice_line_items (via parent invoice org)
-- ================================================================

DROP POLICY IF EXISTS "Tenant users can view their invoice line items" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Tenant users can create invoice line items" ON public.invoice_line_items;

CREATE POLICY "Org-scoped line items read"
  ON public.invoice_line_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.waybill_invoices wi
      WHERE wi.id = invoice_id
        AND public.get_user_tenant_id(auth.uid()) = wi.tenant_id
        AND (wi.org_id IS NULL OR public.can_access_waybill_org(auth.uid(), wi.org_id))
    )
  );

CREATE POLICY "Org-scoped line items insert"
  ON public.invoice_line_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.waybill_invoices wi
      WHERE wi.id = invoice_id
        AND public.get_user_tenant_id(auth.uid()) = wi.tenant_id
        AND (wi.org_id IS NULL OR public.can_write_waybill(auth.uid(), wi.org_id))
    )
  );

-- ================================================================
-- 7) Replace RLS on invoice_shares
-- ================================================================

DROP POLICY IF EXISTS "Tenant users can view their invoice shares" ON public.invoice_shares;
DROP POLICY IF EXISTS "Tenant users can create invoice shares" ON public.invoice_shares;

CREATE POLICY "Org-scoped shares read"
  ON public.invoice_shares FOR SELECT TO authenticated
  USING (
    public.get_user_tenant_id(auth.uid()) = tenant_id
    AND EXISTS (
      SELECT 1 FROM public.waybill_invoices wi
      WHERE wi.id = invoice_id
        AND (wi.org_id IS NULL OR public.can_access_waybill_org(auth.uid(), wi.org_id))
    )
  );

CREATE POLICY "Org-scoped shares insert"
  ON public.invoice_shares FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_tenant_id(auth.uid()) = tenant_id
    AND EXISTS (
      SELECT 1 FROM public.waybill_invoices wi
      WHERE wi.id = invoice_id
        AND (wi.org_id IS NULL OR public.can_write_waybill(auth.uid(), wi.org_id))
    )
  );

-- ================================================================
-- 8) RLS on waybill_audit_log (read-only, scoped)
-- ================================================================

DROP POLICY IF EXISTS "Tenant users can view waybill audit log" ON public.waybill_audit_log;

CREATE POLICY "Org-scoped audit log read"
  ON public.waybill_audit_log FOR SELECT TO authenticated
  USING (
    public.get_user_tenant_id(auth.uid()) = tenant_id
  );

-- Platform admin global read
CREATE POLICY "Platform admin audit log read"
  ON public.waybill_audit_log FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );
