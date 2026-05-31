import { describe, it, expect } from 'vitest';
import {
  canAccessRoute,
  computeOrgDataScope,
  isModuleVisible,
  isSharedRoute,
  resolveOrgHomeRoute,
} from '@/lib/orgPermissions';
import type { OrgMembership } from '@/types/orgRoles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMembership(orgType: string, orgId = 'org-1'): OrgMembership {
  return {
    orgId,
    orgName: `Test ${orgType}`,
    orgType,
    roleKeys: ['ADMIN'],
    roleScope: 'ORG',
  };
}

const enterprise = makeMembership('ENTERPRISE', 'ent-1');
const fleet = makeMembership('FLEET_PROVIDER', 'fleet-1');
const aggregator = makeMembership('AGGREGATOR', 'agg-1');
const ownerOp = makeMembership('OWNER_OPERATOR', 'oo-1');

// ─── Route Access Tests ───────────────────────────────────────────────────────

describe('Route Access (canAccessRoute)', () => {
  const ms = true; // multi-stakeholder enabled

  it('Enterprise Admin CAN access /enterprise', () => {
    expect(canAccessRoute('/enterprise', [enterprise], undefined, ms)).toBe(true);
  });

  it('Enterprise Admin CAN access /admin (shared modules like jobs, settings)', () => {
    expect(canAccessRoute('/admin', [enterprise], undefined, ms)).toBe(true);
  });

  it('Enterprise Admin CANNOT access /supervisor', () => {
    expect(canAccessRoute('/supervisor', [enterprise], undefined, ms)).toBe(false);
  });

  it('Enterprise Admin CANNOT access /aggregator', () => {
    expect(canAccessRoute('/aggregator', [enterprise], undefined, ms)).toBe(false);
  });

  it('Enterprise Admin CANNOT access /owner-operator', () => {
    expect(canAccessRoute('/owner-operator', [enterprise], undefined, ms)).toBe(false);
  });

  it('Fleet Admin CAN access /admin', () => {
    expect(canAccessRoute('/admin', [fleet], undefined, ms)).toBe(true);
  });

  it('Fleet Admin CANNOT access /enterprise', () => {
    expect(canAccessRoute('/enterprise', [fleet], undefined, ms)).toBe(false);
  });

  it('Fleet Admin CANNOT access /aggregator', () => {
    expect(canAccessRoute('/aggregator', [fleet], undefined, ms)).toBe(false);
  });

  it('Aggregator Admin CAN access /aggregator', () => {
    expect(canAccessRoute('/aggregator', [aggregator], undefined, ms)).toBe(true);
  });

  it('Aggregator Admin CAN access /admin (fleet view)', () => {
    expect(canAccessRoute('/admin', [aggregator], undefined, ms)).toBe(true);
  });

  it('Aggregator Admin CANNOT access /enterprise', () => {
    expect(canAccessRoute('/enterprise', [aggregator], undefined, ms)).toBe(false);
  });

  it('Owner-Operator CAN access /owner-operator', () => {
    expect(canAccessRoute('/owner-operator', [ownerOp], undefined, ms)).toBe(true);
  });

  it('Owner-Operator CAN access /admin (shared modules like jobs, wallet)', () => {
    expect(canAccessRoute('/admin', [ownerOp], undefined, ms)).toBe(true);
  });

  it('Owner-Operator CANNOT access /enterprise', () => {
    expect(canAccessRoute('/enterprise', [ownerOp], undefined, ms)).toBe(false);
  });

  it('Owner-Operator CANNOT access /', () => {
    expect(canAccessRoute('/', [ownerOp], undefined, ms)).toBe(false);
  });

  it('Platform admin CAN access all routes', () => {
    expect(canAccessRoute('/enterprise', [], 'platform_admin', ms)).toBe(true);
    expect(canAccessRoute('/admin', [], 'platform_admin', ms)).toBe(true);
    expect(canAccessRoute('/', [], 'platform_admin', ms)).toBe(true);
    expect(canAccessRoute('/aggregator', [], 'platform_admin', ms)).toBe(true);
    expect(canAccessRoute('/owner-operator', [], 'platform_admin', ms)).toBe(true);
  });

  it('Direct URL to / returns false for non-platform-admin', () => {
    expect(canAccessRoute('/', [enterprise], undefined, ms)).toBe(false);
    expect(canAccessRoute('/', [fleet], undefined, ms)).toBe(false);
    expect(canAccessRoute('/', [ownerOp], undefined, ms)).toBe(false);
  });
});

