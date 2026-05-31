-- Function to return org types grouped by tenant_id (for platform admin views)
CREATE OR REPLACE FUNCTION public.get_tenant_org_types()
RETURNS TABLE(tenant_id text, org_types text[]) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.tenant_id, array_agg(DISTINCT o.organization_type) as org_types
  FROM organizations o
  WHERE o.tenant_id IS NOT NULL
  GROUP BY o.tenant_id;
$$;