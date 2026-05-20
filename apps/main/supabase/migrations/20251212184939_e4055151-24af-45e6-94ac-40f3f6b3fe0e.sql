
-- Create tenant business information table
CREATE TABLE public.tenant_business_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  registration_number TEXT,
  tax_id TEXT,
  business_type TEXT,
  industry TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Nigeria',
  phone TEXT,
  email TEXT,
  website TEXT,
  year_established INTEGER,
  number_of_employees TEXT,
  annual_revenue TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create KYC documents table
CREATE TABLE public.tenant_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'certificate_of_incorporation',
    'memorandum_of_association',
    'tax_clearance',
    'vat_certificate',
    'business_license',
    'insurance_certificate',
    'proof_of_address',
    'director_id',
    'other'
  )),
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  uploaded_by UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_kyc_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_business_info
CREATE POLICY "Authenticated users can view business info"
ON public.tenant_business_info FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert business info"
ON public.tenant_business_info FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update business info"
ON public.tenant_business_info FOR UPDATE
TO authenticated
USING (true);

-- RLS Policies for tenant_kyc_documents
CREATE POLICY "Authenticated users can view KYC documents"
ON public.tenant_kyc_documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert KYC documents"
ON public.tenant_kyc_documents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update KYC documents"
ON public.tenant_kyc_documents FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete KYC documents"
ON public.tenant_kyc_documents FOR DELETE
TO authenticated
USING (true);

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload KYC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kyc-documents');

CREATE POLICY "Authenticated users can view KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'kyc-documents');

CREATE POLICY "Authenticated users can delete KYC documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'kyc-documents');

-- Update trigger for updated_at
CREATE TRIGGER update_tenant_business_info_updated_at
BEFORE UPDATE ON public.tenant_business_info
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_kyc_documents_updated_at
BEFORE UPDATE ON public.tenant_kyc_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
