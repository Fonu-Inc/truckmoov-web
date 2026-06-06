import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { DeviceWithTelemetry } from './useDeviceTelemetry';
import { DeviceLifecycleStatus } from './useDeviceLifecycle';

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

export function useInstallerConfig(_tenantId?: string) {
  const { user } = useAuthStore();

  const configQueueDevices: ConfigQueueDevice[] = [];
  const installationEvents: InstallationEvent[] = [];
  const loading = false;
  const error: string | null = null;

  const fetchDeviceEvents = async (_deviceId: string): Promise<InstallationEvent[]> => [];
  const logInstallationEvent = async (
    _deviceId: string,
    _eventType: InstallationEvent['event_type'],
    _previousStatus: string | null,
    _newStatus: string | null,
    _metadata: Record<string, unknown> = {}
  ) => {};
  const markConfigured = async (_deviceId: string, _notes?: string) => ({ success: false });
  const resetToConfigPending = async (_deviceId: string, _reason: string) => ({ success: false });
  const recordVerificationFailure = async (_deviceId: string, _errorCode: string, _errorMessage: string) => {};

  const canConfigureDevices = useCallback(() => {
    const role = user?.role as string;
    return role === 'tenant_admin' || role === 'operations_manager' || role === 'platform_admin' || role === 'installer';
  }, [user]);

  const canResetDevices = useCallback(() => {
    const role = user?.role as string;
    return role === 'tenant_admin' || role === 'operations_manager' || role === 'platform_admin';
  }, [user]);

  return {
    configQueueDevices,
    installationEvents,
    loading,
    error,
    refetch: () => {},
    fetchDeviceEvents,
    markConfigured,
    resetToConfigPending,
    recordVerificationFailure,
    logInstallationEvent,
    canConfigureDevices,
    canResetDevices,
  };
}
