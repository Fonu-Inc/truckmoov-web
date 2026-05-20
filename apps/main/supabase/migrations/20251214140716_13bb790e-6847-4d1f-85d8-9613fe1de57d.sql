-- Add auto top-up settings to tenant_wallets
ALTER TABLE public.tenant_wallets
ADD COLUMN IF NOT EXISTS auto_topup_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_topup_threshold_ngn numeric DEFAULT 500,
ADD COLUMN IF NOT EXISTS auto_topup_amount_ngn numeric DEFAULT 5000,
ADD COLUMN IF NOT EXISTS auto_topup_phone text;

-- Add last auto top-up timestamp to prevent duplicate charges
ALTER TABLE public.tenant_wallets
ADD COLUMN IF NOT EXISTS last_auto_topup_at timestamp with time zone;