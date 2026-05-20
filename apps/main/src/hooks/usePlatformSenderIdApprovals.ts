import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TenantSenderId, SenderIdStatus } from './useTenantSenderIds';

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
      const real = (data || []) as TenantSenderId[];
      const now = Date.now();
      const DEMO_REQUESTS: TenantSenderId[] = [
        { id: "ds-1", tenant_id: "demo-t1", tenant_name: "Lagos Express Logistics", sender_id: "LAGEXPRESS", sender_type: "alphanumeric" as any, status: "pending", requested_at: new Date(now - 1000 * 60 * 60 * 6).toISOString(), requested_by: "ops-lead", request_notes: "For driver dispatch SMS — 3 networks (MTN, Airtel, Glo).", request_letter_url: "demo/letter-lex.pdf", reviewed_at: null, reviewed_by: null, rejection_reason: null, admin_notes: null, telecom_reference: null, telecom_provider: null, whitelisted_at: null, created_at: new Date(now - 1000 * 60 * 60 * 6).toISOString(), updated_at: new Date(now - 1000 * 60 * 60 * 6).toISOString() },
        { id: "ds-2", tenant_id: "demo-t6", tenant_name: "Abuja Haulage Co.", sender_id: "ABJHAULAGE", sender_type: "alphanumeric" as any, status: "pending", requested_at: new Date(now - 1000 * 60 * 60 * 18).toISOString(), requested_by: "tech-admin", request_notes: "OTP and trip notification SMS.", request_letter_url: "demo/letter-abj.pdf", reviewed_at: null, reviewed_by: null, rejection_reason: null, admin_notes: null, telecom_reference: null, telecom_provider: null, whitelisted_at: null, created_at: new Date(now - 1000 * 60 * 60 * 18).toISOString(), updated_at: new Date(now - 1000 * 60 * 60 * 18).toISOString() },
        { id: "ds-3", tenant_id: "demo-t3", tenant_name: "Nairobi Fleet Group", sender_id: "NBOFLEET", sender_type: "alphanumeric" as any, status: "whitelisting", requested_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(), requested_by: "tech-admin", request_notes: "Driver assignment + ETA updates.", request_letter_url: "demo/letter-nbo.pdf", reviewed_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(), reviewed_by: "platform-admin", rejection_reason: null, admin_notes: "Submitted to Safaricom on 18 Apr.", telecom_reference: "SAF-WL-2025-1142", telecom_provider: "Safaricom", whitelisted_at: null, created_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(), updated_at: new Date(now - 1000 * 60 * 60 * 24).toISOString() },
        { id: "ds-4", tenant_id: "demo-t4", tenant_name: "Cape Town Trucking", sender_id: "CPTTRUCK", sender_type: "alphanumeric" as any, status: "whitelisting", requested_at: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(), requested_by: "ops-lead", request_notes: "Service notifications.", request_letter_url: "demo/letter-ctt.pdf", reviewed_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(), reviewed_by: "platform-admin", rejection_reason: null, admin_notes: "Awaiting Vodacom confirmation.", telecom_reference: "VOD-WL-2025-7782", telecom_provider: "Vodacom", whitelisted_at: null, created_at: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(), updated_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString() },
        { id: "ds-5", tenant_id: "demo-t2", tenant_name: "Accra Swift Cargo", sender_id: "ACCSWIFT", sender_type: "alphanumeric" as any, status: "approved", requested_at: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(), requested_by: "ops-lead", request_notes: "Trip notifications and OTP.", request_letter_url: "demo/letter-acc.pdf", reviewed_at: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(), reviewed_by: "platform-admin", rejection_reason: null, admin_notes: "Approved across MTN GH and Vodafone GH.", telecom_reference: "MTNGH-WL-2025-0421", telecom_provider: "MTN Ghana", whitelisted_at: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(), created_at: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(), updated_at: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString() },
        { id: "ds-6", tenant_id: "demo-t5", tenant_name: "Johannesburg Freight", sender_id: "JHBFRGHT", sender_type: "alphanumeric" as any, status: "rejected", requested_at: new Date(now - 1000 * 60 * 60 * 24 * 8).toISOString(), requested_by: "tech-admin", request_notes: "OTP delivery.", request_letter_url: "demo/letter-jhb.pdf", reviewed_at: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(), reviewed_by: "platform-admin", rejection_reason: "Authorisation letter not on company letterhead.", admin_notes: "Tenant notified — please re-submit.", telecom_reference: null, telecom_provider: null, whitelisted_at: null, created_at: new Date(now - 1000 * 60 * 60 * 24 * 8).toISOString(), updated_at: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString() },
      ];
      setRequests(real.length > 0 ? real : DEMO_REQUESTS);
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
