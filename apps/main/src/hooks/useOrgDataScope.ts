export interface OrgDataScope {
  assetOrgIds: string[];
  jobFilterOrgIds: string[];
}

export function useOrgDataScope(): OrgDataScope & { isReady: boolean; multiStakeholderEnabled: boolean } {
  return {
    assetOrgIds: [],
    jobFilterOrgIds: [],
    isReady: true,
    multiStakeholderEnabled: false,
  };
}
