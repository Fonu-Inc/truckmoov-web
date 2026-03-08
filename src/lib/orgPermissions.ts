/**
 * Centralized org-type permission rules.
 * Source of truth for what each org type can see/do.
 * Used by route gating, data hooks, and UI components.
 */

import type { OrgMembership } from '@/types/orgRoles';
import { ORG_TYPES } from '@/types/orgRoles';

// ─── Route Access Rules ─────────────────────────────────────────────────────

export type OrgType = (typeof ORG_TYPES)[keyof typeof ORG_TYPES];

interface RouteRule {
  /** Org types allowed when multi-stakeholder is enabled */
  allowedOrgTypes: OrgType[];
  /** Legacy roles allowed when multi-stakeholder is disabled */
  allowedLegacyRoles: string[];
}

/**
 * Route access rules. Ordered by specificity – the longest prefix match wins.
 * Routes NOT listed here default to "public" (no gating).
 * Use SHARED_ROUTES for routes accessible by all authenticated users.
 */
export const ROUTE_RULES: Record<string, RouteRule> = {
  // ── Enterprise ──
  '/enterprise': {
    allowedOrgTypes: ['ENTERPRISE'],
    allowedLegacyRoles: ['platform_admin'],
  },

  // ── Aggregator ──
  '/aggregator': {
    allowedOrgTypes: ['AGGREGATOR'],
    allowedLegacyRoles: ['platform_admin'],
  },

  // ── Owner-Operator ──
  '/owner-operator': {
    allowedOrgTypes: ['OWNER_OPERATOR'],
    allowedLegacyRoles: ['platform_admin'],
  },

  // ── Fleet / Tenant Admin ──
  '/admin': {
    allowedOrgTypes: ['FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR', 'ENTERPRISE'],
    allowedLegacyRoles: ['tenant_admin', 'operations_manager', 'dispatcher', 'viewer_finance', 'installer', 'supervisor'],
  },

  // ── Supervisor ──
  '/supervisor': {
    allowedOrgTypes: ['FLEET_PROVIDER'],
    allowedLegacyRoles: ['supervisor', 'dispatcher'],
  },

  // ── Platform Admin ──
  '/platform': {
    allowedOrgTypes: [],
    allowedLegacyRoles: ['platform_admin'],
  },

  // ── Driver ──
  '/driver': {
    allowedOrgTypes: [],
    allowedLegacyRoles: ['driver'],
  },
};

/**
 * Routes accessible by ANY authenticated user regardless of org type.
 * These bypass org-type checks entirely.
 */
export const SHARED_ROUTES: string[] = [
  '/help',
  '/not-authorized',
  '/architecture',
  '/technical-architecture',
  '/debug',
];

/**
 * Check if a route is a shared route (accessible by all authenticated users).
 */
export function isSharedRoute(path: string): boolean {
  return SHARED_ROUTES.some((prefix) => path.startsWith(prefix));
}

/**
 * Check if a user can access a given route based on org memberships + legacy role.
 */
export function canAccessRoute(
  path: string,
  memberships: OrgMembership[],
  legacyRole: string | undefined,
  multiStakeholderEnabled: boolean
): boolean {
  // Platform admin always has access
  if (legacyRole === 'platform_admin') return true;

  // Shared routes are accessible by all authenticated users
  if (isSharedRoute(path)) return true;

  // Find matching rule (longest prefix match)
  const matchingPrefix = Object.keys(ROUTE_RULES)
    .filter((prefix) => path.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchingPrefix) return true; // No rule = public route

  const rule = ROUTE_RULES[matchingPrefix];

  if (multiStakeholderEnabled && rule.allowedOrgTypes.length > 0) {
    return memberships.some((m) =>
      rule.allowedOrgTypes.includes(m.orgType as OrgType)
    );
  }

  // Legacy role-based check
  return legacyRole ? rule.allowedLegacyRoles.includes(legacyRole) : false;
}

/**
 * Given org memberships + legacy role, resolve the correct home route.
 */
export function resolveOrgHomeRoute(
  memberships: { orgType: string }[],
  legacyRole: string | undefined,
  multiStakeholderEnabled: boolean
): string {
  if (legacyRole === 'platform_admin') return '/platform';

  if (multiStakeholderEnabled) {
    const orgTypes = new Set(memberships.map((m) => m.orgType));
    if (orgTypes.has('ENTERPRISE')) return '/enterprise';
    if (orgTypes.has('AGGREGATOR')) return '/aggregator';
    if (orgTypes.has('FLEET_PROVIDER')) return '/admin';
    if (orgTypes.has('OWNER_OPERATOR')) return '/owner-operator';
  }

  switch (legacyRole) {
    case 'tenant_admin':
    case 'operations_manager':
      return '/admin';
    case 'supervisor':
    case 'dispatcher':
      return '/supervisor';
    case 'driver':
      return '/driver';
    case 'viewer_finance':
      return '/admin/fleet?tab=analytics';
    default:
      return '/auth';
  }
}

