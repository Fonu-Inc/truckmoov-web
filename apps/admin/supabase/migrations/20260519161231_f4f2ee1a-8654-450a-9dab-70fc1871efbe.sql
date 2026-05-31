ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS billing_mode TEXT NOT NULL DEFAULT 'prepaid'
    CHECK (billing_mode IN ('prepaid','postpaid'));

CREATE INDEX IF NOT EXISTS idx_subscription_plans_billing_mode
  ON public.subscription_plans (billing_mode);