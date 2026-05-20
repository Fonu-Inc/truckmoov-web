import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export function useDriverCommunications(tenantId: string = 'default') {
  const [messages, setMessages] = useState<DriverMessage[]>([]);
  const [callLogs, setCallLogs] = useState<DriverCallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('driver_messages')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMessages((data || []) as DriverMessage[]);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [tenantId]);

  const fetchCallLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('driver_call_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCallLogs((data || []) as DriverCallLog[]);
    } catch (err) {
      console.error('Error fetching call logs:', err);
    }
  }, [tenantId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMessages(), fetchCallLogs()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchMessages, fetchCallLogs]);

  const sendSMS = async (
    driverId: string,
    driverName: string,
    driverPhone: string,
    message: string,
    senderName?: string
  ) => {
    setIsSending(true);
    try {
      // 1) Send to backend API (fleet pro backend)
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/drivers/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          phoneNumber: driverPhone,
          message,
          driverId,
          driverName,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || body?.error || 'Backend SMS failed');
      }

      // 2) Optimistically add to local timeline
      const now = new Date().toISOString();
      const newMessage: DriverMessage = {
        id: `local-${Date.now()}`,
        tenant_id: tenantId,
        driver_id: driverId,
        driver_name: driverName,
        driver_phone: driverPhone,
        message_type: 'sms',
        direction: 'outbound',
        content: message,
        status: 'sent',
        external_id: null,
        sender_id: null,
        sender_name: senderName || 'Supervisor',
        error_message: null,
        created_at: now,
        updated_at: now,
      };
      setMessages((prev) => [newMessage, ...prev]);

      // 3) Also notify Supabase edge (best-effort) to keep history if available
      try {
        await supabase.functions.invoke('fonu-sms', {
          body: {
            action: 'send_sms',
            phoneNumber: driverPhone,
            message,
            driverId,
            driverName,
            senderName,
            tenantId,
          },
        });
        void fetchMessages();
      } catch (e) {
        // ignore secondary failure
      }

      toast.success(`SMS sent to ${driverName}`, {
        description: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      });

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS';
      toast.error('Failed to send SMS', { description: errorMessage });
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  const sendWhatsApp = async (
    driverId: string,
    driverName: string,
    driverPhone: string,
    message: string,
    senderName?: string
  ): Promise<{ success: boolean; queued?: boolean; data?: any }> => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('fonu-sms', {
        body: {
          action: 'send_whatsapp',
          phoneNumber: driverPhone,
          message,
          driverId,
          driverName,
          senderName,
          tenantId,
        },
      });

      if (error) throw error;

      // Check if the API returned a queued/unavailable response
      if (data?.queued || data?.success === false) {
        await fetchMessages();
        return { success: false, queued: true, data };
      }

      toast.success(`WhatsApp sent to ${driverName}`, {
        description: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      });

      await fetchMessages();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send WhatsApp';
      // Don't show toast here - let the caller handle it for fallback option
      console.error('WhatsApp send error:', errorMessage);
      return { success: false, queued: false };
    } finally {
      setIsSending(false);
    }
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
    driverId: string,
    driverName: string,
    driverPhone: string,
    callerName?: string,
    message?: string
  ) => {
    setIsCalling(true);
    try {
      // First log the call
      const { data: callRecord, error: insertError } = await supabase
        .from('driver_call_logs')
        .insert({
          tenant_id: tenantId,
          driver_id: driverId,
          driver_name: driverName,
          driver_phone: driverPhone,
          caller_name: callerName,
          call_type: 'outbound',
          status: 'initiated',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to log call:', insertError);
      }

      const { data, error } = await supabase.functions.invoke('fonu-voice', {
        body: {
          action: 'initiate_call',
          phoneNumber: driverPhone,
          language: 'en',
          message,
          enableRecording: true,
        },
      });

      if (error) throw error;

      // Update call record with external ID
      if (callRecord) {
        await supabase
          .from('driver_call_logs')
          .update({ 
            external_call_id: data.call_id,
            status: 'ringing' 
          })
          .eq('id', callRecord.id);
        
        setActiveCallId(callRecord.id);
      }

      toast.success(`Calling ${driverName}...`, {
        description: driverPhone,
      });

      await fetchCallLogs();
      return { ...data, dbCallId: callRecord?.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate call';
      toast.error('Failed to initiate call', { description: errorMessage });
      throw err;
    } finally {
      setIsCalling(false);
    }
  };

  const endCall = async (callId: string, externalCallId?: string) => {
    try {
      if (externalCallId) {
        await supabase.functions.invoke('fonu-voice', {
          body: {
            action: 'end_call',
            callId: externalCallId,
          },
        });
      }

      await supabase
        .from('driver_call_logs')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', callId);

      setActiveCallId(null);
      toast.success('Call ended');
      await fetchCallLogs();
    } catch (err) {
      console.error('Error ending call:', err);
    }
  };

  const getMessagesForDriver = useCallback((driverId: string) => {
    return messages.filter(m => m.driver_id === driverId);
  }, [messages]);

  const getCallLogsForDriver = useCallback((driverId: string) => {
    return callLogs.filter(c => c.driver_id === driverId);
  }, [callLogs]);

  const getStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMessages = messages.filter(m => new Date(m.created_at) >= today);
    const todayCalls = callLogs.filter(c => new Date(c.created_at) >= today);

    return {
      totalMessages: messages.length,
      totalCalls: callLogs.length,
      todayMessages: todayMessages.length,
      todayCalls: todayCalls.length,
      sentMessages: messages.filter(m => m.status === 'sent' || m.status === 'delivered').length,
      failedMessages: messages.filter(m => m.status === 'failed').length,
      completedCalls: callLogs.filter(c => c.status === 'completed').length,
      missedCalls: callLogs.filter(c => c.status === 'no_answer' || c.status === 'failed').length,
    };
  }, [messages, callLogs]);

  return {
    messages,
    callLogs,
    isLoading,
    isSending,
    isCalling,
    activeCallId,
    sendSMS,
    sendWhatsApp,
    openWhatsAppWeb,
    initiateCall,
    endCall,
    getMessagesForDriver,
    getCallLogsForDriver,
    getStats,
    refetch: () => Promise.all([fetchMessages(), fetchCallLogs()]),
  };
}
