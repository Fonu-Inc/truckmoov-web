-- Drop the restrictive check constraint on status field
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_status_check;

-- Add a more permissive constraint that allows lifecycle status values as legacy status
ALTER TABLE public.devices ADD CONSTRAINT devices_status_check CHECK (
  status IN ('registered', 'configured', 'assigned', 'active', 'faulty', 'decommissioned', 'config_pending', 'verified_online', 'assignable')
);