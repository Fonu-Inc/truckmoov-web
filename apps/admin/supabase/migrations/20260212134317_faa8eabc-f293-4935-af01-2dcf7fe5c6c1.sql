
-- Upgrade requests table for Owner-Operator → Fleet Provider transitions
CREATE TABLE public.org_upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  requested_by uuid REFERENCES auth.users(id),
  from_type text NOT NULL DEFAULT 'OWNER_OPERATOR',
  to_type text NOT NULL DEFAULT 'FLEET_PROVIDER',
  reason text,
  current_vehicle_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Platform admins can see all
CREATE POLICY "Platform admins can manage upgrade requests"
  ON public.org_upgrade_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

-- Org members can view their own requests
CREATE POLICY "Org members can view own upgrade requests"
  ON public.org_upgrade_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_org_memberships
      WHERE user_id = auth.uid() AND org_id = org_upgrade_requests.org_id AND membership_status = 'active'
    )
  );

-- Org members can insert requests for their org
CREATE POLICY "Org members can request upgrades"
  ON public.org_upgrade_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_org_memberships
      WHERE user_id = auth.uid() AND org_id = org_upgrade_requests.org_id AND membership_status = 'active'
    )
  );

-- Function to approve upgrade and transition org type
CREATE OR REPLACE FUNCTION public.approve_org_upgrade(p_request_id uuid, p_reviewer_id uuid, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request org_upgrade_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM org_upgrade_requests WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already ' || v_request.status);
  END IF;

  -- Update org type to Fleet Provider and remove vehicle cap
  UPDATE organizations
  SET organization_type = 'FLEET_PROVIDER',
      max_vehicles = NULL,
      updated_at = now()
  WHERE id = v_request.org_id;

  -- Mark request as approved
  UPDATE org_upgrade_requests
  SET status = 'approved',
      reviewed_by = p_reviewer_id,
      reviewed_at = now(),
      review_notes = p_notes,
      updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_request.org_id,
    'message', 'Organization upgraded to Fleet Provider'
  );
END;
$$;
