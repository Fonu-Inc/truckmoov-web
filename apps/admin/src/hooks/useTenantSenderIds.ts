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

  return {
    senderIds: [] as TenantSenderId[],
    approvedSmsIds: [] as TenantSenderId[],
    approvedVoiceIds: [] as TenantSenderId[],
    loading: false,
    error: null as string | null,
    refetch: () => {},
    requestSenderId: async (_data: {
      sender_id: string;
      sender_type: SenderIdType;
      request_notes?: string;
      request_letter_url?: string;
    }) => {},
  };
}
