import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { DeviceWithTelemetry } from './useDeviceTelemetry';
import { DeviceLifecycleStatus } from './useDeviceLifecycle';
import { toast } from 'sonner';

export interface InstallationEvent {
  id: string;
  tenant_id: string;
  device_id: string;
  event_type: 'registered' | 'config_marked' | 'verified' | 'failed_verify' | 'reset' | 'assigned' | 'unassigned';
  actor_id: string | null;
  actor_name: string | null;
  previous_status: string | null;
  new_status: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ConfigQueueDevice extends DeviceWithTelemetry {
  configured_by?: string | null;
  configured_at?: string | null;
  verification_status?: string | null;
  verification_error_code?: string | null;
  verification_error_message?: string | null;
  installer_id?: string | null;
  installer_notes?: string | null;
  catalog_id?: string | null;
}

export function useInstallerConfig(tenantId?: string) {
  const { user } = useAuthStore();
  const effectiveTenantId = tenantId || user?.tenantId;
  
  const [configQueueDevices, setConfigQueueDevices] = useState<ConfigQueueDevice[]>([]);
  const [installationEvents, setInstallationEvents] = useState<InstallationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch devices in configuration pipeline (not assigned)
  const fetchConfigQueue = useCallback(async () => {
    if (!effectiveTenantId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('devices')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .in('lifecycle_status', ['registered', 'config_pending', 'configured', 'verified_online', 'assignable'])
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setConfigQueueDevices((data || []) as ConfigQueueDevice[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching config queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  }, [effectiveTenantId]);

  // Fetch installation events for a device
  const fetchDeviceEvents = useCallback(async (deviceId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('device_installation_events')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      return (data || []) as InstallationEvent[];
    } catch (err) {
      console.error('Error fetching device events:', err);
      return [];
    }
  }, []);

  // Log an installation event
  const logInstallationEvent = useCallback(async (
    deviceId: string,
    eventType: InstallationEvent['event_type'],
    previousStatus: string | null,
    newStatus: string | null,
    metadata: Record<string, unknown> = {}
  ) => {
    if (!effectiveTenantId) return;

    try {
      // Use type assertion since types may not be regenerated yet
      const { error: insertError } = await supabase
        .from('device_installation_events')
        .insert({
          tenant_id: effectiveTenantId,
          device_id: deviceId,
          event_type: eventType,
          actor_id: user?.id || null,
          actor_name: user?.name || null,
          previous_status: previousStatus,
          new_status: newStatus,
          metadata,
        } as any);

      if (insertError) throw insertError;
    } catch (err) {
      console.error('Error logging installation event:', err);
    }
  }, [effectiveTenantId, user]);

  // Mark device as configured
  const markConfigured = useCallback(async (
    deviceId: string,
    notes?: string
  ) => {
    try {
      // Get current device status
      const { data: device, error: fetchError } = await supabase
        .from('devices')
        .select('lifecycle_status')
        .eq('id', deviceId)
        .single();

      if (fetchError) throw fetchError;

      const previousStatus = device?.lifecycle_status || 'registered';

      // Update device
      const { error: updateError } = await supabase
        .from('devices')
        .update({
          lifecycle_status: 'configured',
          status: 'configured',
          configured_by: user?.id || null,
          configured_at: new Date().toISOString(),
          installer_notes: notes || null,
          verification_status: 'pending',
        })
        .eq('id', deviceId);

      if (updateError) throw updateError;

      // Log event
      await logInstallationEvent(
        deviceId,
        'config_marked',
        previousStatus,
        'configured',
        { notes, configured_by: user?.name }
      );

      toast.success('Device marked as configured', {
        description: 'Waiting for first telemetry signal...',
      });

      await fetchConfigQueue();
      return { success: true };
    } catch (err) {
      console.error('Error marking device configured:', err);
      toast.error('Failed to mark device as configured');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [user, logInstallationEvent, fetchConfigQueue]);

  // Reset device to config_pending (admin only)
  const resetToConfigPending = useCallback(async (
    deviceId: string,
    reason: string
  ) => {
    try {
      const { data: device, error: fetchError } = await supabase
        .from('devices')
        .select('lifecycle_status')
        .eq('id', deviceId)
        .single();

      if (fetchError) throw fetchError;

      const previousStatus = device?.lifecycle_status;

      const { error: updateError } = await supabase
        .from('devices')
        .update({
          lifecycle_status: 'config_pending',
          status: 'config_pending',
          verification_status: 'pending',
          verification_error_code: null,
          verification_error_message: null,
          configured_at: null,
          configured_by: null,
        })
        .eq('id', deviceId);

      if (updateError) throw updateError;

      await logInstallationEvent(
        deviceId,
        'reset',
        previousStatus,
        'config_pending',
        { reason, reset_by: user?.name }
      );

      toast.success('Device reset to Config Pending');
      await fetchConfigQueue();
      return { success: true };
    } catch (err) {
      console.error('Error resetting device:', err);
      toast.error('Failed to reset device');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [user, logInstallationEvent, fetchConfigQueue]);

  // Record verification failure
  const recordVerificationFailure = useCallback(async (
    deviceId: string,
    errorCode: string,
    errorMessage: string
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('devices')
        .update({
          verification_status: 'failed',
          verification_error_code: errorCode,
          verification_error_message: errorMessage,
        })
        .eq('id', deviceId);

      if (updateError) throw updateError;

      await logInstallationEvent(
        deviceId,
        'failed_verify',
        'configured',
        'configured',
        { error_code: errorCode, error_message: errorMessage }
      );
    } catch (err) {
      console.error('Error recording verification failure:', err);
    }
  }, [logInstallationEvent]);

  // Check if user can configure devices
  const canConfigureDevices = useCallback(() => {
    const role = user?.role as string;
    return role === 'tenant_admin' || role === 'operations_manager' || role === 'platform_admin' || role === 'installer';
  }, [user]);

  // Check if user can reset devices (admin only)
  const canResetDevices = useCallback(() => {
    const role = user?.role as string;
    return role === 'tenant_admin' || role === 'operations_manager' || role === 'platform_admin';
  }, [user]);

  useEffect(() => {
    fetchConfigQueue();
  }, [fetchConfigQueue]);

  return {
    configQueueDevices,
    installationEvents,
    loading,
    error,
    refetch: fetchConfigQueue,
    fetchDeviceEvents,
    markConfigured,
    resetToConfigPending,
    recordVerificationFailure,
    logInstallationEvent,
    canConfigureDevices,
    canResetDevices,
  };
}
