-- Create a trigger function that syncs tenant status based on KYC verification
CREATE OR REPLACE FUNCTION public.sync_tenant_status_on_kyc_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When KYC becomes 'verified', set tenant status to 'active'
  IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
    UPDATE public.tenants 
    SET status = 'active', updated_at = now()
    WHERE id::text = NEW.tenant_id;
  END IF;
  
  -- When KYC is 'rejected', set tenant status to 'suspended'
  IF NEW.verification_status = 'rejected' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'rejected') THEN
    UPDATE public.tenants 
    SET status = 'suspended', updated_at = now()
    WHERE id::text = NEW.tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tenant_business_info table
DROP TRIGGER IF EXISTS trigger_sync_tenant_status_on_kyc ON public.tenant_business_info;
CREATE TRIGGER trigger_sync_tenant_status_on_kyc
  AFTER UPDATE OF verification_status ON public.tenant_business_info
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_tenant_status_on_kyc_change();

-- Also trigger on insert for new business info records
DROP TRIGGER IF EXISTS trigger_sync_tenant_status_on_kyc_insert ON public.tenant_business_info;
CREATE TRIGGER trigger_sync_tenant_status_on_kyc_insert
  AFTER INSERT ON public.tenant_business_info
  FOR EACH ROW
  WHEN (NEW.verification_status = 'verified')
  EXECUTE FUNCTION public.sync_tenant_status_on_kyc_change();