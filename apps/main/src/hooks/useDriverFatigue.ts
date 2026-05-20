import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiGet } from '@/lib/backendApi';
import { toast } from 'sonner';

export interface FatigueAlert {
  id: string;
  tenant_id: string;
  driver_id: string | null;
  driver_name: string | null;
  device_id: string;
  fatigue_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  driving_duration_minutes: number | null;
  rest_compliance_score: number | null;
  indicators: string[];
  recommendations: string[];
  ai_analysis: string | null;
  created_at: string;
}

export function useDriverFatigue(tenantId?: string) {
  const [alerts, setAlerts] = useState<FatigueAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = async () => {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const data = await apiGet<FatigueAlert[]>(`/fatigue-alerts${params}`);
      setAlerts((data || []).map((alert) => ({
        ...alert,
        indicators: Array.isArray(alert.indicators) ? alert.indicators : [],
        recommendations: Array.isArray(alert.recommendations) ? alert.recommendations : [],
      })));
    } catch (error) {
      console.error('Error fetching fatigue alerts:', error);
      toast.error('Error', { description: 'Failed to fetch fatigue alerts' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    pollingRef.current = setInterval(fetchAlerts, 30_000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [tenantId]);

  const analyzeFatigue = async (
    deviceId: string,
    tenantId: string,
    driverId?: string,
    driverName?: string
  ) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('driver-fatigue-analysis', {
        body: { device_id: deviceId, tenant_id: tenantId, driver_id: driverId, driver_name: driverName },
      });
      if (error) throw error;
      toast.success('Analysis Complete', {
        description: `Fatigue score: ${data.alert.fatigue_score}/10 (${data.alert.risk_level})`,
      });
      return data;
    } catch (error) {
      console.error('Error analyzing fatigue:', error);
      toast.error('Analysis Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAlertsStats = () => {
    const total = alerts.length;
    const critical = alerts.filter((a) => a.risk_level === 'critical').length;
    const high = alerts.filter((a) => a.risk_level === 'high').length;
    const medium = alerts.filter((a) => a.risk_level === 'medium').length;
    const low = alerts.filter((a) => a.risk_level === 'low').length;

    const avgFatigueScore = total > 0
      ? alerts.reduce((sum, a) => sum + Number(a.fatigue_score), 0) / total
      : 0;

    const withCompliance = alerts.filter(a => a.rest_compliance_score !== null);
    const avgRestCompliance = withCompliance.length > 0
      ? withCompliance.reduce((sum, a) => sum + Number(a.rest_compliance_score || 0), 0) / withCompliance.length
      : 0;

    return {
      total, critical, high, medium, low,
      avgFatigueScore: Math.round(avgFatigueScore * 10) / 10,
      avgRestCompliance: Math.round(avgRestCompliance * 10) / 10,
    };
  };

  return { alerts, isLoading, isAnalyzing, analyzeFatigue, getAlertsStats, refetch: fetchAlerts };
}
