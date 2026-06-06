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

export function useVehicleFinancials(_tenantId: string = 'default') {
  return {
    configs: [] as VehicleFinancialConfig[],
    isLoading: false,
    error: null as string | null,
    fetchConfigs: async () => {},
    upsertConfig: async (_input: FinancialConfigInput): Promise<VehicleFinancialConfig | undefined> => undefined,
    getConfigForVehicle: (_vehicleId: string): VehicleFinancialConfig | undefined => undefined,
    calculateProfitability: async (
      _vehicleId: string,
      _startDate: Date,
      _endDate: Date
    ): Promise<VehicleProfitability | null> => null,
    calculateFleetProfitability: async (
      _vehicleIds: string[],
      _startDate: Date,
      _endDate: Date
    ): Promise<VehicleProfitability[]> => [],
  };
}
