-- Create activity_logs table for user-facing business events
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'job', 'vehicle', 'driver', 'device', etc.
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'assigned', 'status_changed', 'updated', etc.
  description TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_activity_logs_entity ON public.activity_logs (entity_type, entity_id);
CREATE INDEX idx_activity_logs_tenant ON public.activity_logs (tenant_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Tenant users can view their own activity logs
CREATE POLICY "Tenant users view own activity logs"
ON public.activity_logs
FOR SELECT
USING (
  is_platform_admin(auth.uid()) OR 
  tenant_id = get_user_tenant_id(auth.uid())
);

-- System/users can insert activity logs for their tenant
CREATE POLICY "Tenant users insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (
  is_platform_admin(auth.uid()) OR 
  tenant_id = get_user_tenant_id(auth.uid())
);

-- Enable realtime for activity_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Add comment for documentation
COMMENT ON TABLE public.activity_logs IS 'User-facing activity timeline for business entities (jobs, vehicles, drivers, etc.)';