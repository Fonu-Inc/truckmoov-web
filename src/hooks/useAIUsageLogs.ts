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

      const typedLogs = (data || []) as AIUsageLog[];
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
