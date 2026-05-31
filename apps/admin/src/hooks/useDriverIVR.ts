import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Language = 'en' | 'ha' | 'yo' | 'ig' | 'pcm';

interface JobDetails {
  pickup: string;
  dropoff: string;
  cargo: string;
  amount: number;
  deadline?: string;
  distance?: string;
}

interface NotificationResult {
  success: boolean;
  notificationId?: string;
  callId?: string;
  smsId?: string;
  status?: string;
  driverResponse?: 'accepted' | 'rejected' | 'pending' | 'no_answer';
  smsSent?: boolean;
  error?: string;
}

interface UseDriverIVRReturn {
  isLoading: boolean;
  notifyNewJob: (
    driverPhone: string,
    jobDetails: JobDetails,
    options?: { driverName?: string; jobId?: string; language?: Language; tenantId?: string; enableSmsFallback?: boolean }
  ) => Promise<NotificationResult | null>;
  notifyJobUpdate: (
    driverPhone: string,
    jobDetails: Partial<JobDetails>,
    options?: { driverName?: string; language?: Language }
  ) => Promise<NotificationResult | null>;
  notifyUrgent: (
    driverPhone: string,
    jobDetails: JobDetails,
    options?: { driverName?: string; jobId?: string; language?: Language; tenantId?: string; enableSmsFallback?: boolean }
  ) => Promise<NotificationResult | null>;
  sendSmsFallback: (
    driverPhone: string,
    jobDetails: JobDetails,
    options?: { driverName?: string; jobId?: string; language?: Language; tenantId?: string }
  ) => Promise<NotificationResult | null>;
  getNotificationStatus: (notificationId: string) => Promise<NotificationResult | null>;
}

export function useDriverIVR(): UseDriverIVRReturn {
  const [isLoading, setIsLoading] = useState(false);

  const notifyNewJob = useCallback(async (
    driverPhone: string,
    jobDetails: JobDetails,
    options?: { driverName?: string; jobId?: string; language?: Language; tenantId?: string; enableSmsFallback?: boolean }
  ): Promise<NotificationResult | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('driver-ivr-notification', {
        body: {
          action: 'notify_new_job',
          driverPhone,
          driverName: options?.driverName,
          jobId: options?.jobId,
          tenantId: options?.tenantId,
          jobDetails,
          language: options?.language || 'en',
          enableSmsFallback: options?.enableSmsFallback ?? true,
        },
      });

      if (error) {
        console.error('IVR notification error:', error);
        toast.error('Failed to notify driver');
        return null;
      }

      if (data.smsSent) {
        toast.success('Driver notified via SMS (IVR unavailable)');
      } else {
        toast.success('Driver notification sent via IVR');
      }
      return data;
    } catch (err) {
      console.error('IVR notification error:', err);
      toast.error('Failed to connect to IVR service');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const notifyJobUpdate = useCallback(async (
    driverPhone: string,
    jobDetails: Partial<JobDetails>,
    options?: { driverName?: string; language?: Language }
  ): Promise<NotificationResult | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('driver-ivr-notification', {
        body: {
          action: 'notify_job_update',
          driverPhone,
          driverName: options?.driverName,
          jobDetails,
          language: options?.language || 'en',
        },
      });

      if (error) {
        console.error('IVR update notification error:', error);
        toast.error('Failed to send update notification');
        return null;
      }

      toast.success('Update notification sent');
      return data;
    } catch (err) {
      console.error('IVR update error:', err);
      toast.error('Failed to send update');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const notifyUrgent = useCallback(async (
    driverPhone: string,
    jobDetails: JobDetails,
    options?: { driverName?: string; jobId?: string; language?: Language; tenantId?: string; enableSmsFallback?: boolean }
  ): Promise<NotificationResult | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('driver-ivr-notification', {
        body: {
          action: 'notify_urgent',
          driverPhone,
          driverName: options?.driverName,
          jobId: options?.jobId,
          tenantId: options?.tenantId,
          jobDetails,
          language: options?.language || 'en',
          enableSmsFallback: options?.enableSmsFallback ?? true,
        },
      });

      if (error) {
        console.error('Urgent IVR notification error:', error);
        toast.error('Failed to send urgent notification');
        return null;
      }

      if (data.smsSent) {
        toast.success('Urgent notification sent via SMS (calls unavailable)');
      } else {
        toast.success('Urgent notification sent - multiple attempts enabled');
      }
      return data;
    } catch (err) {
      console.error('Urgent IVR error:', err);
      toast.error('Failed to send urgent notification');
      return null;
    } finally {
    setIsLoading(false);
    }
  }, []);

  const sendSmsFallback = useCallback(async (
    driverPhone: string,
    jobDetails: JobDetails,
    options?: { driverName?: string; jobId?: string; language?: Language; tenantId?: string }
  ): Promise<NotificationResult | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('driver-ivr-notification', {
        body: {
          action: 'send_sms_fallback',
          driverPhone,
          driverName: options?.driverName,
          jobId: options?.jobId,
          tenantId: options?.tenantId,
          jobDetails,
          language: options?.language || 'en',
        },
      });

      if (error) {
        console.error('SMS fallback error:', error);
        toast.error('Failed to send SMS');
        return null;
      }

      toast.success('SMS notification sent to driver');
      return data;
    } catch (err) {
      console.error('SMS fallback error:', err);
      toast.error('Failed to send SMS');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getNotificationStatus = useCallback(async (
    notificationId: string
  ): Promise<NotificationResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('driver-ivr-notification', {
        body: {
          action: 'get_notification_status',
          notificationId,
        },
      });

      if (error) {
        console.error('Get notification status error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Get status error:', err);
      return null;
    }
  }, []);

  return {
    isLoading,
    notifyNewJob,
    notifyJobUpdate,
    notifyUrgent,
    sendSmsFallback,
    getNotificationStatus,
  };
}



