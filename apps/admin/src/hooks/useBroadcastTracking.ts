import { useState } from 'react';

interface BroadcastMessage {
  id: string;
  tenant_id: string;
  message: string;
  channel: string;
  sent_by: string | null;
  total_recipients: number;
  delivered_count: number;
  read_count: number;
  replied_count: number;
  created_at: string;
}

interface BroadcastRecipient {
  id: string;
  broadcast_id: string;
  driver_id: string;
  driver_name: string | null;
  driver_phone: string;
  status: string;
  external_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  replied_at: string | null;
  reply_content: string | null;
  error_message: string | null;
  created_at: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
}

export function useBroadcastTracking(_tenantId: string = 'default') {
  const [selectedBroadcast] = useState<BroadcastMessage | null>(null);

  const sendBroadcast = async (
    _drivers: Driver[],
    _message: string,
    _channel: 'sms' | 'whatsapp' = 'whatsapp',
    _senderName?: string
  ) => {
    return { success: false, broadcastId: null };
  };

  const selectBroadcast = async (_broadcast: BroadcastMessage) => {};

  const clearSelection = () => {};

  return {
    broadcasts: [] as BroadcastMessage[],
    selectedBroadcast,
    recipients: [] as BroadcastRecipient[],
    isLoading: false,
    isSending: false,
    sendBroadcast,
    selectBroadcast,
    clearSelection,
    refetch: () => {},
  };
}
