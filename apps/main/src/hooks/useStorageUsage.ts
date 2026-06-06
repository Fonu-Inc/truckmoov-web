import { useAuthStore } from "@/stores/authStore";
import { useTenantSubscription } from "./useTenantSubscription";

export interface StorageUsage {
  usedBytes: number;
  usedGB: number;
  limitGB: number | null;
  percentage: number;
  isLoading: boolean;
}

export function useStorageUsage(): StorageUsage {
  const { user } = useAuthStore();
  const { currentPlan } = useTenantSubscription();
  const limitGB =
    (currentPlan as unknown as { storage_gb?: number | null } | null)?.storage_gb ?? null;

  return {
    usedBytes: 0,
    usedGB: 0,
    limitGB,
    percentage: 0,
    isLoading: false,
  };
}