// ─── Acceptance Tests (Direct URL manipulation) ──────────────────────────────

describe('Acceptance Tests: Direct URL blocking', () => {
  const ms = true;

  it('Enterprise user CAN access /admin/fleet (shared route)', () => {
    // Enterprise accesses /admin/* for shared modules; data isolation is enforced at the scope level
    expect(canAccessRoute('/admin/fleet/vehicles', [enterprise], undefined, ms)).toBe(true);
  });

  it('Fleet user hitting /enterprise/providers is blocked', () => {
    expect(canAccessRoute('/enterprise/providers', [fleet], undefined, ms)).toBe(false);
  });

  it('Owner-operator CAN access /admin/jobs (shared route)', () => {
    // Owner-operator accesses /admin/* for shared modules; data isolation is enforced at the scope level
    expect(canAccessRoute('/admin/jobs', [ownerOp], undefined, ms)).toBe(true);
  });

  it('Owner-operator hitting /supervisor/dispatch is blocked', () => {
    expect(canAccessRoute('/supervisor/dispatch', [ownerOp], undefined, ms)).toBe(false);
  });

  it('Enterprise user hitting /supervisor is blocked', () => {
    expect(canAccessRoute('/supervisor', [enterprise], undefined, ms)).toBe(false);
  });

  it('Aggregator hitting /enterprise is blocked', () => {
    expect(canAccessRoute('/enterprise', [aggregator], undefined, ms)).toBe(false);
  });

  it('Fleet user hitting /owner-operator is blocked', () => {
    expect(canAccessRoute('/owner-operator', [fleet], undefined, ms)).toBe(false);
  });

  it('Guards apply to deeply nested routes', () => {
    expect(canAccessRoute('/enterprise/settings/profile', [fleet], undefined, ms)).toBe(false);
    // Enterprise CAN access /admin/* (shared modules); data isolation enforced at scope level
    expect(canAccessRoute('/admin/fleet/vehicles/123', [enterprise], undefined, ms)).toBe(true);
    expect(canAccessRoute('/tenants/abc', [ownerOp], undefined, ms)).toBe(false);
  });
});

// ─── Shared Routes Tests ─────────────────────────────────────────────────────

describe('Shared Routes', () => {
  const ms = true;

  it('/help is accessible by all org types', () => {
    expect(canAccessRoute('/help', [enterprise], undefined, ms)).toBe(true);
    expect(canAccessRoute('/help', [fleet], undefined, ms)).toBe(true);
    expect(canAccessRoute('/help', [ownerOp], undefined, ms)).toBe(true);
    expect(canAccessRoute('/help', [aggregator], undefined, ms)).toBe(true);
  });

  it('/not-authorized is accessible by all', () => {
    expect(canAccessRoute('/not-authorized', [enterprise], undefined, ms)).toBe(true);
  });

  it('isSharedRoute correctly identifies shared routes', () => {
    expect(isSharedRoute('/help')).toBe(true);
    expect(isSharedRoute('/help/tickets')).toBe(true);
    expect(isSharedRoute('/not-authorized')).toBe(true);
    expect(isSharedRoute('/admin')).toBe(false);
    expect(isSharedRoute('/enterprise')).toBe(false);
  });
});

// ─── Org Home Route Resolution ───────────────────────────────────────────────

describe('resolveOrgHomeRoute', () => {
  const ms = true;

  it('Enterprise resolves to /enterprise', () => {
    expect(resolveOrgHomeRoute([enterprise], undefined, ms)).toBe('/enterprise');
  });

  it('Fleet resolves to /admin', () => {
    expect(resolveOrgHomeRoute([fleet], undefined, ms)).toBe('/admin');
  });

  it('Aggregator resolves to /aggregator', () => {
    expect(resolveOrgHomeRoute([aggregator], undefined, ms)).toBe('/aggregator');
  });

  it('Owner-Operator resolves to /owner-operator', () => {
    expect(resolveOrgHomeRoute([ownerOp], undefined, ms)).toBe('/owner-operator');
  });

  it('Platform admin resolves to /', () => {
    expect(resolveOrgHomeRoute([], 'platform_admin', ms)).toBe('/');
  });
});

// ─── Data Scope Tests ─────────────────────────────────────────────────────────

