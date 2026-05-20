-- =====================================================
-- WHATSAPP BUSINESS MULTI-TENANT SCHEMA
-- =====================================================

-- Enum for WhatsApp account connection status
CREATE TYPE public.whatsapp_account_status AS ENUM (
  'NOT_CONNECTED',
  'PENDING',
  'CONNECTED',
  'NEEDS_ATTENTION',
  'DISABLED'
);

-- Enum for connection method
CREATE TYPE public.whatsapp_connection_method AS ENUM (
  'EMBEDDED_SIGNUP',
  'SUPERADMIN_ASSISTED'
);

-- Enum for template status
CREATE TYPE public.whatsapp_template_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED'
);

-- Enum for message direction
CREATE TYPE public.message_direction AS ENUM (
  'OUTBOUND',
  'INBOUND'
);

-- Enum for message type
CREATE TYPE public.whatsapp_message_type AS ENUM (
  'TEMPLATE',
  'TEXT',
  'MEDIA',
  'INTERACTIVE'
);

-- Enum for message status
CREATE TYPE public.whatsapp_message_status AS ENUM (
  'QUEUED',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED'
);

-- Enum for webhook event status
CREATE TYPE public.webhook_event_status AS ENUM (
  'RECEIVED',
  'PROCESSED',
  'FAILED'
);

-- =====================================================
-- TABLE: tenant_whatsapp_accounts
-- Stores WhatsApp Business sender profiles per tenant
-- =====================================================
CREATE TABLE public.tenant_whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  status public.whatsapp_account_status NOT NULL DEFAULT 'NOT_CONNECTED',
  connection_method public.whatsapp_connection_method,
  waba_id TEXT,
  phone_number_id TEXT,
  business_id TEXT,
  business_portfolio_id TEXT,
  display_phone_number TEXT, -- Masked for display
  verified_name TEXT,
  is_default_sender BOOLEAN NOT NULL DEFAULT false,
  quality_rating TEXT, -- GREEN, YELLOW, RED
  messaging_limit_tier TEXT, -- TIER_1K, TIER_10K, etc.
  token_reference_id TEXT, -- Pointer to secret store, never raw token
  oauth_state TEXT, -- For CSRF protection during OAuth flow
  oauth_state_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT unique_phone_number_id UNIQUE (phone_number_id)
);

-- Enable RLS
ALTER TABLE public.tenant_whatsapp_accounts ENABLE ROW LEVEL SECURITY;

-- Index for tenant lookups
CREATE INDEX idx_whatsapp_accounts_tenant ON public.tenant_whatsapp_accounts(tenant_id);
CREATE INDEX idx_whatsapp_accounts_phone_number_id ON public.tenant_whatsapp_accounts(phone_number_id);

-- =====================================================
-- TABLE: whatsapp_templates
-- Tenant-scoped WhatsApp template registry
-- =====================================================
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  category TEXT, -- MARKETING, UTILITY, AUTHENTICATION
  status public.whatsapp_template_status NOT NULL DEFAULT 'DRAFT',
  meta_template_id TEXT, -- ID from Meta if synced
  content_json JSONB NOT NULL DEFAULT '{}', -- Structured template content
  header_type TEXT, -- NONE, TEXT, IMAGE, VIDEO, DOCUMENT
  header_content TEXT,
  body_text TEXT,
  footer_text TEXT,
  buttons JSONB DEFAULT '[]', -- Button configurations
  variables JSONB DEFAULT '[]', -- Variable placeholders
  rejection_reason TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT unique_template_name_lang UNIQUE (tenant_id, name, language)
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Index for tenant lookups
CREATE INDEX idx_whatsapp_templates_tenant ON public.whatsapp_templates(tenant_id);
CREATE INDEX idx_whatsapp_templates_status ON public.whatsapp_templates(status);

-- =====================================================
-- TABLE: whatsapp_messages
-- Outbound + inbound message log (system of record)
-- =====================================================
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  direction public.message_direction NOT NULL,
  sender_account_id UUID REFERENCES public.tenant_whatsapp_accounts(id),
  to_phone TEXT NOT NULL, -- Masked for storage
  from_phone TEXT, -- Masked for storage
  message_type public.whatsapp_message_type NOT NULL DEFAULT 'TEXT',
  template_name TEXT,
  template_language TEXT,
  template_variables JSONB,
  content TEXT, -- Message content for text messages
  media_url TEXT,
  media_type TEXT,
  payload_ref TEXT, -- Optional reference to full payload
  provider_message_id TEXT, -- Meta or Fonu message ID
  status public.whatsapp_message_status NOT NULL DEFAULT 'QUEUED',
  error_code TEXT,
  error_message TEXT,
  conversation_id TEXT, -- For threading
  driver_id TEXT, -- Optional link to driver
  driver_name TEXT,
  sender_user_id UUID, -- User who sent (for outbound)
  sender_user_name TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_whatsapp_messages_tenant ON public.whatsapp_messages(tenant_id);
CREATE INDEX idx_whatsapp_messages_provider_id ON public.whatsapp_messages(provider_message_id);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);

-- =====================================================
-- TABLE: webhook_events
-- For idempotency + replay
-- =====================================================
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- META_WHATSAPP, FONU
  event_id TEXT NOT NULL, -- Provider's unique event/message ID
  event_type TEXT NOT NULL, -- message.received, message.delivered, etc.
  tenant_id TEXT, -- Resolved tenant
  phone_number_id TEXT, -- For routing
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status public.webhook_event_status NOT NULL DEFAULT 'RECEIVED',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  raw_payload_hash TEXT, -- SHA256 hash for deduplication
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_provider_event UNIQUE (provider, event_id)
);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX idx_webhook_events_retry ON public.webhook_events(next_retry_at) WHERE status = 'FAILED';
CREATE INDEX idx_webhook_events_provider_event ON public.webhook_events(provider, event_id);

