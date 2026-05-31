
-- Fix: cast app_role enum to text before mapping
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
    SELECT ur.user_id, ur.role::text as role_text, p.tenant_id
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.user_id
    WHERE p.tenant_id IS NOT NULL
      AND ur.role::text != 'platform_admin'
      AND NOT EXISTS (
        SELECT 1 FROM public.user_org_memberships uom WHERE uom.user_id = ur.user_id
      )
  LOOP
    SELECT o.id INTO v_org_id
    FROM public.organizations o
    WHERE o.tenant_id = v_user.tenant_id
      AND o.organization_type = 'FLEET_PROVIDER'
    LIMIT 1;

    IF v_org_id IS NULL THEN
      CONTINUE;
    END IF;

    v_role_key := public.map_legacy_role_to_org_role(v_user.role_text);

    INSERT INTO public.user_org_memberships (user_id, org_id, membership_status)
    VALUES (v_user.user_id, v_org_id, 'active')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_org_roles (user_id, org_id, role_key)
    VALUES (v_user.user_id, v_org_id, v_role_key)
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('backfilled_users', v_count);
END;
$$;
