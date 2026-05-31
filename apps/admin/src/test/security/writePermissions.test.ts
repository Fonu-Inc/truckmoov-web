import { describe, it, expect } from 'vitest';
import { resolveRoleCapabilities, ROLE_CAPABILITIES } from '@/lib/orgPermissions';

/**
 * Tests for the write permission matrix.
 * Tests both org-type rules AND role-level restrictions.
 */

// ── Org-type rules (unchanged) ──

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

function canPerform(orgType: string, action: string): boolean {
  return WRITE_RULES[action]?.includes(orgType) ?? false;
}

// ── Org-type tests ──

describe('Write Permission Matrix - Enterprise', () => {
  const org = 'ENTERPRISE';
  it('CAN create jobs', () => expect(canPerform(org, 'jobs:create')).toBe(true));
  it('CAN create job offers', () => expect(canPerform(org, 'offers:create')).toBe(true));
  it('CAN manage relationships', () => expect(canPerform(org, 'relationships:manage')).toBe(true));
  it('CANNOT manage assets', () => {
    expect(canPerform(org, 'assets:manage')).toBe(false);
    expect(canPerform(org, 'drivers:manage')).toBe(false);
  });
  it('CANNOT execute jobs', () => expect(canPerform(org, 'jobs:execute')).toBe(false));
  it('CANNOT respond to offers', () => expect(canPerform(org, 'offers:respond')).toBe(false));
  it('CANNOT delete assets', () => expect(canPerform(org, 'assets:delete')).toBe(false));
});

describe('Write Permission Matrix - Fleet Provider', () => {
  const org = 'FLEET_PROVIDER';
  it('CAN manage assets', () => {
    expect(canPerform(org, 'assets:manage')).toBe(true);
    expect(canPerform(org, 'vehicles:manage')).toBe(true);
    expect(canPerform(org, 'drivers:manage')).toBe(true);
  });
  it('CAN create and delete jobs', () => {
    expect(canPerform(org, 'jobs:create')).toBe(true);
    expect(canPerform(org, 'jobs:delete')).toBe(true);
  });
  it('CAN execute/dispatch', () => expect(canPerform(org, 'jobs:execute')).toBe(true));
  it('CAN respond to offers', () => expect(canPerform(org, 'offers:respond')).toBe(true));
  it('CANNOT create job offers', () => expect(canPerform(org, 'offers:create')).toBe(false));
});

describe('Write Permission Matrix - Aggregator', () => {
  const org = 'AGGREGATOR';
  it('CAN manage assets', () => expect(canPerform(org, 'assets:manage')).toBe(true));
  it('CAN manage jobs', () => expect(canPerform(org, 'jobs:manage')).toBe(true));
  it('CAN manage relationships', () => expect(canPerform(org, 'relationships:manage')).toBe(true));
  it('CANNOT create jobs', () => expect(canPerform(org, 'jobs:create')).toBe(false));
  it('CANNOT delete jobs', () => expect(canPerform(org, 'jobs:delete')).toBe(false));
  it('CANNOT delete assets', () => expect(canPerform(org, 'assets:delete')).toBe(false));
});

describe('Write Permission Matrix - Owner-Operator', () => {
  const org = 'OWNER_OPERATOR';
  it('CAN respond to offers', () => expect(canPerform(org, 'offers:respond')).toBe(true));
  it('CAN update milestones', () => expect(canPerform(org, 'milestones:update')).toBe(true));
  it('CANNOT manage assets', () => {
    expect(canPerform(org, 'assets:manage')).toBe(false);
    expect(canPerform(org, 'vehicles:manage')).toBe(false);
  });
  it('CANNOT create jobs', () => expect(canPerform(org, 'jobs:create')).toBe(false));
  it('CANNOT manage relationships', () => expect(canPerform(org, 'relationships:manage')).toBe(false));
  it('CANNOT manage organizations', () => expect(canPerform(org, 'org:manage')).toBe(false));
  it('CANNOT delete anything', () => {
    expect(canPerform(org, 'assets:delete')).toBe(false);
    expect(canPerform(org, 'jobs:delete')).toBe(false);
  });
});

describe('Unknown actions denied by default', () => {
  it('Unknown action returns false for all org types', () => {
    expect(canPerform('ENTERPRISE', 'unknown:action')).toBe(false);
    expect(canPerform('FLEET_PROVIDER', 'unknown:action')).toBe(false);
    expect(canPerform('AGGREGATOR', 'unknown:action')).toBe(false);
    expect(canPerform('OWNER_OPERATOR', 'unknown:action')).toBe(false);
  });
});

