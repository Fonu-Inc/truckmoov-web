ALTER TABLE public.device_setup_requests
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;
