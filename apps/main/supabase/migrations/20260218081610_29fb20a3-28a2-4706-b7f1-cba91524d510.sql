
-- ═══════════════════════════════════════════════════════════════
-- Waybill-to-Invoice Module: Database Schema
-- ═══════════════════════════════════════════════════════════════

-- Tenant-level invoice configuration (tax, numbering, branding)
CREATE TABLE public.tenant_invoice_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  tax_enabled BOOLEAN NOT NULL DEFAULT false,
  tax_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 7.5,
  tax_label TEXT NOT NULL DEFAULT 'VAT',
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_logo_url TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  payment_terms_days INTEGER NOT NULL DEFAULT 30,
  currency TEXT NOT NULL DEFAULT 'NGN',
  notes_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

ALTER TABLE public.tenant_invoice_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own invoice config"
  ON public.tenant_invoice_config FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can manage invoice config"
  ON public.tenant_invoice_config FOR ALL
  USING (tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Destination pricing rules (agreement-based, flexible)
CREATE TABLE public.destination_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  org_id UUID REFERENCES public.organizations(id),
  rule_name TEXT NOT NULL,
  origin TEXT,
  destination TEXT NOT NULL,
  vehicle_type TEXT,
  price_ngn NUMERIC(12,2) NOT NULL,
  price_per_unit_ngn NUMERIC(12,2),
  unit_type TEXT, -- 'ton', 'bag', 'trip', 'km', etc.
  customer_name TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.destination_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own pricing rules"
  ON public.destination_pricing_rules FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can manage pricing rules"
  ON public.destination_pricing_rules FOR ALL
  USING (tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Waybill status enum
CREATE TYPE public.waybill_status AS ENUM (
  'received',
  'processing',
  'extracted',
  'extraction_failed',
  'invoice_generated',
  'archived'
);

-- Waybill records (from WhatsApp or manual upload)
CREATE TABLE public.waybill_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  org_id UUID REFERENCES public.organizations(id),
  status public.waybill_status NOT NULL DEFAULT 'received',
  -- Source info
  source_type TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'upload', 'manual'
  source_message_id TEXT, -- WhatsApp message ID reference
  source_phone TEXT,
  driver_name TEXT,
  image_url TEXT,
  image_storage_path TEXT,
  -- AI-extracted fields
  extracted_data JSONB,
  destination TEXT,
  origin TEXT,
  vehicle_number TEXT,
  waybill_number TEXT,
  customer_name TEXT,
  waybill_date DATE,
  quantity NUMERIC(12,3),
  quantity_unit TEXT,
  weight_kg NUMERIC(12,3),
  -- Pricing
  matched_pricing_rule_id UUID REFERENCES public.destination_pricing_rules(id),
  calculated_price_ngn NUMERIC(12,2),
  -- Processing
  ai_confidence_score NUMERIC(4,3),
  ai_model_used TEXT,
  extraction_error TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waybill_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own waybills"
  ON public.waybill_records FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users can insert waybills"
  ON public.waybill_records FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users can update own waybills"
  ON public.waybill_records FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Waybill invoice status enum
CREATE TYPE public.waybill_invoice_status AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'sent',
  'paid',
  'partially_paid',
  'overdue',
  'cancelled',
  'disputed'
);

-- Generated invoices from waybills
CREATE TABLE public.waybill_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  org_id UUID REFERENCES public.organizations(id),
  invoice_number TEXT NOT NULL,
  waybill_id UUID REFERENCES public.waybill_records(id) NOT NULL,
  status public.waybill_invoice_status NOT NULL DEFAULT 'draft',
  -- Customer
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  -- Line items stored as JSONB array
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Amounts
  subtotal_ngn NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate_percent NUMERIC(5,2) DEFAULT 0,
  tax_amount_ngn NUMERIC(12,2) DEFAULT 0,
  discount_ngn NUMERIC(12,2) DEFAULT 0,
  total_ngn NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid_ngn NUMERIC(12,2) DEFAULT 0,
  -- Details
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_terms TEXT,
  notes TEXT,
  -- Transport details (from waybill)
  origin TEXT,
  destination TEXT,
  vehicle_number TEXT,
  waybill_number TEXT,
  waybill_date DATE,
  quantity NUMERIC(12,3),
  quantity_unit TEXT,
  -- Sharing
  sent_via TEXT, -- 'whatsapp', 'email', 'both'
  sent_at TIMESTAMPTZ,
  sent_to TEXT,
  pdf_storage_path TEXT,
  -- Audit
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  cancelled_by UUID,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, invoice_number)
);

ALTER TABLE public.waybill_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own invoices"
  ON public.waybill_invoices FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users can insert invoices"
  ON public.waybill_invoices FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users can update own invoices"
  ON public.waybill_invoices FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Audit log for waybill/invoice actions
CREATE TABLE public.waybill_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'waybill', 'invoice', 'pricing_rule'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'extracted', 'invoice_generated', 'approved', 'sent', 'edited', etc.
  actor_id UUID,
  actor_name TEXT,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waybill_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own audit logs"
  ON public.waybill_audit_log FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON public.waybill_audit_log FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Indexes
CREATE INDEX idx_waybill_records_tenant ON public.waybill_records(tenant_id);
CREATE INDEX idx_waybill_records_status ON public.waybill_records(status);
CREATE INDEX idx_waybill_records_created ON public.waybill_records(created_at DESC);
CREATE INDEX idx_waybill_invoices_tenant ON public.waybill_invoices(tenant_id);
CREATE INDEX idx_waybill_invoices_status ON public.waybill_invoices(status);
CREATE INDEX idx_waybill_invoices_customer ON public.waybill_invoices(customer_name);
CREATE INDEX idx_destination_pricing_tenant ON public.destination_pricing_rules(tenant_id);
CREATE INDEX idx_destination_pricing_dest ON public.destination_pricing_rules(destination);
CREATE INDEX idx_waybill_audit_entity ON public.waybill_audit_log(entity_type, entity_id);

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.generate_waybill_invoice_number(p_tenant_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_config tenant_invoice_config%ROWTYPE;
  v_number INTEGER;
  v_invoice_number TEXT;
BEGIN
  SELECT * INTO v_config FROM tenant_invoice_config WHERE tenant_id = p_tenant_id FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO tenant_invoice_config (tenant_id) VALUES (p_tenant_id)
    RETURNING * INTO v_config;
  END IF;
  
  v_number := v_config.next_invoice_number;
  
  UPDATE tenant_invoice_config 
  SET next_invoice_number = next_invoice_number + 1, updated_at = now()
  WHERE tenant_id = p_tenant_id;
  
  v_invoice_number := v_config.invoice_prefix || '-' || LPAD(v_number::TEXT, 6, '0');
  
  RETURN v_invoice_number;
END;
$$;

-- Enable realtime for waybill records (for portal updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.waybill_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waybill_invoices;
