
-- Add vehicle_cap to organizations metadata (we'll use a dedicated column for clarity)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS max_vehicles integer DEFAULT 3;

-- Add a comment for documentation
COMMENT ON COLUMN public.organizations.max_vehicles IS 'Max vehicles allowed for OWNER_OPERATOR orgs. Default 3, max 5. NULL = unlimited (for non-OO types).';

-- Create a function to enforce vehicle cap for owner-operator orgs
CREATE OR REPLACE FUNCTION public.check_owner_operator_vehicle_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org organizations%ROWTYPE;
  v_current_count integer;
BEGIN
  -- Only check if owning_org_id is set
  IF NEW.owning_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the organization
  SELECT * INTO v_org FROM organizations WHERE id = NEW.owning_org_id;
  
  IF NOT FOUND OR v_org.organization_type != 'OWNER_OPERATOR' THEN
    RETURN NEW;
  END IF;

  -- Count existing vehicles for this org (exclude the current one on update)
  SELECT COUNT(*) INTO v_current_count
  FROM vehicles
  WHERE owning_org_id = NEW.owning_org_id
    AND (TG_OP = 'INSERT' OR id != NEW.id);

  -- Enforce cap (default 3, max 5)
  IF v_current_count >= COALESCE(v_org.max_vehicles, 3) THEN
    RAISE EXCEPTION 'Vehicle cap reached for Owner-Operator. Current: %, Max: %. Upgrade to Fleet Provider to manage more vehicles.',
      v_current_count, COALESCE(v_org.max_vehicles, 3);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on vehicles table
DROP TRIGGER IF EXISTS enforce_oo_vehicle_cap ON vehicles;
CREATE TRIGGER enforce_oo_vehicle_cap
  BEFORE INSERT OR UPDATE OF owning_org_id ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION check_owner_operator_vehicle_cap();
