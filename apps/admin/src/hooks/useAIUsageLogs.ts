import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export function useAIUsageLogs(tenantId?: string | null, isPlatformAdmin?: boolean) {
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('ai_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (tenantId && !isPlatformAdmin) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const realLogs = (data || []) as AIUsageLog[];
      const DEMO_LOGS: AIUsageLog[] = realLogs.length > 0 ? [] : [
        { id: "dl-1", tenant_id: "demo-t1", provider: "lovable", model: "gemini-2.5-flash", request_type: "job_match", tokens_used: 1842, prompt_tokens: 1420, completion_tokens: 422, latency_ms: 612, success: true, error_message: null, job_id: "JOB-2025-1041", candidates_count: 8, matches_returned: 3, created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
        { id: "dl-2", tenant_id: "demo-t3", provider: "openai", model: "gpt-5-mini", request_type: "trip_optimization", tokens_used: 3204, prompt_tokens: 2680, completion_tokens: 524, latency_ms: 982, success: true, error_message: null, job_id: "JOB-2025-1040", candidates_count: 12, matches_returned: 5, created_at: new Date(Date.now() - 1000 * 60 * 11).toISOString() },
        { id: "dl-3", tenant_id: "demo-t2", provider: "lovable", model: "gemini-2.5-pro", request_type: "waybill_extraction", tokens_used: 4512, prompt_tokens: 3890, completion_tokens: 622, latency_ms: 1284, success: true, error_message: null, job_id: null, candidates_count: null, matches_returned: null, created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
        { id: "dl-4", tenant_id: "demo-t1", provider: "lovable", model: "gemini-2.5-flash", request_type: "job_match", tokens_used: 1620, prompt_tokens: 1280, completion_tokens: 340, latency_ms: 548, success: true, error_message: null, job_id: "JOB-2025-1039", candidates_count: 6, matches_returned: 2, created_at: new Date(Date.now() - 1000 * 60 * 24).toISOString() },
        { id: "dl-5", tenant_id: "demo-t5", provider: "anthropic", model: "claude-3-haiku", request_type: "fatigue_analysis", tokens_used: 980, prompt_tokens: 820, completion_tokens: 160, latency_ms: 412, success: true, error_message: null, job_id: null, candidates_count: null, matches_returned: null, created_at: new Date(Date.now() - 1000 * 60 * 31).toISOString() },
        { id: "dl-6", tenant_id: "demo-t4", provider: "openai", model: "gpt-5", request_type: "job_match", tokens_used: 5240, prompt_tokens: 4180, completion_tokens: 1060, latency_ms: 2104, success: false, error_message: "Rate limit exceeded — provider 429", job_id: "JOB-2025-1038", candidates_count: 14, matches_returned: 0, created_at: new Date(Date.now() - 1000 * 60 * 38).toISOString() },
        { id: "dl-7", tenant_id: "demo-t3", provider: "lovable", model: "gemini-2.5-flash", request_type: "job_match", tokens_used: 1480, prompt_tokens: 1180, completion_tokens: 300, latency_ms: 524, success: true, error_message: null, job_id: "JOB-2025-1037", candidates_count: 5, matches_returned: 2, created_at: new Date(Date.now() - 1000 * 60 * 47).toISOString() },
        { id: "dl-8", tenant_id: "demo-t6", provider: "lovable", model: "gemini-2.5-flash-lite", request_type: "summary", tokens_used: 720, prompt_tokens: 612, completion_tokens: 108, latency_ms: 312, success: true, error_message: null, job_id: null, candidates_count: null, matches_returned: null, created_at: new Date(Date.now() - 1000 * 60 * 56).toISOString() },
        { id: "dl-9", tenant_id: "demo-t1", provider: "openai", model: "gpt-5-nano", request_type: "intent_classification", tokens_used: 412, prompt_tokens: 360, completion_tokens: 52, latency_ms: 198, success: true, error_message: null, job_id: null, candidates_count: null, matches_returned: null, created_at: new Date(Date.now() - 1000 * 60 * 64).toISOString() },
        { id: "dl-10", tenant_id: "demo-t2", provider: "lovable", model: "gemini-2.5-pro", request_type: "trip_optimization", tokens_used: 3820, prompt_tokens: 3210, completion_tokens: 610, latency_ms: 1142, success: true, error_message: null, job_id: "JOB-2025-1035", candidates_count: 11, matches_returned: 4, created_at: new Date(Date.now() - 1000 * 60 * 78).toISOString() },
        { id: "dl-11", tenant_id: "demo-t5", provider: "lovable", model: "gemini-2.5-flash", request_type: "job_match", tokens_used: 1340, prompt_tokens: 1080, completion_tokens: 260, latency_ms: 488, success: true, error_message: null, job_id: "JOB-2025-1034", candidates_count: 4, matches_returned: 1, created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
        { id: "dl-12", tenant_id: "demo-t4", provider: "anthropic", model: "claude-3.5-sonnet", request_type: "waybill_extraction", tokens_used: 4810, prompt_tokens: 4120, completion_tokens: 690, latency_ms: 1382, success: true, error_message: null, job_id: null, candidates_count: null, matches_returned: null, created_at: new Date(Date.now() - 1000 * 60 * 105).toISOString() },
      ];
      const typedLogs = realLogs.length > 0 ? realLogs : DEMO_LOGS;
      setLogs(typedLogs);

      // Calculate stats
      if (typedLogs.length > 0) {
        const totalRequests = typedLogs.length;
        const totalTokens = typedLogs.reduce((sum, log) => sum + (log.tokens_used || 0), 0);
        const successfulRequests = typedLogs.filter(log => log.success).length;
        const successRate = (successfulRequests / totalRequests) * 100;
        const avgLatency = typedLogs.reduce((sum, log) => sum + (log.latency_ms || 0), 0) / totalRequests;

        const byProvider: Record<string, { requests: number; tokens: number }> = {};
        const byTenant: Record<string, { requests: number; tokens: number }> = {};

        typedLogs.forEach(log => {
          // By provider
          if (!byProvider[log.provider]) {
            byProvider[log.provider] = { requests: 0, tokens: 0 };
          }
          byProvider[log.provider].requests++;
          byProvider[log.provider].tokens += log.tokens_used || 0;

          // By tenant
          if (!byTenant[log.tenant_id]) {
            byTenant[log.tenant_id] = { requests: 0, tokens: 0 };
          }
          byTenant[log.tenant_id].requests++;
          byTenant[log.tenant_id].tokens += log.tokens_used || 0;
        });

        setStats({
          totalRequests,
          totalTokens,
          successRate,
          avgLatency,
          byProvider,
          byTenant,
        });
      }
    } catch (error) {
      console.error('Failed to fetch AI usage logs:', error);
      toast.error('Failed to load AI usage data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tenantId, isPlatformAdmin]);

  return {
    logs,
    stats,
    isLoading,
    refetch: fetchLogs,
  };
}



