-- Drop existing restrictive SELECT policies on devices
DROP POLICY IF EXISTS "Authorized users can view devices" ON public.devices;

-- Create a more permissive SELECT policy for devices (allows viewing for authenticated and anonymous users)
CREATE POLICY "Anyone can view devices" 
ON public.devices 
FOR SELECT 
USING (true);

-- Drop existing restrictive SELECT policy on device_telemetry
DROP POLICY IF EXISTS "Authorized users can view telemetry" ON public.device_telemetry;

-- Create a more permissive SELECT policy for device_telemetry
CREATE POLICY "Anyone can view telemetry" 
ON public.device_telemetry 
FOR SELECT 
USING (true);