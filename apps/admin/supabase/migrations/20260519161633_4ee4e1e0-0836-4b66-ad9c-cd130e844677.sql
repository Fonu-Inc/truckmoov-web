ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS storage_gb integer;

UPDATE public.subscription_plans SET storage_gb = CASE
  WHEN lower(coalesce(tier, name)) LIKE '%enterprise%' THEN 500
  WHEN lower(coalesce(tier, name)) LIKE '%business%' OR lower(coalesce(tier, name)) LIKE '%pro%' THEN 100
  WHEN lower(coalesce(tier, name)) LIKE '%standard%' OR lower(coalesce(tier, name)) LIKE '%growth%' THEN 50
  WHEN lower(coalesce(tier, name)) LIKE '%starter%' OR lower(coalesce(tier, name)) LIKE '%startup%' OR lower(coalesce(tier, name)) LIKE '%basic%' THEN 10
  ELSE 5
END
WHERE storage_gb IS NULL;