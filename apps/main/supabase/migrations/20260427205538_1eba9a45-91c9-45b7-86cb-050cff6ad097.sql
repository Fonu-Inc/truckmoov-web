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
    INSERT INTO public.security_audit_logs (tenant_id, tenant_name, event_type, severity, description, metadata)
    VALUES (
      rec.id, rec.name, 'TRIAL_EXPIRING_SOON', 'warning',
      format('Trial for %s expires on %s.', rec.name, to_char(rec.trial_ends_at, 'YYYY-MM-DD')),
      jsonb_build_object('trial_ends_at', rec.trial_ends_at)
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
    INSERT INTO public.security_audit_logs (tenant_id, tenant_name, event_type, severity, description, metadata)
    VALUES (rec.id, rec.name, 'TRIAL_AUTO_CONVERTED', 'info',
      format('Trial for %s auto-converted to Active (payment method on file).', rec.name),
      '{}'::jsonb);
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
    INSERT INTO public.security_audit_logs (tenant_id, tenant_name, event_type, severity, description, metadata)
    VALUES (rec.id, rec.name, 'TRIAL_SUSPENDED', 'warning',
      format('Trial for %s expired with no payment method — moved to Suspended.', rec.name),
      '{}'::jsonb);
    tenant_id := rec.id; action := 'suspended'; RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;