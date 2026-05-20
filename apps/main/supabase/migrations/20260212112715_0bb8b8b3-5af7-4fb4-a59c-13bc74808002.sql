
-- Phase 1: Organizations & Relationships backbone

-- Enums
CREATE TYPE public.organization_type AS ENUM ('ENTERPRISE','FLEET_PROVIDER','AGGREGATOR','OWNER_OPERATOR');
CREATE TYPE public.organization_status AS ENUM ('ACTIVE','SUSPENDED','ARCHIVED');
CREATE TYPE public.org_relationship_type AS ENUM ('CONTRACTED_PROVIDER','AGGREGATED_FLEET','SUBCONTRACTOR');
CREATE TYPE public.org_relationship_status AS ENUM ('ACTIVE','INACTIVE');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  parent_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_type public.organization_type NOT NULL,
  name TEXT NOT NULL,
  status public.organization_status NOT NULL DEFAULT 'ACTIVE',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_tenant ON public.organizations(tenant_id);
CREATE INDEX idx_organizations_parent ON public.organizations(parent_organization_id);
CREATE INDEX idx_organizations_type ON public.organizations(organization_type);

-- Org relationships table
CREATE TABLE public.org_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  from_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  to_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  relationship_type public.org_relationship_type NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  start_date DATE,
  end_date DATE,
  status public.org_relationship_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT org_relationships_no_self CHECK (from_org_id != to_org_id)
);

CREATE INDEX idx_org_relationships_from ON public.org_relationships(from_org_id);
CREATE INDEX idx_org_relationships_to ON public.org_relationships(to_org_id);
CREATE INDEX idx_org_relationships_status ON public.org_relationships(status);

-- RLS: organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access to organizations"
  ON public.organizations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "Tenant users can view own organizations"
  ON public.organizations FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can manage own organizations"
  ON public.organizations FOR ALL USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'tenant_admin')
  );

CREATE POLICY "Demo tenant public read organizations"
  ON public.organizations FOR SELECT USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');

-- RLS: org_relationships
ALTER TABLE public.org_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access to org_relationships"
  ON public.org_relationships FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "Users can view relationships involving their orgs"
  ON public.org_relationships FOR SELECT USING (
    from_org_id IN (SELECT id FROM public.organizations WHERE tenant_id = public.get_user_tenant_id(auth.uid()))
    OR to_org_id IN (SELECT id FROM public.organizations WHERE tenant_id = public.get_user_tenant_id(auth.uid()))
  );

CREATE POLICY "Tenant admins can manage own org relationships"
  ON public.org_relationships FOR ALL USING (
    from_org_id IN (SELECT id FROM public.organizations WHERE tenant_id = public.get_user_tenant_id(auth.uid()))
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'tenant_admin')
  );

CREATE POLICY "Demo tenant public read org_relationships"
  ON public.org_relationships FOR SELECT USING (
    from_org_id IN (SELECT id FROM public.organizations WHERE tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f')
    OR to_org_id IN (SELECT id FROM public.organizations WHERE tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f')
  );

-- Helper functions
CREATE OR REPLACE FUNCTION public.has_active_org_relationship(p_from_org_id UUID, p_to_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_relationships
    WHERE from_org_id = p_from_org_id AND to_org_id = p_to_org_id
      AND status = 'ACTIVE' AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  )
$$;

CREATE OR REPLACE FUNCTION public.get_related_org_ids(p_tenant_id TEXT)
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT to_org_id FROM public.org_relationships r
  JOIN public.organizations o ON r.from_org_id = o.id
  WHERE o.tenant_id = p_tenant_id AND r.status = 'ACTIVE' AND (r.end_date IS NULL OR r.end_date >= CURRENT_DATE)
  UNION
  SELECT DISTINCT from_org_id FROM public.org_relationships r
  JOIN public.organizations o ON r.to_org_id = o.id
  WHERE o.tenant_id = p_tenant_id AND r.status = 'ACTIVE' AND (r.end_date IS NULL OR r.end_date >= CURRENT_DATE)
$$;
