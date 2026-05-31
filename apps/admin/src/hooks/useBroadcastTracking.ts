import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export function useBroadcastTracking(tenantId: string = 'default') {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastMessage | null>(null);
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchBroadcasts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBroadcasts((data as BroadcastMessage[]) || []);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  const fetchRecipients = useCallback(async (broadcastId: string) => {
    try {
      const { data, error } = await supabase
        .from('broadcast_recipients')
        .select('*')
        .eq('broadcast_id', broadcastId)
        .order('driver_name', { ascending: true });

      if (error) throw error;
      setRecipients((data as BroadcastRecipient[]) || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  }, []);

  const sendBroadcast = async (
    drivers: Driver[],
    message: string,
    channel: 'sms' | 'whatsapp' = 'whatsapp',
    senderName?: string
  ) => {
    const activeDrivers = drivers.filter(d => d.status !== 'offline' && d.phone);
    
    if (activeDrivers.length === 0) {
      toast.error('No active drivers to send broadcast');
      return { success: false, broadcastId: null };
    }

    setIsSending(true);

    try {
      // Create broadcast record
      const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcast_messages')
        .insert({
          tenant_id: tenantId,
          message,
          channel,
          sent_by: senderName || 'Supervisor',
          total_recipients: activeDrivers.length,
        })
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      // Create recipient records
      const recipientRecords = activeDrivers.map(driver => ({
        broadcast_id: broadcast.id,
        driver_id: driver.id,
        driver_name: driver.name,
        driver_phone: driver.phone,
        status: 'pending',
      }));

      const { error: recipientsError } = await supabase
        .from('broadcast_recipients')
        .insert(recipientRecords);

      if (recipientsError) throw recipientsError;

      // Send messages to each driver
      let sentCount = 0;
      let deliveredCount = 0;

      for (const driver of activeDrivers) {
        try {
          const { error } = await supabase.functions.invoke('fonu-sms', {
            body: {
              action: channel === 'whatsapp' ? 'send_whatsapp' : 'send_sms',
              phoneNumber: driver.phone,
              message,
              driverId: driver.id,
              driverName: driver.name,
              tenantId,
              senderName,
            },
          });

          if (!error) {
            sentCount++;
            // Update recipient status
            await supabase
              .from('broadcast_recipients')
              .update({ 
                status: 'sent', 
                sent_at: new Date().toISOString() 
              })
              .eq('broadcast_id', broadcast.id)
              .eq('driver_id', driver.id);
          } else {
            await supabase
              .from('broadcast_recipients')
              .update({ 
                status: 'failed', 
                error_message: 'Failed to send' 
              })
              .eq('broadcast_id', broadcast.id)
              .eq('driver_id', driver.id);
          }
        } catch (err) {
          console.error(`Failed to send to ${driver.name}:`, err);
        }
      }

      // Update broadcast counts
      await supabase
        .from('broadcast_messages')
        .update({ delivered_count: sentCount })
        .eq('id', broadcast.id);

      toast.success(`Broadcast sent to ${sentCount}/${activeDrivers.length} drivers`);
      await fetchBroadcasts();
      
      return { success: true, broadcastId: broadcast.id };
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Failed to send broadcast');
      return { success: false, broadcastId: null };
    } finally {
      setIsSending(false);
    }
  };

  const selectBroadcast = async (broadcast: BroadcastMessage) => {
    setSelectedBroadcast(broadcast);
    await fetchRecipients(broadcast.id);
  };

  const clearSelection = () => {
    setSelectedBroadcast(null);
    setRecipients([]);
  };

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  // Subscribe to realtime updates for recipient status changes
  useEffect(() => {
    if (!selectedBroadcast) return;

    const channel = supabase
      .channel('broadcast-recipients-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'broadcast_recipients',
          filter: `broadcast_id=eq.${selectedBroadcast.id}`,
        },
        () => {
          fetchRecipients(selectedBroadcast.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBroadcast, fetchRecipients]);

  return {
    broadcasts,
    selectedBroadcast,
    recipients,
    isLoading,
    isSending,
    sendBroadcast,
    selectBroadcast,
    clearSelection,
    refetch: fetchBroadcasts,
  };
}



