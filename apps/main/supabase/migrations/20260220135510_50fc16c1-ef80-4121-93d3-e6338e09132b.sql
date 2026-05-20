
-- Add new columns to subscription_plans for the enhanced onboarding schema
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS plan_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS badge_text TEXT,
  ADD COLUMN IF NOT EXISTS badge_style TEXT DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS cta_type TEXT DEFAULT 'SELECT',
  ADD COLUMN IF NOT EXISTS cta_label TEXT,
  ADD COLUMN IF NOT EXISTS pricing_display_mode TEXT DEFAULT 'PRICE',
  ADD COLUMN IF NOT EXISTS custom_price_text TEXT,
  ADD COLUMN IF NOT EXISTS max_users INTEGER,
  ADD COLUMN IF NOT EXISTS entitlements JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_helper_template TEXT,
  ADD COLUMN IF NOT EXISTS yearly_price_ngn NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metric_limit INTEGER,
  ADD COLUMN IF NOT EXISTS metric_line_template TEXT;

-- Index on plan_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_key ON public.subscription_plans(plan_key);
