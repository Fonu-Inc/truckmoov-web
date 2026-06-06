import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export interface DispatchEligibility {
  eligible: boolean;
  overdue_count: number;
  due_count: number;
  warnings: string[];
  block_reason?: string;
}

export interface TenantMaintenanceConfig {
  id: string;
  tenant_id: string;
  dispatch_overdue_action: 'allow' | 'warn' | 'block';
  dispatch_due_action: 'allow' | 'warn' | 'block';
  warn_days_before: number;
  fuel_variance_threshold_percent: number;
  fuel_alert_enabled: boolean;
}

export function useDispatchEligibility() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;

  const checkEligibility = useCallback(async (_vehicleId: string): Promise<DispatchEligibility> => {
    return { eligible: true, overdue_count: 0, due_count: 0, warnings: [] };
  }, []);

  const getConfig = useCallback(async (): Promise<TenantMaintenanceConfig | null> => {
    return null;
  }, []);

  const updateConfig = useCallback(async (_updates: Partial<TenantMaintenanceConfig>): Promise<boolean> => {
    return false;
  }, []);

  return {
    checkEligibility,
    getConfig,
    updateConfig,
    isChecking: false,
    tenantId,
  };
}
