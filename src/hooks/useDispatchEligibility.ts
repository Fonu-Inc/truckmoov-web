import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

// Demo tenant for fallback
const DEMO_TENANT_ID = "f7f5af88-fd76-4439-aae3-0461be52f63f";
const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

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
  const [isChecking, setIsChecking] = useState(false);
  const { user } = useAuthStore();

  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) : false;
  const tenantId = isDemoUser ? DEMO_TENANT_ID : user?.tenantId;

  const checkEligibility = useCallback(async (vehicleId: string): Promise<DispatchEligibility> => {
    if (!tenantId) {
      return { eligible: true, overdue_count: 0, due_count: 0, warnings: [] };
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_vehicle_dispatch_eligibility', {
        p_vehicle_id: vehicleId,
        p_tenant_id: tenantId,
      });

      if (error) throw error;

      // Parse the JSON result safely
      const result = data as unknown as DispatchEligibility | null;
      if (!result) {
        return { eligible: true, overdue_count: 0, due_count: 0, warnings: [] };
      }

      return {
        eligible: result.eligible ?? true,
        overdue_count: result.overdue_count ?? 0,
        due_count: result.due_count ?? 0,
        warnings: Array.isArray(result.warnings) ? result.warnings : [],
        block_reason: result.block_reason,
      };
    } catch (err) {
      console.error('Error checking dispatch eligibility:', err);
      // Default to eligible if check fails
      return { eligible: true, overdue_count: 0, due_count: 0, warnings: [] };
    } finally {
      setIsChecking(false);
    }
  }, [tenantId]);

  const getConfig = useCallback(async (): Promise<TenantMaintenanceConfig | null> => {
    if (!tenantId) return null;

    try {
      const { data, error } = await supabase
        .from('tenant_maintenance_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      return data as TenantMaintenanceConfig | null;
    } catch (err) {
      console.error('Error fetching maintenance config:', err);
      return null;
    }
  }, [tenantId]);

  const updateConfig = useCallback(async (updates: Partial<TenantMaintenanceConfig>): Promise<boolean> => {
    if (!tenantId) return false;

    try {
      const { error } = await supabase
        .from('tenant_maintenance_config')
        .upsert({
          tenant_id: tenantId,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id',
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating maintenance config:', err);
      return false;
    }
  }, [tenantId]);

  return {
    checkEligibility,
    getConfig,
    updateConfig,
    isChecking,
    tenantId,
  };
}
