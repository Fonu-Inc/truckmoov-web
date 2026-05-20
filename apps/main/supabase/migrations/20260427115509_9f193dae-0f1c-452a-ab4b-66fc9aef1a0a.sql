-- Add vehicle quota and notification tracking to tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS vehicle_quota integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS vehicle_quota_notifications jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill: any tenant that somehow has NULL gets 25 (defensive — DEFAULT covers it)
UPDATE public.tenants SET vehicle_quota = 25 WHERE vehicle_quota IS NULL;