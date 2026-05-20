import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

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
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: featureFlags, isLoading, error, refetch } = useQuery({
    queryKey: ['feature-flags', user?.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('category', { ascending: true })
        .order('feature_name', { ascending: true });

      if (error) throw error;
      return data as FeatureFlag[];
    },
  });

  const toggleFeatureFlag = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .update({ 
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success(`Feature ${data.is_enabled ? 'enabled' : 'disabled'}`, {
        description: data.feature_name,
      });
    },
    onError: (error) => {
      toast.error('Failed to update feature flag', {
        description: error.message,
      });
    },
  });

  const isFeatureEnabled = (featureKey: string) => {
    const flag = featureFlags?.find(f => f.feature_key === featureKey);
    if (!flag) return false;
    
    // Check platform-level flag first
    if (flag.scope === 'platform') {
      return flag.is_enabled;
    }
    
    // For tenant-scoped flags, check if tenant matches
    if (flag.scope === 'tenant' && flag.tenant_id === user?.tenantId) {
      return flag.is_enabled;
    }
    
    return false;
  };

  const getPhase3Features = () => {
    return featureFlags?.filter(f => f.phase === 'phase_3') || [];
  };

  const getFeaturesByCategory = (category: string) => {
    return featureFlags?.filter(f => f.category === category) || [];
  };

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
