import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export interface IntegrationAuditLog {
  id: string;
  tenant_id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function useIntegrationAudit() {
  const [auditLogs, setAuditLogs] = useState<IntegrationAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  const tenantId = user?.tenantId;
  const role = user?.role;

  const fetchAuditLogs = useCallback(async (filters?: {
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('integration_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      // Platform admin sees all, tenant admin sees own tenant
      if (role !== 'platform_admin' && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map the data to our interface
      const mappedLogs: IntegrationAuditLog[] = (data || []).map(item => ({
        id: item.id,
        tenant_id: item.tenant_id,
        actor_id: item.actor_id,
        actor_name: item.actor_name,
        action: item.action,
        resource_type: item.resource_type,
        resource_id: item.resource_id,
        changes: typeof item.changes === 'object' && item.changes !== null ? item.changes as Record<string, unknown> : null,
        ip_address: item.ip_address,
        user_agent: item.user_agent,
        created_at: item.created_at,
      }));

      setAuditLogs(mappedLogs);
    } catch (error) {
      console.error('Error fetching integration audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, role]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return {
    auditLogs,
    isLoading,
    refreshAuditLogs: fetchAuditLogs,
  };
}
