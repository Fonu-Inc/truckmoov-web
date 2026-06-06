import { useState, useCallback } from 'react';

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
  const [isLoading] = useState(false);

  const notifyNewJob = useCallback(async (
    _driverPhone: string,
    _jobDetails: JobDetails,
    _options?: { driverName?: string; jobId?: string; language?: Language; tenantId?: string; enableSmsFallback?: boolean }
  ): Promise<NotificationResult | null> => null, []);

  const notifyJobUpdate = useCallback(async (
    _driverPhone: string,
    _jobDetails: Partial<JobDetails>,
    _options?: { driverName?: string; language?: Language }
  ): Promise<NotificationResult | null> => null, []);

  const notifyUrgent = useCallback(async (
    _driverPhone: string,
    _jobDetails: JobDetails,
    _options?: { driverName?: string; jobId?: string; language?: Language; tenantId?: string; enableSmsFallback?: boolean }
  ): Promise<NotificationResult | null> => null, []);

  const sendSmsFallback = useCallback(async (
    _driverPhone: string,
    _jobDetails: JobDetails,
    _options?: { driverName?: string; jobId?: string; language?: Language; tenantId?: string }
  ): Promise<NotificationResult | null> => null, []);

  const getNotificationStatus = useCallback(async (
    _notificationId: string
  ): Promise<NotificationResult | null> => null, []);

  return {
    isLoading,
    notifyNewJob,
    notifyJobUpdate,
    notifyUrgent,
    sendSmsFallback,
    getNotificationStatus,
  };
}
