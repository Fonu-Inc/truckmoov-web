-- Create tenant wallets table
CREATE TABLE public.tenant_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  balance_ngn NUMERIC NOT NULL DEFAULT 0,
  credit_enabled BOOLEAN NOT NULL DEFAULT false,
  credit_limit_ngn NUMERIC DEFAULT 0,
  low_balance_threshold_ngn NUMERIC DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallet transactions table for logging
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'debit', 'credit', 'topup', 'refund'
  communication_type TEXT, -- 'call', 'sms', 'whatsapp', null for topups
  quantity NUMERIC, -- minutes for calls, count for messages
  unit_rate_ngn NUMERIC,
  amount_ngn NUMERIC NOT NULL,
  balance_before_ngn NUMERIC NOT NULL,
  balance_after_ngn NUMERIC NOT NULL,
  reference_id TEXT, -- external message/call id
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create configurable communication rates table
CREATE TABLE public.communication_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  communication_type TEXT NOT NULL UNIQUE, -- 'call', 'sms', 'whatsapp'
  rate_ngn NUMERIC NOT NULL,
  rate_unit TEXT NOT NULL, -- 'per_minute', 'per_message'
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_rates ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant_wallets
CREATE POLICY "Platform admins can manage all wallets"
ON public.tenant_wallets FOR ALL
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can view own wallet"
ON public.tenant_wallets FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS policies for wallet_transactions
CREATE POLICY "Platform admins can view all transactions"
ON public.wallet_transactions FOR SELECT
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can view own transactions"
ON public.wallet_transactions FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert transactions"
ON public.wallet_transactions FOR INSERT
WITH CHECK (true);

-- RLS policies for communication_rates
CREATE POLICY "Anyone authenticated can view rates"
ON public.communication_rates FOR SELECT
USING (true);

CREATE POLICY "Platform admins can manage rates"
ON public.communication_rates FOR ALL
USING (public.is_platform_admin(auth.uid()));

-- Insert default rates
INSERT INTO public.communication_rates (communication_type, rate_ngn, rate_unit, description) VALUES
('call', 22, 'per_minute', 'Voice call rate per minute'),
('sms', 6, 'per_message', 'SMS rate per message'),
('whatsapp', 10, 'per_message', 'WhatsApp outgoing message rate');

-- Create function to check and deduct wallet balance
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_tenant_id TEXT,
  p_communication_type TEXT,
  p_quantity NUMERIC,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Deduct balance
  v_balance_after := v_balance_before - v_amount;
  
  UPDATE public.tenant_wallets 
  SET balance_ngn = v_balance_after, updated_at = now()
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
    'quantity', p_quantity
  );
END;
$$;

-- Create function to top up wallet
CREATE OR REPLACE FUNCTION public.topup_wallet(
  p_tenant_id TEXT,
  p_amount NUMERIC,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
BEGIN
  -- Get or create wallet
  SELECT * INTO v_wallet FROM public.tenant_wallets WHERE tenant_id = p_tenant_id FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.tenant_wallets (tenant_id, balance_ngn)
    VALUES (p_tenant_id, 0)
    RETURNING * INTO v_wallet;
  END IF;
  
  v_balance_before := v_wallet.balance_ngn;
  v_balance_after := v_balance_before + p_amount;
  
  UPDATE public.tenant_wallets 
  SET balance_ngn = v_balance_after, updated_at = now()
  WHERE tenant_id = p_tenant_id;
  
  -- Log transaction
  INSERT INTO public.wallet_transactions (
    tenant_id, transaction_type, amount_ngn,
    balance_before_ngn, balance_after_ngn,
    reference_id, description
  ) VALUES (
    p_tenant_id, 'topup', p_amount,
    v_balance_before, v_balance_after,
    p_reference_id, COALESCE(p_description, 'Wallet top-up')
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'amount_credited', p_amount,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after
  );
END;
$$;

-- Create function to get wallet balance
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_tenant_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_wallet FROM public.tenant_wallets WHERE tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'balance', 0,
      'credit_enabled', false,
      'credit_limit', 0,
      'low_balance_threshold', 1000
    );
  END IF;
  
  RETURN jsonb_build_object(
    'balance', v_wallet.balance_ngn,
    'credit_enabled', v_wallet.credit_enabled,
    'credit_limit', v_wallet.credit_limit_ngn,
    'low_balance_threshold', v_wallet.low_balance_threshold_ngn
  );
END;
$$;

-- Create updated_at trigger for wallets
CREATE TRIGGER update_tenant_wallets_updated_at
BEFORE UPDATE ON public.tenant_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for rates
CREATE TRIGGER update_communication_rates_updated_at
BEFORE UPDATE ON public.communication_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();