-- Add public SELECT policy for geofences for demo tenant
CREATE POLICY "Allow public read for demo tenant geofences"
ON public.geofences
FOR SELECT
USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');

-- Also add for vehicle_geofences (needed for join in the query)
CREATE POLICY "Allow public read for demo tenant vehicle_geofences"
ON public.vehicle_geofences
FOR SELECT
USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');