// ── Role-level restriction tests ──

describe('Role Capabilities - ADMIN', () => {
  const caps = resolveRoleCapabilities(['ADMIN']);
  it('has all capabilities', () => {
    expect(caps.canCreateJobs).toBe(true);
    expect(caps.canDeleteJobs).toBe(true);
    expect(caps.canDeleteAssets).toBe(true);
    expect(caps.canManageOrgRelationships).toBe(true);
    expect(caps.canCreateSubOrgs).toBe(true);
    expect(caps.canManageFinance).toBe(true);
  });
});

describe('Role Capabilities - OPERATIONS_MANAGER', () => {
  const caps = resolveRoleCapabilities(['OPERATIONS_MANAGER']);
  it('CAN create jobs and manage assets', () => {
    expect(caps.canCreateJobs).toBe(true);
    expect(caps.canCreateAssets).toBe(true);
    expect(caps.canDispatch).toBe(true);
    expect(caps.canUpdateJobMilestones).toBe(true);
  });
  it('CANNOT delete jobs or assets', () => {
    expect(caps.canDeleteJobs).toBe(false);
    expect(caps.canDeleteAssets).toBe(false);
  });
  it('CANNOT manage org relationships or sub-orgs', () => {
    expect(caps.canManageOrgRelationships).toBe(false);
    expect(caps.canCreateSubOrgs).toBe(false);
  });
  it('CANNOT manage finance', () => {
    expect(caps.canManageFinance).toBe(false);
  });
});

describe('Role Capabilities - DISPATCHER', () => {
  const caps = resolveRoleCapabilities(['DISPATCHER']);
  it('CAN dispatch and update milestones', () => {
    expect(caps.canDispatch).toBe(true);
    expect(caps.canUpdateJobMilestones).toBe(true);
    expect(caps.canRespondToJobOffers).toBe(true);
    expect(caps.canUpdateJobs).toBe(true);
  });
  it('CANNOT create or delete anything', () => {
    expect(caps.canCreateJobs).toBe(false);
    expect(caps.canDeleteJobs).toBe(false);
    expect(caps.canCreateAssets).toBe(false);
    expect(caps.canUpdateAssets).toBe(false);
    expect(caps.canDeleteAssets).toBe(false);
    expect(caps.canCreateJobOffers).toBe(false);
  });
  it('CANNOT manage finance or org', () => {
    expect(caps.canManageFinance).toBe(false);
    expect(caps.canManageOrgRelationships).toBe(false);
  });
});

describe('Role Capabilities - FINANCE', () => {
  const caps = resolveRoleCapabilities(['FINANCE']);
  it('CAN manage finance and view analytics', () => {
    expect(caps.canManageFinance).toBe(true);
    expect(caps.canViewCrossFleetAnalytics).toBe(true);
  });
  it('CANNOT do anything operational', () => {
    expect(caps.canCreateJobs).toBe(false);
    expect(caps.canDispatch).toBe(false);
    expect(caps.canCreateAssets).toBe(false);
    expect(caps.canUpdateJobMilestones).toBe(false);
  });
});

describe('Role Capabilities - VIEWER', () => {
  const caps = resolveRoleCapabilities(['VIEWER']);
  it('CAN only view analytics', () => {
    expect(caps.canViewCrossFleetAnalytics).toBe(true);
  });
  it('CANNOT do any write operations', () => {
    expect(caps.canCreateJobs).toBe(false);
    expect(caps.canUpdateJobs).toBe(false);
    expect(caps.canDeleteJobs).toBe(false);
    expect(caps.canDispatch).toBe(false);
    expect(caps.canCreateAssets).toBe(false);
    expect(caps.canManageFinance).toBe(false);
  });
});

describe('Role Capabilities - Priority Resolution', () => {
  it('picks ADMIN when user has both ADMIN and VIEWER', () => {
    const caps = resolveRoleCapabilities(['VIEWER', 'ADMIN']);
    expect(caps.canDeleteJobs).toBe(true);
    expect(caps.canManageOrgRelationships).toBe(true);
  });

  it('picks DISPATCHER over FINANCE', () => {
    const caps = resolveRoleCapabilities(['FINANCE', 'DISPATCHER']);
    expect(caps.canDispatch).toBe(true);
    expect(caps.canManageFinance).toBe(false); // DISPATCHER doesn't have finance
  });

  it('returns all-false for empty roleKeys', () => {
    const caps = resolveRoleCapabilities([]);
    expect(caps.canCreateJobs).toBe(false);
    expect(caps.canViewCrossFleetAnalytics).toBe(false);
  });
});



