import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const API_BASE =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:4040/api';

export interface DriverMessage {
  id: string;
  tenant_id: string;
  driver_id: string;
  driver_name: string | null;
  driver_phone: string;
  message_type: string;
  direction: string;
  content: string;
  status: string;
  external_id: string | null;
  sender_id: string | null;
  sender_name: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverCallLog {
  id: string;
  tenant_id: string;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string;
  caller_id: string | null;
  caller_name: string | null;
  call_type: string;
  status: string;
  external_call_id: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export function useDriverCommunications(_tenantId: string = 'default') {
  const [messages] = useState<DriverMessage[]>([]);
  const [callLogs] = useState<DriverCallLog[]>([]);
  const [activeCallId] = useState<string | null>(null);

  const sendSMS = async (
    _driverId: string,
    _driverName: string,
    _driverPhone: string,
    _message: string,
    _senderName?: string
  ) => {
    return { success: false };
  };

  const sendWhatsApp = async (
    _driverId: string,
    _driverName: string,
    _driverPhone: string,
    _message: string,
    _senderName?: string
  ): Promise<{ success: boolean; queued?: boolean; data?: any }> => {
    return { success: false };
  };

  const openWhatsAppWeb = (driverPhone: string, driverName: string, message: string) => {
    const phone = driverPhone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    toast.success(`Opening WhatsApp for ${driverName}`, {
      description: 'Message will open in WhatsApp Web',
    });
  };

  const initiateCall = async (
    _driverId: string,
    _driverName: string,
    _driverPhone: string,
    _callerName?: string,
    _message?: string
  ) => {
    return null;
  };

  const endCall = async (_callId: string, _externalCallId?: string) => {};

  const getMessagesForDriver = useCallback((driverId: string) => {
    return messages.filter(m => m.driver_id === driverId);
  }, [messages]);

  const getCallLogsForDriver = useCallback((driverId: string) => {
    return callLogs.filter(c => c.driver_id === driverId);
  }, [callLogs]);

  const getStats = useCallback(() => {
    return {
      totalMessages: 0,
      totalCalls: 0,
      todayMessages: 0,
      todayCalls: 0,
      sentMessages: 0,
      failedMessages: 0,
      completedCalls: 0,
      missedCalls: 0,
    };
  }, []);

  return {
    messages,
    callLogs,
    isLoading: false,
    isSending: false,
    isCalling: false,
    activeCallId,
    sendSMS,
    sendWhatsApp,
    openWhatsAppWeb,
    initiateCall,
    endCall,
    getMessagesForDriver,
    getCallLogsForDriver,
    getStats,
    refetch: () => Promise.resolve(),
  };
}
