
CREATE TYPE public.billing_model AS ENUM ('subscription', 'postpaid', 'prepaid');
CREATE TYPE public.postpaid_invoice_status AS ENUM ('generated', 'sent', 'paid', 'overdue', 'partially_paid', 'void');
CREATE TYPE public.credit_limit_action AS ENUM ('suspend_services', 'notify_only');

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS billing_model public.billing_model NOT NULL DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS billing_cycle_day integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.validate_billing_cycle_day()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.billing_cycle_day < 1 OR NEW.billing_cycle_day > 28 THEN
    RAISE EXCEPTION 'billing_cycle_day must be between 1 and 28';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_billing_cycle_day
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.validate_billing_cycle_day();

-- USAGE LEDGER (tenant_id as TEXT to match profiles.tenant_id)
CREATE TABLE public.usage_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  org_id UUID,
  event_type TEXT NOT NULL,
  quantity NUMERIC(12,4) NOT NULL DEFAULT 1,
  unit_rate_ngn NUMERIC(12,4) NOT NULL,
  amount_ngn NUMERIC(14,4) NOT NULL,
  billing_period TEXT NOT NULL,
  settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMPTZ,
  postpaid_invoice_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_ledger_tenant_period ON public.usage_ledger(tenant_id, billing_period);
CREATE INDEX idx_usage_ledger_settled ON public.usage_ledger(settled) WHERE NOT settled;

ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own usage"
  ON public.usage_ledger FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Service role manages usage ledger"
  ON public.usage_ledger FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- POSTPAID INVOICES
CREATE TABLE public.postpaid_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  total_usage_ngn NUMERIC(14,4) NOT NULL DEFAULT 0,
  wallet_deducted_ngn NUMERIC(14,4) NOT NULL DEFAULT 0,
  invoice_balance_ngn NUMERIC(14,4) NOT NULL DEFAULT 0,
  status public.postpaid_invoice_status NOT NULL DEFAULT 'generated',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, billing_period)
);

CREATE INDEX idx_postpaid_invoices_status ON public.postpaid_invoices(status);

ALTER TABLE public.postpaid_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own postpaid invoices"
  ON public.postpaid_invoices FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Service role manages postpaid invoices"
  ON public.postpaid_invoices FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- CREDIT LIMITS
CREATE TABLE public.credit_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  credit_limit_ngn NUMERIC(14,4) NOT NULL DEFAULT 0,
  current_usage_ngn NUMERIC(14,4) NOT NULL DEFAULT 0,
  warning_threshold_percent INTEGER NOT NULL DEFAULT 80,
  hard_limit_action public.credit_limit_action NOT NULL DEFAULT 'notify_only',
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspended_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own credit limits"
  ON public.credit_limits FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Service role manages credit limits"
  ON public.credit_limits FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_postpaid_invoices_updated_at
  BEFORE UPDATE ON public.postpaid_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_limits_updated_at
  BEFORE UPDATE ON public.credit_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Record usage event function
CREATE OR REPLACE FUNCTION public.record_usage_event(
  p_tenant_id TEXT,
  p_org_id UUID,
  p_event_type TEXT,
  p_quantity NUMERIC,
  p_unit_rate_ngn NUMERIC,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC;
  v_billing_period TEXT;
  v_billing_model public.billing_model;
  v_credit_limit RECORD;
BEGIN
  v_amount := p_quantity * p_unit_rate_ngn;
  v_billing_period := to_char(now(), 'YYYY-MM');

  SELECT t.billing_model INTO v_billing_model FROM tenants t WHERE t.id::text = p_tenant_id;
  
  IF v_billing_model = 'postpaid' THEN
    SELECT * INTO v_credit_limit FROM credit_limits cl WHERE cl.tenant_id = p_tenant_id;
    
    IF v_credit_limit IS NOT NULL THEN
      IF v_credit_limit.is_suspended THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'account_suspended');
      END IF;
      
      IF v_credit_limit.hard_limit_action = 'suspend_services' 
         AND (v_credit_limit.current_usage_ngn + v_amount) > v_credit_limit.credit_limit_ngn 
         AND v_credit_limit.credit_limit_ngn > 0 THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'credit_limit_exceeded');
      END IF;
    END IF;

    INSERT INTO usage_ledger (tenant_id, org_id, event_type, quantity, unit_rate_ngn, amount_ngn, billing_period, metadata)
    VALUES (p_tenant_id, p_org_id, p_event_type, p_quantity, p_unit_rate_ngn, v_amount, v_billing_period, p_metadata);

    UPDATE credit_limits SET current_usage_ngn = current_usage_ngn + v_amount WHERE tenant_id = p_tenant_id;

    RETURN jsonb_build_object('allowed', true, 'amount_ngn', v_amount, 'billing_model', 'postpaid',
      'current_usage', COALESCE(v_credit_limit.current_usage_ngn + v_amount, v_amount));
  ELSE
    RETURN jsonb_build_object('allowed', true, 'billing_model', v_billing_model::text, 'amount_ngn', v_amount);
  END IF;
END;
$$;
