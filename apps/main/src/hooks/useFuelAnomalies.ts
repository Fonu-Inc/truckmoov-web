import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  // Joined fields
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
  const [anomalies, setAnomalies] = useState<FuelAnomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const tenantId = user?.tenantId;

  const fetchAnomalies = useCallback(async (vehicleId?: string, limit = 50) => {
    const effectiveTenantId = tenantId;
    if (!effectiveTenantId) {
      setAnomalies([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('fuel_anomaly_events')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .order('detected_at', { ascending: false })
        .limit(limit);

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAnomalies((data || []) as FuelAnomaly[]);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch fuel anomalies';
      setError(message);
      console.error('Error fetching fuel anomalies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const acknowledgeAnomaly = useCallback(async (id: string, notes?: string) => {
    try {
      const { error: updateError } = await supabase
        .from('fuel_anomaly_events')
        .update({
          acknowledged: true,
          acknowledged_by: user?.id || null,
          acknowledged_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setAnomalies(prev => prev.map(a => 
        a.id === id ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() } : a
      ));

      toast.success('Anomaly acknowledged');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to acknowledge anomaly';
      toast.error(message);
      throw err;
    }
  }, [user?.id]);

  const getFuelHistory = useCallback(async (vehicleId: string, hours = 24): Promise<FuelLevelHistory[]> => {
    const effectiveTenantId = tenantId;
    if (!effectiveTenantId) return [];

    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error: fetchError } = await supabase
        .from('fuel_level_history')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .eq('vehicle_id', vehicleId)
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: true });

      if (fetchError) throw fetchError;

      return (data || []) as FuelLevelHistory[];
    } catch (err) {
      console.error('Error fetching fuel history:', err);
      return [];
    }
  }, [tenantId]);

  // Stats computed from anomalies
  const stats = {
    total: anomalies.length,
    unacknowledged: anomalies.filter(a => !a.acknowledged).length,
    critical: anomalies.filter(a => a.severity === 'critical' && !a.acknowledged).length,
    byType: {
      sudden_drop: anomalies.filter(a => a.anomaly_type === 'sudden_drop').length,
      abnormal_consumption: anomalies.filter(a => a.anomaly_type === 'abnormal_consumption').length,
      suspected_theft: anomalies.filter(a => a.anomaly_type === 'suspected_theft').length,
      sensor_error: anomalies.filter(a => a.anomaly_type === 'sensor_error').length,
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
