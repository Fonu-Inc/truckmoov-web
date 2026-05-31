
-- Phase 1: Backfill org memberships and roles from legacy user_roles
-- Step 1: Create missing organization for orphaned tenant
INSERT INTO public.organizations (id, name, organization_type, tenant_id, status)
SELECT 
  gen_random_uuid(),
  t.name,
  'FLEET_PROVIDER',
  t.id::text,
  'ACTIVE'
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations o WHERE o.tenant_id = t.id::text
)
AND t.id::text != 'f7f5af88-fd76-4439-aae3-0461be52f63f'; -- Lagos Express already has orgs

-- Step 2: Create a DB function to map legacy roles to org role keys
CREATE OR REPLACE FUNCTION public.map_legacy_role_to_org_role(legacy_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE legacy_role
    WHEN 'tenant_admin' THEN 'ADMIN'
    WHEN 'operations_manager' THEN 'OPERATIONS_MANAGER'
    WHEN 'dispatcher' THEN 'DISPATCHER'
    WHEN 'supervisor' THEN 'DISPATCHER'
    WHEN 'viewer_finance' THEN 'FINANCE'
    WHEN 'driver' THEN 'VIEWER'
    WHEN 'installer' THEN 'VIEWER'
    ELSE 'VIEWER'
  END
$$;

-- Step 3: Auto-backfill function that creates org memberships + roles
-- for all users who have a legacy role and a tenant but no org membership yet
CREATE OR REPLACE FUNCTION public.backfill_org_memberships()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_user RECORD;
  v_org_id uuid;
  v_role_key text;
BEGIN
  FOR v_user IN
    SELECT ur.user_id, ur.role, p.tenant_id
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.user_id
    WHERE p.tenant_id IS NOT NULL
      AND ur.role != 'platform_admin'
      AND NOT EXISTS (
        SELECT 1 FROM public.user_org_memberships uom WHERE uom.user_id = ur.user_id
      )
  LOOP
    -- Find the org for this tenant
    SELECT o.id INTO v_org_id
    FROM public.organizations o
    WHERE o.tenant_id = v_user.tenant_id
      AND o.organization_type = 'FLEET_PROVIDER'
    LIMIT 1;

    IF v_org_id IS NULL THEN
      CONTINUE;
    END IF;

    v_role_key := public.map_legacy_role_to_org_role(v_user.role);

    -- Create membership
    INSERT INTO public.user_org_memberships (user_id, org_id, membership_status)
    VALUES (v_user.user_id, v_org_id, 'active')
    ON CONFLICT DO NOTHING;

    -- Create org role
    INSERT INTO public.user_org_roles (user_id, org_id, role_key)
    VALUES (v_user.user_id, v_org_id, v_role_key)
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('backfilled_users', v_count);
END;
$$;
