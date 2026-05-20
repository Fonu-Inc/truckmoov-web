-- 1. priority_order on both queues (lower number = higher priority; null = default)
ALTER TABLE public.device_setup_requests
  ADD COLUMN IF NOT EXISTS priority_order integer,
  ADD COLUMN IF NOT EXISTS use_case text,
  ADD COLUMN IF NOT EXISTS provisioning_checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS provisioning_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS provisioning_completed_at timestamptz;

ALTER TABLE public.sim_provisioning_requests
  ADD COLUMN IF NOT EXISTS priority_order integer,
  ADD COLUMN IF NOT EXISTS provisioning_checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS provisioning_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS provisioning_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_device_setup_requests_priority_order
  ON public.device_setup_requests (priority_order ASC NULLS LAST, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_sim_provisioning_requests_priority_order
  ON public.sim_provisioning_requests (priority_order ASC NULLS LAST, created_at ASC);
