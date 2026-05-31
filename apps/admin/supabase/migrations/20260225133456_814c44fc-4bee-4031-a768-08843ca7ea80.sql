
-- Update the default vehicle cap from 3 to 7
ALTER TABLE public.organizations ALTER COLUMN max_vehicles SET DEFAULT 7;

-- Update existing OWNER_OPERATOR orgs that still have the old default of 3
UPDATE public.organizations
SET max_vehicles = 7
WHERE organization_type = 'OWNER_OPERATOR' AND max_vehicles = 3;

-- Update the comment
COMMENT ON COLUMN public.organizations.max_vehicles IS 'Max vehicles allowed for OWNER_OPERATOR orgs. Default 7, max 10. NULL = unlimited (for non-OO types).';

-- Replace the vehicle cap enforcement function with new limits
CREATE OR REPLACE FUNCTION public.enforce_owner_operator_vehicle_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org RECORD;
  v_current_count integer;
BEGIN
  -- Only check on INSERT
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Get org info
  SELECT organization_type, max_vehicles
  INTO v_org
  FROM public.organizations
  WHERE id = NEW.owning_org_id;

  -- Only enforce for OWNER_OPERATOR
  IF v_org.organization_type != 'OWNER_OPERATOR' THEN
    RETURN NEW;
  END IF;

  -- Count current vehicles
  SELECT COUNT(*) INTO v_current_count
  FROM public.vehicles
  WHERE owning_org_id = NEW.owning_org_id;

  -- Enforce cap (default 7, max 10)
  IF v_current_count >= COALESCE(v_org.max_vehicles, 7) THEN
    RAISE EXCEPTION 'Vehicle cap reached for Owner-Operator. Current: %, Max: %. Upgrade to Fleet Provider to manage more vehicles.',
      v_current_count, COALESCE(v_org.max_vehicles, 7);
  END IF;

  RETURN NEW;
END;
$function$;
