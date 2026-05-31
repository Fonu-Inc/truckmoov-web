import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityAlertConfig {
  enabled: boolean;
  recipientEmail: string;
  alertOnAutoBlock: boolean;
  alertOnCriticalEvents: boolean;
  alertOnSuspiciousActivity: boolean;
}

const STORAGE_KEY = 'security_alert_config';

const defaultConfig: SecurityAlertConfig = {
  enabled: false,
  recipientEmail: '',
  alertOnAutoBlock: true,
  alertOnCriticalEvents: true,
  alertOnSuspiciousActivity: false
};

export function useSecurityAlerts() {
  const [config, setConfig] = useState<SecurityAlertConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    } catch {
      return defaultConfig;
    }
  });
  
  const [isSending, setIsSending] = useState(false);

  const updateConfig = useCallback((updates: Partial<SecurityAlertConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      return newConfig;
    });
  }, []);

  const sendAlert = useCallback(async (params: {
    alertType: 'ip_blocked' | 'critical_event' | 'suspicious_activity';
    ipAddress?: string;
    country?: string;
    city?: string;
    reason?: string;
    threatLevel?: string;
    details?: Record<string, unknown>;
  }) => {
    if (!config.enabled || !config.recipientEmail) {
      console.log('Security alerts disabled or no recipient configured');
      return false;
    }

    // Check if this alert type is enabled
    if (params.alertType === 'ip_blocked' && !config.alertOnAutoBlock) return false;
    if (params.alertType === 'critical_event' && !config.alertOnCriticalEvents) return false;
    if (params.alertType === 'suspicious_activity' && !config.alertOnSuspiciousActivity) return false;

    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('security-alerts', {
        body: {
          alert_type: params.alertType,
          ip_address: params.ipAddress,
          country: params.country,
          city: params.city,
          reason: params.reason,
          threat_level: params.threatLevel,
          recipient_email: config.recipientEmail,
          details: params.details
        }
      });

      if (error) throw error;

      if (data?.success) {
        console.log('Security alert sent successfully');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to send security alert:', err);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [config]);

  const sendTestAlert = useCallback(async () => {
    if (!config.recipientEmail) {
      toast.error('Please configure a recipient email first');
      return false;
    }

    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('security-alerts', {
        body: {
          alert_type: 'ip_blocked',
          ip_address: '192.168.1.1',
          country: 'Test Country',
          city: 'Test City',
          reason: 'This is a test alert to verify your email configuration',
          threat_level: 'medium',
          recipient_email: config.recipientEmail
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Test alert sent! Check your email.');
        return true;
      }
      
      toast.error('Failed to send test alert');
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send test alert';
      toast.error(message);
      console.error('Failed to send test alert:', err);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [config.recipientEmail]);

  return {
    config,
    updateConfig,
    sendAlert,
    sendTestAlert,
    isSending
  };
}



