
CREATE TABLE public.usage_summary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icon_key TEXT NOT NULL DEFAULT 'wifi',
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_summary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active usage summary items"
  ON public.usage_summary_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Platform admins can manage usage summary items"
  ON public.usage_summary_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );

-- Seed the current hardcoded items
INSERT INTO public.usage_summary_items (icon_key, label, sort_order) VALUES
  ('wifi', 'IoT SIM connectivity (per active SIM)', 0),
  ('message', 'WhatsApp conversations', 1),
  ('phone', 'SMS & voice fallback', 2),
  ('brain', 'AI trip optimization', 3);
