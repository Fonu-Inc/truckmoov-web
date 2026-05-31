CREATE OR REPLACE FUNCTION public.pay_postpaid_invoice(
  p_invoice_id uuid,
  p_payment_method text,
  p_payment_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_caller_tenant text;
  v_is_platform_admin boolean;
BEGIN
  SELECT * INTO v_invoice FROM public.postpaid_invoices WHERE id = p_invoice_id;
  IF v_invoice IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invoice_not_found');
  END IF;

  IF v_invoice.status = 'paid' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_paid');
  END IF;

  -- Authorisation: caller must be in the tenant or a platform admin
  SELECT tenant_id INTO v_caller_tenant FROM public.profiles WHERE id = auth.uid();
  v_is_platform_admin := public.is_platform_admin(auth.uid());

  IF NOT v_is_platform_admin AND (v_caller_tenant IS NULL OR v_caller_tenant <> v_invoice.tenant_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorised');
  END IF;

  UPDATE public.postpaid_invoices
  SET status = 'paid',
      paid_at = now(),
      payment_reference = COALESCE(p_payment_reference, 'manual-' || to_char(now(), 'YYYYMMDDHH24MISS')),
      notes = COALESCE(notes, '') ||
              CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE E'\n' END ||
              'Paid via ' || COALESCE(p_payment_method, 'unknown') || ' on ' || to_char(now(), 'YYYY-MM-DD HH24:MI')
  WHERE id = p_invoice_id;

  -- Lift suspension if any
  UPDATE public.credit_limits
  SET is_suspended = false,
      suspended_at = NULL,
      current_usage_ngn = 0
  WHERE tenant_id = v_invoice.tenant_id
    AND is_suspended = true;

  RETURN jsonb_build_object('success', true, 'invoice_id', p_invoice_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.pay_postpaid_invoice(uuid, text, text) TO authenticated;