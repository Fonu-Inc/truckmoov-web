
-- Add org-type scoping to subscription plans
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS applicable_org_types text[] NOT NULL DEFAULT ARRAY['FLEET_PROVIDER', 'ENTERPRISE', 'AGGREGATOR', 'OWNER_OPERATOR'];

-- Add org-type scoping to plan features (NULL means applies to all org types)
ALTER TABLE public.plan_features
ADD COLUMN IF NOT EXISTS applicable_org_type text DEFAULT NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_plan_features_org_type ON public.plan_features(applicable_org_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_org_types ON public.subscription_plans USING GIN(applicable_org_types);

-- Add a helper function to check if a plan is available for an org type
CREATE OR REPLACE FUNCTION public.is_plan_available_for_org_type(p_plan_id uuid, p_org_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscription_plans
    WHERE id = p_plan_id
      AND is_active = true
      AND p_org_type = ANY(applicable_org_types)
  )
$$;

-- Add a function to get effective features for a plan + org type combo
CREATE OR REPLACE FUNCTION public.get_plan_features_for_org_type(p_plan_id uuid, p_org_type text)
RETURNS SETOF plan_features
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.plan_features
  WHERE plan_id = p_plan_id
    AND (applicable_org_type IS NULL OR applicable_org_type = p_org_type)
  ORDER BY feature_category, feature_name
$$;
