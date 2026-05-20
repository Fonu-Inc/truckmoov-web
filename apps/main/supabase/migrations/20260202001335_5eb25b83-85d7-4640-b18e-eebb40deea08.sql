-- Drop existing webhook_events table to recreate with proper schema
DROP TABLE IF EXISTS public.webhook_events CASCADE;

-- =====================================================
-- TRUCKMOOV EXTERNAL INTEGRATIONS SCHEMA
-- =====================================================

-- API Scope Enum
CREATE TYPE public.api_scope AS ENUM (
  'jobs.read',
  'jobs.write',
  'vehicles.read',
  'vehicles.write',
  'drivers.read',
  'drivers.write',
  'devices.read',
  'geofences.read',
  'geofences.write',
  'alerts.read',
  'maintenance.read',
  'fuel.read',
  'webhooks.manage'
);

-- API Key Status Enum
CREATE TYPE public.api_key_status AS ENUM ('active', 'revoked', 'expired');

-- Webhook Event Type Enum
CREATE TYPE public.webhook_event_type AS ENUM (
  'job.created',
  'job.updated',
  'job.offer.sent',
  'job.offer.accepted',
  'job.offer.declined',
  'job.completed',
  'job.cancelled',
  'geofence.enter',
  'geofence.exit',
  'geofence.dwell.exceeded',
  'device.status.changed',
  'sla.breached',
  'maintenance.due',
  'fuel.anomaly.detected',
  'alert.created'
);

-- Webhook Delivery Status Enum
CREATE TYPE public.webhook_delivery_status AS ENUM (
  'pending',
  'success',
  'failed',
  'retrying',
  'dead_letter'
);

-- =====================================================
-- API KEYS TABLE
-- =====================================================
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes api_scope[] NOT NULL DEFAULT '{}',
  status api_key_status NOT NULL DEFAULT 'active',
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  rate_limit_per_day INTEGER NOT NULL DEFAULT 10000,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_used_ip TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_api_keys_prefix ON public.api_keys(key_prefix, status);
CREATE INDEX idx_api_keys_tenant ON public.api_keys(tenant_id, status);

-- =====================================================
-- API USAGE TRACKING TABLE
-- =====================================================
CREATE TABLE public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_usage_tenant_date ON public.api_usage_logs(tenant_id, created_at DESC);
CREATE INDEX idx_api_usage_key_date ON public.api_usage_logs(api_key_id, created_at DESC);

-- =====================================================
-- WEBHOOK SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE public.webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  signing_secret TEXT NOT NULL,
  event_types webhook_event_type[] NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  headers JSONB DEFAULT '{}',
  retry_count INTEGER NOT NULL DEFAULT 3,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_subs_tenant ON public.webhook_subscriptions(tenant_id, is_enabled);

-- =====================================================
-- WEBHOOK EVENTS TABLE
-- =====================================================
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  event_type webhook_event_type NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_events_tenant ON public.webhook_events(tenant_id, created_at DESC);
CREATE INDEX idx_webhook_events_type ON public.webhook_events(event_type, created_at DESC);

-- =====================================================
-- WEBHOOK DELIVERY LOGS TABLE
-- =====================================================
CREATE TABLE public.webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event_id UUID REFERENCES public.webhook_events(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  status webhook_delivery_status NOT NULL DEFAULT 'pending',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  request_url TEXT NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  response_status_code INTEGER,
  response_body TEXT,
  response_headers JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_delivery_status ON public.webhook_delivery_logs(status, next_retry_at);
CREATE INDEX idx_webhook_delivery_tenant ON public.webhook_delivery_logs(tenant_id, created_at DESC);
CREATE INDEX idx_webhook_delivery_subscription ON public.webhook_delivery_logs(subscription_id, created_at DESC);

-- =====================================================
-- INTEGRATION AUDIT LOG TABLE
-- =====================================================
CREATE TABLE public.integration_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_audit_tenant ON public.integration_audit_logs(tenant_id, created_at DESC);

-- =====================================================
-- RATE LIMIT TRACKING TABLE
-- =====================================================
CREATE TABLE public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_type TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(api_key_id, window_start, window_type)
);

CREATE INDEX idx_rate_limits_key_window ON public.api_rate_limits(api_key_id, window_start DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own API keys" ON public.api_keys
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "Tenants can manage own API keys" ON public.api_keys
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()));

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own API usage" ON public.api_usage_logs
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "System can insert API usage" ON public.api_usage_logs
  FOR INSERT WITH CHECK (true);

ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own webhooks" ON public.webhook_subscriptions
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "Tenants can manage own webhooks" ON public.webhook_subscriptions
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()));

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own events" ON public.webhook_events
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "System can insert events" ON public.webhook_events
  FOR INSERT WITH CHECK (true);

ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own delivery logs" ON public.webhook_delivery_logs
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "System can manage delivery logs" ON public.webhook_delivery_logs
  FOR ALL WITH CHECK (true);

ALTER TABLE public.integration_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own audit logs" ON public.integration_audit_logs
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "System can insert audit logs" ON public.integration_audit_logs
  FOR INSERT WITH CHECK (true);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits" ON public.api_rate_limits
  FOR ALL WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_api_key(p_api_key TEXT, p_required_scope api_scope)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_prefix TEXT;
  v_key_hash TEXT;
  v_api_key RECORD;
  v_rate_check JSONB;
