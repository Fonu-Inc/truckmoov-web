-- Allow unauthenticated users (demo mode) to read ONLY the Lagos Express Logistics demo rows.
-- This fixes empty Compliance & Messaging Center screens when the user is using the demo role switcher (no backend session).

DO $$
BEGIN
  -- compliance_documents demo read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'compliance_documents'
      AND policyname = 'Public can view demo compliance documents'
  ) THEN
    CREATE POLICY "Public can view demo compliance documents"
    ON public.compliance_documents
    FOR SELECT
    TO public
    USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');
  END IF;

  -- broadcast_messages demo read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcast_messages'
      AND policyname = 'Public can view demo broadcast messages'
  ) THEN
    CREATE POLICY "Public can view demo broadcast messages"
    ON public.broadcast_messages
    FOR SELECT
    TO public
    USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');
  END IF;
END $$;