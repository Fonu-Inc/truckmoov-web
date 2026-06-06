import { useState } from 'react';
import { toast } from 'sonner';

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
}

export function useBroadcastMessage(_tenantId: string = 'default') {
  const [isSending] = useState(false);

  const sendBroadcast = async (
    _drivers: Driver[],
    _message: string,
    _channel: 'sms' | 'whatsapp' = 'whatsapp',
    _senderName?: string
  ) => {
    return { success: false, sent: 0, failed: 0 };
  };

  return {
    sendBroadcast,
    isSending,
  };
}
