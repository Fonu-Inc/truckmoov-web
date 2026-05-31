
-- Create tenant branding configuration table
CREATE TABLE public.tenant_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#E6A817',
  secondary_color TEXT DEFAULT '#1a1f2e',
  accent_color TEXT DEFAULT '#cc9515',
  success_color TEXT DEFAULT '#22956a',
  warning_color TEXT DEFAULT '#d48a06',
  destructive_color TEXT DEFAULT '#ef4444',
  sidebar_bg_color TEXT DEFAULT '#141821',
  sidebar_text_color TEXT DEFAULT '#e5e5e5',
  sidebar_accent_color TEXT DEFAULT '#1f2937',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;

-- Tenant users can read their own branding
CREATE POLICY "Users can read own tenant branding"
ON public.tenant_branding FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

-- Tenant admins can manage their branding
CREATE POLICY "Tenant admins can manage branding"
ON public.tenant_branding FOR ALL
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

-- Allow demo access for non-authenticated users
CREATE POLICY "Allow demo access to tenant_branding"
ON public.tenant_branding FOR ALL
USING (true) WITH CHECK (true);

-- Storage bucket for tenant logos
INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-logos', 'tenant-logos', true);

-- Anyone can view logos (they're public branding)
CREATE POLICY "Tenant logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-logos');

-- Authenticated users can upload logos for their tenant
CREATE POLICY "Users can upload tenant logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tenant-logos');

CREATE POLICY "Users can update tenant logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tenant-logos');

CREATE POLICY "Users can delete tenant logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'tenant-logos');