describe('Data Scope (computeOrgDataScope)', () => {
  it('Enterprise sees only jobs where job_owner_org_id matches', () => {
    const scope = computeOrgDataScope([enterprise], undefined);
    expect(scope.jobFilterField).toBe('job_owner_org_id');
    expect(scope.jobFilterOrgIds).toEqual(['ent-1']);
  });

  it('Enterprise CANNOT manage assets', () => {
    const scope = computeOrgDataScope([enterprise], undefined);
    expect(scope.canManageAssets).toBe(false);
    expect(scope.assetOrgIds).toEqual([]);
  });

  it('Enterprise CANNOT dispatch', () => {
    const scope = computeOrgDataScope([enterprise], undefined);
    expect(scope.canDispatch).toBe(false);
  });

  it('Fleet Admin sees only executing_org jobs + owned assets', () => {
    const scope = computeOrgDataScope([fleet], undefined);
    expect(scope.jobFilterField).toBe('executing_org_id');
    expect(scope.jobFilterOrgIds).toEqual(['fleet-1']);
    expect(scope.assetOrgIds).toEqual(['fleet-1']);
    expect(scope.canManageAssets).toBe(true);
  });

  it('Aggregator sees child org assets and jobs', () => {
    const childIds = ['child-1', 'child-2'];
    const scope = computeOrgDataScope([aggregator], undefined, childIds);
    expect(scope.assetOrgIds).toEqual(['agg-1', 'child-1', 'child-2']);
    expect(scope.jobFilterOrgIds).toEqual(['agg-1', 'child-1', 'child-2']);
  });

  it('Owner-Operator sees only own org data', () => {
    const scope = computeOrgDataScope([ownerOp], undefined);
    expect(scope.assetOrgIds).toEqual(['oo-1']);
    expect(scope.jobFilterOrgIds).toEqual(['oo-1']);
    expect(scope.canManageAssets).toBe(false);
    expect(scope.canCreateJobs).toBe(false);
    expect(scope.canDispatch).toBe(false);
    expect(scope.canCreateSubOrgs).toBe(false);
    expect(scope.canViewCrossFleetAnalytics).toBe(false);
  });

  it('Platform admin has unrestricted scope (no org filters)', () => {
    const scope = computeOrgDataScope([], 'platform_admin');
    expect(scope.canManageAssets).toBe(true);
    expect(scope.canCreateJobs).toBe(true);
    expect(scope.canDispatch).toBe(true);
    expect(scope.canViewCrossFleetAnalytics).toBe(true);
  });

  it('No endpoint returns tenant-wide data without filters for non-admin', () => {
    for (const m of [enterprise, fleet, aggregator, ownerOp]) {
      const scope = computeOrgDataScope([m], undefined);
      const hasJobFilter = scope.jobFilterField !== null && scope.jobFilterOrgIds.length > 0;
      const hasAssetFilter = scope.assetOrgIds.length > 0 || !scope.canManageAssets;
      expect(hasJobFilter).toBe(true);
      expect(hasAssetFilter).toBe(true);
    }
  });
});

// ─── Module Visibility Tests ──────────────────────────────────────────────────

describe('Module Visibility', () => {
  it('Enterprise CANNOT see fleet_management module', () => {
    expect(isModuleVisible('ENTERPRISE', 'fleet_management')).toBe(false);
  });

  it('Enterprise CANNOT see device_management module', () => {
    expect(isModuleVisible('ENTERPRISE', 'device_management')).toBe(false);
  });

  it('Enterprise CAN see jobs and analytics', () => {
    expect(isModuleVisible('ENTERPRISE', 'jobs')).toBe(true);
    expect(isModuleVisible('ENTERPRISE', 'analytics')).toBe(true);
  });

  it('Owner-Operator CANNOT see fleet_management', () => {
    expect(isModuleVisible('OWNER_OPERATOR', 'fleet_management')).toBe(false);
  });

  it('Owner-Operator CANNOT see dispatch or analytics', () => {
    expect(isModuleVisible('OWNER_OPERATOR', 'dispatch')).toBe(false);
    expect(isModuleVisible('OWNER_OPERATOR', 'analytics')).toBe(false);
  });

  it('Owner-Operator CAN see job_offers', () => {
    expect(isModuleVisible('OWNER_OPERATOR', 'job_offers')).toBe(true);
  });

  it('Fleet Provider CAN see all modules', () => {
    expect(isModuleVisible('FLEET_PROVIDER', 'fleet_management')).toBe(true);
    expect(isModuleVisible('FLEET_PROVIDER', 'dispatch')).toBe(true);
    expect(isModuleVisible('FLEET_PROVIDER', 'device_management')).toBe(true);
    expect(isModuleVisible('FLEET_PROVIDER', 'analytics')).toBe(true);
  });
});



