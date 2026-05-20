
-- Add org-level ownership and verification to compliance_documents
ALTER TABLE public.compliance_documents
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create index for org-level queries
CREATE INDEX IF NOT EXISTS idx_compliance_documents_org_id ON public.compliance_documents(org_id);

-- Storage bucket for compliance document files
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-documents', 'compliance-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their own org folder
CREATE POLICY "Users can upload compliance docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'compliance-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view compliance docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'compliance-documents');

-- RLS: org members can view their org's docs
CREATE POLICY "Org members view own compliance docs"
ON public.compliance_documents FOR SELECT TO authenticated
USING (
  org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  OR tenant_id = public.get_user_tenant_id(auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

-- Owner-operators can insert docs for their org
CREATE POLICY "Org members insert compliance docs"
ON public.compliance_documents FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  OR tenant_id = public.get_user_tenant_id(auth.uid())
);

-- Only payer org / platform admin can update verification_status
CREATE POLICY "Authorized users update compliance docs"
ON public.compliance_documents FOR UPDATE TO authenticated
USING (
  org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  OR tenant_id = public.get_user_tenant_id(auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);
