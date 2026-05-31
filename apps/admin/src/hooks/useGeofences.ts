import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useOrgDataScope } from '@/hooks/useOrgDataScope';
import { useMemo } from 'react';

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
  // Joined data
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
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const tenantId = user?.tenantId;
  const orgScope = useOrgDataScope();
  const assetOrgIdsKey = JSON.stringify(orgScope.assetOrgIds);
  const stableAssetOrgIds = useMemo(() => orgScope.assetOrgIds, [assetOrgIdsKey]);

  // Fetch all geofences for tenant
  const { data: geofences, isLoading, error, refetch } = useQuery({
    queryKey: ['geofences', tenantId, assetOrgIdsKey],
    queryFn: async () => {
      let query = supabase
        .from('geofences')
        .select(`
          *,
          vehicle_geofences (*)
        `)
        .order('name', { ascending: true });

      // Apply org-level filter when multi-stakeholder is enabled
      if (orgScope.multiStakeholderEnabled && stableAssetOrgIds.length > 0 && user?.role !== 'platform_admin') {
        query = query.in('org_id', stableAssetOrgIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map to include assignedVehicleIds
      return (data || []).map((g: any) => ({
        ...g,
        assignedVehicleIds: (g.vehicle_geofences || [])
          .filter((vg: VehicleGeofence) => vg.is_active)
          .map((vg: VehicleGeofence) => vg.vehicle_id),
      })) as GeofenceWithAssignments[];
    },
    enabled: !!user,
  });

  // Fetch active geofences only (for maps)
  const { data: activeGeofences } = useQuery({
    queryKey: ['geofences', tenantId, 'active', assetOrgIdsKey],
    queryFn: async () => {
      let query = supabase
        .from('geofences')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name', { ascending: true });

      // Apply org-level filter
      if (orgScope.multiStakeholderEnabled && stableAssetOrgIds.length > 0 && user?.role !== 'platform_admin') {
        query = query.in('org_id', stableAssetOrgIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as Geofence[];
    },
    enabled: !!user,
  });

  // Create geofence
  const createGeofence = useMutation({
    mutationFn: async (input: CreateGeofenceInput) => {
      if (!tenantId) throw new Error('No tenant context');

      const { data, error } = await supabase
        .from('geofences')
        .insert({
          tenant_id: tenantId,
          name: input.name,
          category: input.category,
          geofence_type: input.geofence_type,
          geometry: input.geometry,
          radius_meters: input.radius_meters,
          color: input.color || '#3b82f6',
          alert_on_entry: input.alert_on_entry ?? true,
          alert_on_exit: input.alert_on_exit ?? true,
          alert_on_dwell: input.alert_on_dwell ?? false,
          dwell_threshold_minutes: input.dwell_threshold_minutes,
          speed_limit_kmh: input.speed_limit_kmh,
          schedule_enabled: input.schedule_enabled ?? false,
          schedule_days: input.schedule_days,
          schedule_start_time: input.schedule_start_time,
          schedule_end_time: input.schedule_end_time,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      toast.success('Geofence created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create geofence', { description: error.message });
    },
  });

  // Update geofence
  const updateGeofence = useMutation({
    mutationFn: async (input: UpdateGeofenceInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('geofences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      toast.success('Geofence updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update geofence', { description: error.message });
    },
  });

  // Archive geofence (soft delete)
  const archiveGeofence = useMutation({
    mutationFn: async (geofenceId: string) => {
      const { error } = await supabase
        .from('geofences')
        .update({ status: 'ARCHIVED' })
        .eq('id', geofenceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      toast.success('Geofence archived');
    },
    onError: (error) => {
      toast.error('Failed to archive geofence', { description: error.message });
    },
  });

  // Delete geofence (hard delete)
  const deleteGeofence = useMutation({
    mutationFn: async (geofenceId: string) => {
      const { error } = await supabase
        .from('geofences')
        .delete()
        .eq('id', geofenceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      toast.success('Geofence deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete geofence', { description: error.message });
    },
  });

  // Assign vehicles to geofence
  const assignVehicles = useMutation({
    mutationFn: async ({ geofenceId, vehicleIds }: { geofenceId: string; vehicleIds: string[] }) => {
      if (!tenantId) throw new Error('No tenant context');

      // First, deactivate all existing assignments
      await supabase
        .from('vehicle_geofences')
        .update({ is_active: false })
        .eq('geofence_id', geofenceId);

      // Then, upsert new assignments
      if (vehicleIds.length > 0) {
        const assignments = vehicleIds.map((vehicleId) => ({
          tenant_id: tenantId,
          vehicle_id: vehicleId,
          geofence_id: geofenceId,
          is_active: true,
        }));

        const { error } = await supabase
          .from('vehicle_geofences')
          .upsert(assignments, { onConflict: 'vehicle_id,geofence_id' });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-geofence-states'] });
      toast.success('Vehicle assignments updated');
    },
    onError: (error) => {
      toast.error('Failed to assign vehicles', { description: error.message });
    },
  });

  return {
    geofences,
    activeGeofences,
    isLoading,
    error,
    refetch,
    createGeofence,
    updateGeofence,
    archiveGeofence,
    deleteGeofence,
    assignVehicles,
  };
}

// Hook for vehicle geofence states (current INSIDE/OUTSIDE status)
export function useVehicleGeofenceStates(vehicleId?: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['vehicle-geofence-states', vehicleId],
    queryFn: async () => {
      let query = supabase
        .from('vehicle_geofence_states')
        .select(`
          *,
          geofence:geofences(*)
        `)
        .order('last_evaluated_at', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as (VehicleGeofenceState & { geofence: Geofence })[];
    },
    enabled: !!user,
  });
}

// Hook for geofence events (audit trail)
export function useGeofenceEvents(options?: {
  vehicleId?: string;
  geofenceId?: string;
  limit?: number;
}) {
  const { user } = useAuthStore();
  const { vehicleId, geofenceId, limit = 50 } = options || {};

  return useQuery({
    queryKey: ['geofence-events', vehicleId, geofenceId, limit],
    queryFn: async () => {
      let query = supabase
        .from('geofence_events')
        .select(`
          *,
          geofence:geofences(id, name, category, color)
        `)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }
      if (geofenceId) {
        query = query.eq('geofence_id', geofenceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GeofenceEvent[];
    },
    enabled: !!user,
  });
}

// Hook for geofence permissions (org-scoped)
export function useGeofencePermissions() {
  const { user } = useAuthStore();
  const isPlatformAdmin = user?.role === 'platform_admin';

  // Org-scoped: ADMIN and OPS_MANAGER can manage geofences
  // All org members can view alerts. Server-side RLS enforces data isolation.
  return {
    canManageGeofences: isPlatformAdmin || ['tenant_admin', 'operations_manager'].includes(user?.role || ''),
    canAssignGeofences: isPlatformAdmin || ['tenant_admin', 'operations_manager'].includes(user?.role || ''),
    canViewGeofenceAlerts: true,
  };
}



