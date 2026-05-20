import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformAuditEntry {
  id: string;
  source: 'integration' | 'security';
  timestamp: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  tenant_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  severity: string | null;
  description: string | null;
}

export interface AuditFilters {
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  actor?: string;
  actionType?: string;
  resourceType?: string;
  search?: string;
}

export function usePlatformAuditLog(filters: AuditFilters = {}) {
  const [entries, setEntries] = useState<PlatformAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('v_platform_audit_log' as any)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(2000);

      if (filters.startDate) query = query.gte('timestamp', filters.startDate);
      if (filters.endDate) query = query.lte('timestamp', filters.endDate);
      if (filters.tenantId) query = query.eq('tenant_id', filters.tenantId);
      if (filters.actionType) query = query.eq('action_type', filters.actionType);
      if (filters.resourceType) query = query.eq('resource_type', filters.resourceType);

      const { data, error } = await query;
      if (error) throw error;

      let rows = (data || []) as unknown as PlatformAuditEntry[];

      if (filters.actor) {
        const t = filters.actor.toLowerCase();
        rows = rows.filter(
          (r) =>
            (r.actor_name || '').toLowerCase().includes(t) ||
            (r.actor_email || '').toLowerCase().includes(t) ||
            (r.actor_id || '').toLowerCase().includes(t)
        );
      }

      if (filters.search) {
        const t = filters.search.toLowerCase();
        rows = rows.filter((r) =>
          [
            r.actor_id,
            r.actor_name,
            r.actor_email,
            r.action_type,
            r.resource_type,
            r.resource_id,
            r.tenant_id,
            r.ip_address,
            r.description,
            r.severity,
            r.metadata ? JSON.stringify(r.metadata) : '',
          ]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(t))
        );
      }

      setEntries(rows);
    } catch (e) {
      console.error('Failed to load platform audit log:', e);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.startDate,
    filters.endDate,
    filters.tenantId,
    filters.actor,
    filters.actionType,
    filters.resourceType,
    filters.search,
  ]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { entries, isLoading, refresh: fetchEntries };
}
