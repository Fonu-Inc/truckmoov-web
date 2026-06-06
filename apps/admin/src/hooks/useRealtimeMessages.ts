import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface RealtimeMessage {
  id: string;
  driver_id: string;
  driver_name: string | null;
  driver_phone: string;
  content: string;
  direction: string;
  message_type: string;
  created_at: string;
}

export function useRealtimeMessages(_providedTenantId?: string) {
  const [unreadCount] = useState(0);
  const [lastMessage] = useState<RealtimeMessage | null>(null);

  const clearUnread = useCallback(() => {}, []);

  return {
    unreadCount,
    lastMessage,
    clearUnread,
  };
}
