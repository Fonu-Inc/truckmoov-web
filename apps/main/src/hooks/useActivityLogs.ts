export interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  actor_id: string | null;
  actor_name: string | null;
  metadata: Record<string, unknown>;
  tenant_id: string;
  created_at: string;
}

interface UseActivityLogsOptions {
  entityType: string;
  entityId: string;
  enabled?: boolean;
}

export function useActivityLogs(_options: UseActivityLogsOptions) {
  return {
    logs: [] as ActivityLog[],
    isLoading: false,
    error: null as string | null,
    refetch: () => {},
  };
}

// Helper function to log activity
export async function logActivity(_params: {
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  tenantId: string;
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  return true;
}
