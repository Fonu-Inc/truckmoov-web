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

export function usePlatformAuditLog(_filters: AuditFilters = {}) {
  return {
    entries: [] as PlatformAuditEntry[],
    isLoading: false,
    refresh: () => {},
  };
}
