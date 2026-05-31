-- AI Provider enum
CREATE TYPE public.ai_provider AS ENUM ('openai', 'anthropic', 'lovable');

-- AI Model enum  
CREATE TYPE public.ai_model AS ENUM (
  'gpt-4.1', 'gpt-4o', 'gpt-4o-mini', 'gpt-5', 'gpt-5-mini', 'gpt-5-nano',
  'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-3.5-sonnet',
  'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview'
);

-- Platform-level AI Governance (SuperAdmin)
CREATE TABLE public.platform_ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Allowed providers
  openai_enabled BOOLEAN NOT NULL DEFAULT true,
  anthropic_enabled BOOLEAN NOT NULL DEFAULT true,
  lovable_enabled BOOLEAN NOT NULL DEFAULT true,
  -- Allowed models per provider (JSON arrays)
  openai_allowed_models TEXT[] DEFAULT ARRAY['gpt-4o', 'gpt-4o-mini', 'gpt-5', 'gpt-5-mini'],
  anthropic_allowed_models TEXT[] DEFAULT ARRAY['claude-3.5-sonnet', 'claude-3-sonnet', 'claude-3-haiku'],
  lovable_allowed_models TEXT[] DEFAULT ARRAY['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview'],
  -- Default provider for demo/trial tenants
  default_provider public.ai_provider NOT NULL DEFAULT 'lovable',
  default_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  -- Guardrails
  max_tokens_per_request INTEGER NOT NULL DEFAULT 4000,
  max_requests_per_minute INTEGER NOT NULL DEFAULT 60,
  max_tokens_per_day_per_tenant INTEGER NOT NULL DEFAULT 100000,
  -- Redaction toggles (ON by default)
  redact_phone_numbers BOOLEAN NOT NULL DEFAULT true,
  redact_driver_names BOOLEAN NOT NULL DEFAULT true,
  redact_vehicle_plates BOOLEAN NOT NULL DEFAULT true,
  -- Prompt/response storage
  store_prompts_responses BOOLEAN NOT NULL DEFAULT false,
  -- Global feature toggle
  ai_job_matching_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure only one platform config row exists
CREATE UNIQUE INDEX platform_ai_config_singleton ON public.platform_ai_config ((true));

-- Insert default platform config
INSERT INTO public.platform_ai_config (id) VALUES (gen_random_uuid());

-- Tenant-level AI Configuration
CREATE TABLE public.tenant_ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  -- Enable AI Job Matching
  enabled BOOLEAN NOT NULL DEFAULT false,
  -- Provider selection
  provider public.ai_provider,
  model TEXT,
  -- BYOK - API key reference (stored encrypted, we store the vault reference)
  api_key_encrypted TEXT,
  api_key_last_four TEXT,
  -- Matching policy weights (0-100)
  weight_capacity_fit INTEGER NOT NULL DEFAULT 80,
  weight_distance_pickup INTEGER NOT NULL DEFAULT 70,
  weight_eta_delivery INTEGER NOT NULL DEFAULT 60,
  weight_driver_availability INTEGER NOT NULL DEFAULT 75,
  weight_cost_efficiency INTEGER NOT NULL DEFAULT 50,
  -- Hard constraints (checkboxes)
  constraint_max_load BOOLEAN NOT NULL DEFAULT true,
  constraint_truck_type BOOLEAN NOT NULL DEFAULT true,
  constraint_refrigeration BOOLEAN NOT NULL DEFAULT true,
  constraint_driver_hours BOOLEAN NOT NULL DEFAULT true,
  -- Confidence threshold
  confidence_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.75,
  -- Human-in-the-loop
  require_dispatcher_approval BOOLEAN NOT NULL DEFAULT true,
  -- Connection test status
  last_connection_test_at TIMESTAMPTZ,
  last_connection_test_success BOOLEAN,
  last_connection_test_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Usage Logs
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  provider public.ai_provider NOT NULL,
  model TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'JOB_MATCHING',
  tokens_used INTEGER NOT NULL DEFAULT 0,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  latency_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  job_id TEXT,
  candidates_count INTEGER,
  matches_returned INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Match Results (for explainability)
CREATE TABLE public.ai_match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  provider public.ai_provider NOT NULL,
  model TEXT NOT NULL,
  candidates_considered INTEGER NOT NULL,
  top_matches JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC(3,2),
  analysis TEXT,
  prompt_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ai_usage_logs_tenant ON public.ai_usage_logs(tenant_id);
CREATE INDEX idx_ai_usage_logs_created ON public.ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_provider ON public.ai_usage_logs(provider);
CREATE INDEX idx_ai_match_results_tenant ON public.ai_match_results(tenant_id);
CREATE INDEX idx_ai_match_results_job ON public.ai_match_results(job_id);
CREATE INDEX idx_ai_match_results_created ON public.ai_match_results(created_at DESC);

-- Enable RLS
ALTER TABLE public.platform_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_match_results ENABLE ROW LEVEL SECURITY;

-- Platform AI Config - Only platform admins can view/manage
CREATE POLICY "Platform admins can manage platform AI config"
ON public.platform_ai_config
FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- Tenant AI Config - Tenant admins can manage their own config
CREATE POLICY "Tenant admins can view their AI config"
ON public.tenant_ai_config
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.is_platform_admin(auth.uid())
);

CREATE POLICY "Tenant admins can manage their AI config"
ON public.tenant_ai_config
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'tenant_admin'
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'tenant_admin'
  )
);

