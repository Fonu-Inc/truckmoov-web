import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export interface MaintenanceSLAMetrics {
  id: string;
  tenant_id: string;
  total_vehicles: number;
  vehicles_with_overdue: number;
  vehicles_with_due_soon: number;
  overdue_percentage: number;
  avg_days_to_service: number;
  avg_delay_days: number;
  on_time_completion_rate: number;
  total_maintenance_cost_30d: number;
  avg_cost_per_vehicle_30d: number;
  cost_trend_percentage: number;
  total_completions_30d: number;
  preventive_vs_reactive_ratio: number;
  computed_at: string;
}

export function useMaintenanceSLA() {
  const slaMetrics: MaintenanceSLAMetrics | null = null;
  const isLoading = false;
  const error = null;
  const isRefreshing = false;

  const refreshSLAMetrics = useCallback(async () => {}, []);

  const getCostTrendIndicator = () => null;

  const getOverdueStatus = () => 'unknown';

  return {
    slaMetrics,
    isLoading,
    error,
    isRefreshing,
    refreshSLAMetrics,
    getCostTrendIndicator,
    getOverdueStatus,
    refetch: () => {},
  };
}
