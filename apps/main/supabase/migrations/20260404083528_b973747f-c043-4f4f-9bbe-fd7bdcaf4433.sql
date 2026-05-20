-- Enable pg_cron and pg_net extensions (pg_cron is already available on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule postpaid billing cycle to run on the 1st of every month at 2:00 AM UTC
SELECT cron.schedule(
  'postpaid-billing-cycle-monthly',
  '0 2 1 * *',
  $$
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/postpaid-billing-cycle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('billing_period', to_char(now() - interval '1 month', 'YYYY-MM'))
  );
  $$
);