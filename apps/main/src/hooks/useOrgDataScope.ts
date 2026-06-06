import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { computeOrgDataScope, type OrgDataScope } from '@/lib/orgPermissions';
import { filterValidUuids } from '@/lib/uuidUtils';

/**
 * Provides the computed data scope for the current user.
 * Used by useJobs, useVehicles, useDrivers etc. to filter queries.
 */
export function useOrgDataScope(): OrgDataScope & { isReady: boolean; multiStakeholderEnabled: boolean } {
  const { user } = useAuthStore();
  const orgCtx = { memberships: [], orgIds: [], isLoading: false, hasOrgRole: () => false };
  const multiStakeholderEnabled = false;

  const childOrgIds: string[] = [];

  const scope = useMemo(
    () => computeOrgDataScope(orgCtx.memberships, user?.role, childOrgIds),
    [orgCtx.memberships, user?.role]
  );

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
