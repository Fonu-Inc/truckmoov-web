import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useVehicles } from './useVehicles';
import { useDrivers } from './useDrivers';

export interface TenantPlan {
  id: string;
  name: string;
  tier: string | null;
  price_ngn: number;
  billing_cycle: string;
  max_vehicles: number | null;
  max_drivers: number | null;
  max_devices: number | null;
  storage_gb: number | null;
  features: string[];
  is_popular: boolean;
  trial_days: number;
  yearly_discount_percent: number;
  tier_badge_color: string;
}

export interface PlanFeature {
  feature_key: string;
  feature_name: string;
  feature_description: string | null;
  feature_category: string;
  is_included: boolean;
  usage_limit: number | null;
  applicable_org_type: string | null;
}

export interface UsageStats {
  vehicles: { current: number; limit: number | null; percentage: number };
  drivers: { current: number; limit: number | null; percentage: number };
  devices: { current: number; limit: number | null; percentage: number };
  sims: { current: number; limit: number | null; percentage: number };
}

export function useTenantSubscription() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();

  // Fetch tenant info to get their plan name
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant-info', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, plan, status')
        .eq('id', tenantId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Fetch matching subscription plan from database
  const { data: currentPlan, isLoading: planLoading } = useQuery({
    queryKey: ['subscription-plan', tenant?.plan],
    queryFn: async () => {
      if (!tenant?.plan) return null;
      
      // Try to match by plan name (case-insensitive)
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .ilike('name', tenant.plan)
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        // Fallback: try to find by tier
        const { data: tierMatch } = await supabase
          .from('subscription_plans')
          .select('*')
          .ilike('tier', tenant.plan)
          .eq('is_active', true)
          .single();
        
        return tierMatch as TenantPlan | null;
      }
      
      return data as TenantPlan;
    },
    enabled: !!tenant?.plan,
  });

  // Fetch plan features
  const { data: planFeatures, isLoading: featuresLoading } = useQuery({
    queryKey: ['plan-features', currentPlan?.id],
    queryFn: async () => {
      if (!currentPlan?.id) return [];
      
      const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .eq('plan_id', currentPlan.id)
        .order('feature_category', { ascending: true });
      
      if (error) throw error;
      return data as PlanFeature[];
    },
    enabled: !!currentPlan?.id,
  });

  // Fetch all available plans for upgrade options
  const { data: availablePlans } = useQuery({
    queryKey: ['available-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as TenantPlan[];
    },
  });

  // Count current devices
  const { data: deviceCount } = useQuery({
    queryKey: ['device-count', tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const { count, error } = await supabase
        .from('devices')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!tenantId,
  });

  // Count current SIMs + read tenant sim_quota
  const { data: simData } = useQuery({
    queryKey: ['sim-usage', tenantId],
    queryFn: async () => {
      if (!tenantId) return { count: 0, quota: null as number | null };
      const [{ count }, { data: tRow }] = await Promise.all([
        supabase.from('iot_sims').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('tenants').select('sim_quota').eq('id', tenantId).single(),
      ]);
      return { count: count || 0, quota: (tRow as { sim_quota?: number } | null)?.sim_quota ?? null };
    },
    enabled: !!tenantId,
  });

  // Calculate usage stats
  const simLimit = simData?.quota ?? null;
  const simCurrent = simData?.count ?? 0;
  const usageStats: UsageStats = {
    vehicles: {
      current: vehicles.length,
      limit: currentPlan?.max_vehicles || null,
      percentage: currentPlan?.max_vehicles 
        ? Math.min(100, (vehicles.length / currentPlan.max_vehicles) * 100)
        : 0,
    },
    drivers: {
      current: drivers.length,
      limit: currentPlan?.max_drivers || null,
      percentage: currentPlan?.max_drivers
        ? Math.min(100, (drivers.length / currentPlan.max_drivers) * 100)
        : 0,
    },
    devices: {
      current: deviceCount || 0,
      limit: currentPlan?.max_devices || null,
      percentage: currentPlan?.max_devices
        ? Math.min(100, ((deviceCount || 0) / currentPlan.max_devices) * 100)
        : 0,
    },
    sims: {
      current: simCurrent,
      limit: simLimit,
      percentage: simLimit ? Math.min(100, (simCurrent / simLimit) * 100) : 0,
    },
  };

  // Check if a feature is available
  const hasFeature = (featureKey: string): boolean => {
    if (!planFeatures) return false;
    const feature = planFeatures.find(f => f.feature_key === featureKey);
    return feature?.is_included || false;
  };

  // Get feature usage limit
  const getFeatureLimit = (featureKey: string): number | null => {
    if (!planFeatures) return null;
    const feature = planFeatures.find(f => f.feature_key === featureKey);
    return feature?.usage_limit || null;
  };

  // Check if approaching or at limits
  const isApproachingLimit = (type: 'vehicles' | 'drivers' | 'devices' | 'sims'): boolean => {
    const stats = usageStats[type];
    return stats.limit !== null && stats.percentage >= 80;
  };

  const isAtLimit = (type: 'vehicles' | 'drivers' | 'devices' | 'sims'): boolean => {
    const stats = usageStats[type];
    return stats.limit !== null && stats.current >= stats.limit;
  };

  // Get upgrade options (plans higher than current)
  const upgradeOptions = availablePlans?.filter(plan => {
    if (!currentPlan) return true;
    return plan.price_ngn > currentPlan.price_ngn;
  }) || [];

  // Get downgrade options (plans lower than current)
  const downgradeOptions = availablePlans?.filter(plan => {
    if (!currentPlan) return false;
    return plan.price_ngn < currentPlan.price_ngn;
  }) || [];

  return {
    tenant,
    currentPlan,
    planFeatures,
    usageStats,
    availablePlans,
    upgradeOptions,
    downgradeOptions,
    isLoading: tenantLoading || planLoading || featuresLoading,
    hasFeature,
    getFeatureLimit,
    isApproachingLimit,
    isAtLimit,
  };
}



