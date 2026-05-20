import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReminderSettings {
  email_enabled: boolean;
  push_enabled: boolean;
  days_before: number[];
  recipient_emails: string[];
}

export function useFleetReminders(tenantId: string = 'default') {
  const [isSending, setIsSending] = useState(false);

  const sendReminders = useCallback(async (
    reminderType: 'compliance' | 'maintenance' | 'all',
    recipientEmail: string,
    daysBefore?: number[]
  ) => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('fleet-reminders', {
        body: {
          tenant_id: tenantId,
          reminder_type: reminderType,
          recipient_email: recipientEmail,
          days_before: daysBefore || [30, 14, 7, 1],
        },
      });

      if (error) throw error;

      if (data?.success) {
        if (data.sent > 0) {
          toast.success(`Reminders sent for ${data.sent} item(s)`, {
            description: 'Check your email for details.',
          });
        } else {
          toast.info('No reminders needed', {
            description: 'All items are up to date.',
          });
        }
        return data;
      }

      throw new Error(data?.error || 'Failed to send reminders');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reminders';
      toast.error(message);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [tenantId]);

  const saveReminderSettings = useCallback(async (
    reminderType: string,
    settings: Partial<ReminderSettings>
  ) => {
    try {
      const { error } = await supabase
        .from('reminder_settings')
        .upsert({
          tenant_id: tenantId,
          reminder_type: reminderType,
          ...settings,
        }, {
          onConflict: 'tenant_id,reminder_type',
        });

      if (error) throw error;
      toast.success('Reminder settings saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      toast.error(message);
      throw err;
    }
  }, [tenantId]);

  const getReminderSettings = useCallback(async (reminderType: string) => {
    try {
      const { data, error } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('reminder_type', reminderType)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to get reminder settings:', err);
      return null;
    }
  }, [tenantId]);

  return {
    isSending,
    sendReminders,
    saveReminderSettings,
    getReminderSettings,
  };
}
