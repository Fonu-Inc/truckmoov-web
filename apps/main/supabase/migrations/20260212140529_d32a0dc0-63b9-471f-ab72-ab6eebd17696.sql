
-- Job Settlements table: tracks payment flow from payer (Enterprise/Aggregator) to payee (Owner-Operator)
CREATE TABLE public.job_settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE RESTRICT,
  payer_org_id UUID NOT NULL REFERENCES public.organizations(id),
  payee_org_id UUID NOT NULL REFERENCES public.organizations(id),
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  platform_fee NUMERIC DEFAULT 0,
  net_amount NUMERIC GENERATED ALWAYS AS (gross_amount - COALESCE(platform_fee, 0)) STORED,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID')),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_orgs CHECK (payer_org_id != payee_org_id)
);

-- Indexes
CREATE INDEX idx_job_settlements_job_id ON public.job_settlements(job_id);
CREATE INDEX idx_job_settlements_payer ON public.job_settlements(payer_org_id);
CREATE INDEX idx_job_settlements_payee ON public.job_settlements(payee_org_id);
CREATE INDEX idx_job_settlements_status ON public.job_settlements(status);

-- Enable RLS
ALTER TABLE public.job_settlements ENABLE ROW LEVEL SECURITY;

-- Platform admins: full access
CREATE POLICY "Platform admins full access to settlements"
  ON public.job_settlements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

-- Payer org members: read + update (editable by payer)
CREATE POLICY "Payer org members can view settlements"
  ON public.job_settlements FOR SELECT
  USING (public.is_org_member(auth.uid(), payer_org_id));

CREATE POLICY "Payer org members can update settlements"
  ON public.job_settlements FOR UPDATE
  USING (public.is_org_member(auth.uid(), payer_org_id))
  WITH CHECK (public.is_org_member(auth.uid(), payer_org_id));

-- Payee org members: read-only
CREATE POLICY "Payee org members can view settlements"
  ON public.job_settlements FOR SELECT
  USING (public.is_org_member(auth.uid(), payee_org_id));

-- Insert: only payer org or system (service role)
CREATE POLICY "Payer org can create settlements"
  ON public.job_settlements FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), payer_org_id));

-- Timestamp trigger
CREATE TRIGGER update_job_settlements_updated_at
  BEFORE UPDATE ON public.job_settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function: auto-create settlement on job completion
CREATE OR REPLACE FUNCTION public.create_settlement_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
  v_existing UUID;
BEGIN
  -- Only fire when status transitions to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Need both job_owner_org_id (payer) and executing_org_id (payee)
    IF NEW.job_owner_org_id IS NOT NULL AND NEW.executing_org_id IS NOT NULL
       AND NEW.job_owner_org_id != NEW.executing_org_id THEN

      -- Idempotency check
      SELECT id INTO v_existing FROM public.job_settlements WHERE job_id = NEW.id LIMIT 1;
      IF v_existing IS NOT NULL THEN
        RETURN NEW;
      END IF;

      INSERT INTO public.job_settlements (
        job_id, payer_org_id, payee_org_id, gross_amount, status
      ) VALUES (
        NEW.id,
        NEW.job_owner_org_id,
        NEW.executing_org_id,
        COALESCE(NEW.revenue_ngn, NEW.amount_ngn, 0),
        'PENDING'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_settlement_on_completion
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_settlement_on_completion();
