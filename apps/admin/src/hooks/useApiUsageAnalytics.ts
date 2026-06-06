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

export function useApiUsageAnalytics(_daysRange: number = 30) {
  const summary: ApiUsageSummary = {
    totalRequests: 0,
    successRate: 100,
    avgLatencyMs: 0,
    requestsToday: 0,
    errorRateToday: 0,
    peakHour: null,
    peakHourRequests: 0,
  };

  return {
    dailyUsage: [] as DailyApiUsage[],
    endpointUsage: [] as EndpointUsage[],
    apiKeyUsage: [] as ApiKeyUsage[],
    summary,
    isLoading: false,
    refreshAnalytics: () => {},
  };
}
