-- Create storage bucket for sender ID request documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('sender-id-documents', 'sender-id-documents', false);

-- Allow authenticated users to upload their own request letters
CREATE POLICY "Tenants can upload sender ID documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sender-id-documents'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())
);

-- Allow users to view their own documents
CREATE POLICY "Tenants can view own sender ID documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'sender-id-documents'
  AND (
    (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())
    OR public.has_role(auth.uid(), 'platform_admin')
  )
);

-- Allow platform admins to view all documents
CREATE POLICY "Platform admins can view all sender ID documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'sender-id-documents'
  AND public.has_role(auth.uid(), 'platform_admin')
);

-- Add document URL column to tenant_sender_ids
ALTER TABLE public.tenant_sender_ids
ADD COLUMN request_letter_url TEXT;