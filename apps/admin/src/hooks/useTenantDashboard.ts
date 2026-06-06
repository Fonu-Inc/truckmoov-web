interface TenantDashboardData {
  name: string;
  vehicleCount: number;
  driverCount: number;
  deviceCount: number;
  simCount: number;
  plan: string;
  status: string;
}

export function useTenantDashboard() {
  return {
    data: null as TenantDashboardData | null,
    isLoading: false,
    error: null as Error | null,
  };
}
