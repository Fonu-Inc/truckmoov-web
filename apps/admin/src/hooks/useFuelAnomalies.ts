import { useAuthStore } from '@/stores/authStore';

export type FuelAnomalyType = 'sudden_drop' | 'abnormal_consumption' | 'suspected_theft' | 'sensor_error';
export type FuelAnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface FuelAnomaly {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  device_id: string | null;
  anomaly_type: FuelAnomalyType;
  severity: FuelAnomalySeverity;
  fuel_drop_percent: number | null;
  fuel_drop_liters: number | null;
  expected_consumption: number | null;
  actual_consumption: number | null;
  variance_percent: number | null;
  confidence_score: number | null;
  detected_at: string;
  location_lat: number | null;
  location_lng: number | null;
  alert_id: string | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  notes: string | null;
  created_at: string;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
}

export interface FuelLevelHistory {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  device_id: string | null;
  fuel_level_percent: number;
  fuel_level_liters: number | null;
  recorded_at: string;
  latitude: number | null;
  longitude: number | null;
  odometer: number | null;
  source: 'telemetry' | 'manual';
}

export function useFuelAnomalies() {
  const anomalies: FuelAnomaly[] = [];
  const isLoading = false;
  const error: string | null = null;

  const fetchAnomalies = async (_vehicleId?: string, _limit = 50) => {};
  const acknowledgeAnomaly = async (_id: string, _notes?: string) => {};
  const getFuelHistory = async (_vehicleId: string, _hours = 24): Promise<FuelLevelHistory[]> => [];

  const stats = {
    total: 0,
    unacknowledged: 0,
    critical: 0,
    byType: {
      sudden_drop: 0,
      abnormal_consumption: 0,
      suspected_theft: 0,
      sensor_error: 0,
    },
  };

  return {
    anomalies,
    stats,
    isLoading,
    error,
    fetchAnomalies,
    acknowledgeAnomaly,
    getFuelHistory,
  };
}
