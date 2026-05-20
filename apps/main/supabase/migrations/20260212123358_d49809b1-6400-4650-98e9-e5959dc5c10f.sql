
-- ============================================================
-- PHASE 6: Backfill organizations, link assets, feature flag
-- ============================================================

-- 1. Backfill: Create a default FLEET_PROVIDER org per existing tenant
INSERT INTO public.organizations (id, name, organization_type, tenant_id, status)
SELECT
  gen_random_uuid(),
  t.name,
  'FLEET_PROVIDER'::organization_type,
  t.id::text,
  CASE t.status
    WHEN 'active' THEN 'ACTIVE'::organization_status
    WHEN 'suspended' THEN 'SUSPENDED'::organization_status
    ELSE 'ACTIVE'::organization_status
  END
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations o WHERE o.tenant_id = t.id::text
);

-- 2. Backfill vehicles
UPDATE public.vehicles v
SET owning_org_id = o.id
FROM public.organizations o
WHERE o.tenant_id = v.tenant_id AND v.owning_org_id IS NULL;

-- 3. Backfill drivers
UPDATE public.drivers d
SET owning_org_id = o.id
FROM public.organizations o
WHERE o.tenant_id = d.tenant_id AND d.owning_org_id IS NULL;

-- 4. Backfill devices
UPDATE public.devices dev
SET owning_org_id = o.id
FROM public.organizations o
WHERE o.tenant_id = dev.tenant_id AND dev.owning_org_id IS NULL;

-- 5. Backfill jobs
UPDATE public.jobs j
SET job_owner_org_id = o.id
FROM public.organizations o
WHERE o.tenant_id = j.tenant_id AND j.job_owner_org_id IS NULL;

-- 6. Feature flag (unique on scope+tenant_id+feature_key)
INSERT INTO public.feature_flags (feature_key, feature_name, feature_description, is_enabled, scope, tenant_id, category, phase)
VALUES (
  'enable_multi_stakeholder_model',
  'Multi-Stakeholder Model',
  'Enables organization-scoped access control, cross-org visibility, enterprise/aggregator dashboards, and job offer workflows. When disabled, legacy tenant-level RBAC is used.',
  false,
  'platform',
  NULL,
  'architecture',
  'phase_6'
)
ON CONFLICT (scope, tenant_id, feature_key) DO NOTHING;
