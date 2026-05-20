import { describe, it, expect } from 'vitest';
import { computeOrgDataScope } from '@/lib/orgPermissions';
import type { OrgMembership } from '@/types/orgRoles';

/**
 * Tests that validate org-scoped data isolation at the permission layer.
 * These prove that the computeOrgDataScope function returns the correct
 * filter parameters to prevent tenant-wide data leakage.
 */

function makeMembership(orgType: string, orgId: string): OrgMembership {
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

describe('Data Isolation: Enterprise cannot access assets', () => {
  const scope = computeOrgDataScope([enterprise], undefined);

  it('Enterprise has NO asset org IDs (empty array blocks vehicle/driver queries)', () => {
    expect(scope.assetOrgIds).toEqual([]);
  });

  it('Enterprise canManageAssets is false', () => {
    expect(scope.canManageAssets).toBe(false);
  });

  it('Enterprise canDispatch is false', () => {
    expect(scope.canDispatch).toBe(false);
  });

  it('Enterprise job filter is by job_owner_org_id (not executing)', () => {
    expect(scope.jobFilterField).toBe('job_owner_org_id');
    expect(scope.jobFilterOrgIds).toEqual(['ent-1']);
  });

  it('Enterprise cannot create sub-orgs', () => {
    expect(scope.canCreateSubOrgs).toBe(false);
  });
});

describe('Data Isolation: Fleet Provider sees only own assets', () => {
  const scope = computeOrgDataScope([fleet], undefined);

  it('Fleet asset filter scoped to own org ID only', () => {
    expect(scope.assetOrgIds).toEqual(['fleet-1']);
  });

  it('Fleet job filter is by executing_org_id', () => {
    expect(scope.jobFilterField).toBe('executing_org_id');
    expect(scope.jobFilterOrgIds).toEqual(['fleet-1']);
  });

  it('Fleet does NOT see other fleet org data', () => {
    expect(scope.assetOrgIds).not.toContain('fleet-2');
    expect(scope.jobFilterOrgIds).not.toContain('fleet-2');
  });
});

describe('Data Isolation: Aggregator sees only child network', () => {
  const childIds = ['child-fleet-1', 'child-fleet-2'];
  const scope = computeOrgDataScope([aggregator], undefined, childIds);

  it('Aggregator asset filter includes own + child orgs', () => {
    expect(scope.assetOrgIds).toEqual(['agg-1', 'child-fleet-1', 'child-fleet-2']);
  });

  it('Aggregator job filter includes own + child orgs', () => {
    expect(scope.jobFilterOrgIds).toEqual(['agg-1', 'child-fleet-1', 'child-fleet-2']);
  });

  it('Aggregator does NOT see unrelated org data', () => {
    expect(scope.assetOrgIds).not.toContain('unrelated-org');
    expect(scope.jobFilterOrgIds).not.toContain('unrelated-org');
  });

  it('Aggregator can create sub-orgs', () => {
    expect(scope.canCreateSubOrgs).toBe(true);
  });
});

describe('Data Isolation: Owner-Operator sees only own data', () => {
  const scope = computeOrgDataScope([ownerOp], undefined);

  it('Owner-Operator asset filter scoped to own org only', () => {
    expect(scope.assetOrgIds).toEqual(['oo-1']);
  });

  it('Owner-Operator job filter scoped to own org only', () => {
    expect(scope.jobFilterOrgIds).toEqual(['oo-1']);
  });

  it('Owner-Operator CANNOT manage assets', () => {
    expect(scope.canManageAssets).toBe(false);
  });

  it('Owner-Operator CANNOT create jobs', () => {
    expect(scope.canCreateJobs).toBe(false);
  });

  it('Owner-Operator CANNOT dispatch', () => {
    expect(scope.canDispatch).toBe(false);
  });

  it('Owner-Operator CANNOT view cross-fleet analytics', () => {
    expect(scope.canViewCrossFleetAnalytics).toBe(false);
  });
});

describe('Data Isolation: Platform admin has unrestricted access', () => {
  const scope = computeOrgDataScope([], 'platform_admin');

  it('Platform admin has empty asset filter (meaning no restriction)', () => {
    expect(scope.assetOrgIds).toEqual([]);
  });

  it('Platform admin can manage assets', () => {
    expect(scope.canManageAssets).toBe(true);
  });

  it('Platform admin can dispatch', () => {
    expect(scope.canDispatch).toBe(true);
  });

  it('Platform admin can view cross-fleet analytics', () => {
    expect(scope.canViewCrossFleetAnalytics).toBe(true);
  });
});

describe('Data Isolation: No stakeholder gets tenant-wide unfiltered access', () => {
  const allStakeholders = [enterprise, fleet, aggregator, ownerOp];

  for (const m of allStakeholders) {
    it(`${m.orgType} has non-empty job filter`, () => {
      const scope = computeOrgDataScope([m], undefined);
      expect(scope.jobFilterField).not.toBeNull();
      expect(scope.jobFilterOrgIds.length).toBeGreaterThan(0);
    });

    it(`${m.orgType} has non-empty asset filter OR no asset permission`, () => {
      const scope = computeOrgDataScope([m], undefined);
      const hasAssetFilter = scope.assetOrgIds.length > 0 || !scope.canManageAssets;
      expect(hasAssetFilter).toBe(true);
    });
  }
});

describe('Cross-org data leakage prevention', () => {
  it('Enterprise CANNOT see Fleet vehicles (assetOrgIds is empty)', () => {
    const scope = computeOrgDataScope([enterprise], undefined);
    expect(scope.assetOrgIds).not.toContain('fleet-1');
    expect(scope.assetOrgIds).toHaveLength(0);
  });

  it('Fleet CANNOT see Enterprise jobs (different filter field)', () => {
    const fleetScope = computeOrgDataScope([fleet], undefined);
    const entScope = computeOrgDataScope([enterprise], undefined);
    // Fleet filters by executing_org_id, Enterprise by job_owner_org_id
    expect(fleetScope.jobFilterField).toBe('executing_org_id');
    expect(entScope.jobFilterField).toBe('job_owner_org_id');
    // Neither includes the other's org ID
    expect(fleetScope.jobFilterOrgIds).not.toContain('ent-1');
    expect(entScope.jobFilterOrgIds).not.toContain('fleet-1');
  });

  it('Owner-Operator CANNOT see Aggregator child data', () => {
    const scope = computeOrgDataScope([ownerOp], undefined);
    expect(scope.assetOrgIds).not.toContain('agg-1');
    expect(scope.jobFilterOrgIds).not.toContain('agg-1');
  });

  it('Aggregator without children sees only own data', () => {
    const scope = computeOrgDataScope([aggregator], undefined, []);
    expect(scope.assetOrgIds).toEqual(['agg-1']);
    expect(scope.jobFilterOrgIds).toEqual(['agg-1']);
  });
});