// ─── Data Scope Rules ────────────────────────────────────────────────────────

export interface OrgDataScope {
  /** The org IDs to filter assets (vehicles/drivers/devices) by owning_org_id */
  assetOrgIds: string[];
  /** For jobs: filter by job_owner_org_id (Enterprise) or executing_org_id (Fleet/Aggregator) */
  jobFilterField: 'job_owner_org_id' | 'executing_org_id' | null;
  jobFilterOrgIds: string[];
  /** Can this org type create/edit/delete fleet assets? */
  canManageAssets: boolean;
  /** Can this org type create jobs? */
  canCreateJobs: boolean;
  /** Can this org type dispatch (assign drivers/vehicles)? */
  canDispatch: boolean;
  /** Can this org type create sub-organizations? */
  canCreateSubOrgs: boolean;
  /** Can this org type view cross-fleet analytics? */
  canViewCrossFleetAnalytics: boolean;
}

/**
 * Compute the data scope for the current user based on org memberships.
 */
export function computeOrgDataScope(
  memberships: OrgMembership[],
  legacyRole: string | undefined,
  childOrgIds: string[] = []
): OrgDataScope {
  const scope: OrgDataScope = {
    assetOrgIds: [],
    jobFilterField: null,
    jobFilterOrgIds: [],
    canManageAssets: false,
    canCreateJobs: false,
    canDispatch: false,
    canCreateSubOrgs: false,
    canViewCrossFleetAnalytics: false,
  };

  if (legacyRole === 'platform_admin') {
    return {
      ...scope,
      canManageAssets: true,
      canCreateJobs: true,
      canDispatch: true,
      canCreateSubOrgs: true,
      canViewCrossFleetAnalytics: true,
    };
  }

  const orgTypes = new Set(memberships.map((m) => m.orgType));
  const allOrgIds = memberships.map((m) => m.orgId);

  if (orgTypes.has('ENTERPRISE')) {
    scope.jobFilterField = 'job_owner_org_id';
    scope.jobFilterOrgIds = allOrgIds;
    scope.canCreateJobs = true;
    scope.canManageAssets = false;
    scope.canDispatch = false;
    scope.canViewCrossFleetAnalytics = true;
  } else if (orgTypes.has('AGGREGATOR')) {
    scope.assetOrgIds = [...allOrgIds, ...childOrgIds];
    scope.jobFilterField = 'executing_org_id';
    scope.jobFilterOrgIds = [...allOrgIds, ...childOrgIds];
    scope.canManageAssets = true;
    scope.canDispatch = true;
    scope.canCreateSubOrgs = true;
    scope.canViewCrossFleetAnalytics = true;
  } else if (orgTypes.has('FLEET_PROVIDER')) {
    scope.assetOrgIds = allOrgIds;
    scope.jobFilterField = 'executing_org_id';
    scope.jobFilterOrgIds = allOrgIds;
    scope.canManageAssets = true;
    scope.canCreateJobs = true;
    scope.canDispatch = true;
  } else if (orgTypes.has('OWNER_OPERATOR')) {
    scope.assetOrgIds = allOrgIds;
    scope.jobFilterField = 'executing_org_id';
    scope.jobFilterOrgIds = allOrgIds;
    scope.canManageAssets = false;
    scope.canCreateJobs = false;
    scope.canDispatch = false;
    scope.canCreateSubOrgs = false;
    scope.canViewCrossFleetAnalytics = false;
  }

  return scope;
}

// ─── Role-Level Permission Matrix ────────────────────────────────────────────

/**
 * Defines which write-action flags each generic role is allowed.
 * This is intersected with the org-type permissions to produce the final result.
 * ADMIN gets everything the org type allows; other roles are progressively restricted.
 */
export interface RoleWriteCapabilities {
  canCreateJobs: boolean;
  canUpdateJobs: boolean;
  canDeleteJobs: boolean;
  canDispatch: boolean;
  canCreateAssets: boolean;
  canUpdateAssets: boolean;
  canDeleteAssets: boolean;
  canCreateJobOffers: boolean;
  canRespondToJobOffers: boolean;
  canManageOrgRelationships: boolean;
  canCreateSubOrgs: boolean;
  canManageCompliance: boolean;
  canUpdateJobMilestones: boolean;
  canViewCrossFleetAnalytics: boolean;
  canManageFinance: boolean;
}

