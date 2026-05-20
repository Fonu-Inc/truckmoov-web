-- Trial lifecycle columns on tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_vehicle_cap integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS trial_sim_cap integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS trial_whatsapp_daily_cap integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS trial_sms_daily_cap integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS payment_method_on_file boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_expiry_alert_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_extended_count integer NOT NULL DEFAULT 0;

-- Validation: when status is trial, trial_ends_at must be in the future at write-time
CREATE OR REPLACE FUNCTION public.validate_tenant_trial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'trial' THEN
    IF NEW.trial_ends_at IS NULL THEN
      RAISE EXCEPTION 'trial_ends_at is required when status is trial';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.trial_ends_at <= now() THEN
      RAISE EXCEPTION 'trial_ends_at must be in the future for new trial tenants';
    END IF;
    IF NEW.trial_started_at IS NULL THEN
      NEW.trial_started_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_tenant_trial ON public.tenants;
CREATE TRIGGER trg_validate_tenant_trial
BEFORE INSERT OR UPDATE OF status, trial_ends_at, trial_started_at ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_trial();

-- View exposing computed trial state to UI
CREATE OR REPLACE VIEW public.v_tenant_trial_status AS
SELECT
  t.id AS tenant_id,
  t.name,
  t.status,
  t.trial_started_at,
  t.trial_ends_at,
  t.trial_vehicle_cap,
  t.trial_sim_cap,
  t.trial_whatsapp_daily_cap,
  t.trial_sms_daily_cap,
  t.payment_method_on_file,
  t.trial_extended_count,
  CASE
    WHEN t.trial_ends_at IS NULL THEN NULL
    ELSE GREATEST(0, EXTRACT(EPOCH FROM (t.trial_ends_at - now()))::int / 86400)
  END AS days_remaining,
  CASE
    WHEN t.status = 'trial' AND t.trial_ends_at IS NOT NULL AND t.trial_ends_at <= now() THEN true
    ELSE false
  END AS is_expired
FROM public.tenants t;

-- Auto-handler: convert paid trials, suspend unpaid trials, raise 7-day warnings
CREATE OR REPLACE FUNCTION public.expire_tenant_trials()
RETURNS TABLE(tenant_id uuid, action text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
BEGIN
  -- 1) 7-day warning (only fire once per trial)
  FOR rec IN
    SELECT id, name, trial_ends_at
    FROM public.tenants
    WHERE status = 'trial'
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at > now()
      AND trial_ends_at <= now() + interval '7 days'
      AND trial_expiry_alert_sent_at IS NULL
  LOOP
    INSERT INTO public.security_audit_logs (tenant_id, action, resource_type, resource_id, metadata)
    VALUES (
      rec.id,
      'trial.expiring_soon',
      'tenant',
      rec.id::text,
      jsonb_build_object('tenant_name', rec.name, 'trial_ends_at', rec.trial_ends_at)
    );
    UPDATE public.tenants SET trial_expiry_alert_sent_at = now() WHERE id = rec.id;
    tenant_id := rec.id; action := 'warned'; RETURN NEXT;
  END LOOP;

  -- 2) Trials that have expired with payment method => convert to active
  FOR rec IN
    SELECT id, name FROM public.tenants
    WHERE status = 'trial' AND trial_ends_at <= now() AND payment_method_on_file = true
  LOOP
    UPDATE public.tenants
       SET status = 'active', trial_converted_at = now(), updated_at = now()
     WHERE id = rec.id;
    INSERT INTO public.security_audit_logs (tenant_id, action, resource_type, resource_id, metadata)
    VALUES (rec.id, 'trial.auto_converted', 'tenant', rec.id::text, jsonb_build_object('tenant_name', rec.name));
    tenant_id := rec.id; action := 'converted'; RETURN NEXT;
  END LOOP;

  -- 3) Trials that have expired without payment method => suspend
  FOR rec IN
    SELECT id, name FROM public.tenants
    WHERE status = 'trial' AND trial_ends_at <= now() AND payment_method_on_file = false
  LOOP
    UPDATE public.tenants
       SET status = 'suspended', updated_at = now()
     WHERE id = rec.id;
    INSERT INTO public.security_audit_logs (tenant_id, action, resource_type, resource_id, metadata)
    VALUES (rec.id, 'trial.suspended', 'tenant', rec.id::text, jsonb_build_object('tenant_name', rec.name));
    tenant_id := rec.id; action := 'suspended'; RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

GRANT SELECT ON public.v_tenant_trial_status TO authenticated, anon;