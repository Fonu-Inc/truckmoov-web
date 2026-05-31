-- Phase 1 — MVP gap closures
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mtn_consolidated_invoice boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_tenants_tags ON public.tenants USING GIN (tags);

CREATE OR REPLACE FUNCTION public.tg_tenant_consolidated_flag()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.mtn_consolidated_invoice :=
    (NEW.billing_model::text = 'postpaid' AND 'mtn-enterprise' = ANY(COALESCE(NEW.tags,'{}')));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_tenant_consolidated_flag ON public.tenants;
CREATE TRIGGER trg_tenant_consolidated_flag
  BEFORE INSERT OR UPDATE OF tags, billing_model ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.tg_tenant_consolidated_flag();

ALTER TABLE public.tenant_invoice_config
  ALTER COLUMN payment_terms_days SET DEFAULT 15,
  ADD COLUMN IF NOT EXISTS ncc_levy_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ncc_levy_percent numeric(5,2) NOT NULL DEFAULT 2.50,
  ADD COLUMN IF NOT EXISTS ncc_levy_label text NOT NULL DEFAULT 'NCC Levy';

UPDATE public.tenant_invoice_config SET payment_terms_days = 15 WHERE payment_terms_days = 30;

DO $$ BEGIN
  CREATE TYPE public.sim_type_enum AS ENUM ('IOT','DRIVER','HOTSPOT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mtn_suspension_state_enum AS ENUM ('ACTIVE','PENDING_SUSPEND','SUSPENDED','PENDING_RESUME','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.iot_sims
  ADD COLUMN IF NOT EXISTS sim_type public.sim_type_enum NOT NULL DEFAULT 'IOT',
  ADD COLUMN IF NOT EXISTS monthly_rental_ngn numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mtn_suspension_state public.mtn_suspension_state_enum NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS mtn_suspension_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS mtn_suspension_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS mtn_suspension_reason text;

CREATE INDEX IF NOT EXISTS idx_iot_sims_suspension_pending
  ON public.iot_sims (mtn_suspension_state)
  WHERE mtn_suspension_state IN ('PENDING_SUSPEND','PENDING_RESUME');

DO $$ BEGIN
  CREATE TYPE public.bundle_cycle_enum AS ENUM ('monthly','yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.data_bundles_catalog
  ADD COLUMN IF NOT EXISTS billing_cycle public.bundle_cycle_enum NOT NULL DEFAULT 'monthly';

ALTER TABLE public.data_bundle_allocations
  ADD COLUMN IF NOT EXISTS expiry_alert_7d_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS expiry_alert_1d_sent_at timestamptz;

CREATE TABLE IF NOT EXISTS public.invoice_finance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  invoice_kind text NOT NULL CHECK (invoice_kind IN ('subscription','postpaid','waybill')),
  tenant_id text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('T_MINUS_7','DUE_DATE','SUSPENSION')),
  channel text NOT NULL CHECK (channel IN ('email','whatsapp')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  recipient text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  UNIQUE (invoice_id, invoice_kind, stage, channel)
);
CREATE INDEX IF NOT EXISTS idx_invoice_finance_reminders_tenant
  ON public.invoice_finance_reminders (tenant_id, sent_at DESC);

ALTER TABLE public.invoice_finance_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform admin reads all reminders" ON public.invoice_finance_reminders;
CREATE POLICY "platform admin reads all reminders"
  ON public.invoice_finance_reminders FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "tenant reads own reminders" ON public.invoice_finance_reminders;
CREATE POLICY "tenant reads own reminders"
  ON public.invoice_finance_reminders FOR SELECT
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id', true));

DROP POLICY IF EXISTS "service role writes reminders" ON public.invoice_finance_reminders;
CREATE POLICY "service role writes reminders"
  ON public.invoice_finance_reminders FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.check_trial_cap(_tenant_id text, _resource text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t record;
  cur integer := 0;
  cap integer := 0;
BEGIN
  SELECT status, trial_vehicle_cap, trial_sim_cap, trial_whatsapp_daily_cap, trial_sms_daily_cap,
         vehicle_count, sim_count
    INTO t
    FROM public.tenants WHERE id::text = _tenant_id;

  IF NOT FOUND OR t.status <> 'trial' THEN
    RETURN jsonb_build_object('ok', true, 'on_trial', false);
  END IF;

  IF _resource = 'vehicle' THEN
    cur := COALESCE(t.vehicle_count,0); cap := COALESCE(t.trial_vehicle_cap,5);
  ELSIF _resource = 'sim' THEN
    cur := COALESCE(t.sim_count,0); cap := COALESCE(t.trial_sim_cap,5);
  ELSIF _resource = 'whatsapp_daily' THEN
    SELECT count(*) INTO cur FROM public.usage_ledger
      WHERE tenant_id = _tenant_id AND event_type = 'whatsapp_message'
        AND created_at >= date_trunc('day', now());
    cap := COALESCE(t.trial_whatsapp_daily_cap,100);
  ELSIF _resource = 'sms_daily' THEN
    SELECT count(*) INTO cur FROM public.usage_ledger
      WHERE tenant_id = _tenant_id AND event_type = 'sms_message'
        AND created_at >= date_trunc('day', now());
    cap := COALESCE(t.trial_sms_daily_cap,50);
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_resource');
  END IF;

  RETURN jsonb_build_object(
    'ok', cur < cap, 'on_trial', true, 'resource', _resource,
    'current', cur, 'cap', cap, 'remaining', greatest(0, cap - cur)
  );
END $$;

GRANT EXECUTE ON FUNCTION public.check_trial_cap(text, text) TO authenticated, anon, service_role;