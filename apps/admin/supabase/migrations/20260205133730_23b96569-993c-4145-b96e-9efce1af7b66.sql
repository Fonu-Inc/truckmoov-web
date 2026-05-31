-- Create enum for service tier if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_tier') THEN
    CREATE TYPE public.service_tier AS ENUM ('basic', 'standard', 'advanced', 'premium');
  END IF;
END $$;

-- Add tier column with TEXT type for flexibility, then add other columns
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS tier TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier_badge_color TEXT DEFAULT '#94a3b8',
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS yearly_discount_percent NUMERIC(5,2) DEFAULT 0;

-- Update existing plans with tier assignments
UPDATE public.subscription_plans 
SET tier = 'basic', display_order = 1, tier_badge_color = '#94a3b8', trial_days = 14
WHERE name = 'Starter';

UPDATE public.subscription_plans 
SET tier = 'standard', display_order = 2, tier_badge_color = '#3b82f6', is_popular = true, trial_days = 14
WHERE name = 'Professional';

UPDATE public.subscription_plans 
SET tier = 'advanced', display_order = 3, tier_badge_color = '#22c55e', trial_days = 7
WHERE name = 'Enterprise';

-- Create Premium tier plan if not exists
INSERT INTO public.subscription_plans (
  name, description, price_ngn, billing_cycle, 
  max_vehicles, max_drivers, max_devices, 
  features, is_active, tier, display_order, tier_badge_color, trial_days, yearly_discount_percent
) 
SELECT 
  'Premium',
  'Full-featured solution with video telematics and AI optimization',
  999900,
  'monthly',
  NULL, NULL, NULL,
  '["Everything in Advanced", "Video Telematics", "AI Route Optimization", "Custom Integrations", "Dedicated Support", "White-label Options"]'::jsonb,
  true,
  'premium',
  4,
  '#a855f7',
  7,
  20
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Premium');

-- Create plan features table if not exists
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  feature_category TEXT NOT NULL DEFAULT 'core',
  is_included BOOLEAN NOT NULL DEFAULT false,
  usage_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);

-- Enable RLS on plan_features
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Anyone can view plan features" ON public.plan_features;
DROP POLICY IF EXISTS "Platform admins can manage plan features" ON public.plan_features;

CREATE POLICY "Anyone can view plan features" ON public.plan_features
  FOR SELECT USING (true);

CREATE POLICY "Platform admins can manage plan features" ON public.plan_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );

-- Insert Starter features
INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'gps_tracking', 'GPS Tracking', 'Real-time vehicle location tracking', 'tracking', true, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'job_dispatch', 'Job Dispatch', 'Basic job assignment and management', 'operations', true, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'whatsapp_comm', 'WhatsApp Communication', 'Driver messaging via WhatsApp', 'communication', true, 500 FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'basic_reporting', 'Basic Reporting', 'Standard fleet reports', 'reporting', true, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'geofencing', 'Geofencing', 'Virtual boundary alerts', 'tracking', false, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'driver_behavior', 'Driver Behavior Analytics', 'Driving pattern analysis', 'analytics', false, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'obd_diagnostics', 'OBD-II Diagnostics', 'Vehicle diagnostic data', 'diagnostics', false, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'predictive_maintenance', 'Predictive Maintenance', 'AI-powered maintenance predictions', 'maintenance', false, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'financial_analytics', 'Financial Analytics', 'Cost and profitability analysis', 'analytics', false, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'video_telematics', 'Video Telematics', 'In-cab video monitoring', 'safety', false, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'ai_route_optimization', 'AI Route Optimization', 'AI-powered route planning', 'optimization', false, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_name, feature_description, feature_category, is_included, usage_limit)
SELECT id, 'custom_integrations', 'Custom Integrations', 'API and third-party integrations', 'integration', false, NULL FROM public.subscription_plans WHERE name = 'Starter'
ON CONFLICT (plan_id, feature_key) DO NOTHING;