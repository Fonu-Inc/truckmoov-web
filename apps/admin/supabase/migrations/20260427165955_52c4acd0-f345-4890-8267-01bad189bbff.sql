-- Cross-Tenant Audit Log: unified view + immutability enforcement + 7-year retention

-- 1. Enforce immutability: revoke UPDATE and DELETE on audit tables for all roles
REVOKE UPDATE, DELETE ON public.integration_audit_logs FROM PUBLIC, anon, authenticated, service_role;
REVOKE UPDATE, DELETE ON public.security_audit_logs FROM PUBLIC, anon, authenticated, service_role;

-- Block any future RLS UPDATE/DELETE attempts as well (no policies = denied)
-- Add explicit deny policies for clarity
DROP POLICY IF EXISTS "No updates allowed on audit logs" ON public.integration_audit_logs;
CREATE POLICY "No updates allowed on audit logs" ON public.integration_audit_logs
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No deletes allowed on audit logs" ON public.integration_audit_logs;
CREATE POLICY "No deletes allowed on audit logs" ON public.integration_audit_logs
  FOR DELETE USING (false);

DROP POLICY IF EXISTS "No updates allowed on security audit logs" ON public.security_audit_logs;
CREATE POLICY "No updates allowed on security audit logs" ON public.security_audit_logs
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No deletes allowed on security audit logs" ON public.security_audit_logs;
CREATE POLICY "No deletes allowed on security audit logs" ON public.security_audit_logs
  FOR DELETE USING (false);

COMMENT ON TABLE public.integration_audit_logs IS 'Immutable audit log. Retention: 7 years (NCC regulatory requirement).';
COMMENT ON TABLE public.security_audit_logs IS 'Immutable audit log. Retention: 7 years (NCC regulatory requirement).';

-- 2. Unified cross-tenant audit view (Platform Admin only via existing RLS on underlying tables)
CREATE OR REPLACE VIEW public.v_platform_audit_log AS
SELECT
  id,
  'integration'::text AS source,
  created_at AS timestamp,
  actor_id AS actor_id,
  actor_name AS actor_name,
  NULL::text AS actor_email,
  action AS action_type,
  resource_type,
  resource_id::text AS resource_id,
  tenant_id,
  ip_address,
  user_agent,
  changes AS metadata,
  NULL::text AS severity,
  NULL::text AS description
FROM public.integration_audit_logs
UNION ALL
SELECT
  id,
  'security'::text AS source,
  created_at AS timestamp,
  user_id::text AS actor_id,
  user_name AS actor_name,
  user_email AS actor_email,
  event_type AS action_type,
  'security_event'::text AS resource_type,
  NULL::text AS resource_id,
  tenant_id,
  ip_address,
  NULL::text AS user_agent,
  metadata,
  severity,
  description
FROM public.security_audit_logs;

COMMENT ON VIEW public.v_platform_audit_log IS 'Unified cross-tenant audit log view for Platform Admin compliance review.';

GRANT SELECT ON public.v_platform_audit_log TO authenticated;

-- 3. Schedule 7-year retention cleanup (runs monthly)
-- Only deletes rows older than 7 years. Uses a SECURITY DEFINER function to bypass the no-delete RLS.
CREATE OR REPLACE FUNCTION public.purge_audit_logs_beyond_retention()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 7 years = NCC regulatory minimum
  DELETE FROM public.integration_audit_logs
  WHERE created_at < (now() - interval '7 years');

  DELETE FROM public.security_audit_logs
  WHERE created_at < (now() - interval '7 years');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_audit_logs_beyond_retention() FROM PUBLIC, anon, authenticated;

-- Schedule monthly via pg_cron (1st of every month, 03:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge-audit-logs-7yr')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-audit-logs-7yr');
    PERFORM cron.schedule(
      'purge-audit-logs-7yr',
      '0 3 1 * *',
      $cron$ SELECT public.purge_audit_logs_beyond_retention(); $cron$
    );
  END IF;
END $$;