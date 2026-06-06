import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export interface MaintenanceCompletion {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  vehicle_id: string;
  service_type: string;
  completion_date: string;
  completion_mileage: number | null;
  completion_engine_hours: number | null;
  cost_ngn: number;
  parts_cost_ngn: number | null;
  labor_cost_ngn: number | null;
  technician_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface VehicleMaintenanceCostSummary {
  vehicle_id: string;
  vehicle_registration: string;
  total_cost: number;
  parts_cost: number;
  labor_cost: number;
  service_count: number;
}

export function useMaintenanceHistory() {
  const completions: MaintenanceCompletion[] = [];
  const isLoading = false;
  const error: string | null = null;

  const fetchCompletions = async (_vehicleId?: string, _limit = 100) => {};

  const getCostSummary = useCallback(async (): Promise<VehicleMaintenanceCostSummary[]> => [], []);

  const stats = {
    totalCompletions: 0,
    totalCost: 0,
    totalPartsCost: 0,
    totalLaborCost: 0,
    avgCostPerService: 0,
  };

  return {
    completions,
    stats,
    isLoading,
    error,
    fetchCompletions,
    getCostSummary,
  };
}
