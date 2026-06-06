import { useAuthStore } from '@/stores/authStore';

export interface VehicleDispatchScore {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  overall_score: number;
  maintenance_health_score: number;
  fuel_efficiency_score: number;
  driver_performance_score: number;
  reliability_score: number;
  is_dispatch_recommended: boolean;
  recommendation_reasons: string[];
  risk_warnings: string[];
  computed_at: string;
}

export function useVehicleDispatchScores() {
  const { user } = useAuthStore();

  const dispatchScores = [] as VehicleDispatchScore[] | undefined;

  const getScoreForVehicle = (_vehicleId: string) => undefined;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTopVehicles = (_limit: number = 5) => [] as VehicleDispatchScore[];
  const getVehiclesWithWarnings = () => [] as VehicleDispatchScore[];

  return {
    dispatchScores,
    isLoading: false,
    error: null,
    refetch: () => {},
    getScoreForVehicle,
    getScoreColor,
    getTopVehicles,
    getVehiclesWithWarnings,
  };
}
