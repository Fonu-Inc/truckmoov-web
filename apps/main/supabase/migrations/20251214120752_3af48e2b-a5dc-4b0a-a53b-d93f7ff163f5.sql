
-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance-documents', 'compliance-documents', false);

-- Create policies for compliance documents storage
CREATE POLICY "Authenticated users can upload compliance documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'compliance-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view compliance documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'compliance-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update compliance documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'compliance-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete compliance documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'compliance-documents' AND auth.role() = 'authenticated');
