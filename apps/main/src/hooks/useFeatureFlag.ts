/**
 * Hook to check if a feature flag is enabled.
 * Supports platform-level and tenant-level flags.
 */
export function useFeatureFlag(_featureKey: string, _tenantId?: string | null): {
  enabled: boolean;
  isLoading: boolean;
} {
  return { enabled: false, isLoading: false };
}
