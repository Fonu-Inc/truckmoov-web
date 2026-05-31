
-- 1) whatsapp_inbound_messages table
CREATE TABLE public.whatsapp_inbound_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  org_id UUID REFERENCES public.organizations(id),
  from_phone TEXT NOT NULL,
  to_phone TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO')),
  text_body TEXT,
  media_url TEXT,
  media_mime TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_inbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their inbound messages"
  ON public.whatsapp_inbound_messages FOR SELECT
  USING (public.get_user_tenant_id(auth.uid()) = tenant_id);

CREATE POLICY "Service role full access on inbound messages"
  ON public.whatsapp_inbound_messages FOR ALL
  USING (true) WITH CHECK (true);

-- Allow anon inserts for webhook intake
CREATE POLICY "Anon insert for webhook intake"
  ON public.whatsapp_inbound_messages FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_wim_tenant_received ON public.whatsapp_inbound_messages(tenant_id, received_at DESC);
CREATE INDEX idx_wim_from_phone ON public.whatsapp_inbound_messages(from_phone);

-- 2) invoice_line_items table
CREATE TABLE public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.waybill_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view line items via invoice"
  ON public.invoice_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.waybill_invoices wi
      WHERE wi.id = invoice_id
        AND public.get_user_tenant_id(auth.uid()) = wi.tenant_id
    )
  );

CREATE POLICY "Tenant users can manage line items"
  ON public.invoice_line_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.waybill_invoices wi
      WHERE wi.id = invoice_id
        AND public.get_user_tenant_id(auth.uid()) = wi.tenant_id
    )
  );

CREATE INDEX idx_ili_invoice ON public.invoice_line_items(invoice_id);

-- 3) invoice_shares table
CREATE TABLE public.invoice_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.waybill_invoices(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('WHATSAPP', 'EMAIL', 'LINK')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'FAILED')),
  provider_response JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their invoice shares"
  ON public.invoice_shares FOR SELECT
  USING (public.get_user_tenant_id(auth.uid()) = tenant_id);

CREATE POLICY "Tenant users can create invoice shares"
  ON public.invoice_shares FOR INSERT
  WITH CHECK (public.get_user_tenant_id(auth.uid()) = tenant_id);

CREATE INDEX idx_is_invoice ON public.invoice_shares(invoice_id);
CREATE INDEX idx_is_tenant ON public.invoice_shares(tenant_id);

-- 4) Add missing columns to destination_pricing_rules
ALTER TABLE public.destination_pricing_rules
  ADD COLUMN IF NOT EXISTS destination_aliases JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing_mode TEXT NOT NULL DEFAULT 'FLAT' CHECK (pricing_mode IN ('FLAT', 'PER_WEIGHT', 'PER_DISTANCE')),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS minimum_charge NUMERIC;

-- 5) Update waybill_records status enum to include missing states
-- First drop and recreate the enum with all required values
ALTER TABLE public.waybill_records ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.waybill_records ALTER COLUMN status TYPE TEXT;
DROP TYPE IF EXISTS public.waybill_status;
CREATE TYPE public.waybill_status AS ENUM (
  'received', 'processing', 'extracted', 'extraction_failed',
  'needs_review', 'approved', 'invoice_generated', 'invoiced', 'rejected', 'archived'
);
ALTER TABLE public.waybill_records ALTER COLUMN status TYPE public.waybill_status USING status::public.waybill_status;
ALTER TABLE public.waybill_records ALTER COLUMN status SET DEFAULT 'received';

-- Enable realtime for inbound messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_inbound_messages;
