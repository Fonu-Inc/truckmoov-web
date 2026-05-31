import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { startOfDay, subDays, format, parseISO } from 'date-fns';

export interface DailyApiUsage {
  date: string;
  requests: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
}

export interface EndpointUsage {
  endpoint: string;
  method: string;
  requests: number;
  successRate: number;
  avgLatencyMs: number;
}

export interface ApiKeyUsage {
  keyId: string;
  keyName: string;
  keyPrefix: string;
  requests: number;
  successRate: number;
  lastUsed: string | null;
}

export interface ApiUsageSummary {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  requestsToday: number;
  errorRateToday: number;
  peakHour: string | null;
  peakHourRequests: number;
}

export function useApiUsageAnalytics(daysRange: number = 30) {
  const [dailyUsage, setDailyUsage] = useState<DailyApiUsage[]>([]);
  const [endpointUsage, setEndpointUsage] = useState<EndpointUsage[]>([]);
  const [apiKeyUsage, setApiKeyUsage] = useState<ApiKeyUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;

  const fetchAnalytics = useCallback(async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      const startDate = subDays(new Date(), daysRange).toISOString();

      // Fetch usage logs
      const { data: usageLogs, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch API keys for name mapping
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, last_used_at')
        .eq('tenant_id', tenantId);

      const logs = usageLogs || [];
      const keys = apiKeys || [];

      // Aggregate daily usage
      const dailyMap = new Map<string, { requests: number; success: number; errors: number; totalLatency: number }>();
      
      logs.forEach(log => {
        const day = format(parseISO(log.created_at), 'yyyy-MM-dd');
        const existing = dailyMap.get(day) || { requests: 0, success: 0, errors: 0, totalLatency: 0 };
        existing.requests += 1;
        if (log.status_code >= 200 && log.status_code < 400) {
          existing.success += 1;
        } else {
          existing.errors += 1;
        }
        existing.totalLatency += log.response_time_ms || 0;
        dailyMap.set(day, existing);
      });

      // Fill in missing days with zeros
      const dailyData: DailyApiUsage[] = [];
      for (let i = daysRange - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const data = dailyMap.get(date);
        dailyData.push({
          date,
          requests: data?.requests || 0,
          successCount: data?.success || 0,
          errorCount: data?.errors || 0,
          avgLatencyMs: data?.requests ? Math.round(data.totalLatency / data.requests) : 0,
        });
      }
      setDailyUsage(dailyData);

      // Aggregate endpoint usage
      const endpointMap = new Map<string, { requests: number; success: number; totalLatency: number }>();
      logs.forEach(log => {
        const key = `${log.method}:${log.endpoint}`;
        const existing = endpointMap.get(key) || { requests: 0, success: 0, totalLatency: 0 };
        existing.requests += 1;
        if (log.status_code >= 200 && log.status_code < 400) {
          existing.success += 1;
        }
        existing.totalLatency += log.response_time_ms || 0;
        endpointMap.set(key, existing);
      });

      const endpointData: EndpointUsage[] = Array.from(endpointMap.entries())
        .map(([key, data]) => {
          const [method, endpoint] = key.split(':');
          return {
            endpoint,
            method,
            requests: data.requests,
            successRate: data.requests > 0 ? Math.round((data.success / data.requests) * 100) : 0,
            avgLatencyMs: data.requests > 0 ? Math.round(data.totalLatency / data.requests) : 0,
          };
        })
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10);
      setEndpointUsage(endpointData);

      // Aggregate by API key
      const keyMap = new Map<string, { requests: number; success: number }>();
      logs.forEach(log => {
        if (!log.api_key_id) return;
        const existing = keyMap.get(log.api_key_id) || { requests: 0, success: 0 };
        existing.requests += 1;
        if (log.status_code >= 200 && log.status_code < 400) {
          existing.success += 1;
        }
        keyMap.set(log.api_key_id, existing);
      });

      const keyData: ApiKeyUsage[] = keys.map(key => {
        const usage = keyMap.get(key.id) || { requests: 0, success: 0 };
        return {
          keyId: key.id,
          keyName: key.name,
          keyPrefix: key.key_prefix,
          requests: usage.requests,
          successRate: usage.requests > 0 ? Math.round((usage.success / usage.requests) * 100) : 100,
          lastUsed: key.last_used_at,
        };
      }).sort((a, b) => b.requests - a.requests);
      setApiKeyUsage(keyData);

    } catch (error) {
      console.error('Error fetching API usage analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, daysRange]);

  // Compute summary metrics
  const summary = useMemo<ApiUsageSummary>(() => {
    const totalRequests = dailyUsage.reduce((sum, d) => sum + d.requests, 0);
    const totalSuccess = dailyUsage.reduce((sum, d) => sum + d.successCount, 0);
    const totalLatency = dailyUsage.reduce((sum, d) => sum + (d.avgLatencyMs * d.requests), 0);
    
    const today = dailyUsage[dailyUsage.length - 1];
    const requestsToday = today?.requests || 0;
    const errorsToday = today?.errorCount || 0;
    const errorRateToday = requestsToday > 0 ? Math.round((errorsToday / requestsToday) * 100) : 0;

    // Find peak day
    let peakDay: DailyApiUsage | null = null;
    dailyUsage.forEach(d => {
      if (!peakDay || d.requests > peakDay.requests) {
        peakDay = d;
      }
    });

    return {
      totalRequests,
      successRate: totalRequests > 0 ? Math.round((totalSuccess / totalRequests) * 100) : 100,
      avgLatencyMs: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
      requestsToday,
      errorRateToday,
      peakHour: peakDay?.date || null,
      peakHourRequests: peakDay?.requests || 0,
    };
  }, [dailyUsage]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    dailyUsage,
    endpointUsage,
    apiKeyUsage,
    summary,
    isLoading,
    refreshAnalytics: fetchAnalytics,
  };
}



