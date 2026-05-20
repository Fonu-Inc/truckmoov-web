CREATE OR REPLACE FUNCTION public.tg_tenant_consolidated_flag()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.mtn_consolidated_invoice :=
    (NEW.billing_model::text = 'postpaid' AND 'mtn-enterprise' = ANY(COALESCE(NEW.tags,'{}')));
  RETURN NEW;
END $$;

DROP POLICY IF EXISTS "service role writes reminders" ON public.invoice_finance_reminders;
CREATE POLICY "service role writes reminders"
  ON public.invoice_finance_reminders FOR INSERT
  TO service_role
  WITH CHECK (true);