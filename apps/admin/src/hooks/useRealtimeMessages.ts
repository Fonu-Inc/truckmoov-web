import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface RealtimeCallLog {
  id: string;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string;
  call_type: string;
  status: string;
  started_at: string;
}

export function useRealtimeMessages(providedTenantId?: string) {
  const { user } = useAuthStore();
  
  const tenantId = providedTenantId || user?.tenantId || null;
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);

  const showMessageNotification = useCallback((message: RealtimeMessage) => {
    if (message.direction === 'inbound') {
      toast.info(`New message from ${message.driver_name || 'Driver'}`, {
        description: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = '/supervisor/messages';
          },
        },
      });
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const showCallNotification = useCallback((call: RealtimeCallLog) => {
    if (call.call_type === 'inbound') {
      toast.info(`Incoming call from ${call.driver_name || call.driver_phone}`, {
        duration: 10000,
      });
    }
  }, []);

  useEffect(() => {
    console.log('Setting up realtime subscriptions for tenant:', tenantId);

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('driver-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          const message = payload.new as RealtimeMessage;
          setLastMessage(message);
          showMessageNotification(message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('Message updated:', payload);
        }
      )
      .subscribe((status) => {
        console.log('Messages channel status:', status);
      });

    // Subscribe to call logs
    const callsChannel = supabase
      .channel('driver-calls-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_call_logs',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('New call log received:', payload);
          const call = payload.new as RealtimeCallLog;
          showCallNotification(call);
        }
      )
      .subscribe((status) => {
        console.log('Calls channel status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(callsChannel);
    };
  }, [tenantId, showMessageNotification, showCallNotification]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    lastMessage,
    clearUnread,
  };
}



