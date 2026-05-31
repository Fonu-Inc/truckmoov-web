ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terminated_by UUID,
  ADD COLUMN IF NOT EXISTS terminated_by_email TEXT,
  ADD COLUMN IF NOT EXISTS termination_reason TEXT,
  ADD COLUMN IF NOT EXISTS data_purge_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_export_path TEXT,
  ADD COLUMN IF NOT EXISTS data_export_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.tenant_terminations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tenant_name TEXT NOT NULL,
  terminated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  terminated_by UUID,
  terminated_by_email TEXT,
  terminated_by_name TEXT,
  reason TEXT NOT NULL,
  sims_terminated_count INTEGER NOT NULL DEFAULT 0,
  whatsapp_numbers_retired_count INTEGER NOT NULL DEFAULT 0,
  data_export_path TEXT,
  data_export_expires_at TIMESTAMPTZ,
  data_purge_at TIMESTAMPTZ NOT NULL,
  resource_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_terminations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_read_terminations"
ON public.tenant_terminations
FOR SELECT
TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "platform_admin_insert_terminations"
ON public.tenant_terminations
FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_tenant_terminations_tenant ON public.tenant_terminations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_terminations_terminated_at ON public.tenant_terminations(terminated_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-data-exports', 'tenant-data-exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "platform_admin_write_tenant_exports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tenant-data-exports' AND public.is_platform_admin(auth.uid()));

CREATE POLICY "platform_admin_read_tenant_exports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'tenant-data-exports' AND public.is_platform_admin(auth.uid()));

CREATE POLICY "platform_admin_delete_tenant_exports"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'tenant-data-exports' AND public.is_platform_admin(auth.uid()));