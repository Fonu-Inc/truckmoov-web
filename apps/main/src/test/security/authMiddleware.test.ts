import { describe, it, expect } from 'vitest';
import { computeOrgDataScope } from '@/lib/orgPermissions';

/**
 * Tests for the server-side auth middleware logic.
 * Validates org header enforcement and write permission rules
 * without requiring Deno/Supabase runtime.
 */

// Minimal replica of enforceWritePermission logic for unit testing
const WRITE_RULES: Record<string, string[]> = {
  'jobs:create': ['ENTERPRISE', 'FLEET_PROVIDER'],
  'jobs:manage': ['ENTERPRISE', 'FLEET_PROVIDER', 'AGGREGATOR'],
  'assets:manage': ['FLEET_PROVIDER', 'AGGREGATOR'],
  'vehicles:manage': ['FLEET_PROVIDER', 'AGGREGATOR'],
  'devices:manage': ['FLEET_PROVIDER', 'AGGREGATOR'],
  'offers:respond': ['FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR'],
  'milestones:update': ['FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR'],
  'relationships:manage': ['ENTERPRISE', 'AGGREGATOR'],
  'org:manage': ['ENTERPRISE', 'FLEET_PROVIDER', 'AGGREGATOR'],
};

interface MockAuthContext {
  orgMemberships: Array<{ orgId: string; orgType: string }>;
  orgIds: string[];
  isPlatformAdmin: boolean;
}

function enforceWritePermission(ctx: MockAuthContext, action: string, targetOrgId?: string) {
  if (ctx.isPlatformAdmin) return;

  const allowedTypes = WRITE_RULES[action];
  if (!allowedTypes) {
    throw { status: 403, message: `Access denied: unknown action ${action}` };
  }

  const hasAllowedType = allowedTypes.some(t =>
    ctx.orgMemberships.some(m => m.orgType === t)
  );
  if (!hasAllowedType) {
    throw { status: 403, message: `Access denied for action ${action}` };
  }

  if (targetOrgId && !ctx.orgIds.includes(targetOrgId)) {
    throw { status: 403, message: `Not a member of org ${targetOrgId}` };
  }
}

function enforceActiveOrgHeader(ctx: MockAuthContext, activeOrgId: string | null) {
  if (!activeOrgId) return null;
  if (!ctx.isPlatformAdmin && !ctx.orgIds.includes(activeOrgId)) {
    throw { status: 403, message: `Not a member of organization ${activeOrgId}` };
  }
  return activeOrgId;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Server-side enforceWritePermission', () => {
  const enterpriseCtx: MockAuthContext = {
    orgMemberships: [{ orgId: 'ent-1', orgType: 'ENTERPRISE' }],
    orgIds: ['ent-1'],
    isPlatformAdmin: false,
  };

  const fleetCtx: MockAuthContext = {
    orgMemberships: [{ orgId: 'fleet-1', orgType: 'FLEET_PROVIDER' }],
    orgIds: ['fleet-1'],
    isPlatformAdmin: false,
  };

  const ownerOpCtx: MockAuthContext = {
    orgMemberships: [{ orgId: 'oo-1', orgType: 'OWNER_OPERATOR' }],
    orgIds: ['oo-1'],
    isPlatformAdmin: false,
  };

  const platformCtx: MockAuthContext = {
    orgMemberships: [],
    orgIds: [],
    isPlatformAdmin: true,
  };

  it('Enterprise CANNOT write to vehicles table', () => {
    expect(() => enforceWritePermission(enterpriseCtx, 'vehicles:manage')).toThrow();
  });

  it('Enterprise CANNOT manage assets', () => {
    expect(() => enforceWritePermission(enterpriseCtx, 'assets:manage')).toThrow();
  });

  it('Enterprise CANNOT manage devices', () => {
    expect(() => enforceWritePermission(enterpriseCtx, 'devices:manage')).toThrow();
  });

  it('Enterprise CAN create jobs', () => {
    expect(() => enforceWritePermission(enterpriseCtx, 'jobs:create')).not.toThrow();
  });

  it('Owner-Operator CANNOT manage assets', () => {
    expect(() => enforceWritePermission(ownerOpCtx, 'assets:manage')).toThrow();
  });

  it('Owner-Operator CANNOT manage orgs', () => {
    expect(() => enforceWritePermission(ownerOpCtx, 'org:manage')).toThrow();
  });

  it('Owner-Operator CAN respond to offers', () => {
    expect(() => enforceWritePermission(ownerOpCtx, 'offers:respond')).not.toThrow();
  });

  it('Fleet CAN manage vehicles', () => {
    expect(() => enforceWritePermission(fleetCtx, 'vehicles:manage')).not.toThrow();
  });

  it('Platform admin bypasses all write checks', () => {
    expect(() => enforceWritePermission(platformCtx, 'vehicles:manage')).not.toThrow();
    expect(() => enforceWritePermission(platformCtx, 'assets:manage')).not.toThrow();
    expect(() => enforceWritePermission(platformCtx, 'org:manage')).not.toThrow();
  });

  it('Attempted write to non-member org is rejected', () => {
    expect(() => enforceWritePermission(fleetCtx, 'vehicles:manage', 'other-org')).toThrow();
  });
});

describe('Server-side enforceActiveOrgHeader', () => {
  const userCtx: MockAuthContext = {
    orgMemberships: [{ orgId: 'org-1', orgType: 'FLEET_PROVIDER' }],
    orgIds: ['org-1'],
    isPlatformAdmin: false,
  };

  it('Spoofed org header is rejected', () => {
    expect(() => enforceActiveOrgHeader(userCtx, 'other-org-id')).toThrow();
  });

  it('Valid org header is accepted', () => {
    expect(() => enforceActiveOrgHeader(userCtx, 'org-1')).not.toThrow();
  });

  it('Null header returns null', () => {
    expect(enforceActiveOrgHeader(userCtx, null)).toBeNull();
  });

  it('Platform admin can use any org header', () => {
    const admin: MockAuthContext = { orgMemberships: [], orgIds: [], isPlatformAdmin: true };
    expect(() => enforceActiveOrgHeader(admin, 'any-org')).not.toThrow();
  });
});

describe('Switching org context changes data scope', () => {
  it('Different org memberships produce different scopes', () => {
    const ent = [{ orgId: 'ent-1', orgName: 'E', orgType: 'ENTERPRISE', roleKeys: [] as string[], roleScope: 'ORG' }];
    const fleetM = [{ orgId: 'fl-1', orgName: 'F', orgType: 'FLEET_PROVIDER', roleKeys: [] as string[], roleScope: 'ORG' }];

    const entScope = computeOrgDataScope(ent, undefined);
    const fleetScope = computeOrgDataScope(fleetM, undefined);

    // Scopes must differ in filter field and capabilities
    expect(entScope.jobFilterField).toBe('job_owner_org_id');
    expect(fleetScope.jobFilterField).toBe('executing_org_id');
    expect(entScope.canManageAssets).toBe(false);
    expect(fleetScope.canManageAssets).toBe(true);
  });
});
