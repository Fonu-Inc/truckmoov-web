
-- ============================================================
-- Add org_id to geofences, alerts, support_tickets
-- Replace tenant-only RLS with org-scoped policies
-- ============================================================

-- 1) ADD org_id COLUMNS
ALTER TABLE public.geofences ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- 2) GEOFENCES — Drop old tenant-only policies, add org-scoped
DROP POLICY IF EXISTS "Users view own tenant geofences" ON public.geofences;
DROP POLICY IF EXISTS "Tenant admins manage geofences" ON public.geofences;
DROP POLICY IF EXISTS "Tenant admins update geofences" ON public.geofences;
DROP POLICY IF EXISTS "Tenant admins delete geofences" ON public.geofences;

-- SELECT: org member OR cross-org visibility OR tenant fallback (org_id NULL) OR platform admin
CREATE POLICY "geofences_select_policy" ON public.geofences FOR SELECT USING (
  is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND (
    is_org_member(auth.uid(), org_id)
    OR has_cross_org_visibility(auth.uid(), org_id)
  ))
  OR (org_id IS NULL AND tenant_id = get_user_tenant_id(auth.uid()))
  OR tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f'
);

-- INSERT: must be org member with permission, or tenant fallback
CREATE POLICY "geofences_insert_policy" ON public.geofences FOR INSERT WITH CHECK (
  is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND can_write_org_entity(auth.uid(), org_id, 'assets:manage'))
  OR (org_id IS NULL AND tenant_id = get_user_tenant_id(auth.uid()) AND can_manage_geofences(auth.uid()))
);

-- UPDATE: same as insert
CREATE POLICY "geofences_update_policy" ON public.geofences FOR UPDATE USING (
  is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND can_write_org_entity(auth.uid(), org_id, 'assets:manage'))
  OR (org_id IS NULL AND tenant_id = get_user_tenant_id(auth.uid()) AND can_manage_geofences(auth.uid()))
);

-- DELETE
CREATE POLICY "geofences_delete_policy" ON public.geofences FOR DELETE USING (
  is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND can_write_org_entity(auth.uid(), org_id, 'assets:manage'))
  OR (org_id IS NULL AND tenant_id = get_user_tenant_id(auth.uid()) AND can_manage_geofences(auth.uid()))
);

-- 3) ALERTS — Drop old tenant-only policies, add org-scoped
DROP POLICY IF EXISTS "Tenant users view own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Tenant users insert own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Tenant users update own alerts" ON public.alerts;

-- SELECT
CREATE POLICY "alerts_select_policy" ON public.alerts FOR SELECT USING (
  is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND (
    is_org_member(auth.uid(), org_id)
    OR has_cross_org_visibility(auth.uid(), org_id)
  ))
  OR (org_id IS NULL AND tenant_id = get_user_tenant_id(auth.uid()))
  OR tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f'
);

-- INSERT (system/telemetry inserts + org member)
CREATE POLICY "alerts_insert_policy" ON public.alerts FOR INSERT WITH CHECK (
  is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  OR (org_id IS NULL AND tenant_id = get_user_tenant_id(auth.uid()))
  OR tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f'
);

-- UPDATE (acknowledge alerts)
CREATE POLICY "alerts_update_policy" ON public.alerts FOR UPDATE USING (
  is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  OR (org_id IS NULL AND tenant_id = get_user_tenant_id(auth.uid()))
);

-- 4) SUPPORT TICKETS — Drop old, add org-scoped
DROP POLICY IF EXISTS "Tenant users can view own tenant tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Tenant users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Tenant users can update own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Platform admin can update any ticket" ON public.support_tickets;

-- SELECT
CREATE POLICY "support_tickets_select_policy" ON public.support_tickets FOR SELECT USING (
  is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  OR (org_id IS NULL AND tenant_id = get_user_tenant_id(auth.uid()) AND can_view_support_tickets(auth.uid()))
);

-- INSERT
CREATE POLICY "support_tickets_insert_policy" ON public.support_tickets FOR INSERT WITH CHECK (
  is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id) AND can_create_support_ticket(auth.uid()))
  OR (org_id IS NULL AND tenant_id = get_user_tenant_id(auth.uid()) AND can_create_support_ticket(auth.uid()) AND created_by = auth.uid())
);

-- UPDATE
CREATE POLICY "support_tickets_update_policy" ON public.support_tickets FOR UPDATE USING (
  is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id) AND can_create_support_ticket(auth.uid()))
  OR (org_id IS NULL AND tenant_id = get_user_tenant_id(auth.uid()) AND can_create_support_ticket(auth.uid()))
);

-- 5) BACKFILL org_id from related assets where possible

-- Alerts: set org_id from vehicle's owning_org_id
UPDATE public.alerts a
SET org_id = v.owning_org_id
FROM public.vehicles v
WHERE a.vehicle_id = v.id AND a.org_id IS NULL AND v.owning_org_id IS NOT NULL;

-- Alerts: set org_id from device's owning_org_id where vehicle didn't match
UPDATE public.alerts a
SET org_id = d.owning_org_id
FROM public.devices d
WHERE a.device_id = d.id AND a.org_id IS NULL AND d.owning_org_id IS NOT NULL;

-- Geofences: set org_id from vehicle_geofences -> vehicle -> owning_org_id for geofences linked to vehicles
UPDATE public.geofences g
SET org_id = v.owning_org_id
FROM public.vehicle_geofences vg
JOIN public.vehicles v ON vg.vehicle_id = v.id
WHERE vg.geofence_id = g.id AND g.org_id IS NULL AND v.owning_org_id IS NOT NULL;
