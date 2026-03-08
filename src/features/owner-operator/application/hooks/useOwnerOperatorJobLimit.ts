import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { ORG_TYPES } from '@/types/orgRoles';

/**
 * Checks whether an Owner-Operator org has capacity for new jobs.
 * Returns eligibility status and active job count.
 */
export function useOwnerOperatorJobLimit() {
  const { memberships } = useOrgContext();

  const ooOrg = memberships.find(m => m.orgType === ORG_TYPES.OWNER_OPERATOR);

  const { data, isLoading } = useQuery({
    queryKey: ['oo-job-limit', ooOrg?.orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_owner_operator_active_job_limit', {
        p_org_id: ooOrg!.orgId,
      });
      if (error) throw error;
      return data as { eligible: boolean; active_jobs: number; max_active_jobs: number; reason?: string };
    },
    enabled: !!ooOrg?.orgId,
    staleTime: 30_000,
  });

  return {
    isOwnerOperator: !!ooOrg,
    eligible: data?.eligible ?? true,
    activeJobs: data?.active_jobs ?? 0,
    maxActiveJobs: data?.max_active_jobs ?? 1,
    reason: data?.reason,
    isLoading,
    orgId: ooOrg?.orgId,
  };
}
