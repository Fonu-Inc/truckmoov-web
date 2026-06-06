import { useState, useCallback } from 'react';
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

  const [isSending] = useState(false);

  const updateConfig = useCallback((updates: Partial<SecurityAlertConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      return newConfig;
    });
  }, []);

  const sendAlert = useCallback(async (_params: {
    alertType: 'ip_blocked' | 'critical_event' | 'suspicious_activity';
    ipAddress?: string;
    country?: string;
    city?: string;
    reason?: string;
    threatLevel?: string;
    details?: Record<string, unknown>;
  }) => {
    return false;
  }, [config]);

  const sendTestAlert = useCallback(async () => {
    if (!config.recipientEmail) {
      toast.error('Please configure a recipient email first');
      return false;
    }
    return false;
  }, [config.recipientEmail]);

  return {
    config,
    updateConfig,
    sendAlert,
    sendTestAlert,
    isSending
  };
}
