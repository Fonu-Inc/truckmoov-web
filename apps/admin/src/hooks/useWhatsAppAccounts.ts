import { useState } from 'react';

export interface WhatsAppAccount {
  id: string;
  tenant_id: string;
  status: 'NOT_CONNECTED' | 'PENDING' | 'CONNECTED' | 'NEEDS_ATTENTION' | 'DISABLED';
  connection_method: 'EMBEDDED_SIGNUP' | 'SUPERADMIN_ASSISTED' | null;
  waba_id: string | null;
  phone_number_id: string | null;
  business_id: string | null;
  display_phone_number: string | null;
  verified_name: string | null;
  is_default_sender: boolean;
  quality_rating: string | null;
  messaging_limit_tier: string | null;
  connected_at: string | null;
  created_at: string;
}

export function useWhatsAppAccounts(_tenantId: string) {
  const [isConnecting] = useState(false);
  const [isDisconnecting] = useState(false);

  return {
    accounts: [] as WhatsAppAccount[],
    isLoading: false,
    canSend: false,
    tenantStatus: 'unknown',
    isConnecting,
    isDisconnecting,
    refetch: async () => {},
    startEmbeddedSignup: async () => {},
    disconnect: async (_accountId: string) => {},
    setAsDefault: async (_accountId: string) => {},
    sendTestMessage: async (_toPhone: string) => null,
  };
}
