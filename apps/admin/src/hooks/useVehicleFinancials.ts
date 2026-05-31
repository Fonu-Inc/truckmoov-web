import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface VehicleFinancialConfig {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  monthly_insurance_ngn: number;
  monthly_driver_wage_ngn: number;
  monthly_parking_ngn: number;
  monthly_other_fixed_ngn: number;
  purchase_price_ngn: number | null;
  purchase_date: string | null;
  useful_life_months: number;
  salvage_value_ngn: number;
  depreciation_method: 'straight_line' | 'declining_balance';
  per_trip_wage_ngn: number;
  per_km_wage_ngn: number;
  wage_allocation_method: 'fixed' | 'per_trip' | 'per_km' | 'hybrid';
  created_at: string;
  updated_at: string;
}

export interface VehicleProfitability {
  vehicle_id: string;
  period_start: string;
  period_end: string;
  costs: {
    fuel: number;
    maintenance: number;
    wages: number;
    insurance: number;
    depreciation: number;
    total: number;
  };
  revenue: {
    total: number;
    jobs_completed: number;
    total_km: number;
  };
  profitability: {
    net_profit: number;
    margin_percent: number;
    score: number;
    tier: 'excellent' | 'good' | 'marginal' | 'loss-making';
  };
}

export interface FinancialConfigInput {
  vehicle_id: string;
  monthly_insurance_ngn?: number;
  monthly_driver_wage_ngn?: number;
  monthly_parking_ngn?: number;
  monthly_other_fixed_ngn?: number;
  purchase_price_ngn?: number | null;
  purchase_date?: string | null;
  useful_life_months?: number;
  salvage_value_ngn?: number;
  depreciation_method?: 'straight_line' | 'declining_balance';
  per_trip_wage_ngn?: number;
  per_km_wage_ngn?: number;
  wage_allocation_method?: 'fixed' | 'per_trip' | 'per_km' | 'hybrid';
}

function parseDbConfig(data: unknown): VehicleFinancialConfig {
  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    tenant_id: d.tenant_id as string,
    vehicle_id: d.vehicle_id as string,
    monthly_insurance_ngn: (d.monthly_insurance_ngn as number) || 0,
    monthly_driver_wage_ngn: (d.monthly_driver_wage_ngn as number) || 0,
    monthly_parking_ngn: (d.monthly_parking_ngn as number) || 0,
    monthly_other_fixed_ngn: (d.monthly_other_fixed_ngn as number) || 0,
    purchase_price_ngn: d.purchase_price_ngn as number | null,
    purchase_date: d.purchase_date as string | null,
    useful_life_months: (d.useful_life_months as number) || 60,
    salvage_value_ngn: (d.salvage_value_ngn as number) || 0,
    depreciation_method: (d.depreciation_method as 'straight_line' | 'declining_balance') || 'straight_line',
    per_trip_wage_ngn: (d.per_trip_wage_ngn as number) || 0,
    per_km_wage_ngn: (d.per_km_wage_ngn as number) || 0,
    wage_allocation_method: (d.wage_allocation_method as 'fixed' | 'per_trip' | 'per_km' | 'hybrid') || 'fixed',
    created_at: d.created_at as string,
    updated_at: d.updated_at as string,
  };
}

function parseProfitability(data: Json): VehicleProfitability | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const d = data as Record<string, Json>;
  const costs = d.costs as Record<string, number> | undefined;
  const revenue = d.revenue as Record<string, number> | undefined;
  const profitability = d.profitability as Record<string, unknown> | undefined;
  
  return {
    vehicle_id: d.vehicle_id as string,
    period_start: d.period_start as string,
    period_end: d.period_end as string,
    costs: {
      fuel: costs?.fuel || 0,
      maintenance: costs?.maintenance || 0,
      wages: costs?.wages || 0,
      insurance: costs?.insurance || 0,
      depreciation: costs?.depreciation || 0,
      total: costs?.total || 0,
    },
    revenue: {
      total: revenue?.total || 0,
      jobs_completed: revenue?.jobs_completed || 0,
      total_km: revenue?.total_km || 0,
    },
    profitability: {
      net_profit: (profitability?.net_profit as number) || 0,
      margin_percent: (profitability?.margin_percent as number) || 0,
      score: (profitability?.score as number) || 0,
      tier: (profitability?.tier as 'excellent' | 'good' | 'marginal' | 'loss-making') || 'marginal',
    },
  };
}

export function useVehicleFinancials(tenantId: string = 'default') {
  const [configs, setConfigs] = useState<VehicleFinancialConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('vehicle_financial_config')
        .select('*')
        .eq('tenant_id', tenantId);

      if (fetchError) throw fetchError;
      setConfigs((data || []).map(parseDbConfig));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch financial configs';
      setError(message);
      console.error('Error fetching financial configs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const upsertConfig = async (input: FinancialConfigInput) => {
    try {
      const { data, error: upsertError } = await supabase
        .from('vehicle_financial_config')
        .upsert({
          ...input,
          tenant_id: tenantId,
        }, { onConflict: 'vehicle_id' })
        .select()
        .single();

      if (upsertError) throw upsertError;
      
      const parsed = parseDbConfig(data);
      setConfigs(prev => {
        const existing = prev.findIndex(c => c.vehicle_id === input.vehicle_id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = parsed;
          return updated;
        }
        return [...prev, parsed];
      });
      
      toast.success('Financial configuration saved');
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save financial config';
      toast.error(message);
      throw err;
    }
  };

  const getConfigForVehicle = (vehicleId: string): VehicleFinancialConfig | undefined => {
    return configs.find(c => c.vehicle_id === vehicleId);
  };

  const calculateProfitability = async (
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VehicleProfitability | null> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('calculate_vehicle_profitability', {
        p_vehicle_id: vehicleId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
      });

      if (rpcError) throw rpcError;
      return parseProfitability(data as Json);
    } catch (err) {
      console.error('Error calculating profitability:', err);
      return null;
    }
  };

  const calculateFleetProfitability = async (
    vehicleIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<VehicleProfitability[]> => {
    const results: VehicleProfitability[] = [];
    
    for (const vehicleId of vehicleIds) {
      const result = await calculateProfitability(vehicleId, startDate, endDate);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  };

  return {
    configs,
    isLoading,
    error,
    fetchConfigs,
    upsertConfig,
    getConfigForVehicle,
    calculateProfitability,
    calculateFleetProfitability,
  };
}



