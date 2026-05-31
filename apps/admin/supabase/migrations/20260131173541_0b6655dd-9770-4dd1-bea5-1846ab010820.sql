-- Add device configuration tracking fields to devices table
ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS configured_by uuid,
ADD COLUMN IF NOT EXISTS configured_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_error_code text,
ADD COLUMN IF NOT EXISTS verification_error_message text,
ADD COLUMN IF NOT EXISTS installer_id uuid,
ADD COLUMN IF NOT EXISTS installer_notes text;

-- Create device_installation_events table for audit trail
CREATE TABLE IF NOT EXISTS public.device_installation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('registered', 'config_marked', 'verified', 'failed_verify', 'reset', 'assigned', 'unassigned')),
  actor_id uuid,
  actor_name text,
  previous_status text,
  new_status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on device_installation_events
ALTER TABLE public.device_installation_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for device_installation_events
CREATE POLICY "Tenant users can view own installation events"
ON public.device_installation_events FOR SELECT
USING (
  is_platform_admin(auth.uid()) OR 
  tenant_id = get_user_tenant_id(auth.uid())
);

CREATE POLICY "Device managers can insert installation events"
ON public.device_installation_events FOR INSERT
WITH CHECK (
  can_manage_devices(auth.uid()) OR
  has_role(auth.uid(), 'installer')
);

-- Create helper function for installer permissions
CREATE OR REPLACE FUNCTION public.can_configure_devices(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('tenant_admin', 'operations_manager', 'platform_admin', 'installer')
  )
$$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_device_installation_events_device_id 
ON public.device_installation_events(device_id);

CREATE INDEX IF NOT EXISTS idx_device_installation_events_tenant_id 
ON public.device_installation_events(tenant_id);

CREATE INDEX IF NOT EXISTS idx_devices_lifecycle_status 
ON public.devices(lifecycle_status);

CREATE INDEX IF NOT EXISTS idx_devices_configured_at 
ON public.devices(configured_at);