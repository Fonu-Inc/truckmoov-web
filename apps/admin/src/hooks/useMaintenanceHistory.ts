import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [completions, setCompletions] = useState<MaintenanceCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const tenantId = user?.tenantId;

  const fetchCompletions = useCallback(async (vehicleId?: string, limit = 100) => {
    if (!tenantId) {
      setCompletions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('maintenance_completions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('completion_date', { ascending: false })
        .limit(limit);

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCompletions((data || []) as MaintenanceCompletion[]);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch maintenance history';
      setError(message);
      console.error('Error fetching maintenance history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  const getCostSummary = useCallback(async (): Promise<VehicleMaintenanceCostSummary[]> => {
    if (!tenantId) return [];

    try {
      // Get aggregated costs per vehicle
      const { data, error: fetchError } = await supabase
        .from('maintenance_completions')
        .select('vehicle_id, cost_ngn, parts_cost_ngn, labor_cost_ngn')
        .eq('tenant_id', tenantId);

      if (fetchError) throw fetchError;

      // Get vehicle registrations
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, registration_number')
        .eq('tenant_id', tenantId);

      const vehicleMap = new Map((vehicles || []).map(v => [v.id, v.registration_number]));

      // Aggregate by vehicle
      const summaryMap = new Map<string, VehicleMaintenanceCostSummary>();
      
      for (const record of (data || [])) {
        const existing = summaryMap.get(record.vehicle_id) || {
          vehicle_id: record.vehicle_id,
          vehicle_registration: vehicleMap.get(record.vehicle_id) || 'Unknown',
          total_cost: 0,
          parts_cost: 0,
          labor_cost: 0,
          service_count: 0,
        };

        existing.total_cost += Number(record.cost_ngn) || 0;
        existing.parts_cost += Number(record.parts_cost_ngn) || 0;
        existing.labor_cost += Number(record.labor_cost_ngn) || 0;
        existing.service_count += 1;

        summaryMap.set(record.vehicle_id, existing);
      }

      return Array.from(summaryMap.values()).sort((a, b) => b.total_cost - a.total_cost);
    } catch (err) {
      console.error('Error fetching cost summary:', err);
      return [];
    }
  }, [tenantId]);

  // Stats computed from completions
  const stats = {
    totalCompletions: completions.length,
    totalCost: completions.reduce((sum, c) => sum + Number(c.cost_ngn || 0), 0),
    totalPartsCost: completions.reduce((sum, c) => sum + Number(c.parts_cost_ngn || 0), 0),
    totalLaborCost: completions.reduce((sum, c) => sum + Number(c.labor_cost_ngn || 0), 0),
    avgCostPerService: completions.length > 0 
      ? completions.reduce((sum, c) => sum + Number(c.cost_ngn || 0), 0) / completions.length 
      : 0,
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



