import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TenantSenderId, SenderIdStatus } from '@/hooks/useTenantSenderIds';

export function usePlatformSenderIdApprovals() {
  const [requests, setRequests] = useState<TenantSenderId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('tenant_sender_ids')
        .select('*')
        .order('requested_at', { ascending: false });

      if (fetchError) throw fetchError;
      setRequests((data || []) as TenantSenderId[]);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sender ID requests';
      setError(message);
      console.error('Error fetching sender ID requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (
    id: string,
    status: SenderIdStatus,
    options?: {
      rejection_reason?: string;
      admin_notes?: string;
      telecom_reference?: string;
      telecom_provider?: string;
    }
  ) => {
    try {
      const updateData: Record<string, unknown> = {
        status,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (options?.rejection_reason) {
        updateData.rejection_reason = options.rejection_reason;
      }
      if (options?.admin_notes) {
        updateData.admin_notes = options.admin_notes;
      }
      if (options?.telecom_reference) {
        updateData.telecom_reference = options.telecom_reference;
      }
      if (options?.telecom_provider) {
        updateData.telecom_provider = options.telecom_provider;
      }
      if (status === 'approved') {
        updateData.whitelisted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tenant_sender_ids')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      const statusMessages: Record<SenderIdStatus, string> = {
        pending: 'Status set to pending',
        whitelisting: 'Marked as whitelisting in progress',
        approved: 'Sender ID approved',
        rejected: 'Sender ID rejected',
      };

      toast.success(statusMessages[status]);
      await fetchRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(message);
      throw err;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tenant_sender_ids')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Request deleted');
      await fetchRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete request';
      toast.error(message);
      throw err;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const whitelistingCount = requests.filter(r => r.status === 'whitelisting').length;

  return {
    requests,
    pendingCount,
    whitelistingCount,
    loading,
    error,
    refetch: fetchRequests,
    updateStatus,
    deleteRequest,
  };
}
