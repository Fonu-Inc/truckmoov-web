-- Create tenants table to store onboarded tenant organizations
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  email text NOT NULL,
  phone text,
  address text,
  billing_email text,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'pending',
  logo_url text,
  features jsonb DEFAULT '{}',
  device_count integer DEFAULT 0,
  sim_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage all tenants
CREATE POLICY "Platform admins can manage all tenants"
ON public.tenants
FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Tenant admins can view their own tenant
CREATE POLICY "Tenant admins can view own tenant"
ON public.tenants
FOR SELECT
USING (id::text = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

-- Create function to generate URL-friendly slug
CREATE OR REPLACE FUNCTION public.generate_tenant_slug(tenant_name text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(regexp_replace(tenant_name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table to reference tenants properly (ensure tenant_id can be validated)
-- Add index for faster tenant lookups
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_status ON public.tenants(status);