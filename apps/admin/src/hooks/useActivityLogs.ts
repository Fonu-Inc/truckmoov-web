import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  actor_id: string | null;
  actor_name: string | null;
  metadata: Json;
  tenant_id: string;
  created_at: string;
}

interface UseActivityLogsOptions {
  entityType: string;
  entityId: string;
  enabled?: boolean;
}

export function useActivityLogs({ entityType, entityId, enabled = true }: UseActivityLogsOptions) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!entityType || !entityId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLogs((data as ActivityLog[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activity logs';
      setError(message);
      console.error('Error fetching activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!enabled || !entityType || !entityId) return;

    fetchLogs();

    const channel = supabase
      .channel(`activity-${entityType}-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `entity_id=eq.${entityId}`,
        },
        (payload) => {
          const newLog = payload.new as ActivityLog;
          if (newLog.entity_type === entityType) {
            setLogs((prev) => [newLog, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityType, entityId, enabled, fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    refetch: fetchLogs,
  };
}

// Helper function to log activity
export async function logActivity(params: {
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  tenantId: string;
  actorId?: string;
  actorName?: string;
  metadata?: Json;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('activity_logs').insert([{
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      description: params.description,
      tenant_id: params.tenantId,
      actor_id: params.actorId || null,
      actor_name: params.actorName || null,
      metadata: params.metadata || {},
    }]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error logging activity:', err);
    return false;
  }
}



