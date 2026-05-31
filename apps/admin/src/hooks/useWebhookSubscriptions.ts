import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

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

type WebhookEventType = typeof WEBHOOK_EVENT_TYPES[number]['value'];

function generateSigningSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = 'whsec_';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

export function useWebhookSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;

  const fetchSubscriptions = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to our interface
      const mapped: WebhookSubscription[] = (data || []).map(item => ({
        id: item.id,
        tenant_id: item.tenant_id,
        name: item.name,
        url: item.url,
        signing_secret: item.signing_secret,
        event_types: item.event_types as string[],
        is_enabled: item.is_enabled,
        headers: typeof item.headers === 'object' && item.headers !== null ? item.headers as Record<string, string> : {},
        retry_count: item.retry_count,
        timeout_seconds: item.timeout_seconds,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      
      setSubscriptions(mapped);
    } catch (error) {
      console.error('Error fetching webhook subscriptions:', error);
      toast.error('Failed to load webhook subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  const fetchDeliveryLogs = useCallback(async (subscriptionId?: string) => {
    if (!tenantId) return;
    
    try {
      let query = supabase
        .from('webhook_delivery_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (subscriptionId) {
        query = query.eq('subscription_id', subscriptionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Map the data
      const mapped: WebhookDeliveryLog[] = (data || []).map(item => ({
        id: item.id,
        webhook_event_id: item.webhook_event_id || '',
        subscription_id: item.subscription_id || '',
        status: item.status as WebhookDeliveryLog['status'],
        attempt_number: item.attempt_number,
        request_url: item.request_url,
        request_body: item.request_body,
        response_status_code: item.response_status_code,
        response_body: item.response_body,
        error_message: item.error_message,
        duration_ms: item.duration_ms,
        created_at: item.created_at,
        completed_at: item.completed_at,
      }));
      
      setDeliveryLogs(mapped);
    } catch (error) {
      console.error('Error fetching delivery logs:', error);
    }
  }, [tenantId]);

  const createSubscription = useCallback(async (input: CreateWebhookInput): Promise<WebhookSubscription | null> => {
    if (!tenantId) return null;
    
    try {
      const eventTypes = input.event_types as WebhookEventType[];
      
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .insert({
          tenant_id: tenantId,
          name: input.name,
          url: input.url,
          signing_secret: generateSigningSecret(),
          event_types: eventTypes,
          headers: input.headers || {},
          retry_count: input.retry_count || 3,
          timeout_seconds: input.timeout_seconds || 30,
          is_enabled: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Webhook subscription created');
      await fetchSubscriptions();
      
      return {
        id: data.id,
        tenant_id: data.tenant_id,
        name: data.name,
        url: data.url,
        signing_secret: data.signing_secret,
        event_types: data.event_types as string[],
        is_enabled: data.is_enabled,
        headers: typeof data.headers === 'object' && data.headers !== null ? data.headers as Record<string, string> : {},
        retry_count: data.retry_count,
        timeout_seconds: data.timeout_seconds,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error: unknown) {
      console.error('Error creating webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create webhook';
      toast.error(errorMessage);
      return null;
    }
  }, [tenantId, fetchSubscriptions]);

  const updateSubscription = useCallback(async (
    id: string, 
    updates: Partial<CreateWebhookInput & { is_enabled: boolean }>
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.url !== undefined) updateData.url = updates.url;
      if (updates.event_types !== undefined) updateData.event_types = updates.event_types as WebhookEventType[];
      if (updates.headers !== undefined) updateData.headers = updates.headers;
      if (updates.retry_count !== undefined) updateData.retry_count = updates.retry_count;
      if (updates.timeout_seconds !== undefined) updateData.timeout_seconds = updates.timeout_seconds;
      if (updates.is_enabled !== undefined) updateData.is_enabled = updates.is_enabled;

      const { error } = await supabase
        .from('webhook_subscriptions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Webhook subscription updated');
      await fetchSubscriptions();
      return true;
    } catch (error: unknown) {
      console.error('Error updating webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update webhook';
      toast.error(errorMessage);
      return false;
    }
  }, [fetchSubscriptions]);

  const deleteSubscription = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Webhook subscription deleted');
      await fetchSubscriptions();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete webhook';
      toast.error(errorMessage);
      return false;
    }
  }, [fetchSubscriptions]);

  const regenerateSecret = useCallback(async (id: string): Promise<string | null> => {
    try {
      const newSecret = generateSigningSecret();
      const { error } = await supabase
        .from('webhook_subscriptions')
        .update({
          signing_secret: newSecret,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Signing secret regenerated');
      await fetchSubscriptions();
      return newSecret;
    } catch (error: unknown) {
      console.error('Error regenerating secret:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate secret';
      toast.error(errorMessage);
      return null;
    }
  }, [fetchSubscriptions]);

  useEffect(() => {
    fetchSubscriptions();
    fetchDeliveryLogs();
  }, [fetchSubscriptions, fetchDeliveryLogs]);

  // Subscribe to realtime delivery log updates
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('webhook-delivery-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhook_delivery_logs',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchDeliveryLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchDeliveryLogs]);

  return {
    subscriptions,
    deliveryLogs,
    isLoading,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    regenerateSecret,
    refreshSubscriptions: fetchSubscriptions,
    refreshDeliveryLogs: fetchDeliveryLogs,
  };
}



