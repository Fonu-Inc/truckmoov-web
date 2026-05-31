import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: slaMetrics, isLoading, error, refetch } = useQuery({
    queryKey: ['maintenance-sla-metrics', user?.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_sla_metrics')
        .select('*')
        .eq('tenant_id', user?.tenantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MaintenanceSLAMetrics | null;
    },
    enabled: !!user?.tenantId,
  });

  const refreshSLAMetrics = useCallback(async () => {
    if (!user?.tenantId) return;
    
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.rpc('compute_tenant_sla_metrics', {
        p_tenant_id: user.tenantId,
      });

      if (error) throw error;
      await refetch();
      return data;
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.tenantId, refetch]);

  const getCostTrendIndicator = () => {
    if (!slaMetrics) return null;
    const trend = slaMetrics.cost_trend_percentage;
    if (trend > 10) return { direction: 'up', severity: 'bad', value: trend };
    if (trend > 0) return { direction: 'up', severity: 'neutral', value: trend };
    if (trend < -10) return { direction: 'down', severity: 'good', value: Math.abs(trend) };
    if (trend < 0) return { direction: 'down', severity: 'neutral', value: Math.abs(trend) };
    return { direction: 'stable', severity: 'neutral', value: 0 };
  };

  const getOverdueStatus = () => {
    if (!slaMetrics) return 'unknown';
    if (slaMetrics.overdue_percentage > 20) return 'critical';
    if (slaMetrics.overdue_percentage > 10) return 'warning';
    if (slaMetrics.overdue_percentage > 5) return 'attention';
    return 'healthy';
  };

  return {
    slaMetrics,
    isLoading,
    error,
    isRefreshing,
    refreshSLAMetrics,
    getCostTrendIndicator,
    getOverdueStatus,
    refetch,
  };
}



