-- =========================================================
-- Live agent handoff
-- =========================================================
CREATE TYPE public.support_live_session_status AS ENUM (
  'queued', 'assigned', 'active', 'ended', 'abandoned'
);

CREATE TABLE public.support_live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  org_id uuid REFERENCES public.organizations(id),
  requester_id uuid NOT NULL,
  requester_name text,
  requester_email text,
  topic text,
  context_summary text,
  status public.support_live_session_status NOT NULL DEFAULT 'queued',
  agent_id uuid,
  agent_name text,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  queued_at timestamptz NOT NULL DEFAULT now(),
  assigned_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  wait_seconds int,
  duration_seconds int,
  ended_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sls_tenant ON public.support_live_sessions(tenant_id);
CREATE INDEX idx_sls_status ON public.support_live_sessions(status);
CREATE INDEX idx_sls_requester ON public.support_live_sessions(requester_id);
CREATE INDEX idx_sls_agent ON public.support_live_sessions(agent_id);

ALTER TABLE public.support_live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sls_select" ON public.support_live_sessions FOR SELECT TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR requester_id = auth.uid()
  OR (org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id))
  OR (org_id IS NULL AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

CREATE POLICY "sls_insert" ON public.support_live_sessions FOR INSERT TO authenticated
WITH CHECK (
  requester_id = auth.uid()
  AND (
    public.is_platform_admin(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id))
    OR (org_id IS NULL AND tenant_id = public.get_user_tenant_id(auth.uid()))
  )
);

CREATE POLICY "sls_update" ON public.support_live_sessions FOR UPDATE TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR requester_id = auth.uid()
);

-- =========================================================
-- Live agent chat messages
-- =========================================================
CREATE TABLE public.support_live_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.support_live_sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_name text,
  sender_role text NOT NULL CHECK (sender_role IN ('user','agent','system')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_slm_session ON public.support_live_messages(session_id, created_at);

ALTER TABLE public.support_live_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slm_select" ON public.support_live_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_live_sessions s
    WHERE s.id = session_id
      AND (
        public.is_platform_admin(auth.uid())
        OR s.requester_id = auth.uid()
        OR (s.org_id IS NOT NULL AND public.is_org_member(auth.uid(), s.org_id))
        OR (s.org_id IS NULL AND s.tenant_id = public.get_user_tenant_id(auth.uid()))
      )
  )
);

CREATE POLICY "slm_insert" ON public.support_live_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.support_live_sessions s
    WHERE s.id = session_id
      AND (
        public.is_platform_admin(auth.uid())
        OR s.requester_id = auth.uid()
      )
  )
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_live_messages;

-- =========================================================
-- Ticket CSAT
-- =========================================================
CREATE TABLE public.support_ticket_csat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  org_id uuid REFERENCES public.organizations(id),
  submitted_by uuid NOT NULL,
  submitted_by_name text,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  would_recommend boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_id, submitted_by)
);

CREATE INDEX idx_csat_tenant ON public.support_ticket_csat(tenant_id);
CREATE INDEX idx_csat_ticket ON public.support_ticket_csat(ticket_id);

ALTER TABLE public.support_ticket_csat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csat_select" ON public.support_ticket_csat FOR SELECT TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR submitted_by = auth.uid()
  OR (org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id))
  OR (org_id IS NULL AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

-- Only the ticket reporter can submit CSAT, and only when the ticket is resolved or closed.
CREATE POLICY "csat_insert" ON public.support_ticket_csat FOR INSERT TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND t.created_by = auth.uid()
      AND t.status IN ('resolved','closed')
      AND t.tenant_id = support_ticket_csat.tenant_id
  )
);
