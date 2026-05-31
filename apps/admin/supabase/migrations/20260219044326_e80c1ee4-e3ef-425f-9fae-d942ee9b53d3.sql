
-- Phase 1: Migrate org_role_definitions from stakeholder-specific to generic roles
-- 
-- OLD: ENTERPRISE_ADMIN, FLEET_ADMIN, AGGREGATOR_ADMIN, OWNER_OPERATOR_ADMIN,
--      LOGISTICS_MANAGER, ENTERPRISE_VIEWER, FLEET_VIEWER, FLEET_FINANCE,
--      DISPATCHER, AGGREGATOR_DISPATCHER
-- NEW: ADMIN, OPERATIONS_MANAGER, DISPATCHER, FINANCE, VIEWER

-- Step 1: Update any existing user_org_roles to map to generic keys
-- (user_org_roles is currently empty but this is future-proof)
UPDATE public.user_org_roles SET role_key = 'ADMIN' 
WHERE role_key IN ('ENTERPRISE_ADMIN', 'FLEET_ADMIN', 'AGGREGATOR_ADMIN', 'OWNER_OPERATOR_ADMIN', 'OWNER_OPERATOR');

UPDATE public.user_org_roles SET role_key = 'OPERATIONS_MANAGER' 
WHERE role_key IN ('LOGISTICS_MANAGER');

UPDATE public.user_org_roles SET role_key = 'DISPATCHER' 
WHERE role_key IN ('AGGREGATOR_DISPATCHER');

UPDATE public.user_org_roles SET role_key = 'FINANCE' 
WHERE role_key IN ('FLEET_FINANCE');

UPDATE public.user_org_roles SET role_key = 'VIEWER' 
WHERE role_key IN ('ENTERPRISE_VIEWER', 'FLEET_VIEWER');

-- Step 2: Delete all legacy role definitions
DELETE FROM public.org_role_definitions 
WHERE role_key IN (
  'ENTERPRISE_ADMIN', 'FLEET_ADMIN', 'AGGREGATOR_ADMIN', 'OWNER_OPERATOR_ADMIN',
  'OWNER_OPERATOR', 'LOGISTICS_MANAGER', 'ENTERPRISE_VIEWER', 'FLEET_VIEWER',
  'FLEET_FINANCE', 'AGGREGATOR_DISPATCHER'
);

-- Step 3: Insert 5 generic role definitions (idempotent via ON CONFLICT)
INSERT INTO public.org_role_definitions (role_key, display_name, description, role_scope, applicable_org_types, permissions, is_system_role)
VALUES
  ('ADMIN', 'Admin', 'Full control of the organization. Permissions scoped by org type.',
   'ORG', '{ENTERPRISE,FLEET_PROVIDER,AGGREGATOR,OWNER_OPERATOR}',
   '["org:manage","assets:manage","jobs:create","jobs:view","jobs:execute","jobs:cancel","offers:create","offers:respond","offers:view","relationships:manage","drivers:manage","vehicles:manage","devices:manage","finance:view","finance:manage","reports:view","users:manage","execution:monitor"]',
   true),

  ('OPERATIONS_MANAGER', 'Operations Manager', 'Day-to-day operations, coordination, and cross-org visibility where applicable.',
   'CROSS_ORG', '{ENTERPRISE,FLEET_PROVIDER,AGGREGATOR}',
   '["jobs:create","jobs:view","jobs:execute","offers:create","offers:respond","offers:view","assets:manage","assets:view_related","drivers:manage","vehicles:manage","devices:view","execution:monitor","execution:manage","reports:view"]',
   true),

  ('DISPATCHER', 'Dispatcher', 'Assign drivers/vehicles to jobs, manage execution.',
   'ORG', '{FLEET_PROVIDER,AGGREGATOR}',
   '["jobs:view","jobs:execute","offers:respond","drivers:view","vehicles:view","devices:view","execution:manage"]',
   true),

  ('FINANCE', 'Finance', 'Financial data access, invoicing, and cost reporting.',
   'ORG', '{ENTERPRISE,FLEET_PROVIDER,AGGREGATOR}',
   '["jobs:view","finance:view","finance:manage","reports:view"]',
   true),

  ('VIEWER', 'Viewer', 'Read-only access to organizational data.',
   'ORG', '{ENTERPRISE,FLEET_PROVIDER,AGGREGATOR,OWNER_OPERATOR}',
   '["jobs:view","drivers:view","vehicles:view","devices:view","reports:view","assets:view_related","execution:monitor"]',
   true)
ON CONFLICT (role_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  role_scope = EXCLUDED.role_scope,
  applicable_org_types = EXCLUDED.applicable_org_types,
  permissions = EXCLUDED.permissions,
  is_system_role = EXCLUDED.is_system_role;
