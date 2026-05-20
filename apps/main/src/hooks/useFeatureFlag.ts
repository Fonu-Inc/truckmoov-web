import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if a feature flag is enabled.
 * Supports platform-level and tenant-level flags.
 */
export function useFeatureFlag(featureKey: string, tenantId?: string | null): {
  enabled: boolean;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag', featureKey, tenantId],
    queryFn: async () => {
      // Check platform-level flag first
      let query = supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('feature_key', featureKey)
        .eq('scope', 'platform')
        .is('tenant_id', null)
        .maybeSingle();

      const { data: platformFlag } = await query;
      if (platformFlag?.is_enabled) return true;

      // Check tenant-level override if tenant provided
      if (tenantId) {
        const { data: tenantFlag } = await supabase
          .from('feature_flags')
          .select('is_enabled')
          .eq('feature_key', featureKey)
          .eq('scope', 'tenant')
          .eq('tenant_id', tenantId)
          .maybeSingle();
        if (tenantFlag?.is_enabled) return true;
      }

      return false;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { enabled: data ?? false, isLoading };
}
