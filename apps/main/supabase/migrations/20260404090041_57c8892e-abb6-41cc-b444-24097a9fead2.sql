
-- Create enum for ERP providers
CREATE TYPE public.erp_provider AS ENUM ('sap', 'oracle', 'dynamics', 'odoo', 'zoho', 'custom');

-- Create enum for auth methods
CREATE TYPE public.erp_auth_method AS ENUM ('oauth2', 'api_key', 'basic_auth', 'custom_header');

-- Create enum for sync scopes
CREATE TYPE public.erp_sync_scope AS ENUM ('orders', 'invoices', 'inventory', 'fleet_costs');

-- Create enum for sync status
CREATE TYPE public.erp_sync_status AS ENUM ('pending', 'running', 'success', 'partial', 'failed');

-- Create enum for sync direction
CREATE TYPE public.erp_sync_direction AS ENUM ('inbound', 'outbound', 'bidirectional');

-- 1. ERP/WMS Connectors
CREATE TABLE public.erp_wms_connectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider public.erp_provider NOT NULL DEFAULT 'custom',
  auth_method public.erp_auth_method NOT NULL DEFAULT 'api_key',
  api_base_url TEXT,
  api_version TEXT,
  credentials_encrypted JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'disconnected',
  company_name TEXT,
  environment TEXT DEFAULT 'production',
  default_mappings JSONB DEFAULT '{}'::jsonb,
  sync_config JSONB DEFAULT '{}'::jsonb,
  last_connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_wms_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage their connectors"
  ON public.erp_wms_connectors FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 2. ERP Sync Mappings
CREATE TABLE public.erp_sync_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id UUID NOT NULL REFERENCES public.erp_wms_connectors(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  scope public.erp_sync_scope NOT NULL,
  direction public.erp_sync_direction NOT NULL DEFAULT 'bidirectional',
  fleetpro_entity TEXT NOT NULL,
  fleetpro_field TEXT NOT NULL,
  erp_entity TEXT NOT NULL,
  erp_field TEXT NOT NULL,
  transform_rule TEXT,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_sync_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage their mappings"
  ON public.erp_sync_mappings FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 3. ERP Sync Logs
CREATE TABLE public.erp_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id UUID NOT NULL REFERENCES public.erp_wms_connectors(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  scope public.erp_sync_scope NOT NULL,
  direction public.erp_sync_direction NOT NULL,
  status public.erp_sync_status NOT NULL DEFAULT 'pending',
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  duration_ms INTEGER,
  triggered_by TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view their sync logs"
  ON public.erp_sync_logs FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant members can create sync logs"
  ON public.erp_sync_logs FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 4. ERP Sync Schedules
CREATE TABLE public.erp_sync_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id UUID NOT NULL REFERENCES public.erp_wms_connectors(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  scope public.erp_sync_scope NOT NULL,
  direction public.erp_sync_direction NOT NULL DEFAULT 'bidirectional',
  interval_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(connector_id, scope)
);

ALTER TABLE public.erp_sync_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage their schedules"
  ON public.erp_sync_schedules FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX idx_erp_connectors_tenant ON public.erp_wms_connectors(tenant_id);
CREATE INDEX idx_erp_mappings_connector ON public.erp_sync_mappings(connector_id);
CREATE INDEX idx_erp_logs_connector ON public.erp_sync_logs(connector_id, created_at DESC);
CREATE INDEX idx_erp_schedules_next_run ON public.erp_sync_schedules(next_run_at) WHERE is_active = true;
