import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  // Transition device to new state
  const transitionDevice = useCallback(async (
    deviceId: string,
    newStatus: DeviceLifecycleStatus
  ): Promise<LifecycleTransitionResult> => {
    try {
      const { data, error } = await supabase.rpc('transition_device_lifecycle', {
        p_device_id: deviceId,
        p_new_status: newStatus,
      }) as { data: LifecycleTransitionResult | null; error: unknown };

      if (error) throw error;

      const result = data as LifecycleTransitionResult || { success: false, error: 'No response' };
      
      if (result.success) {
        toast.success('Device status updated', {
          description: `Transitioned to ${lifecycleStatusConfig[newStatus].label}`,
        });
      } else {
        toast.error('Transition failed', {
          description: result.error,
        });
      }

      return result;
    } catch (err) {
      console.error('Error transitioning device:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Failed to update status', { description: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Check if device can be assigned to vehicle
  const canAssignToVehicle = useCallback(async (
    deviceId: string,
    vehicleId: string
  ): Promise<AssignmentValidation> => {
    try {
      const { data, error } = await supabase.rpc('can_assign_device_to_vehicle', {
        p_device_id: deviceId,
        p_vehicle_id: vehicleId,
      }) as { data: AssignmentValidation | null; error: unknown };

      if (error) throw error;

      return data as AssignmentValidation || { can_assign: false, reason: 'No response' };
    } catch (err) {
      console.error('Error checking assignment:', err);
      return { 
        can_assign: false, 
        reason: err instanceof Error ? err.message : 'Validation failed' 
      };
    }
  }, []);

  // Mark device as configured (by installer)
  const markAsConfigured = useCallback(async (deviceId: string) => {
    // First transition to config_pending if still registered
    const device = await supabase
      .from('devices')
      .select('lifecycle_status')
      .eq('id', deviceId)
      .single();

    if (device.data?.lifecycle_status === 'registered') {
      await transitionDevice(deviceId, 'config_pending');
    }

    return transitionDevice(deviceId, 'configured');
  }, [transitionDevice]);

  // Mark device as faulty
  const markAsFaulty = useCallback(async (deviceId: string, reason?: string) => {
    const result = await transitionDevice(deviceId, 'faulty');
    
    if (result.success && reason) {
      // Log the fault reason
      await supabase.from('security_audit_logs').insert({
        event_type: 'device_marked_faulty',
        severity: 'warn',
        description: `Device marked as faulty: ${reason}`,
        metadata: { device_id: deviceId, reason },
      });
    }

    return result;
  }, [transitionDevice]);

  // Decommission device
  const decommissionDevice = useCallback(async (deviceId: string) => {
    // First unassign if assigned
    const device = await supabase
      .from('devices')
      .select('lifecycle_status, vehicle_id')
      .eq('id', deviceId)
      .single();

    if (device.data?.lifecycle_status === 'assigned') {
      // Unassign first
      await supabase
        .from('devices')
        .update({ vehicle_id: null, lifecycle_status: 'assignable' })
        .eq('id', deviceId);
    }

    return transitionDevice(deviceId, 'decommissioned');
  }, [transitionDevice]);

  // Get available transitions for a status
  const getAvailableTransitions = useCallback((currentStatus: DeviceLifecycleStatus) => {
    return validTransitions[currentStatus] || [];
  }, []);

  // Check if assignment is allowed
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
