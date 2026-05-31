-- Add spending limit columns to tenant_wallets
ALTER TABLE public.tenant_wallets
ADD COLUMN IF NOT EXISTS spending_limit_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS monthly_spending_limit_ngn numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_month_spending_ngn numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS spending_limit_reset_day integer NOT NULL DEFAULT 1;

-- Update deduct_wallet_balance to check spending limits
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(p_tenant_id text, p_communication_type text, p_quantity numeric, p_reference_id text DEFAULT NULL::text, p_description text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet RECORD;
  v_rate RECORD;
  v_amount NUMERIC;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_result JSONB;
BEGIN
  -- Get current rate
  SELECT * INTO v_rate FROM public.communication_rates 
  WHERE communication_type = p_communication_type AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate not configured for ' || p_communication_type);
  END IF;
  
  -- Calculate amount
  v_amount := p_quantity * v_rate.rate_ngn;
  
  -- Get or create wallet
  SELECT * INTO v_wallet FROM public.tenant_wallets WHERE tenant_id = p_tenant_id FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.tenant_wallets (tenant_id, balance_ngn)
    VALUES (p_tenant_id, 0)
    RETURNING * INTO v_wallet;
  END IF;
  
  -- Check spending limit if enabled
  IF v_wallet.spending_limit_enabled AND v_wallet.monthly_spending_limit_ngn IS NOT NULL THEN
    IF (v_wallet.current_month_spending_ngn + v_amount) > v_wallet.monthly_spending_limit_ngn THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Monthly spending limit exceeded',
        'current_spending', v_wallet.current_month_spending_ngn,
        'spending_limit', v_wallet.monthly_spending_limit_ngn,
        'amount_requested', v_amount
      );
    END IF;
  END IF;
  
  v_balance_before := v_wallet.balance_ngn;
  
  -- Check if sufficient balance or credit enabled
  IF v_balance_before < v_amount AND NOT v_wallet.credit_enabled THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient wallet balance',
      'balance', v_balance_before,
      'required', v_amount
    );
  END IF;
  
  -- Check credit limit if credit enabled
  IF v_wallet.credit_enabled AND v_balance_before < v_amount THEN
    IF (v_balance_before - v_amount) < (-1 * v_wallet.credit_limit_ngn) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Credit limit exceeded',
        'balance', v_balance_before,
        'credit_limit', v_wallet.credit_limit_ngn
      );
    END IF;
  END IF;
  
  -- Deduct balance and update spending
  v_balance_after := v_balance_before - v_amount;
  
  UPDATE public.tenant_wallets 
  SET balance_ngn = v_balance_after, 
      current_month_spending_ngn = current_month_spending_ngn + v_amount,
      updated_at = now()
  WHERE tenant_id = p_tenant_id;
  
  -- Log transaction
  INSERT INTO public.wallet_transactions (
    tenant_id, transaction_type, communication_type, quantity,
    unit_rate_ngn, amount_ngn, balance_before_ngn, balance_after_ngn,
    reference_id, description
  ) VALUES (
    p_tenant_id, 'debit', p_communication_type, p_quantity,
    v_rate.rate_ngn, v_amount, v_balance_before, v_balance_after,
    p_reference_id, COALESCE(p_description, p_communication_type || ' usage charge')
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'amount_charged', v_amount,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'rate', v_rate.rate_ngn,
    'quantity', p_quantity,
    'current_month_spending', v_wallet.current_month_spending_ngn + v_amount
  );
END;
$function$;

-- Create function to reset monthly spending (to be called by a cron job or manually)
CREATE OR REPLACE FUNCTION public.reset_monthly_spending()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.tenant_wallets
  SET current_month_spending_ngn = 0, updated_at = now()
  WHERE spending_limit_reset_day = EXTRACT(DAY FROM CURRENT_DATE)::integer;
END;
$function$;