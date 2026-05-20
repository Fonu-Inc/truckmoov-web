
-- 4.1 Active job limit check function for Owner-Operators
CREATE OR REPLACE FUNCTION public.check_owner_operator_active_job_limit(
  p_org_id uuid,
  p_max_active_jobs integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org organizations%ROWTYPE;
  v_active_count integer;
BEGIN
  SELECT * INTO v_org FROM organizations WHERE id = p_org_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Organization not found');
  END IF;

  IF v_org.organization_type != 'OWNER_OPERATOR' THEN
    -- Non-OO orgs have no single-job constraint
    RETURN jsonb_build_object('eligible', true, 'active_jobs', 0, 'max_active_jobs', null);
  END IF;

  -- Count active jobs where this org is executing
  SELECT COUNT(*) INTO v_active_count
  FROM jobs
  WHERE executing_org_id = p_org_id
    AND status IN ('assigned', 'accepted', 'in_progress');

  -- Also count pending offers they haven't responded to
  -- (they shouldn't get new offers while one is pending)
  v_active_count := v_active_count + (
    SELECT COUNT(*) FROM job_offers
    WHERE target_org_id = p_org_id AND status = 'PENDING'
  );

  IF v_active_count >= p_max_active_jobs THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', format('Owner-Operator already has %s active job(s). Maximum allowed: %s', v_active_count, p_max_active_jobs),
      'active_jobs', v_active_count,
      'max_active_jobs', p_max_active_jobs
    );
  END IF;

  RETURN jsonb_build_object('eligible', true, 'active_jobs', v_active_count, 'max_active_jobs', p_max_active_jobs);
END;
$$;

-- 4.2 Function to record offer channel delivery attempts
CREATE TABLE IF NOT EXISTS public.job_offer_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.job_offers(id) ON DELETE CASCADE,
  channel text NOT NULL, -- 'whatsapp', 'sms', 'voice'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  external_message_id text,
  error_message text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  response_received_at timestamptz,
  response_keyword text, -- 'ACCEPT', 'DECLINE'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_offer_delivery_log ENABLE ROW LEVEL SECURITY;

-- Platform admins see all, org members see their own offers
CREATE POLICY "Platform admins can view all offer delivery logs"
  ON public.job_offer_delivery_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "Org members can view their offer delivery logs"
  ON public.job_offer_delivery_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_offers jo
      JOIN public.user_org_memberships uom ON uom.org_id = jo.target_org_id
      WHERE jo.id = job_offer_delivery_log.offer_id
        AND uom.user_id = auth.uid()
        AND uom.membership_status = 'active'
    )
  );

-- Add offer_channel to job_offers to track primary channel used
ALTER TABLE public.job_offers ADD COLUMN IF NOT EXISTS offer_channel text DEFAULT 'portal';
ALTER TABLE public.job_offers ADD COLUMN IF NOT EXISTS offer_message_id text;

-- Add max_active_jobs config to organizations metadata
COMMENT ON COLUMN public.organizations.metadata IS 'JSON config including max_active_jobs for OO orgs';
