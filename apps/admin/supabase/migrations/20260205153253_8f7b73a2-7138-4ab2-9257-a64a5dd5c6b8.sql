-- Create phone number type enum
CREATE TYPE public.phone_number_type AS ENUM ('local', 'mobile', 'toll_free');

-- Create phone number status enum
CREATE TYPE public.phone_number_status AS ENUM ('available', 'assigned', 'suspended', 'released');

-- Create platform phone numbers table
CREATE TABLE public.platform_phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  phone_number_type phone_number_type NOT NULL DEFAULT 'mobile',
  country_code TEXT NOT NULL DEFAULT 'NG',
  status phone_number_status NOT NULL DEFAULT 'available',
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  tenant_name TEXT,
  capabilities TEXT[] NOT NULL DEFAULT ARRAY['sms', 'voice'],
  fonu_number_id TEXT,
  monthly_cost_ngn NUMERIC(10,2) DEFAULT 0,
  provisioned_at TIMESTAMPTZ DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  assigned_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage all phone numbers
CREATE POLICY "Platform admins can manage phone numbers"
ON public.platform_phone_numbers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  )
);

-- Tenants can view their assigned numbers
CREATE POLICY "Tenants can view assigned numbers"
ON public.platform_phone_numbers
FOR SELECT
TO authenticated
USING (
  tenant_id::text = public.get_user_tenant_id(auth.uid())
);

-- Create index for tenant lookups
CREATE INDEX idx_platform_phone_numbers_tenant ON public.platform_phone_numbers(tenant_id);
CREATE INDEX idx_platform_phone_numbers_status ON public.platform_phone_numbers(status);