
-- Add missing columns for Section 6 extraction schema
ALTER TABLE public.waybill_records
  ADD COLUMN IF NOT EXISTS order_number text,
  ADD COLUMN IF NOT EXISTS weight_tons numeric,
  ADD COLUMN IF NOT EXISTS additional_notes text,
  ADD COLUMN IF NOT EXISTS confidence_per_field jsonb;
