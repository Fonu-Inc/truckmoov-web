-- Create enum for sender ID status
CREATE TYPE sender_id_status AS ENUM ('pending', 'whitelisting', 'approved', 'rejected');

-- Create enum for sender ID type
CREATE TYPE sender_id_type AS ENUM ('sms', 'voice', 'both');

-- Create table for tenant sender ID requests/approvals
CREATE TABLE public.tenant_sender_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  tenant_name TEXT,
  sender_id TEXT NOT NULL,
  sender_type sender_id_type NOT NULL DEFAULT 'sms',
  status sender_id_status NOT NULL DEFAULT 'pending',
  
  -- Request details
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_by UUID REFERENCES auth.users(id),
  request_notes TEXT,
  
  -- Review details
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Telecom whitelisting tracking
  telecom_reference TEXT,
  telecom_provider TEXT,
  whitelisted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate requests for same sender ID per tenant
  UNIQUE(tenant_id, sender_id, sender_type)
);

-- Enable RLS
ALTER TABLE public.tenant_sender_ids ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own sender IDs
CREATE POLICY "Tenants can view own sender IDs"
ON public.tenant_sender_ids
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.has_role(auth.uid(), 'platform_admin')
);

-- Tenants can request new sender IDs
CREATE POLICY "Tenants can request sender IDs"
ON public.tenant_sender_ids
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND status = 'pending'
);

-- Only platform admins can update (approve/reject)
CREATE POLICY "Platform admins can update sender IDs"
ON public.tenant_sender_ids
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- Only platform admins can delete
CREATE POLICY "Platform admins can delete sender IDs"
ON public.tenant_sender_ids
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Create index for faster lookups
CREATE INDEX idx_tenant_sender_ids_tenant ON public.tenant_sender_ids(tenant_id);
CREATE INDEX idx_tenant_sender_ids_status ON public.tenant_sender_ids(status);

-- Add trigger for updated_at
CREATE TRIGGER update_tenant_sender_ids_updated_at
  BEFORE UPDATE ON public.tenant_sender_ids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();