import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  feature_name: string;
  feature_description: string | null;
  feature_category: string;
  is_included: boolean;
  usage_limit: number | null;
  applicable_org_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_ngn: number;
  billing_cycle: string;
  billing_mode: 'prepaid' | 'postpaid';
  max_vehicles: number | null;
  max_drivers: number | null;
  max_devices: number | null;
  max_sims: number | null;
  max_users: number | null;
  storage_gb: number | null;
  features: string[];
  is_active: boolean;
  tier: string | null;
  display_order: number;
  tier_badge_color: string;
  is_popular: boolean;
  trial_days: number;
  yearly_discount_percent: number;
  applicable_org_types: string[];
  plan_key: string | null;
  badge_text: string | null;
  badge_style: string | null;
  cta_type: string | null;
  cta_label: string | null;
  pricing_display_mode: string | null;
  custom_price_text: string | null;
  entitlements: Record<string, any> | null;
  footer_helper_template: string | null;
  yearly_price_ngn: number;
  metric_limit: number | null;
  metric_line_template: string | null;
  created_at: string;
  updated_at: string;
  plan_features?: PlanFeature[];
}

export function useSubscriptionPlans() {
  const queryClient = useQueryClient();

  const { data: plans, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const { data: planFeatures, isLoading: featuresLoading } = useQuery({
    queryKey: ['plan-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .order('feature_category', { ascending: true })
        .order('feature_name', { ascending: true });

      if (error) throw error;
      return data as PlanFeature[];
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SubscriptionPlan> }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plan updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update plan', { description: error.message });
    },
  });

  const updatePlanFeature = useMutation({
    mutationFn: async ({ 
      planId, 
      featureKey, 
      isIncluded, 
      usageLimit 
    }: { 
      planId: string; 
      featureKey: string; 
      isIncluded: boolean; 
      usageLimit?: number | null;
    }) => {
      const { data, error } = await supabase
        .from('plan_features')
        .update({ 
          is_included: isIncluded, 
          usage_limit: usageLimit,
          updated_at: new Date().toISOString() 
        })
        .eq('plan_id', planId)
        .eq('feature_key', featureKey)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-features'] });
      toast.success('Feature updated');
    },
    onError: (error) => {
      toast.error('Failed to update feature', { description: error.message });
    },
  });

  const createPlan = useMutation({
    mutationFn: async (plan: {
      name: string;
      description?: string;
      billing_mode?: 'prepaid' | 'postpaid';
      price_ngn: number;
      yearly_price_ngn?: number;
      yearly_discount_percent?: number;
      trial_days?: number;
      billing_cycle?: string;
      max_vehicles?: number | null;
      max_drivers?: number | null;
      max_devices?: number | null;
      max_sims?: number | null;
      storage_gb?: number | null;
      features?: string[];
      applicable_org_types?: string[];
      is_active?: boolean;
      tier?: string;
      display_order?: number;
      pricing_display_mode?: 'fixed' | 'custom';
      custom_price_text?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          name: plan.name,
          description: plan.description,
          billing_mode: plan.billing_mode ?? 'prepaid',
          price_ngn: plan.price_ngn,
          yearly_price_ngn: plan.yearly_price_ngn ?? 0,
          yearly_discount_percent: plan.yearly_discount_percent ?? 0,
          trial_days: plan.trial_days ?? 0,
          billing_cycle: plan.billing_cycle ?? 'monthly',
          max_vehicles: plan.max_vehicles ?? null,
          max_drivers: plan.max_drivers ?? null,
          max_devices: plan.max_devices ?? null,
          max_sims: plan.max_sims ?? null,
          storage_gb: plan.storage_gb ?? null,
          features: plan.features ?? [],
          applicable_org_types: plan.applicable_org_types ?? ['FLEET_PROVIDER','ENTERPRISE','AGGREGATOR','OWNER_OPERATOR'],
          is_active: plan.is_active ?? true,
          tier: plan.tier ?? 'basic',
          display_order: plan.display_order ?? 0,
          pricing_display_mode: plan.pricing_display_mode ?? 'fixed',
          custom_price_text: plan.custom_price_text ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plan created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create plan', { description: error.message });
    },
  });

  const togglePlanActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success(`Plan ${data.is_active ? 'activated' : 'deactivated'}`);
    },
    onError: (error) => {
      toast.error('Failed to update plan status', { description: error.message });
    },
  });

  const getPlanFeatures = (planId: string, orgType?: string) => {
    return planFeatures?.filter(f => 
      f.plan_id === planId && 
      (!orgType || !f.applicable_org_type || f.applicable_org_type === orgType)
    ) || [];
  };

  const getPlansForOrgType = (orgType: string) => {
    return plans?.filter(p => p.applicable_org_types?.includes(orgType)) || [];
  };

  const getFeatureCategories = () => {
    const categories = new Set(planFeatures?.map(f => f.feature_category) || []);
    return Array.from(categories);
  };

  const getUniqueFeatures = () => {
    const uniqueFeatures = new Map<string, { key: string; name: string; description: string | null; category: string }>();
    planFeatures?.forEach(f => {
      if (!uniqueFeatures.has(f.feature_key)) {
        uniqueFeatures.set(f.feature_key, {
          key: f.feature_key,
          name: f.feature_name,
          description: f.feature_description,
          category: f.feature_category,
        });
      }
    });
    return Array.from(uniqueFeatures.values());
  };

  return {
    plans,
    planFeatures,
    isLoading: isLoading || featuresLoading,
    error,
    refetch,
    updatePlan,
    updatePlanFeature,
    createPlan,
    togglePlanActive,
    getPlanFeatures,
    getPlansForOrgType,
    getFeatureCategories,
    getUniqueFeatures,
  };
}



