-- Create a platform admin invitation for the demo admin email
-- This allows someone to sign up with this email and automatically get platform_admin role

INSERT INTO public.user_invitations (email, role, tenant_id, invited_by, expires_at)
VALUES (
  'admin@truckmoov.com',
  'platform_admin',
  NULL,  -- Platform admins don't belong to a tenant
  NULL,  -- Self-bootstrap
  now() + interval '1 year'  -- Long expiry for demo purposes
)
ON CONFLICT DO NOTHING;