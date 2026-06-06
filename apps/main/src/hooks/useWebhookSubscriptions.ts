import { useAuthStore } from '@/stores/authStore';

export interface WebhookSubscription {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  signing_secret: string;
  event_types: string[];
  is_enabled: boolean;
  headers: Record<string, string>;
  retry_count: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhook_event_id: string;
  subscription_id: string;
  status: 'pending' | 'success' | 'failed' | 'retrying' | 'dead_letter';
  attempt_number: number;
  request_url: string;
  request_body: unknown;
  response_status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  event_types: string[];
  headers?: Record<string, string>;
  retry_count?: number;
  timeout_seconds?: number;
}

export const WEBHOOK_EVENT_TYPES = [
  { value: 'job.created', label: 'Job Created', category: 'Jobs' },
  { value: 'job.updated', label: 'Job Updated', category: 'Jobs' },
  { value: 'job.offer.sent', label: 'Job Offer Sent', category: 'Jobs' },
  { value: 'job.offer.accepted', label: 'Job Offer Accepted', category: 'Jobs' },
  { value: 'job.offer.declined', label: 'Job Offer Declined', category: 'Jobs' },
  { value: 'job.completed', label: 'Job Completed', category: 'Jobs' },
  { value: 'job.cancelled', label: 'Job Cancelled', category: 'Jobs' },
  { value: 'geofence.enter', label: 'Geofence Entry', category: 'Geofencing' },
  { value: 'geofence.exit', label: 'Geofence Exit', category: 'Geofencing' },
  { value: 'geofence.dwell.exceeded', label: 'Geofence Dwell Exceeded', category: 'Geofencing' },
  { value: 'device.status.changed', label: 'Device Status Changed', category: 'Fleet' },
  { value: 'sla.breached', label: 'SLA Breached', category: 'Operations' },
  { value: 'maintenance.due', label: 'Maintenance Due', category: 'Operations' },
  { value: 'fuel.anomaly.detected', label: 'Fuel Anomaly Detected', category: 'Operations' },
  { value: 'alert.created', label: 'Alert Created', category: 'Alerts' },
] as const;

export function useWebhookSubscriptions() {
  const { user } = useAuthStore();

  return {
    subscriptions: [] as WebhookSubscription[],
    deliveryLogs: [] as WebhookDeliveryLog[],
    isLoading: false,
    createSubscription: async (_input: CreateWebhookInput): Promise<WebhookSubscription | null> => null,
    updateSubscription: async (
      _id: string,
      _updates: Partial<CreateWebhookInput & { is_enabled: boolean }>
    ): Promise<boolean> => false,
    deleteSubscription: async (_id: string): Promise<boolean> => false,
    regenerateSecret: async (_id: string): Promise<string | null> => null,
    refreshSubscriptions: async () => {},
    refreshDeliveryLogs: async (_subscriptionId?: string) => {},
  };
}
