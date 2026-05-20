
-- =============================================
-- PHASE 3: RBAC 2.0 — Organization-Scoped Roles
-- =============================================

-- 1. ENUMS
CREATE TYPE public.org_role_scope AS ENUM ('ORG', 'CROSS_ORG');
CREATE TYPE public.org_membership_status AS ENUM ('active', 'invited', 'suspended', 'removed');

-- 2. ORG ROLE DEFINITIONS — the role catalog
CREATE TABLE public.org_role_definitions (
  role_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  role_scope public.org_role_scope NOT NULL DEFAULT 'ORG',
  applicable_org_types public.organization_type[] NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the role catalog
INSERT INTO public.org_role_definitions (role_key, display_name, description, role_scope, applicable_org_types, permissions) VALUES
  -- Enterprise roles
  ('ENTERPRISE_ADMIN',     'Enterprise Admin',     'Full control of enterprise org and relationships',          'ORG',       '{ENTERPRISE}',       '["org:manage","jobs:create","jobs:view","jobs:cancel","offers:create","offers:view","relationships:manage","assets:view","reports:view","finance:view","users:manage"]'),
  ('LOGISTICS_MANAGER',    'Logistics Manager',    'Cross-provider visibility and coordination',                'CROSS_ORG', '{ENTERPRISE}',       '["jobs:create","jobs:view","offers:create","offers:view","assets:view_related","execution:monitor","reports:view"]'),
  ('ENTERPRISE_VIEWER',    'Enterprise Viewer',    'Read-only access to enterprise data and execution status',  'CROSS_ORG', '{ENTERPRISE}',       '["jobs:view","offers:view","assets:view_related","execution:monitor","reports:view"]'),
  -- Fleet Provider roles
  ('FLEET_ADMIN',          'Fleet Admin',          'Full control of fleet provider org and owned assets',       'ORG',       '{FLEET_PROVIDER}',   '["org:manage","assets:manage","jobs:view","jobs:execute","offers:respond","drivers:manage","vehicles:manage","devices:manage","finance:view","reports:view","users:manage"]'),
  ('DISPATCHER',           'Dispatcher',           'Assign drivers/vehicles to jobs, manage execution',         'ORG',       '{FLEET_PROVIDER,AGGREGATOR}', '["jobs:view","jobs:execute","offers:respond","drivers:view","vehicles:view","devices:view","execution:manage"]'),
  ('FLEET_VIEWER',         'Fleet Viewer',         'Read-only access to fleet assets and jobs',                 'ORG',       '{FLEET_PROVIDER}',   '["jobs:view","drivers:view","vehicles:view","devices:view","reports:view"]'),
  ('FLEET_FINANCE',        'Fleet Finance',        'Financial data access for fleet operations',                'ORG',       '{FLEET_PROVIDER}',   '["jobs:view","finance:view","finance:manage","reports:view"]'),
  -- Aggregator roles
  ('AGGREGATOR_ADMIN',     'Aggregator Admin',     'Full control of aggregator org, sub-fleets, and dispatch',  'CROSS_ORG', '{AGGREGATOR}',       '["org:manage","assets:manage","jobs:view","jobs:execute","offers:create","offers:respond","relationships:manage","drivers:manage","vehicles:manage","finance:view","reports:view","users:manage"]'),
  ('AGGREGATOR_DISPATCHER','Aggregator Dispatcher', 'Dispatch across aggregated fleets',                        'CROSS_ORG', '{AGGREGATOR}',       '["jobs:view","jobs:execute","offers:respond","drivers:view","vehicles:view","execution:manage","assets:view_related"]'),
  -- Owner Operator roles
  ('OWNER_OPERATOR_ADMIN', 'Owner Operator Admin', 'Minimal admin for owner-operator (own assets + jobs)',      'ORG',       '{OWNER_OPERATOR}',   '["org:manage","assets:manage","jobs:view","jobs:execute","offers:respond","drivers:manage","vehicles:manage","devices:manage"]');

-- 3. USER_ORG_MEMBERSHIPS — links users to organizations
CREATE TABLE public.user_org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  membership_status public.org_membership_status NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id)
);

