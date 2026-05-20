import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export function useWhatsAppAccounts(tenantId: string) {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canSend, setCanSend] = useState(false);
  const [tenantStatus, setTenantStatus] = useState<string>('unknown');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const fetchAccounts = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-connect', {
        body: {
          action: 'get_status',
          tenantId,
        },
      });

      if (error) throw error;

      setAccounts(data.accounts || []);
      setCanSend(data.canSend || false);
      setTenantStatus(data.tenantStatus || 'unknown');
    } catch (error) {
      console.error('Failed to fetch WhatsApp accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [tenantId]);

  const startEmbeddedSignup = async () => {
    setIsConnecting(true);
    try {
      // Start the connection flow
      const { data: startData, error: startError } = await supabase.functions.invoke('whatsapp-connect', {
        body: {
          action: 'start',
          tenantId,
          connectionMethod: 'EMBEDDED_SIGNUP',
        },
      });

      if (startError) throw startError;

      // In development/simulation mode, we simulate the callback directly
      // instead of opening Meta's Embedded Signup URL which requires a registered Tech Provider
      toast.loading('Simulating WhatsApp Business connection...', { id: 'wa-connect' });

      // Simulate a brief delay for the "signup" process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Complete the connection by calling callback with the state
      const { data: callbackData, error: callbackError } = await supabase.functions.invoke('whatsapp-connect', {
        body: {
          action: 'callback',
          tenantId,
          state: startData.state,
          code: 'SIMULATED_AUTH_CODE', // Simulated auth code
        },
      });

      if (callbackError) throw callbackError;

      toast.success('WhatsApp Business account connected successfully!', { id: 'wa-connect' });
      await fetchAccounts();
    } catch (error) {
      console.error('Failed to connect WhatsApp:', error);
      toast.error('Failed to connect WhatsApp account', { id: 'wa-connect' });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async (accountId: string) => {
    setIsDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-connect', {
        body: {
          action: 'disconnect',
          tenantId,
          accountId,
        },
      });

      if (error) throw error;

      toast.success('WhatsApp account disconnected');
      await fetchAccounts();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect WhatsApp account');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const setAsDefault = async (accountId: string) => {
    try {
      const { error } = await supabase.functions.invoke('whatsapp-connect', {
        body: {
          action: 'set_default',
          tenantId,
          accountId,
        },
      });

      if (error) throw error;

      toast.success('Default sender updated');
      await fetchAccounts();
    } catch (error) {
      console.error('Failed to set default:', error);
      toast.error('Failed to update default sender');
    }
  };

  const sendTestMessage = async (toPhone: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          tenantId,
          toPhone,
          messageType: 'TEXT',
          textContent: 'This is a test message from FleetPro WhatsApp Business.',
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Test message sent successfully');
      } else {
        toast.error(data.message || 'Failed to send test message');
      }

      return data;
    } catch (error) {
      console.error('Failed to send test message:', error);
      toast.error('Failed to send test message');
      throw error;
    }
  };

  return {
    accounts,
    isLoading,
    canSend,
    tenantStatus,
    isConnecting,
    isDisconnecting,
    refetch: fetchAccounts,
    startEmbeddedSignup,
    disconnect,
    setAsDefault,
    sendTestMessage,
  };
}