BEGIN
  v_key_prefix := substring(p_api_key, 1, 8);
  v_key_hash := encode(sha256(p_api_key::bytea), 'hex');
  
  SELECT * INTO v_api_key
  FROM public.api_keys
  WHERE key_prefix = v_key_prefix
    AND key_hash = v_key_hash
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'INVALID_API_KEY');
  END IF;
  
  IF NOT (p_required_scope = ANY(v_api_key.scopes)) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'INSUFFICIENT_SCOPE', 'required', p_required_scope::text);
  END IF;
  
  v_rate_check := public.check_api_rate_limit(v_api_key.id, v_api_key.tenant_id, v_api_key.rate_limit_per_minute, v_api_key.rate_limit_per_day);
  
  IF NOT (v_rate_check->>'allowed')::boolean THEN
    RETURN jsonb_build_object('valid', false, 'error', 'RATE_LIMIT_EXCEEDED', 'details', v_rate_check);
  END IF;
  
  UPDATE public.api_keys SET last_used_at = now() WHERE id = v_api_key.id;
  
  RETURN jsonb_build_object(
    'valid', true,
    'tenant_id', v_api_key.tenant_id,
    'api_key_id', v_api_key.id,
    'scopes', v_api_key.scopes
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_api_key_id UUID,
  p_tenant_id TEXT,
  p_limit_per_minute INTEGER,
  p_limit_per_day INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_minute_count INTEGER;
  v_day_count INTEGER;
  v_minute_start TIMESTAMPTZ;
  v_day_start TIMESTAMPTZ;
BEGIN
  v_minute_start := date_trunc('minute', now());
  v_day_start := date_trunc('day', now());
  
  INSERT INTO public.api_rate_limits (api_key_id, tenant_id, window_start, window_type, request_count)
  VALUES (p_api_key_id, p_tenant_id, v_minute_start, 'minute', 1)
  ON CONFLICT (api_key_id, window_start, window_type) 
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_minute_count;
  
  INSERT INTO public.api_rate_limits (api_key_id, tenant_id, window_start, window_type, request_count)
  VALUES (p_api_key_id, p_tenant_id, v_day_start, 'day', 1)
  ON CONFLICT (api_key_id, window_start, window_type) 
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_day_count;
  
  IF v_minute_count > p_limit_per_minute THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'minute_limit_exceeded',
      'limit', p_limit_per_minute,
      'current', v_minute_count,
      'reset_at', v_minute_start + interval '1 minute'
    );
  END IF;
  
  IF v_day_count > p_limit_per_day THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'day_limit_exceeded',
      'limit', p_limit_per_day,
      'current', v_day_count,
      'reset_at', v_day_start + interval '1 day'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'minute_remaining', p_limit_per_minute - v_minute_count,
    'day_remaining', p_limit_per_day - v_day_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_webhook_event(
  p_tenant_id TEXT,
  p_event_type webhook_event_type,
  p_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_subscription RECORD;
BEGIN
  v_event_id := gen_random_uuid();
  
  INSERT INTO public.webhook_events (id, event_id, tenant_id, event_type, payload, occurred_at)
  VALUES (v_event_id, v_event_id, p_tenant_id, p_event_type, 
    jsonb_build_object(
      'event_id', v_event_id,
      'event_type', p_event_type::text,
      'tenant_id', p_tenant_id,
      'occurred_at', now(),
      'data', p_data
    ),
    now()
  );
  
  FOR v_subscription IN
    SELECT * FROM public.webhook_subscriptions
    WHERE tenant_id = p_tenant_id
      AND is_enabled = true
      AND p_event_type = ANY(event_types)
  LOOP
    INSERT INTO public.webhook_delivery_logs (
      webhook_event_id, subscription_id, tenant_id, status,
      request_url, request_body, attempt_number
    ) VALUES (
      v_event_id, v_subscription.id, p_tenant_id, 'pending',
      v_subscription.url,
      (SELECT payload FROM public.webhook_events WHERE id = v_event_id),
      1
    );
  END LOOP;
  
  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_integration_audit(
  p_tenant_id TEXT,
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.integration_audit_logs (
    tenant_id, actor_id, actor_name, action, resource_type, resource_id, changes
  ) VALUES (
    p_tenant_id, p_actor_id, p_actor_name, p_action, p_resource_type, p_resource_id, p_changes
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_api_usage_stats(
  p_tenant_id TEXT,
  p_start_date TIMESTAMPTZ DEFAULT now() - interval '30 days',
  p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_requests', COUNT(*),
    'successful_requests', COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300),
    'failed_requests', COUNT(*) FILTER (WHERE status_code >= 400),
    'avg_response_time_ms', ROUND(AVG(response_time_ms)),
    'requests_by_endpoint', (
      SELECT jsonb_object_agg(endpoint, cnt)
      FROM (
        SELECT endpoint, COUNT(*) as cnt
        FROM public.api_usage_logs
        WHERE tenant_id = p_tenant_id
          AND created_at BETWEEN p_start_date AND p_end_date
        GROUP BY endpoint
        ORDER BY cnt DESC
        LIMIT 10
      ) ep
    ),
    'requests_by_day', (
      SELECT jsonb_agg(jsonb_build_object('date', d, 'count', cnt))
      FROM (
        SELECT date_trunc('day', created_at)::date as d, COUNT(*) as cnt
        FROM public.api_usage_logs
        WHERE tenant_id = p_tenant_id
          AND created_at BETWEEN p_start_date AND p_end_date
        GROUP BY d
        ORDER BY d
      ) daily
    )
  ) INTO v_result
  FROM public.api_usage_logs
  WHERE tenant_id = p_tenant_id
    AND created_at BETWEEN p_start_date AND p_end_date;
  
  RETURN v_result;
END;
$$;

-- Enable realtime for webhook delivery logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_delivery_logs;