/**
 * Unified Authorization Middleware for Edge Functions
 * 
 * Extracts user identity, resolves org context, and enforces
 * route/resource permissions based on role + org type.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthContext {
  userId: string;
  tenantId: string | null;
  role: string | null;
  isPlatformAdmin: boolean;
  orgMemberships: Array<{
    orgId: string;
    orgType: string;
    roleKeys: string[];
  }>;
  /** All org IDs the user belongs to */
  orgIds: string[];
  /** Check if user has a specific org type */
  hasOrgType: (orgType: string) => boolean;
  /** Check if user belongs to a specific org */
  isOrgMember: (orgId: string) => boolean;
  /** Get org IDs for a specific org type */
  getOrgIdsByType: (orgType: string) => string[];
}

export interface AuthError {
  status: number;
  message: string;
}

/**
 * Extract and validate the user from the Authorization header.
 * Returns AuthContext on success, or throws an AuthError.
 */
export async function resolveAuthContext(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw { status: 401, message: 'Missing Authorization header' } as AuthError;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify JWT and get user
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw { status: 401, message: 'Invalid or expired token' } as AuthError;
  }

  // Fetch profile + org memberships + legacy role (fallback during migration)
  const [profileResult, legacyRoleResult, orgResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_org_memberships')
      .select(`
        org_id,
        organizations!inner(org_type),
        user_org_roles(role_key)
      `)
      .eq('user_id', user.id)
      .eq('membership_status', 'active'),
  ]);

  const tenantId = profileResult.data?.tenant_id ?? null;

  // Platform admin is resolved from user_roles because platform admins are
  // cross-tenant and don't belong to any specific organization. Org-scoped
  // role keys are used for all other role derivation.
  const allRoleKeys = (orgResult.data || []).flatMap(
    (m: any) => (m.user_org_roles || []).map((r: any) => r.role_key)
  );
  const legacyRole = legacyRoleResult.data?.role ?? null;
  const isPlatformAdmin = legacyRole === 'platform_admin';

  const role = isPlatformAdmin ? 'platform_admin'
    : allRoleKeys.includes('ADMIN') ? 'tenant_admin'
    : allRoleKeys.includes('OPERATIONS_MANAGER') ? 'operations_manager'
    : allRoleKeys.includes('DISPATCHER') ? 'dispatcher'
    : allRoleKeys.includes('SUPERVISOR') ? 'supervisor'
    : legacyRole; // fallback to legacy role during migration

  // Map org memberships
  const orgMemberships = (orgResult.data || []).map((m: any) => ({
    orgId: m.org_id,
    orgType: (m.organizations as any)?.org_type ?? 'UNKNOWN',
    roleKeys: (m.user_org_roles || []).map((r: any) => r.role_key),
  }));

  const orgIds = orgMemberships.map((m: any) => m.orgId);

  return {
    userId: user.id,
    tenantId,
    role,
    isPlatformAdmin,
    orgMemberships,
    orgIds,
    hasOrgType: (orgType: string) => orgMemberships.some((m: any) => m.orgType === orgType),
    isOrgMember: (orgId: string) => orgIds.includes(orgId),
    getOrgIdsByType: (orgType: string) =>
      orgMemberships.filter((m: any) => m.orgType === orgType).map((m: any) => m.orgId),
  };
}

/**
 * Enforce that the user can access a specific org's resources.
 * Throws AuthError if denied.
 */
export function enforceOrgAccess(
  ctx: AuthContext,
  targetOrgId: string,
  requiredPermission?: string
): void {
  if (ctx.isPlatformAdmin) return;

  if (!ctx.isOrgMember(targetOrgId)) {
    throw {
      status: 403,
      message: `Access denied: not a member of organization ${targetOrgId}`,
    } as AuthError;
  }
}

/**
 * Enforce that the user has a specific org type.
 * Throws AuthError if denied.
 */
export function enforceOrgType(ctx: AuthContext, ...allowedTypes: string[]): void {
  if (ctx.isPlatformAdmin) return;

  const hasAllowed = allowedTypes.some((t) => ctx.hasOrgType(t));
  if (!hasAllowed) {
    throw {
      status: 403,
      message: `Access denied: requires org type ${allowedTypes.join(' or ')}`,
    } as AuthError;
  }
}

/**
 * Server-side route guard: validates that the requesting user's org type
 * is allowed for the given route prefix. Mirrors the client-side ROUTE_RULES.
 * 
 * Usage in edge functions:
 *   enforceRouteOrgType(ctx, '/enterprise');  // only ENTERPRISE allowed
 *   enforceRouteOrgType(ctx, '/admin');        // FLEET_PROVIDER or AGGREGATOR
 */
const SERVER_ROUTE_RULES: Record<string, string[]> = {
  '/enterprise': ['ENTERPRISE'],
  '/aggregator': ['AGGREGATOR'],
  '/owner-operator': ['OWNER_OPERATOR'],
  '/admin': ['FLEET_PROVIDER', 'AGGREGATOR'],
  '/supervisor': ['FLEET_PROVIDER'],
  '/platform': [], // platform_admin only (checked via isPlatformAdmin)
  '/driver': [],   // driver legacy role only
};

export function enforceRouteOrgType(ctx: AuthContext, routePrefix: string): void {
  if (ctx.isPlatformAdmin) return;

  const allowedTypes = SERVER_ROUTE_RULES[routePrefix];
  if (!allowedTypes) return; // No rule = no restriction

  if (allowedTypes.length === 0) {
    // Route is restricted to platform_admin or specific legacy role only
    throw {
      status: 403,
      message: `Access denied: route ${routePrefix} requires elevated privileges`,
    } as AuthError;
  }

  const hasAllowed = allowedTypes.some((t) => ctx.hasOrgType(t));
  if (!hasAllowed) {
    throw {
      status: 403,
      message: `Access denied: org type ${ctx.orgMemberships.map(m => m.orgType).join(',')} cannot access ${routePrefix}`,
    } as AuthError;
  }
}

