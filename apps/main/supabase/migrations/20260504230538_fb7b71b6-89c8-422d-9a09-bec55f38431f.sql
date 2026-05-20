INSERT INTO public.data_bundles_catalog (code, name, carrier, data_mb, validity_days, price_ngn, billing_cycle, is_active) VALUES
  ('MTN_1GB_M','MTN 1GB Monthly','MTN',1024,30,1500,'monthly',true),
  ('MTN_5GB_M','MTN 5GB Monthly','MTN',5120,30,5500,'monthly',true),
  ('MTN_10GB_M','MTN 10GB Monthly','MTN',10240,30,9500,'monthly',true),
  ('MTN_25GB_M','MTN 25GB Monthly','MTN',25600,30,18000,'monthly',true),
  ('MTN_60GB_Y','MTN 60GB Yearly','MTN',61440,365,75000,'yearly',true),
  ('AIRTEL_1GB_M','Airtel 1GB Monthly','Airtel',1024,30,1400,'monthly',true),
  ('AIRTEL_3GB_M','Airtel 3GB Monthly','Airtel',3072,30,3500,'monthly',true),
  ('AIRTEL_10GB_M','Airtel 10GB Monthly','Airtel',10240,30,9000,'monthly',true),
  ('AIRTEL_50GB_Y','Airtel 50GB Yearly','Airtel',51200,365,62000,'yearly',true),
  ('GLO_2GB_M','Glo 2GB Monthly','Glo',2048,30,2200,'monthly',true),
  ('GLO_5GB_M','Glo 5GB Monthly','Glo',5120,30,4800,'monthly',true),
  ('GLO_15GB_M','Glo 15GB Monthly','Glo',15360,30,12000,'monthly',true),
  ('FONU_2GB_M','Fonu 2GB Monthly','Fonu',2048,30,2000,'monthly',true),
  ('FONU_10GB_M','Fonu 10GB Monthly','Fonu',10240,30,9000,'monthly',true),
  ('FONU_25GB_M','Fonu 25GB Monthly','Fonu',25600,30,17500,'monthly',true),
  ('FONU_50GB_Y','Fonu 50GB Yearly','Fonu',51200,365,65000,'yearly',true)
ON CONFLICT (code) DO NOTHING;