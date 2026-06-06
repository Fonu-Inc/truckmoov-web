export interface FeatureFlag {
  id: string;
  scope: 'platform' | 'tenant';
  tenant_id: string | null;
  feature_key: string;
  feature_name: string;
  feature_description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  category: string;
  phase: string | null;
  created_at: string;
  updated_at: string;
}

export function useFeatureFlags() {
  const featureFlags: FeatureFlag[] = [];
  const isLoading = false;
  const error = null;
  const refetch = () => {};

  const toggleFeatureFlag = {
    mutate: async (_variables: { id: string; isEnabled: boolean }) => {},
    mutateAsync: async (_variables: { id: string; isEnabled: boolean }) => {},
    isPending: false,
  };

  const isFeatureEnabled = (_featureKey: string) => false;
  const getPhase3Features = () => [] as FeatureFlag[];
  const getFeaturesByCategory = (_category: string) => [] as FeatureFlag[];

  return {
    featureFlags,
    isLoading,
    error,
    refetch,
    toggleFeatureFlag,
    isFeatureEnabled,
    getPhase3Features,
    getFeaturesByCategory,
  };
}
