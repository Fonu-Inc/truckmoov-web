import { useMemo } from 'react';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useAuthStore } from '@/stores/authStore';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeOrgDataScope, type OrgDataScope } from '@/lib/orgPermissions';
import { filterValidUuids } from '@/lib/uuidUtils';

/**
 * Provides the computed data scope for the current user.
 * Used by useJobs, useVehicles, useDrivers etc. to filter queries.
 */
export function useOrgDataScope(): OrgDataScope & { isReady: boolean; multiStakeholderEnabled: boolean } {
  const { user } = useAuthStore();
  const orgCtx = useOrgContext();
  const { enabled: flagEnabled } = useFeatureFlag(
    'enable_multi_stakeholder_model',
    user?.tenantId
  );
  const multiStakeholderEnabled = flagEnabled;

  // For aggregators, fetch child org IDs
  const isAggregator = orgCtx.hasOrgType('AGGREGATOR');
  const aggregatorOrgIds = useMemo(
    () => orgCtx.getByOrgType('AGGREGATOR').map((m) => m.orgId),
    [orgCtx]
  );

  const { data: childOrgIds = [] } = useQuery({
    queryKey: ['aggregator-children', aggregatorOrgIds],
    queryFn: async () => {
      if (aggregatorOrgIds.length === 0) return [];
      const { data, error } = await supabase
        .from('org_relationships')
        .select('to_org_id')
        .in('from_org_id', aggregatorOrgIds)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return (data || []).map((r) => r.to_org_id);
    },
    enabled: isAggregator && aggregatorOrgIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const scope = useMemo(
    () => computeOrgDataScope(orgCtx.memberships, user?.role, childOrgIds),
    [orgCtx.memberships, user?.role, childOrgIds]
  );

  // Sanitize org IDs going into Supabase .in() filters: demo stakeholder
  // placeholders (e.g. "o0000001-...") are not real UUIDs and would 400.
  const sanitizedScope = useMemo<OrgDataScope>(() => ({
    ...scope,
    assetOrgIds: filterValidUuids(scope.assetOrgIds),
    jobFilterOrgIds: filterValidUuids(scope.jobFilterOrgIds),
  }), [scope]);

  return {
    ...sanitizedScope,
    multiStakeholderEnabled,
    isReady: !orgCtx.isLoading,
  };
}
