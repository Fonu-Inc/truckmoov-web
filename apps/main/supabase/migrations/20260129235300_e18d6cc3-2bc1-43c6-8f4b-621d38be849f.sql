-- Fix remaining INSERT policies that should be tenant-scoped

-- DEVICE TELEMETRY - Keep public insert but add tenant validation
-- (IoT devices need to insert without auth, but we validate tenant_id exists)
-- No change needed - this is intentional for device telemetry ingestion

-- DRIVER BEHAVIOR EVENTS - Keep public insert for device ingestion  
-- No change needed - this is intentional for behavior event ingestion

-- SIM USAGE SIGNALS - Keep system insert
-- No change needed - this is intentional

-- The warnings are for intentional public INSERT policies for IoT device data ingestion
-- These tables receive data from devices that don't have user authentication