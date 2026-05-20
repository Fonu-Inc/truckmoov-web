-- Create helper function to check if user can manage devices (CRUD)
CREATE OR REPLACE FUNCTION public.can_manage_devices(_user_id uuid)
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
      AND role IN ('tenant_admin', 'operations_manager')
  )
$$;

-- Create helper function to check if user can view devices (read-only)
CREATE OR REPLACE FUNCTION public.can_view_devices(_user_id uuid)
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
      AND role IN ('tenant_admin', 'operations_manager', 'dispatcher', 'platform_admin', 'viewer_finance')
  )
$$;

-- Drop existing device policies
DROP POLICY IF EXISTS "Authenticated users can delete devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated users can insert devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated users can update devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated users can view devices" ON public.devices;

-- Create new RBAC policies for devices

-- SELECT: Fleet Admin, Operations Manager, Dispatcher, Platform Admin, Viewer/Finance can view
CREATE POLICY "Authorized users can view devices"
ON public.devices
FOR SELECT
USING (public.can_view_devices(auth.uid()));

-- INSERT: Only Fleet Admin and Operations Manager can register devices
CREATE POLICY "Device managers can insert devices"
ON public.devices
FOR INSERT
WITH CHECK (public.can_manage_devices(auth.uid()));

-- UPDATE: Only Fleet Admin and Operations Manager can edit devices
CREATE POLICY "Device managers can update devices"
ON public.devices
FOR UPDATE
USING (public.can_manage_devices(auth.uid()));

-- DELETE: Only Fleet Admin and Operations Manager can delete devices
CREATE POLICY "Device managers can delete devices"
ON public.devices
FOR DELETE
USING (public.can_manage_devices(auth.uid()));

-- Also update device_telemetry policies for consistent access
DROP POLICY IF EXISTS "Authenticated users can view telemetry" ON public.device_telemetry;

CREATE POLICY "Authorized users can view telemetry"
ON public.device_telemetry
FOR SELECT
USING (public.can_view_devices(auth.uid()));

-- Update device_geofence_alerts policies
DROP POLICY IF EXISTS "Authenticated users can view geofence alerts" ON public.device_geofence_alerts;

CREATE POLICY "Authorized users can view geofence alerts"
ON public.device_geofence_alerts
FOR SELECT
USING (public.can_view_devices(auth.uid()));