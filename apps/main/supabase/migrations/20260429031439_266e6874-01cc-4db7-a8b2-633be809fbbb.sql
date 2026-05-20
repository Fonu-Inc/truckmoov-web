-- ============================================================
-- 1. WhatsApp opt-out registry
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_opt_outs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  phone text NOT NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT 'STOP_KEYWORD',
  source_message_id text,
  opted_out_at timestamptz NOT NULL DEFAULT now(),
  reactivated_at timestamptz,
  UNIQUE (tenant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_opt_outs_tenant_phone
  ON public.whatsapp_opt_outs (tenant_id, phone) WHERE reactivated_at IS NULL;

ALTER TABLE public.whatsapp_opt_outs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage all opt-outs"
  ON public.whatsapp_opt_outs FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant users view own opt-outs"
  ON public.whatsapp_opt_outs FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Helper: is a phone currently opted out?
CREATE OR REPLACE FUNCTION public.is_whatsapp_opted_out(p_tenant_id text, p_phone text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.whatsapp_opt_outs
    WHERE tenant_id = p_tenant_id
      AND phone = p_phone
      AND reactivated_at IS NULL
  );
$$;

-- ============================================================
-- 2. Field-level audit log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.field_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  column_name text,
  old_value jsonb,
  new_value jsonb,
  tenant_id text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_audit_log_table_record
  ON public.field_audit_log (table_name, record_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_audit_log_tenant_time
  ON public.field_audit_log (tenant_id, changed_at DESC);

ALTER TABLE public.field_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins read all audit"
  ON public.field_audit_log FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins read own audit"
  ON public.field_audit_log FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Generic trigger function: captures per-column diffs on UPDATE,
-- a single row marker on INSERT/DELETE.
CREATE OR REPLACE FUNCTION public.log_field_audit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_record_id text;
  v_tenant_id text;
  v_user uuid := auth.uid();
  v_old jsonb;
  v_new jsonb;
  v_key text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
  END IF;

  v_record_id := COALESCE(
    (CASE WHEN TG_OP = 'DELETE' THEN v_old ELSE v_new END) ->> 'id',
    'unknown'
  );
  v_tenant_id := COALESCE(
    (CASE WHEN TG_OP = 'DELETE' THEN v_old ELSE v_new END) ->> 'tenant_id',
    NULL
  );

  IF TG_OP = 'UPDATE' THEN
    -- Iterate keys, log only changed columns
    FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
      IF (v_old -> v_key) IS DISTINCT FROM (v_new -> v_key)
         AND v_key NOT IN ('updated_at') THEN
        INSERT INTO public.field_audit_log
          (table_name, record_id, operation, column_name, old_value, new_value, tenant_id, changed_by)
        VALUES
          (TG_TABLE_NAME, v_record_id, 'UPDATE', v_key, v_old -> v_key, v_new -> v_key, v_tenant_id, v_user);
      END IF;
    END LOOP;
  ELSE
    INSERT INTO public.field_audit_log
      (table_name, record_id, operation, column_name, old_value, new_value, tenant_id, changed_by)
    VALUES
      (TG_TABLE_NAME, v_record_id, TG_OP, NULL, v_old, v_new, v_tenant_id, v_user);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Helper to attach the trigger idempotently
CREATE OR REPLACE FUNCTION public._attach_field_audit(p_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('DROP TRIGGER IF EXISTS trg_field_audit ON public.%I', p_table);
  EXECUTE format(
    'CREATE TRIGGER trg_field_audit
       AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.log_field_audit()',
    p_table
  );
END;
$$;

-- Attach to high-value business tables (skip silently if table missing)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'jobs', 'vehicles', 'drivers', 'tenants',
    'organizations', 'invoices', 'subscription_plans', 'geofences'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = t) THEN
      PERFORM public._attach_field_audit(t);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 3. Two-stage low-fuel detector (helper RPC the cron will call)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fuel_alert_state (
  vehicle_id uuid PRIMARY KEY REFERENCES public.vehicles(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  last_stage int NOT NULL DEFAULT 0,           -- 0 = no alert, 25, 10
  last_alert_at timestamptz,
  last_level_percent numeric
);

ALTER TABLE public.fuel_alert_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admins manage fuel alert state"
  ON public.fuel_alert_state FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "Tenant users view own fuel alert state"
  ON public.fuel_alert_state FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));