CREATE INDEX idx_user_org_memberships_user ON public.user_org_memberships(user_id);
CREATE INDEX idx_user_org_memberships_org ON public.user_org_memberships(org_id);
CREATE INDEX idx_user_org_memberships_status ON public.user_org_memberships(membership_status);

-- 4. USER_ORG_ROLES — assigns roles to users within an org context
CREATE TABLE public.user_org_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL REFERENCES public.org_role_definitions(role_key),
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id, role_key)
);

CREATE INDEX idx_user_org_roles_user ON public.user_org_roles(user_id);
CREATE INDEX idx_user_org_roles_org ON public.user_org_roles(org_id);
CREATE INDEX idx_user_org_roles_role ON public.user_org_roles(role_key);

-- 5. SECURITY DEFINER HELPER FUNCTIONS

-- Check if user has a specific org role
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _org_id UUID, _role_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_org_roles
    WHERE user_id = _user_id
      AND org_id = _org_id
      AND role_key = _role_key
  )
$$;

-- Check if user has ANY of the given permissions within an org
CREATE OR REPLACE FUNCTION public.has_org_permission(_user_id UUID, _org_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_org_roles uor
    JOIN public.org_role_definitions ord ON uor.role_key = ord.role_key
    WHERE uor.user_id = _user_id
      AND uor.org_id = _org_id
      AND ord.permissions @> to_jsonb(_permission)
  )
$$;

-- Check if user belongs to an org (active membership)
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_org_memberships
    WHERE user_id = _user_id
      AND org_id = _org_id
      AND membership_status = 'active'
  )
$$;

-- Get all org IDs a user is a member of
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.user_org_memberships
  WHERE user_id = _user_id AND membership_status = 'active'
$$;

-- Check if user has cross-org visibility (LOGISTICS_MANAGER, ENTERPRISE_VIEWER, AGGREGATOR roles)
CREATE OR REPLACE FUNCTION public.has_cross_org_visibility(_user_id UUID, _target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_org_roles uor
    JOIN public.org_role_definitions ord ON uor.role_key = ord.role_key
    WHERE uor.user_id = _user_id
      AND ord.role_scope = 'CROSS_ORG'
      AND public.has_active_org_relationship(uor.org_id, _target_org_id)
  )
$$;

-- 6. RLS POLICIES

-- org_role_definitions: readable by all authenticated, writable by platform_admin
ALTER TABLE public.org_role_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read role definitions"
  ON public.org_role_definitions FOR SELECT
  USING (true);

CREATE POLICY "Platform admins manage role definitions"
  ON public.org_role_definitions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

-- user_org_memberships
ALTER TABLE public.user_org_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access to memberships"
  ON public.user_org_memberships FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "Users can view own memberships"
  ON public.user_org_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Org admins can manage memberships in own org"
  ON public.user_org_memberships FOR ALL
  USING (
    public.has_org_permission(auth.uid(), org_id, 'users:manage')
  )
  WITH CHECK (
    public.has_org_permission(auth.uid(), org_id, 'users:manage')
  );

-- user_org_roles
ALTER TABLE public.user_org_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access to org roles"
  ON public.user_org_roles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "Users can view own org roles"
  ON public.user_org_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Org admins can manage roles in own org"
  ON public.user_org_roles FOR ALL
  USING (
    public.has_org_permission(auth.uid(), org_id, 'users:manage')
  )
  WITH CHECK (
    public.has_org_permission(auth.uid(), org_id, 'users:manage')
  );

-- Demo tenant public read
CREATE POLICY "Public read memberships for demo"
  ON public.user_org_memberships FOR SELECT
  USING (
    org_id IN (SELECT id FROM public.organizations WHERE tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f')
  );

CREATE POLICY "Public read org roles for demo"
  ON public.user_org_roles FOR SELECT
  USING (
    org_id IN (SELECT id FROM public.organizations WHERE tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f')
  );
