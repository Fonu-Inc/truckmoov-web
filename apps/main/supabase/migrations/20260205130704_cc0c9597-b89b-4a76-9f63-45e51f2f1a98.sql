-- Create accounting integration status enum
CREATE TYPE public.accounting_integration_status AS ENUM ('pending', 'connected', 'disconnected', 'error');

-- Create accounting sync status enum
CREATE TYPE public.accounting_sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed');

-- Create tenant accounting integrations table
CREATE TABLE public.tenant_accounting_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'sage', -- sage, xero, quickbooks
  status accounting_integration_status NOT NULL DEFAULT 'pending',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  company_id TEXT, -- External accounting company ID
  company_name TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, provider)
);

-- Create invoice sync records table
CREATE TABLE public.accounting_invoice_syncs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  integration_id UUID NOT NULL REFERENCES public.tenant_accounting_integrations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL,
  external_invoice_id TEXT,
  external_invoice_number TEXT,
  sync_status accounting_sync_status NOT NULL DEFAULT 'pending',
  sync_direction TEXT NOT NULL DEFAULT 'outbound', -- outbound = job->invoice, inbound = invoice->job
  amount_ngn NUMERIC,
  external_amount NUMERIC,
  external_currency TEXT DEFAULT 'NGN',
  synced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook events table for accounting providers
CREATE TABLE public.accounting_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT,
  integration_id UUID REFERENCES public.tenant_accounting_integrations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_accounting_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_invoice_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant_accounting_integrations
CREATE POLICY "Tenants can view their own integrations"
ON public.tenant_accounting_integrations
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

CREATE POLICY "Tenant admins can manage integrations"
ON public.tenant_accounting_integrations
FOR ALL
USING (
  (tenant_id = public.get_user_tenant_id(auth.uid()) 
   AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'tenant_admin'))
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

-- RLS policies for accounting_invoice_syncs
CREATE POLICY "Tenants can view their own invoice syncs"
ON public.accounting_invoice_syncs
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

CREATE POLICY "Tenant admins can manage invoice syncs"
ON public.accounting_invoice_syncs
FOR ALL
USING (
  (tenant_id = public.get_user_tenant_id(auth.uid()) 
   AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'tenant_admin'))
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

-- RLS policies for webhook events (system access)
CREATE POLICY "Platform admins can view webhook events"
ON public.accounting_webhook_events
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

CREATE POLICY "System can insert webhook events"
ON public.accounting_webhook_events
FOR INSERT
WITH CHECK (true);

-- Create permission function
CREATE OR REPLACE FUNCTION public.can_manage_accounting_integrations(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('tenant_admin', 'platform_admin')
  )
$$;

-- Add indexes
CREATE INDEX idx_accounting_integrations_tenant ON public.tenant_accounting_integrations(tenant_id);
CREATE INDEX idx_invoice_syncs_job ON public.accounting_invoice_syncs(job_id);
CREATE INDEX idx_invoice_syncs_status ON public.accounting_invoice_syncs(sync_status);
CREATE INDEX idx_webhook_events_processed ON public.accounting_webhook_events(processed, created_at);