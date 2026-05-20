-- Add new API scopes for waybills, pricing, and invoices
ALTER TYPE public.api_scope ADD VALUE IF NOT EXISTS 'waybills.read';
ALTER TYPE public.api_scope ADD VALUE IF NOT EXISTS 'waybills.write';
ALTER TYPE public.api_scope ADD VALUE IF NOT EXISTS 'pricing.read';
ALTER TYPE public.api_scope ADD VALUE IF NOT EXISTS 'pricing.write';
ALTER TYPE public.api_scope ADD VALUE IF NOT EXISTS 'invoices.read';
ALTER TYPE public.api_scope ADD VALUE IF NOT EXISTS 'invoices.write';