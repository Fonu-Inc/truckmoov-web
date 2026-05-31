-- Step 1: Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dispatcher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer_finance';