/**
 * Centralized write permission hook based on org type + role.
 * Provides boolean flags that hooks and UI components use to gate mutations.
 *
 * In multi-stakeholder mode the final permission = orgType-allows AND roleKey-allows.
 */
import { useMemo } from 'react';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useAuthStore, readDemoStakeholder } from '@/stores/authStore';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { resolveRoleCapabilities } from '@/lib/orgPermissions';

export interface WritePermissions {
  // Jobs
  canCreateJobs: boolean;
  canUpdateJobs: boolean;
  canDeleteJobs: boolean;
  canDispatch: boolean;

  // Fleet assets (vehicles, drivers, devices)
  canCreateAssets: boolean;
  canUpdateAssets: boolean;
  canDeleteAssets: boolean;

  // Job offers
  canCreateJobOffers: boolean;
  canRespondToJobOffers: boolean;

  // Org management
  canManageOrgRelationships: boolean;
  canCreateSubOrgs: boolean;

  // Compliance
  canManageCompliance: boolean;

  // Milestone updates (Owner-Operator)
  canUpdateJobMilestones: boolean;

  // Cross-fleet analytics
  canViewCrossFleetAnalytics: boolean;

  // Finance
  canManageFinance: boolean;
}

export function useWritePermissions(): WritePermissions {
  const { user } = useAuthStore();
  const orgCtx = useOrgContext();
  const { enabled: flagEnabled } = useFeatureFlag(
    'enable_multi_stakeholder_model',
    user?.tenantId
  );
  const demoStakeholder = readDemoStakeholder();
  const multiStakeholderEnabled = flagEnabled || !!demoStakeholder;

  return useMemo(() => {
    const isPlatformAdmin = user?.role === 'platform_admin';
    if (isPlatformAdmin) {
      return {
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
    }

    // Multi-stakeholder is now always active; no legacy fallback.

    // ── Multi-stakeholder mode: intersect orgType × roleKey ──
    const isEnterprise = orgCtx.hasOrgType('ENTERPRISE');
    const isFleetProvider = orgCtx.hasOrgType('FLEET_PROVIDER');
    const isAggregator = orgCtx.hasOrgType('AGGREGATOR');
    const isOwnerOperator = orgCtx.hasOrgType('OWNER_OPERATOR');

    // Org-type ceiling (what the org type allows at most)
    const orgTypeCeiling: WritePermissions = {
      canCreateJobs: isEnterprise || isFleetProvider,
      canUpdateJobs: isEnterprise || isFleetProvider || isAggregator,
      canDeleteJobs: isEnterprise || isFleetProvider,
      canDispatch: isFleetProvider || isAggregator,
      canCreateAssets: isFleetProvider || isAggregator,
      canUpdateAssets: isFleetProvider || isAggregator,
      canDeleteAssets: isFleetProvider,
      canCreateJobOffers: isEnterprise,
      canRespondToJobOffers: isFleetProvider || isAggregator || isOwnerOperator,
      canManageOrgRelationships: isEnterprise || isAggregator,
      canCreateSubOrgs: isAggregator,
      canManageCompliance: isFleetProvider || isAggregator || isOwnerOperator,
      canUpdateJobMilestones: isFleetProvider || isAggregator || isOwnerOperator,
      canViewCrossFleetAnalytics: isEnterprise || isAggregator,
      canManageFinance: isEnterprise || isFleetProvider || isAggregator,
    };

    // Resolve highest-privilege role the user holds
    const activeRoleKeys = orgCtx.memberships.flatMap((m) => m.roleKeys);
    const roleCap = resolveRoleCapabilities(activeRoleKeys);

    // Final = orgType-allows AND role-allows
    return {
      canCreateJobs: orgTypeCeiling.canCreateJobs && roleCap.canCreateJobs,
      canUpdateJobs: orgTypeCeiling.canUpdateJobs && roleCap.canUpdateJobs,
      canDeleteJobs: orgTypeCeiling.canDeleteJobs && roleCap.canDeleteJobs,
      canDispatch: orgTypeCeiling.canDispatch && roleCap.canDispatch,
      canCreateAssets: orgTypeCeiling.canCreateAssets && roleCap.canCreateAssets,
      canUpdateAssets: orgTypeCeiling.canUpdateAssets && roleCap.canUpdateAssets,
      canDeleteAssets: orgTypeCeiling.canDeleteAssets && roleCap.canDeleteAssets,
      canCreateJobOffers: orgTypeCeiling.canCreateJobOffers && roleCap.canCreateJobOffers,
      canRespondToJobOffers: orgTypeCeiling.canRespondToJobOffers && roleCap.canRespondToJobOffers,
      canManageOrgRelationships: orgTypeCeiling.canManageOrgRelationships && roleCap.canManageOrgRelationships,
      canCreateSubOrgs: orgTypeCeiling.canCreateSubOrgs && roleCap.canCreateSubOrgs,
      canManageCompliance: orgTypeCeiling.canManageCompliance && roleCap.canManageCompliance,
      canUpdateJobMilestones: orgTypeCeiling.canUpdateJobMilestones && roleCap.canUpdateJobMilestones,
      canViewCrossFleetAnalytics: orgTypeCeiling.canViewCrossFleetAnalytics && roleCap.canViewCrossFleetAnalytics,
      canManageFinance: orgTypeCeiling.canManageFinance && roleCap.canManageFinance,
    };
  }, [user?.role, multiStakeholderEnabled, orgCtx]);
}
