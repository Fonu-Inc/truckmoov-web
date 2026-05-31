-- Add revenue and last active tracking columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS monthly_revenue_ngn NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing tenants with revenue based on their plan
UPDATE public.tenants SET monthly_revenue_ngn = CASE 
  WHEN plan = 'starter' THEN 774500
  WHEN plan = 'professional' THEN 2323500
  WHEN plan = 'enterprise' THEN 7748500
  ELSE 0
END;

-- Set last_active_at to updated_at for existing tenants
UPDATE public.tenants SET last_active_at = COALESCE(updated_at, created_at);