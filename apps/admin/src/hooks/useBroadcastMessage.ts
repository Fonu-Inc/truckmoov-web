import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
}

export function useBroadcastMessage(tenantId: string = 'default') {
  const [isSending, setIsSending] = useState(false);

  const sendBroadcast = async (
    drivers: Driver[],
    message: string,
    channel: 'sms' | 'whatsapp' = 'whatsapp',
    senderName?: string
  ) => {
    const activeDrivers = drivers.filter(d => d.status !== 'offline' && d.phone);
    
    if (activeDrivers.length === 0) {
      toast.error('No active drivers to send broadcast');
      return { success: false, sent: 0, failed: 0 };
    }

    setIsSending(true);
    let sent = 0;
    let failed = 0;

    try {
      const promises = activeDrivers.map(async (driver) => {
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

          if (error) throw error;
          sent++;
          return { success: true, driver };
        } catch (err) {
          failed++;
          console.error(`Failed to send to ${driver.name}:`, err);
          return { success: false, driver, error: err };
        }
      });

      await Promise.all(promises);

      if (sent > 0 && failed === 0) {
        toast.success(`Broadcast sent to ${sent} drivers`);
      } else if (sent > 0 && failed > 0) {
        toast.warning(`Sent to ${sent} drivers, ${failed} failed`);
      } else {
        toast.error('Failed to send broadcast');
      }

      return { success: sent > 0, sent, failed };
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Failed to send broadcast');
      return { success: false, sent: 0, failed: activeDrivers.length };
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendBroadcast,
    isSending,
  };
}



