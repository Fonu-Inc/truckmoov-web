
INSERT INTO public.org_role_definitions (role_key, display_name, description, role_scope, applicable_org_types, permissions, is_system_role)
VALUES (
  'OWNER_OPERATOR_ADMIN',
  'Owner-Operator Admin',
  'Primary role for owner-operators. Can manage jobs, vehicles, and compliance. Cannot create sub-orgs, view other operators, access cross-fleet analytics, or manage contracts.',
  'ORG',
  ARRAY['OWNER_OPERATOR']::organization_type[],
  '["view_assigned_jobs", "accept_decline_offers", "update_job_milestones", "view_own_vehicles", "view_own_compliance", "view_earnings"]'::jsonb,
  true
)
ON CONFLICT (role_key) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  description = EXCLUDED.description;
