import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_by: string | null;
  blocked_at: string;
  expires_at: string | null;
  is_permanent: boolean;
  tenant_id: string | null;
  metadata: Record<string, unknown>;
}

export interface SecurityAuditLog {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info' | 'warning';
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  description: string;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useIPBlocking() {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockedIPs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('ip-blocking', {
        body: { action: 'list' }
      });

      if (error) throw error;
      
      setBlockedIPs(data?.blocked_ips || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch blocked IPs';
      setError(message);
      console.error('Error fetching blocked IPs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkIP = useCallback(async (ipAddress: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('ip-blocking', {
        body: { action: 'check', ip_address: ipAddress }
      });

      if (error) throw error;
      
      return data?.is_blocked || false;
    } catch (err) {
      console.error('Error checking IP:', err);
      return false;
    }
  }, []);

  const blockIP = useCallback(async (
    ipAddress: string,
    reason: string,
    options?: {
      expiresAt?: string;
      isPermanent?: boolean;
      tenantId?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('ip-blocking', {
        body: {
          action: 'block',
          ip_address: ipAddress,
          reason,
          expires_at: options?.expiresAt,
          is_permanent: options?.isPermanent,
          tenant_id: options?.tenantId,
          metadata: options?.metadata
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success(`IP ${ipAddress} has been blocked`);
        await fetchBlockedIPs();
        return true;
      }
      
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to block IP';
      toast.error(message);
      console.error('Error blocking IP:', err);
      return false;
    }
  }, [fetchBlockedIPs]);

  const unblockIP = useCallback(async (ipAddress: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('ip-blocking', {
        body: { action: 'unblock', ip_address: ipAddress }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success(`IP ${ipAddress} has been unblocked`);
        await fetchBlockedIPs();
        return true;
      }
      
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unblock IP';
      toast.error(message);
      console.error('Error unblocking IP:', err);
      return false;
    }
  }, [fetchBlockedIPs]);

  useEffect(() => {
    fetchBlockedIPs();
  }, [fetchBlockedIPs]);

  return {
    blockedIPs,
    isLoading,
    error,
    fetchBlockedIPs,
    checkIP,
    blockIP,
    unblockIP
  };
}

export function useSecurityAuditLogs() {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (filters?: {
    eventType?: string;
    severity?: string;
    tenantId?: string;
    limit?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setLogs((data as SecurityAuditLog[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit logs';
      setError(message);
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    fetchLogs
  };
}



