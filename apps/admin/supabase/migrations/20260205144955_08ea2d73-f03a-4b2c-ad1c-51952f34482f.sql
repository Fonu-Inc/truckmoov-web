-- Create tenant communication configuration table
CREATE TABLE public.tenant_communication_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  sms_sender_id TEXT,
  voice_caller_id TEXT,
  whatsapp_fallback_to_sms BOOLEAN DEFAULT false,
  sms_fallback_timeout_seconds INTEGER DEFAULT 300,
  enable_delivery_notifications BOOLEAN DEFAULT true,
  enable_read_receipts BOOLEAN DEFAULT true,
  default_message_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_communication_config ENABLE ROW LEVEL SECURITY;

-- Allow tenant admins to view their own config
CREATE POLICY "Tenant admins can view their communication config"
ON public.tenant_communication_config
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'platform_admin'
  )
);

-- Allow tenant admins to update their own config
CREATE POLICY "Tenant admins can update their communication config"
ON public.tenant_communication_config
FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'tenant_admin'
  )
);

-- Allow tenant admins to insert their own config
CREATE POLICY "Tenant admins can insert their communication config"
ON public.tenant_communication_config
FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'tenant_admin'
  )
);

-- Platform admins can manage all configs
CREATE POLICY "Platform admins can manage all communication configs"
ON public.tenant_communication_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'platform_admin'
  )
);

-- Add SMS templates table
CREATE TABLE public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Enable RLS on SMS templates
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own templates
CREATE POLICY "Tenants can view their SMS templates"
ON public.sms_templates
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'platform_admin'
  )
);

-- Tenant admins can manage their templates
CREATE POLICY "Tenant admins can manage SMS templates"
ON public.sms_templates
FOR ALL
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'operations_manager')
  )
);

-- Add function to get tenant communication config with defaults
CREATE OR REPLACE FUNCTION public.get_tenant_communication_config(p_tenant_id TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_config tenant_communication_config%ROWTYPE;
BEGIN
  SELECT * INTO v_config FROM tenant_communication_config WHERE tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    -- Return defaults
    RETURN jsonb_build_object(
      'sms_sender_id', NULL,
      'voice_caller_id', NULL,
      'whatsapp_fallback_to_sms', false,
      'sms_fallback_timeout_seconds', 300,
      'enable_delivery_notifications', true,
      'enable_read_receipts', true,
      'default_message_language', 'en'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'id', v_config.id,
    'sms_sender_id', v_config.sms_sender_id,
    'voice_caller_id', v_config.voice_caller_id,
    'whatsapp_fallback_to_sms', v_config.whatsapp_fallback_to_sms,
    'sms_fallback_timeout_seconds', v_config.sms_fallback_timeout_seconds,
    'enable_delivery_notifications', v_config.enable_delivery_notifications,
    'enable_read_receipts', v_config.enable_read_receipts,
    'default_message_language', v_config.default_message_language
  );
END;
$$;