/**
 * Write permission matrix — enforces org-type-specific write rules.
 */
const WRITE_RULES: Record<string, string[]> = {
  'jobs:create': ['ENTERPRISE', 'FLEET_PROVIDER'],
  'jobs:manage': ['ENTERPRISE', 'FLEET_PROVIDER', 'AGGREGATOR'],
  'jobs:execute': ['FLEET_PROVIDER', 'AGGREGATOR'],
  'jobs:delete': ['ENTERPRISE', 'FLEET_PROVIDER'],
  'assets:manage': ['FLEET_PROVIDER', 'AGGREGATOR'],
  'assets:delete': ['FLEET_PROVIDER'],
  'drivers:manage': ['FLEET_PROVIDER', 'AGGREGATOR'],
  'vehicles:manage': ['FLEET_PROVIDER', 'AGGREGATOR'],
  'devices:manage': ['FLEET_PROVIDER', 'AGGREGATOR'],
  'offers:create': ['ENTERPRISE'],
  'offers:respond': ['FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR'],
  'milestones:update': ['FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR'],
  'relationships:manage': ['ENTERPRISE', 'AGGREGATOR'],
  'org:manage': ['ENTERPRISE', 'FLEET_PROVIDER', 'AGGREGATOR'],
  'finance:manage': ['ENTERPRISE', 'FLEET_PROVIDER', 'AGGREGATOR'],
};

/**
 * Role-level write rules — maps actions to the minimum role keys that can perform them.
 * If an action is not listed here, only ADMIN can perform it.
 */
const ROLE_WRITE_RULES: Record<string, string[]> = {
  'jobs:create': ['ADMIN', 'OPERATIONS_MANAGER'],
  'jobs:manage': ['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER'],
  'jobs:execute': ['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER'],
  'jobs:delete': ['ADMIN'],
  'assets:manage': ['ADMIN', 'OPERATIONS_MANAGER'],
  'assets:delete': ['ADMIN'],
  'drivers:manage': ['ADMIN', 'OPERATIONS_MANAGER'],
  'vehicles:manage': ['ADMIN', 'OPERATIONS_MANAGER'],
  'devices:manage': ['ADMIN', 'OPERATIONS_MANAGER'],
  'offers:create': ['ADMIN', 'OPERATIONS_MANAGER'],
  'offers:respond': ['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER'],
  'milestones:update': ['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER'],
  'relationships:manage': ['ADMIN'],
  'org:manage': ['ADMIN'],
  'finance:manage': ['ADMIN', 'FINANCE'],
};

/**
 * Enforce that the user's org type AND role are allowed to perform the given write action.
 */
export function enforceWritePermission(
  ctx: AuthContext,
  action: string,
  targetOrgId?: string
): void {
  if (ctx.isPlatformAdmin) return;

  // 1. Org-type check
  const allowedTypes = WRITE_RULES[action];
  if (!allowedTypes) {
    throw { status: 403, message: `Access denied: unknown action ${action}` } as AuthError;
  }

  const hasAllowedType = allowedTypes.some((t) => ctx.hasOrgType(t));
  if (!hasAllowedType) {
    throw {
      status: 403,
      message: `Access denied: ${ctx.orgMemberships.map(m => m.orgType).join(',')} cannot perform ${action}`,
    } as AuthError;
  }

  // 2. Role-key check
  const allowedRoles = ROLE_WRITE_RULES[action] ?? ['ADMIN'];
  const userRoleKeys = ctx.orgMemberships.flatMap((m) => m.roleKeys);
  const hasAllowedRole = allowedRoles.some((r) => userRoleKeys.includes(r));
  if (!hasAllowedRole) {
    throw {
      status: 403,
      message: `Access denied: role ${userRoleKeys.join(',')} cannot perform ${action}`,
    } as AuthError;
  }

  if (targetOrgId) {
    enforceOrgAccess(ctx, targetOrgId);
  }
}

/**
 * Build org-scoped query filters for the current user context.
 */
export function buildOrgFilters(ctx: AuthContext, req?: Request) {
  if (ctx.isPlatformAdmin) {
    return { filterByOrg: false, orgIds: [] as string[], tenantId: null, activeOrgId: null };
  }

  const activeOrgHeader = req?.headers.get('X-Active-Org-Id');
  if (activeOrgHeader && ctx.isOrgMember(activeOrgHeader)) {
    return {
      filterByOrg: true,
      orgIds: [activeOrgHeader],
      tenantId: ctx.tenantId,
      activeOrgId: activeOrgHeader,
    };
  }

  return {
    filterByOrg: ctx.orgIds.length > 0,
    orgIds: ctx.orgIds,
    tenantId: ctx.tenantId,
    activeOrgId: null,
  };
}

/**
 * Enforce that the request's X-Active-Org-Id header is valid.
 */
export function enforceActiveOrgHeader(ctx: AuthContext, req: Request): string | null {
  const activeOrgId = req.headers.get('X-Active-Org-Id');
  if (!activeOrgId) return null;

  if (!ctx.isPlatformAdmin && !ctx.isOrgMember(activeOrgId)) {
    throw {
      status: 403,
      message: `Access denied: not a member of organization ${activeOrgId}`,
    } as AuthError;
  }

  return activeOrgId;
}

/**
 * Standard error response helper
 */
export function authErrorResponse(err: AuthError, headers: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify({ error: err.message }),
    { status: err.status, headers: { 'Content-Type': 'application/json', ...headers } }
  );
}
