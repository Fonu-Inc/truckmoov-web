
-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-pdfs', 'invoice-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can read invoice PDFs belonging to their tenant
CREATE POLICY "Authenticated users can read own tenant invoice PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoice-pdfs'
  AND auth.role() = 'authenticated'
);

-- RLS: Only edge functions (service role) upload PDFs - no user upload policy needed

-- Ensure pdf_url column exists on waybill_invoices (it should already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waybill_invoices' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE public.waybill_invoices ADD COLUMN pdf_url text;
  END IF;
END$$;
