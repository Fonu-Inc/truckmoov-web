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
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();

  const usageStats: UsageStats = {
    vehicles: { current: vehicles.length, limit: null, percentage: 0 },
    drivers: { current: drivers.length, limit: null, percentage: 0 },
    devices: { current: 0, limit: null, percentage: 0 },
    sims: { current: 0, limit: null, percentage: 0 },
  };

  const hasFeature = (_featureKey: string): boolean => false;
  const getFeatureLimit = (_featureKey: string): number | null => null;
  const isApproachingLimit = (_type: 'vehicles' | 'drivers' | 'devices' | 'sims'): boolean => false;
  const isAtLimit = (_type: 'vehicles' | 'drivers' | 'devices' | 'sims'): boolean => false;

  return {
    tenant: null as any,
    currentPlan: null as TenantPlan | null,
    planFeatures: [] as PlanFeature[],
    usageStats,
    availablePlans: [] as TenantPlan[],
    upgradeOptions: [] as TenantPlan[],
    downgradeOptions: [] as TenantPlan[],
    isLoading: false,
    hasFeature,
    getFeatureLimit,
    isApproachingLimit,
    isAtLimit,
  };
}
