import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export type SenderIdStatus = 'pending' | 'whitelisting' | 'approved' | 'rejected';
export type SenderIdType = 'sms' | 'voice' | 'both';

export interface TenantSenderId {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  sender_id: string;
  sender_type: SenderIdType;
  status: SenderIdStatus;
  requested_at: string;
  requested_by: string | null;
  request_notes: string | null;
  request_letter_url: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  telecom_reference: string | null;
  telecom_provider: string | null;
  whitelisted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useTenantSenderIds() {
  const { user } = useAuthStore();
  const [senderIds, setSenderIds] = useState<TenantSenderId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSenderIds = useCallback(async () => {
    if (!user?.tenantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('tenant_sender_ids')
        .select('*')
        .eq('tenant_id', user.tenantId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSenderIds((data || []) as TenantSenderId[]);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sender IDs';
      setError(message);
      console.error('Error fetching sender IDs:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId]);

  useEffect(() => {
    fetchSenderIds();
  }, [fetchSenderIds]);

  const requestSenderId = async (data: {
    sender_id: string;
    sender_type: SenderIdType;
    request_notes?: string;
    request_letter_url?: string;
  }) => {
    if (!user?.tenantId) {
      toast.error('Unable to submit request');
      return;
    }

    try {
      const { error } = await supabase
        .from('tenant_sender_ids')
        .insert({
          tenant_id: user.tenantId,
          sender_id: data.sender_id,
          sender_type: data.sender_type,
          request_notes: data.request_notes,
          request_letter_url: data.request_letter_url,
          requested_by: user.id,
          status: 'pending',
        });

      if (error) throw error;
      toast.success('Sender ID request submitted for approval');
      await fetchSenderIds();
    } catch (err: any) {
      if (err.code === '23505') {
        toast.error('This sender ID has already been requested');
      } else {
        toast.error(err.message || 'Failed to submit request');
      }
      throw err;
    }
  };

  // Get only approved sender IDs for use in dropdowns
  const approvedSmsIds = senderIds.filter(
    s => s.status === 'approved' && (s.sender_type === 'sms' || s.sender_type === 'both')
  );
  
  const approvedVoiceIds = senderIds.filter(
    s => s.status === 'approved' && (s.sender_type === 'voice' || s.sender_type === 'both')
  );

  return {
    senderIds,
    approvedSmsIds,
    approvedVoiceIds,
    loading,
    error,
    refetch: fetchSenderIds,
    requestSenderId,
  };
}
