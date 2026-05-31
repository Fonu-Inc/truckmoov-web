
-- Create storage bucket for waybill images (tenant-scoped)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'waybill-images', 
  'waybill-images', 
  false, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
);

-- RLS: Authenticated users can upload to their tenant folder
CREATE POLICY "Tenant users can upload waybill images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'waybill-images'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())
);

-- RLS: Authenticated users can view their tenant's waybill images
CREATE POLICY "Tenant users can view waybill images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'waybill-images'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())
);

-- RLS: Service role (edge functions) can read/write all waybill images
CREATE POLICY "Service role full access to waybill images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'waybill-images')
WITH CHECK (bucket_id = 'waybill-images');

-- RLS: Allow anonymous/service uploads for webhook-based intake
CREATE POLICY "Webhook intake can upload waybill images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'waybill-images');
