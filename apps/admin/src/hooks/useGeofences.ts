import { useAuthStore } from '@/stores/authStore';
import { useOrgDataScope } from '@/hooks/useOrgDataScope';

export type GeofenceType = 'CIRCLE' | 'POLYGON';
export type GeofenceStatus = 'ACTIVE' | 'ARCHIVED';
export type GeofenceCategory = 'depot' | 'delivery' | 'restricted' | 'customer' | 'custom';
export type GeofenceState = 'INSIDE' | 'OUTSIDE';
export type GeofenceEventType = 'ENTER' | 'EXIT';

export interface Geofence {
  id: string;
  tenant_id: string;
  name: string;
  category: GeofenceCategory;
  geofence_type: GeofenceType;
  geometry: {
    type: 'Point' | 'Polygon';
    coordinates: number[] | number[][][];
  };
  radius_meters: number | null;
  color: string;
  status: GeofenceStatus;
  alert_on_entry: boolean;
  alert_on_exit: boolean;
  alert_on_dwell: boolean;
  dwell_threshold_minutes: number | null;
  speed_limit_kmh: number | null;
  schedule_enabled: boolean;
  schedule_days: string[] | null;
  schedule_start_time: string | null;
  schedule_end_time: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleGeofence {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  geofence_id: string;
  is_active: boolean;
  created_at: string;
}

export interface VehicleGeofenceState {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  geofence_id: string;
  state: GeofenceState;
  consecutive_count: number;
  pending_state: GeofenceState | null;
  last_transition_at: string | null;
  last_evaluated_at: string;
}

export interface GeofenceEvent {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  geofence_id: string;
  event_type: GeofenceEventType;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  telemetry_id: string | null;
  job_id: string | null;
  milestone_type: string | null;
  occurred_at: string;
  created_at: string;
  geofence?: Geofence;
}

export interface GeofenceWithAssignments extends Geofence {
  vehicle_geofences?: VehicleGeofence[];
  assignedVehicleIds: string[];
}

export interface CreateGeofenceInput {
  name: string;
  category: GeofenceCategory;
  geofence_type: GeofenceType;
  geometry: { type: string; coordinates: number[] | number[][][] };
  radius_meters?: number | null;
  color?: string;
  alert_on_entry?: boolean;
  alert_on_exit?: boolean;
  alert_on_dwell?: boolean;
  dwell_threshold_minutes?: number;
  speed_limit_kmh?: number | null;
  schedule_enabled?: boolean;
  schedule_days?: string[];
  schedule_start_time?: string;
  schedule_end_time?: string;
}

export interface UpdateGeofenceInput extends Partial<CreateGeofenceInput> {
  id: string;
  status?: GeofenceStatus;
}

export function useGeofences() {
  const geofences: GeofenceWithAssignments[] = [];
  const activeGeofences: Geofence[] = [];
  const isLoading = false;
  const error = null;
  const refetch = () => {};

  const noOpMutation = {
    mutate: async (_input: any) => {},
    mutateAsync: async (_input: any) => {},
    isPending: false,
  };

  return {
    geofences,
    activeGeofences,
    isLoading,
    error,
    refetch,
    createGeofence: noOpMutation,
    updateGeofence: noOpMutation,
    archiveGeofence: noOpMutation,
    deleteGeofence: noOpMutation,
    assignVehicles: noOpMutation,
  };
}

export function useVehicleGeofenceStates(_vehicleId?: string) {
  return {
    data: [] as any[],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function useGeofenceEvents(_options?: {
  vehicleId?: string;
  geofenceId?: string;
  limit?: number;
}) {
  return {
    data: [] as any[],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function useGeofencePermissions() {
  const { user } = useAuthStore();
  const isPlatformAdmin = user?.role === 'platform_admin';

  return {
    canManageGeofences: isPlatformAdmin || ['tenant_admin', 'operations_manager'].includes(user?.role || ''),
    canAssignGeofences: isPlatformAdmin || ['tenant_admin', 'operations_manager'].includes(user?.role || ''),
    canViewGeofenceAlerts: true,
  };
}