-- =====================================================
-- RBAC FUNCTIONS
-- =====================================================

-- Check if user can manage WhatsApp for a tenant
CREATE OR REPLACE FUNCTION public.can_manage_whatsapp(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('tenant_admin', 'platform_admin')
  )
$$;

-- Check if user can send WhatsApp messages
CREATE OR REPLACE FUNCTION public.can_send_whatsapp(_user_id UUID)
RETURNS BOOLEAN
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

-- Check if user can view WhatsApp messages
CREATE OR REPLACE FUNCTION public.can_view_whatsapp(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('tenant_admin', 'operations_manager', 'dispatcher', 'supervisor', 'viewer_finance', 'platform_admin')
  )
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- tenant_whatsapp_accounts policies
CREATE POLICY "Platform admins can manage all WhatsApp accounts"
  ON public.tenant_whatsapp_accounts
  FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can view own WhatsApp accounts"
  ON public.tenant_whatsapp_accounts
  FOR SELECT
  USING (
    can_manage_whatsapp(auth.uid()) 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Tenant admins can insert own WhatsApp accounts"
  ON public.tenant_whatsapp_accounts
  FOR INSERT
  WITH CHECK (
    can_manage_whatsapp(auth.uid()) 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Tenant admins can update own WhatsApp accounts"
  ON public.tenant_whatsapp_accounts
  FOR UPDATE
  USING (
    can_manage_whatsapp(auth.uid()) 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- whatsapp_templates policies
CREATE POLICY "Platform admins can manage all templates"
  ON public.whatsapp_templates
  FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can manage own templates"
  ON public.whatsapp_templates
  FOR ALL
  USING (
    can_manage_whatsapp(auth.uid()) 
    AND tenant_id = get_user_tenant_id(auth.uid())
  )
  WITH CHECK (
    can_manage_whatsapp(auth.uid()) 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Authorized users can view own tenant templates"
  ON public.whatsapp_templates
  FOR SELECT
  USING (
    can_view_whatsapp(auth.uid()) 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- whatsapp_messages policies
CREATE POLICY "Platform admins can view all messages"
  ON public.whatsapp_messages
  FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Tenant users can view own messages"
  ON public.whatsapp_messages
  FOR SELECT
  USING (
    can_view_whatsapp(auth.uid()) 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Authorized users can insert messages"
  ON public.whatsapp_messages
  FOR INSERT
  WITH CHECK (
    can_send_whatsapp(auth.uid()) 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "System can insert messages"
  ON public.whatsapp_messages
  FOR INSERT
  WITH CHECK (true); -- For webhook inserts

CREATE POLICY "System can update message status"
  ON public.whatsapp_messages
  FOR UPDATE
  USING (true); -- For webhook status updates

-- webhook_events policies (system only)
CREATE POLICY "System can insert webhook events"
  ON public.webhook_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update webhook events"
  ON public.webhook_events
  FOR UPDATE
  USING (true);

CREATE POLICY "Platform admins can view webhook events"
  ON public.webhook_events
  FOR SELECT
  USING (is_platform_admin(auth.uid()));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON public.tenant_whatsapp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one default sender per tenant
CREATE OR REPLACE FUNCTION public.ensure_single_default_sender()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default_sender = true THEN
    UPDATE public.tenant_whatsapp_accounts
    SET is_default_sender = false, updated_at = now()
    WHERE tenant_id = NEW.tenant_id 
      AND id != NEW.id 
      AND is_default_sender = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER ensure_single_default_whatsapp_sender
  BEFORE INSERT OR UPDATE ON public.tenant_whatsapp_accounts
  FOR EACH ROW
  WHEN (NEW.is_default_sender = true)
  EXECUTE FUNCTION public.ensure_single_default_sender();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Mask phone number for display/storage
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF phone IS NULL OR length(phone) < 6 THEN
    RETURN phone;
  END IF;
  RETURN substring(phone, 1, 4) || '****' || substring(phone, length(phone) - 3);
END;
$$;

-- Get tenant's default WhatsApp sender
CREATE OR REPLACE FUNCTION public.get_tenant_default_whatsapp_sender(p_tenant_id TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.tenant_whatsapp_accounts
  WHERE tenant_id = p_tenant_id
    AND is_default_sender = true
    AND status = 'CONNECTED'
  LIMIT 1
$$;

-- Check if tenant can send WhatsApp (KYC approved check)
CREATE OR REPLACE FUNCTION public.can_tenant_send_whatsapp(p_tenant_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant RECORD;
  v_sender RECORD;
BEGIN
  -- Check tenant status
  SELECT status INTO v_tenant
  FROM public.tenants
  WHERE id::text = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_send', false, 'error', 'TENANT_NOT_FOUND');
  END IF;
  
  IF v_tenant.status != 'active' THEN
    RETURN jsonb_build_object('can_send', false, 'error', 'TENANT_NOT_APPROVED', 'status', v_tenant.status);
  END IF;
  
  -- Check for connected WhatsApp sender
  SELECT * INTO v_sender
  FROM public.tenant_whatsapp_accounts
  WHERE tenant_id = p_tenant_id
    AND status = 'CONNECTED'
    AND is_default_sender = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_send', false, 'error', 'NO_WHATSAPP_SENDER');
  END IF;
  
  RETURN jsonb_build_object(
    'can_send', true,
    'sender_id', v_sender.id,
    'phone_number_id', v_sender.phone_number_id
  );
END;
$$;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;