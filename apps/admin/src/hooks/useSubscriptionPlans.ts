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
  const getPlanFeatures = (_planId: string, _orgType?: string): PlanFeature[] => [];
  const getPlansForOrgType = (_orgType: string): SubscriptionPlan[] => [];
  const getFeatureCategories = (): string[] => [];
  const getUniqueFeatures = (): { key: string; name: string; description: string | null; category: string }[] => [];

  return {
    plans: undefined as SubscriptionPlan[] | undefined,
    planFeatures: undefined as PlanFeature[] | undefined,
    isLoading: false,
    error: null,
    refetch: () => {},
    updatePlan: {
      mutate: (_args: { id: string; updates: Partial<SubscriptionPlan> }) => {},
      mutateAsync: async (_args: { id: string; updates: Partial<SubscriptionPlan> }) => {},
      isPending: false,
    },
    updatePlanFeature: {
      mutate: (_args: { planId: string; featureKey: string; isIncluded: boolean; usageLimit?: number | null }) => {},
      mutateAsync: async (_args: { planId: string; featureKey: string; isIncluded: boolean; usageLimit?: number | null }) => {},
      isPending: false,
    },
    createPlan: {
      mutate: (_plan: any) => {},
      mutateAsync: async (_plan: any) => {},
      isPending: false,
    },
    togglePlanActive: {
      mutate: (_args: { id: string; isActive: boolean }) => {},
      mutateAsync: async (_args: { id: string; isActive: boolean }) => {},
      isPending: false,
    },
    getPlanFeatures,
    getPlansForOrgType,
    getFeatureCategories,
    getUniqueFeatures,
  };
}
