import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export interface MaintenanceRiskScore {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  overall_risk_score: number;
  age_factor: number;
  mileage_factor: number;
  engine_hours_factor: number;
  overdue_maintenance_factor: number;
  behavioral_factor: number;
  historical_breakdown_factor: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contributing_factors: any;
  recommendations: string[] | null;
  computed_at: string;
  data_points_analyzed: number;
  confidence_score: number;
}

export function useMaintenanceRiskScores() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isComputing, setIsComputing] = useState(false);

  const { data: riskScores, isLoading, error, refetch } = useQuery({
    queryKey: ['maintenance-risk-scores', user?.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_risk_scores')
        .select('*')
        .order('overall_risk_score', { ascending: false });

      if (error) throw error;
      return data as MaintenanceRiskScore[];
    },
    enabled: !!user?.tenantId,
  });

  const computeRiskScore = useCallback(async (vehicleId: string) => {
    setIsComputing(true);
    try {
      const { data, error } = await supabase.rpc('compute_vehicle_maintenance_risk', {
        p_vehicle_id: vehicleId,
      });

      if (error) throw error;
      await refetch();
      return data;
    } finally {
      setIsComputing(false);
    }
  }, [refetch]);

  const computeAllRiskScores = useCallback(async () => {
    if (!user?.tenantId) return;
    
    setIsComputing(true);
    try {
      // Get all vehicles for tenant
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('tenant_id', user.tenantId)
        .neq('status', 'decommissioned');

      if (vehiclesError) throw vehiclesError;

      // Compute risk for each vehicle
      for (const vehicle of vehicles || []) {
        await supabase.rpc('compute_vehicle_maintenance_risk', {
          p_vehicle_id: vehicle.id,
        });
      }

      await refetch();
    } finally {
      setIsComputing(false);
    }
  }, [user?.tenantId, refetch]);

  const getVehicleRiskScore = useCallback((vehicleId: string) => {
    return riskScores?.find(score => score.vehicle_id === vehicleId);
  }, [riskScores]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return {
    riskScores,
    isLoading,
    error,
    isComputing,
    computeRiskScore,
    computeAllRiskScores,
    getVehicleRiskScore,
    getRiskLevelColor,
    refetch,
  };
}



