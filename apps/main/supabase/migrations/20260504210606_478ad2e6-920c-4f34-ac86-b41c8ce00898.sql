
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_settings readable by all"
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY "platform_settings writable by platform admins"
  ON public.platform_settings FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

INSERT INTO public.platform_settings (key, value, description)
VALUES ('fx_usd_ngn', '{"rate": 1600}'::jsonb, 'Exchange rate: 1 USD = X NGN. Used for plan pricing display.')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.touch_platform_settings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_platform_settings ON public.platform_settings;
CREATE TRIGGER trg_touch_platform_settings
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_platform_settings();
