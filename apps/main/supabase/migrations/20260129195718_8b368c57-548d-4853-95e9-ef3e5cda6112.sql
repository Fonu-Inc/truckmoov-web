-- Add vehicle_count and driver_count columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS vehicle_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS driver_count integer DEFAULT 0;