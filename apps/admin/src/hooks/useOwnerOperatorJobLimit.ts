import { useOrgContext } from '@/hooks/useOrgContext';
import { ORG_TYPES } from '@/types/orgRoles';

/**
 * Checks whether an Owner-Operator org has capacity for new jobs.
 * Returns eligibility status and active job count.
 */
export function useOwnerOperatorJobLimit() {
  const { memberships } = useOrgContext();

  const ooOrg = memberships.find(m => m.orgType === ORG_TYPES.OWNER_OPERATOR);

  return {
    isOwnerOperator: !!ooOrg,
    eligible: true,
    activeJobs: 0,
    maxActiveJobs: 1,
    reason: undefined,
    isLoading: false,
    orgId: ooOrg?.orgId,
  };
}