CREATE POLICY "Platform admins can manage all tenant AI configs"
ON public.tenant_ai_config
FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- AI Usage Logs - Tenants see their own, platform admins see all
CREATE POLICY "Tenants can view their AI usage logs"
ON public.ai_usage_logs
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.is_platform_admin(auth.uid())
);

-- Allow edge functions to insert usage logs
CREATE POLICY "Edge functions can insert AI usage logs"
ON public.ai_usage_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- AI Match Results - Tenants see their own, platform admins see aggregate only
CREATE POLICY "Tenants can view their AI match results"
ON public.ai_match_results
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.is_platform_admin(auth.uid())
);

-- Allow edge functions to insert match results
CREATE POLICY "Edge functions can insert AI match results"
ON public.ai_match_results
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Security definer function to check if user can run AI matching
CREATE OR REPLACE FUNCTION public.can_run_ai_matching(_user_id uuid)
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
      AND role IN ('tenant_admin', 'operations_manager', 'dispatcher', 'supervisor', 'platform_admin')
  )
$$;

-- Security definer function to get tenant AI config
CREATE OR REPLACE FUNCTION public.get_tenant_ai_config(p_tenant_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_config RECORD;
  v_platform_config RECORD;
BEGIN
  -- Get platform config
  SELECT * INTO v_platform_config FROM public.platform_ai_config LIMIT 1;
  
  -- Check if AI is enabled globally
  IF NOT v_platform_config.ai_job_matching_enabled THEN
    RETURN jsonb_build_object(
      'enabled', false,
      'error', 'AI Job Matching is disabled platform-wide'
    );
  END IF;
  
  -- Get tenant config
  SELECT * INTO v_tenant_config 
  FROM public.tenant_ai_config 
  WHERE tenant_id = p_tenant_id;
  
  -- If no tenant config, use platform defaults
  IF NOT FOUND OR NOT v_tenant_config.enabled THEN
    RETURN jsonb_build_object(
      'enabled', v_tenant_config.enabled IS TRUE,
      'provider', v_platform_config.default_provider::text,
      'model', v_platform_config.default_model,
      'use_platform_key', true,
      'confidence_threshold', COALESCE(v_tenant_config.confidence_threshold, 0.75),
      'require_dispatcher_approval', COALESCE(v_tenant_config.require_dispatcher_approval, true),
      'weights', jsonb_build_object(
        'capacity_fit', COALESCE(v_tenant_config.weight_capacity_fit, 80),
        'distance_pickup', COALESCE(v_tenant_config.weight_distance_pickup, 70),
        'eta_delivery', COALESCE(v_tenant_config.weight_eta_delivery, 60),
        'driver_availability', COALESCE(v_tenant_config.weight_driver_availability, 75),
        'cost_efficiency', COALESCE(v_tenant_config.weight_cost_efficiency, 50)
      ),
      'constraints', jsonb_build_object(
        'max_load', true,
        'truck_type', true,
        'refrigeration', true,
        'driver_hours', true
      ),
      'guardrails', jsonb_build_object(
        'max_tokens', v_platform_config.max_tokens_per_request,
        'redact_phones', v_platform_config.redact_phone_numbers,
        'redact_names', v_platform_config.redact_driver_names,
        'redact_plates', v_platform_config.redact_vehicle_plates
      )
    );
  END IF;
  
  -- Validate provider is allowed
  IF v_tenant_config.provider = 'openai' AND NOT v_platform_config.openai_enabled THEN
    RETURN jsonb_build_object('enabled', false, 'error', 'OpenAI is disabled by platform');
  END IF;
  
  IF v_tenant_config.provider = 'anthropic' AND NOT v_platform_config.anthropic_enabled THEN
    RETURN jsonb_build_object('enabled', false, 'error', 'Anthropic is disabled by platform');
  END IF;
  
  RETURN jsonb_build_object(
    'enabled', true,
    'provider', v_tenant_config.provider::text,
    'model', v_tenant_config.model,
    'use_platform_key', v_tenant_config.api_key_encrypted IS NULL,
    'api_key_encrypted', v_tenant_config.api_key_encrypted,
    'confidence_threshold', v_tenant_config.confidence_threshold,
    'require_dispatcher_approval', v_tenant_config.require_dispatcher_approval,
    'weights', jsonb_build_object(
      'capacity_fit', v_tenant_config.weight_capacity_fit,
      'distance_pickup', v_tenant_config.weight_distance_pickup,
      'eta_delivery', v_tenant_config.weight_eta_delivery,
      'driver_availability', v_tenant_config.weight_driver_availability,
      'cost_efficiency', v_tenant_config.weight_cost_efficiency
    ),
    'constraints', jsonb_build_object(
      'max_load', v_tenant_config.constraint_max_load,
      'truck_type', v_tenant_config.constraint_truck_type,
      'refrigeration', v_tenant_config.constraint_refrigeration,
      'driver_hours', v_tenant_config.constraint_driver_hours
    ),
    'guardrails', jsonb_build_object(
      'max_tokens', v_platform_config.max_tokens_per_request,
      'redact_phones', v_platform_config.redact_phone_numbers,
      'redact_names', v_platform_config.redact_driver_names,
      'redact_plates', v_platform_config.redact_vehicle_plates
    )
  );
END;
$$;

-- Updated at trigger
CREATE TRIGGER update_platform_ai_config_updated_at
BEFORE UPDATE ON public.platform_ai_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_ai_config_updated_at
BEFORE UPDATE ON public.tenant_ai_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();