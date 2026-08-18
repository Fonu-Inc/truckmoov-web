/**
 * Organization-scoped RBAC types (Phase 3+)
 * These complement the legacy tenant-level UserRole system.
 */

export type OrgMembership = {
  orgId: string;
  orgName: string;
  orgType: string; // ENTERPRISE, FLEET_PROVIDER, AGGREGATOR, OWNER_OPERATOR
  roleKeys: string[]; // e.g. ['ADMIN', 'DISPATCHER']
  roleScope: string; // ORG or CROSS_ORG
};

export type UserOrgContext = {
  memberships: OrgMembership[];
  /** Convenience: all org IDs the user belongs to */
  orgIds: string[];
  /** Check if user has a specific role in any org */
  hasOrgRole: (roleKey: string) => boolean;
  /** Check if user belongs to an org of a specific type */
  hasOrgType: (orgType: string) => boolean;
  /** Get memberships for a specific org type */
  getByOrgType: (orgType: string) => OrgMembership[];
};

/**
 * Generic org role keys — independent of organization type.
 * A user's effective permissions = org_type + role_key.
 */
export const ORG_ROLES = {
  ADMIN: "ADMIN",
  OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
  DISPATCHER: "DISPATCHER",
  FINANCE: "FINANCE",
  VIEWER: "VIEWER",
} as const;

export type OrgRoleKey = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

export const ORG_TYPES = {
  ENTERPRISE: "ENTERPRISE",
  FLEET_PROVIDER: "FLEET_PROVIDER",
  AGGREGATOR: "AGGREGATOR",
  OWNER_OPERATOR: "OWNER_OPERATOR",
} as const;
