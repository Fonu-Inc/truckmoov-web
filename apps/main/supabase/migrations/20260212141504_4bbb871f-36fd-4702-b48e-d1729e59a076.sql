
-- Enhanced approve_org_upgrade: full transition from OWNER_OPERATOR → FLEET_PROVIDER
-- Preserves org_id, vehicles, drivers, job history
-- Unlocks Fleet Admin roles for existing org members
CREATE OR REPLACE FUNCTION public.approve_org_upgrade(
  p_request_id uuid,
  p_reviewer_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request org_upgrade_requests%ROWTYPE;
  v_members_upgraded integer := 0;
  v_member RECORD;
BEGIN
  -- Lock and fetch the request
  SELECT * INTO v_request FROM org_upgrade_requests WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already ' || v_request.status);
  END IF;

  -- 1. Change organization_type: OWNER_OPERATOR → FLEET_PROVIDER
  --    Remove vehicle cap (max_vehicles = NULL)
  --    Preserve org_id — all FK references (vehicles, drivers, jobs, settlements) stay intact
  UPDATE organizations
  SET organization_type = 'FLEET_PROVIDER',
      max_vehicles = NULL,
      updated_at = now()
  WHERE id = v_request.org_id;

  -- 2. Upgrade org roles for all active members
  --    Replace OWNER_OPERATOR role with FLEET_ADMIN
  FOR v_member IN
    SELECT user_id, role_key FROM user_org_roles
    WHERE org_id = v_request.org_id
      AND role_key = 'OWNER_OPERATOR'
  LOOP
    -- Update existing OO role to FLEET_ADMIN
    UPDATE user_org_roles
    SET role_key = 'FLEET_ADMIN', updated_at = now()
    WHERE org_id = v_request.org_id
      AND user_id = v_member.user_id
      AND role_key = 'OWNER_OPERATOR';

    v_members_upgraded := v_members_upgraded + 1;
  END LOOP;

  -- 3. Also grant FLEET_ADMIN to any members who don't have OWNER_OPERATOR
  --    (e.g. members with only generic roles) — idempotent via ON CONFLICT
  INSERT INTO user_org_roles (user_id, org_id, role_key)
  SELECT uom.user_id, uom.org_id, 'FLEET_ADMIN'
  FROM user_org_memberships uom
  WHERE uom.org_id = v_request.org_id
    AND uom.membership_status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM user_org_roles uor
      WHERE uor.user_id = uom.user_id
        AND uor.org_id = uom.org_id
        AND uor.role_key = 'FLEET_ADMIN'
    )
  ON CONFLICT DO NOTHING;

  -- 4. Mark the request as approved
  UPDATE org_upgrade_requests
  SET status = 'approved',
      reviewed_by = p_reviewer_id,
      reviewed_at = now(),
      review_notes = p_notes,
      updated_at = now()
  WHERE id = p_request_id;

  -- 5. Log the upgrade as an activity
  INSERT INTO activity_logs (
    tenant_id, entity_type, entity_id, action, description,
    actor_id, metadata
  ) VALUES (
    COALESCE(v_request.tenant_id, 'system'),
    'organization',
    v_request.org_id::text,
    'org_upgrade',
    'Organization upgraded from Owner-Operator to Fleet Provider',
    p_reviewer_id,
    jsonb_build_object(
      'from_type', 'OWNER_OPERATOR',
      'to_type', 'FLEET_PROVIDER',
      'members_upgraded', v_members_upgraded,
      'request_id', p_request_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_request.org_id,
    'members_upgraded', v_members_upgraded,
    'message', 'Organization upgraded to Fleet Provider. All data preserved, Fleet Admin roles granted.'
  );
END;
$$;
