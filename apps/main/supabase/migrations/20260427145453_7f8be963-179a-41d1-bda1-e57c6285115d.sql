-- Add operational quotas to tenants (driver, device, sim) to mirror existing vehicle_quota.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS driver_quota integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS device_quota integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS sim_quota integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS driver_quota_notifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS device_quota_notifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sim_quota_notifications jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Defensive backfill (DEFAULTs cover new rows).
UPDATE public.tenants SET driver_quota = 30 WHERE driver_quota IS NULL;
UPDATE public.tenants SET device_quota = 25 WHERE device_quota IS NULL;
UPDATE public.tenants SET sim_quota = 25 WHERE sim_quota IS NULL;