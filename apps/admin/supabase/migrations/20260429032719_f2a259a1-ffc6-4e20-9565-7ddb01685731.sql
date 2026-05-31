-- ============================================================
-- 1. DATA BUNDLE MANAGEMENT (E11)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.data_bundles_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  carrier text NOT NULL DEFAULT 'MTN',
  data_mb integer NOT NULL,
  validity_days integer NOT NULL,
  price_ngn numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_bundle_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  org_id uuid,
  sim_id uuid,
  msisdn text,
  bundle_code text NOT NULL,
  data_mb_total integer NOT NULL,
  data_mb_used integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','EXHAUSTED','EXPIRED','CANCELLED')),
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dba_tenant_status
  ON public.data_bundle_allocations (tenant_id, status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_dba_msisdn
  ON public.data_bundle_allocations (msisdn);

CREATE TABLE IF NOT EXISTS public.data_bundle_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL REFERENCES public.data_bundle_allocations(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  msisdn text,
  usage_date date NOT NULL,
  data_mb integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (allocation_id, usage_date)
);
CREATE INDEX IF NOT EXISTS idx_dbu_tenant_date
  ON public.data_bundle_usage (tenant_id, usage_date DESC);

CREATE TABLE IF NOT EXISTS public.data_bundle_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  org_id uuid,
  sim_id uuid,
  msisdn text,
  bundle_code text NOT NULL,
  amount_ngn numeric NOT NULL,
  initiated_by uuid,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','SUCCESS','FAILED')),
  provider_reference text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_dbt_tenant_time
  ON public.data_bundle_topups (tenant_id, created_at DESC);

ALTER TABLE public.data_bundles_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_bundle_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_bundle_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_bundle_topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authed read catalog"
  ON public.data_bundles_catalog FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Platform admin manage catalog"
  ON public.data_bundles_catalog FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant read own allocations"
  ON public.data_bundle_allocations FOR SELECT
  USING (public.is_platform_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant insert own allocations"
  ON public.data_bundle_allocations FOR INSERT
  WITH CHECK (public.is_platform_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Platform admin update allocations"
  ON public.data_bundle_allocations FOR UPDATE
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant read own bundle usage"
  ON public.data_bundle_usage FOR SELECT
  USING (public.is_platform_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant read own topups"
  ON public.data_bundle_topups FOR SELECT
  USING (public.is_platform_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant create own topups"
  ON public.data_bundle_topups FOR INSERT
  WITH CHECK (public.is_platform_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()));

INSERT INTO public.data_bundles_catalog (code, name, carrier, data_mb, validity_days, price_ngn)
VALUES
  ('MTN_FLEET_1GB', 'Fleet Lite — 1 GB',  'MTN', 1024,  30, 500),
  ('MTN_FLEET_5GB', 'Fleet Std — 5 GB',   'MTN', 5120,  30, 2200),
  ('MTN_FLEET_10GB','Fleet Pro — 10 GB',  'MTN', 10240, 30, 4000),
  ('MTN_FLEET_50GB','Fleet Max — 50 GB',  'MTN', 51200, 30, 17500)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. WHATSAPP 24h SESSION TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  phone text NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  last_inbound_message_id text,
  UNIQUE (tenant_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_wa_sessions_expires
  ON public.whatsapp_sessions (tenant_id, expires_at DESC);

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read own sessions"
  ON public.whatsapp_sessions FOR SELECT
  USING (public.is_platform_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE OR REPLACE FUNCTION public.has_active_whatsapp_session(p_tenant_id text, p_phone text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.whatsapp_sessions
    WHERE tenant_id = p_tenant_id AND phone = p_phone AND expires_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_whatsapp_session(
  p_tenant_id text, p_phone text, p_message_id text
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.whatsapp_sessions (tenant_id, phone, opened_at, expires_at, last_inbound_message_id)
  VALUES (p_tenant_id, p_phone, now(), now() + interval '24 hours', p_message_id)
  ON CONFLICT (tenant_id, phone) DO UPDATE
    SET opened_at = EXCLUDED.opened_at,
        expires_at = EXCLUDED.expires_at,
        last_inbound_message_id = EXCLUDED.last_inbound_message_id;
$$;

-- ============================================================
-- 3. JOB POD MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_pod_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'whatsapp',
  source_message_id text,
  storage_path text,
  signed_url text,
  mime_type text,
  caption text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_pod_media_job
  ON public.job_pod_media (job_id, captured_at DESC);

ALTER TABLE public.job_pod_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read own POD"
  ON public.job_pod_media FOR SELECT
  USING (public.is_platform_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()));

INSERT INTO storage.buckets (id, name, public)
VALUES ('pod-media', 'pod-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Tenant users read own POD storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pod-media' AND (
      public.is_platform_admin(auth.uid())
      OR (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())
    )
  );

-- ============================================================
-- 4. TENANT ISOLATION SELF-CHECK
-- ============================================================
CREATE OR REPLACE FUNCTION public.tenant_isolation_check()
RETURNS TABLE (
  check_name text,
  status text,
  detail text,
  leak_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: platform admin only';
  END IF;

  RETURN QUERY
  SELECT 'Vehicles cross-tenant driver'::text,
         CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
         'Vehicles whose assigned driver tenant does not match the vehicle tenant.'::text,
         COUNT(*)::bigint
  FROM public.vehicles v
  JOIN public.drivers d ON d.id = v.driver_id
  WHERE d.tenant_id IS DISTINCT FROM v.tenant_id;

  RETURN QUERY
  SELECT 'Jobs cross-tenant vehicle'::text,
         CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
         'Jobs whose assigned vehicle tenant does not match the job tenant.'::text,
         COUNT(*)::bigint
  FROM public.jobs j
  JOIN public.vehicles v ON v.id = j.vehicle_id
  WHERE v.tenant_id IS DISTINCT FROM j.tenant_id;

  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='organizations') THEN
    RETURN QUERY
    SELECT 'Geofences cross-tenant org'::text,
           CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
           'Geofences whose org belongs to a different tenant.'::text,
           COUNT(*)::bigint
    FROM public.geofences g
    JOIN public.organizations o ON o.id = g.org_id
    WHERE o.tenant_id IS DISTINCT FROM g.tenant_id;
  END IF;

  RETURN QUERY
  SELECT 'Tables without RLS'::text,
         CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
         'Tables in public schema with row-level security disabled.'::text,
         COUNT(*)::bigint
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t.tablename AND c.relrowsecurity = true
    );
END;
$$;