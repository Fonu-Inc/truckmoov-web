import { useCallback } from 'react';

export type DeviceLifecycleStatus =
  | 'registered'
  | 'config_pending'
  | 'configured'
  | 'verified_online'
  | 'assignable'
  | 'assigned'
  | 'faulty'
  | 'decommissioned';

export interface LifecycleTransitionResult {
  success: boolean;
  previous_status?: DeviceLifecycleStatus;
  new_status?: DeviceLifecycleStatus;
  error?: string;
}

export interface AssignmentValidation {
  can_assign: boolean;
  reason?: string;
}

// Status display configuration
export const lifecycleStatusConfig: Record<DeviceLifecycleStatus, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  registered: {
    label: 'Registered',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Device registered, awaiting configuration',
  },
  config_pending: {
    label: 'Config Pending',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'Waiting for installer to configure device',
  },
  configured: {
    label: 'Configured',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Device configured, awaiting first telemetry',
  },
  verified_online: {
    label: 'Verified Online',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    description: 'Telemetry verified, device is online',
  },
  assignable: {
    label: 'Assignable',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Ready to be assigned to a vehicle',
  },
  assigned: {
    label: 'Assigned',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    description: 'Currently assigned to a vehicle',
  },
  faulty: {
    label: 'Faulty',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Device reported as faulty',
  },
  decommissioned: {
    label: 'Decommissioned',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Device is no longer in use',
  },
};

// Valid state transitions
export const validTransitions: Record<DeviceLifecycleStatus, DeviceLifecycleStatus[]> = {
  registered: ['config_pending'],
  config_pending: ['configured', 'faulty'],
  configured: ['verified_online', 'faulty'],
  verified_online: ['assignable', 'faulty'],
  assignable: ['assigned', 'faulty'],
  assigned: ['assignable', 'faulty', 'decommissioned'],
  faulty: ['config_pending', 'decommissioned'],
  decommissioned: [],
};

export function useDeviceLifecycle() {
  const transitionDevice = useCallback(async (
    _deviceId: string,
    _newStatus: DeviceLifecycleStatus
  ): Promise<LifecycleTransitionResult> => {
    return { success: false, error: 'Not implemented' };
  }, []);

  const canAssignToVehicle = useCallback(async (
    _deviceId: string,
    _vehicleId: string
  ): Promise<AssignmentValidation> => {
    return { can_assign: false, reason: 'Not implemented' };
  }, []);

  const markAsConfigured = useCallback(async (_deviceId: string) => {
    return { success: false, error: 'Not implemented' };
  }, []);

  const markAsFaulty = useCallback(async (_deviceId: string, _reason?: string) => {
    return { success: false, error: 'Not implemented' };
  }, []);

  const decommissionDevice = useCallback(async (_deviceId: string) => {
    return { success: false, error: 'Not implemented' };
  }, []);

  const getAvailableTransitions = useCallback((currentStatus: DeviceLifecycleStatus) => {
    return validTransitions[currentStatus] || [];
  }, []);

  const isAssignable = useCallback((status: DeviceLifecycleStatus) => {
    return status === 'assignable' || status === 'verified_online';
  }, []);

  return {
    transitionDevice,
    canAssignToVehicle,
    markAsConfigured,
    markAsFaulty,
    decommissionDevice,
    getAvailableTransitions,
    isAssignable,
    lifecycleStatusConfig,
    validTransitions,
  };
}