const ALL_TRUE: RoleWriteCapabilities = {
  canCreateJobs: true,
  canUpdateJobs: true,
  canDeleteJobs: true,
  canDispatch: true,
  canCreateAssets: true,
  canUpdateAssets: true,
  canDeleteAssets: true,
  canCreateJobOffers: true,
  canRespondToJobOffers: true,
  canManageOrgRelationships: true,
  canCreateSubOrgs: true,
  canManageCompliance: true,
  canUpdateJobMilestones: true,
  canViewCrossFleetAnalytics: true,
  canManageFinance: true,
};

const ALL_FALSE: RoleWriteCapabilities = {
  canCreateJobs: false,
  canUpdateJobs: false,
  canDeleteJobs: false,
  canDispatch: false,
  canCreateAssets: false,
  canUpdateAssets: false,
  canDeleteAssets: false,
  canCreateJobOffers: false,
  canRespondToJobOffers: false,
  canManageOrgRelationships: false,
  canCreateSubOrgs: false,
  canManageCompliance: false,
  canUpdateJobMilestones: false,
  canViewCrossFleetAnalytics: false,
  canManageFinance: false,
};

export const ROLE_CAPABILITIES: Record<string, RoleWriteCapabilities> = {
  ADMIN: { ...ALL_TRUE },

  OPERATIONS_MANAGER: {
    ...ALL_TRUE,
    canDeleteJobs: false,
    canDeleteAssets: false,
    canManageOrgRelationships: false,
    canCreateSubOrgs: false,
    canManageFinance: false,
  },

  DISPATCHER: {
    ...ALL_FALSE,
    canUpdateJobs: true,
    canDispatch: true,
    canRespondToJobOffers: true,
    canUpdateJobMilestones: true,
  },

  FINANCE: {
    ...ALL_FALSE,
    canViewCrossFleetAnalytics: true,
    canManageFinance: true,
  },

  VIEWER: { ...ALL_FALSE, canViewCrossFleetAnalytics: true },
};

/**
 * Resolve effective write capabilities by intersecting org-type permissions
 * with the highest-privilege role the user holds in the active org.
 */
export function resolveRoleCapabilities(roleKeys: string[]): RoleWriteCapabilities {
  if (roleKeys.length === 0) return { ...ALL_FALSE };

  // Use the most privileged role (ADMIN > OPS_MGR > DISPATCHER > FINANCE > VIEWER)
  const PRIORITY = ['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER', 'FINANCE', 'VIEWER'];
  const bestRole = PRIORITY.find((r) => roleKeys.includes(r)) ?? 'VIEWER';
  return ROLE_CAPABILITIES[bestRole] ?? { ...ALL_FALSE };
}

// ─── Module Visibility Matrix ────────────────────────────────────────────────

export type ModuleKey =
  | 'fleet_management'
  | 'driver_management'
  | 'device_management'
  | 'sim_management'
  | 'jobs'
  | 'job_offers'
  | 'dispatch'
  | 'live_map'
  | 'analytics'
  | 'communications'
  | 'maintenance'
  | 'fuel'
  | 'compliance'
  | 'wallet'
  | 'developer_portal'
  | 'waybill_invoices'
  | 'settings';

const MODULE_VISIBILITY: Record<OrgType, ModuleKey[]> = {
  ENTERPRISE: ['jobs', 'analytics', 'communications', 'waybill_invoices', 'settings'],
  FLEET_PROVIDER: [
    'fleet_management', 'driver_management', 'device_management', 'sim_management',
    'jobs', 'job_offers', 'dispatch', 'live_map', 'analytics', 'communications',
    'maintenance', 'fuel', 'compliance', 'wallet', 'developer_portal', 'waybill_invoices', 'settings',
  ],
  AGGREGATOR: [
    'fleet_management', 'driver_management', 'jobs', 'analytics',
    'communications', 'waybill_invoices', 'settings',
  ],
  OWNER_OPERATOR: ['jobs', 'job_offers', 'communications', 'compliance', 'waybill_invoices', 'settings'],
};

/**
 * Check if a module is visible for the given org type.
 */
export function isModuleVisible(orgType: OrgType, module: ModuleKey): boolean {
  return MODULE_VISIBILITY[orgType]?.includes(module) ?? false;
}

/**
 * Get all visible modules for an org type.
 */
export function getVisibleModules(orgType: OrgType): ModuleKey[] {
  return MODULE_VISIBILITY[orgType] ?? [];
}
