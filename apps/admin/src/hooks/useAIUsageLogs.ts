export interface AIUsageLog {
  id: string;
  tenant_id: string;
  provider: 'openai' | 'anthropic' | 'lovable';
  model: string;
  request_type: string;
  tokens_used: number;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  latency_ms: number | null;
  success: boolean;
  error_message: string | null;
  job_id: string | null;
  candidates_count: number | null;
  matches_returned: number | null;
  created_at: string;
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  successRate: number;
  avgLatency: number;
  byProvider: Record<string, { requests: number; tokens: number }>;
  byTenant: Record<string, { requests: number; tokens: number; name?: string }>;
}

export function useAIUsageLogs(_tenantId?: string | null, _isPlatformAdmin?: boolean) {
  return {
    logs: [] as AIUsageLog[],
    stats: null as AIUsageStats | null,
    isLoading: false,
    refetch: () => {},
  };
}
