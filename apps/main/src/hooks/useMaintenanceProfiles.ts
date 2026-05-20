import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { logActivity } from './useActivityLogs';
import { useOrgDataScope } from '@/hooks/useOrgDataScope';
import { isFreshActivation } from "@/lib/freshActivation";

// Lagos Express Logistics tenant UUID (for demo mode)
const DEMO_TENANT_ID = "f7f5af88-fd76-4439-aae3-0461be52f63f";
const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

export type MaintenanceIntervalType = 'date' | 'mileage' | 'both';
export type MaintenanceLifecycleStatus = 'upcoming' | 'due' | 'overdue' | 'completed';

export interface MaintenanceProfile {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  service_type: string;
  service_label?: string | null;
  interval_type: MaintenanceIntervalType;
  interval_days?: number | null;
  interval_months?: number | null;
  interval_km?: number | null;
  interval_engine_hours?: number | null;
  last_service_date?: string | null;
  last_service_mileage?: number | null;
  last_service_engine_hours?: number | null;
  next_due_date?: string | null;
  next_due_mileage?: number | null;
  next_due_engine_hours?: number | null;
  due_soon_days: number;
  due_soon_km: number;
  lifecycle_status: MaintenanceLifecycleStatus;
  is_archived: boolean;
  due_alert_sent: boolean;
  overdue_alert_sent: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joined fields
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  current_mileage?: number | null;
  current_engine_hours?: number | null;
  mileage_source?: string | null;
  engine_hours_source?: string | null;
}

export interface MaintenanceProfileInput {
  vehicle_id: string;
  service_type: string;
  service_label?: string | null;
  interval_type: MaintenanceIntervalType;
  interval_days?: number | null;
  interval_months?: number | null;
  interval_km?: number | null;
  interval_engine_hours?: number | null;
  last_service_date?: string | null;
  last_service_mileage?: number | null;
  last_service_engine_hours?: number | null;
  next_due_date?: string | null;
  next_due_mileage?: number | null;
  next_due_engine_hours?: number | null;
  due_soon_days?: number;
  due_soon_km?: number;
}

export const SERVICE_TYPES = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'brake_service', label: 'Brake Service' },
  { value: 'tire_rotation', label: 'Tire Rotation' },
  { value: 'inspection', label: 'General Inspection' },
  { value: 'transmission', label: 'Transmission Service' },
  { value: 'coolant', label: 'Coolant Flush' },
  { value: 'air_filter', label: 'Air Filter' },
  { value: 'battery', label: 'Battery Service' },
  { value: 'custom', label: 'Custom' },
];

export function useMaintenanceProfiles() {
  const [profiles, setProfiles] = useState<MaintenanceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const orgScope = useOrgDataScope();
  const assetOrgIdsKey = JSON.stringify(orgScope.assetOrgIds);
  const stableAssetOrgIds = useMemo(() => orgScope.assetOrgIds, [assetOrgIdsKey]);

  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) && !isFreshActivation() : false;
  const tenantId = isDemoUser ? DEMO_TENANT_ID : user?.tenantId;

  const fetchProfiles = useCallback(async () => {
    const effectiveTenantId = isDemoUser ? DEMO_TENANT_ID : tenantId;
    if (!effectiveTenantId) {
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch profiles with vehicle info
      let query = supabase
        .from('maintenance_profiles')
        .select(`
          *,
          vehicles!inner(registration_number, make, model, current_mileage, current_engine_hours, mileage_source, engine_hours_source, owning_org_id)
        `)
        .eq('tenant_id', effectiveTenantId)
        .eq('is_archived', false)
        .order('next_due_date', { ascending: true, nullsFirst: false });

      // Apply org-level filter via vehicle's owning_org_id
      if (orgScope.multiStakeholderEnabled && stableAssetOrgIds.length > 0 && user?.role !== 'platform_admin') {
        query = query.in('vehicles.owning_org_id', stableAssetOrgIds);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mapped: MaintenanceProfile[] = (data || []).map((p: any) => ({
        ...p,
        interval_type: p.interval_type as MaintenanceIntervalType,
        lifecycle_status: p.lifecycle_status as MaintenanceLifecycleStatus,
        vehicle_registration: p.vehicles?.registration_number,
        vehicle_make: p.vehicles?.make,
        vehicle_model: p.vehicles?.model,
        current_mileage: p.vehicles?.current_mileage,
        current_engine_hours: p.vehicles?.current_engine_hours,
        mileage_source: p.vehicles?.mileage_source,
        engine_hours_source: p.vehicles?.engine_hours_source,
      }));

      setProfiles(mapped);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch maintenance profiles';
      setError(message);
      console.error('Error fetching maintenance profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, isDemoUser, orgScope.multiStakeholderEnabled, stableAssetOrgIds, user?.role]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const addProfile = async (input: MaintenanceProfileInput) => {
    if (!tenantId) {
      toast.error('No tenant assigned');
      return null;
    }

    try {
      // Calculate next due date if not provided
      let nextDueDate = input.next_due_date;
      if (!nextDueDate && input.interval_type !== 'mileage') {
        const now = new Date();
        if (input.interval_days) {
          nextDueDate = new Date(now.getTime() + input.interval_days * 24 * 60 * 60 * 1000).toISOString();
        } else if (input.interval_months) {
          nextDueDate = new Date(now.setMonth(now.getMonth() + input.interval_months)).toISOString();
        }
      }

      const { data, error: insertError } = await supabase
        .from('maintenance_profiles')
        .insert({
          tenant_id: tenantId,
          vehicle_id: input.vehicle_id,
          service_type: input.service_type,
          service_label: input.service_label,
          interval_type: input.interval_type,
          interval_days: input.interval_days,
          interval_months: input.interval_months,
          interval_km: input.interval_km,
          last_service_date: input.last_service_date,
          last_service_mileage: input.last_service_mileage,
          next_due_date: nextDueDate,
          next_due_mileage: input.next_due_mileage,
          due_soon_days: input.due_soon_days ?? 7,
          due_soon_km: input.due_soon_km ?? 500,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await logActivity({
        entityType: 'maintenance_profile',
        entityId: data.id,
        action: 'created',
        description: `Maintenance profile "${input.service_type}" created`,
        tenantId,
        actorId: user?.id,
        actorName: user?.name,
      });

      await fetchProfiles();
      toast.success('Maintenance profile created');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create maintenance profile';
      toast.error(message);
      throw err;
    }
  };

  const updateProfile = async (id: string, updates: Partial<MaintenanceProfileInput>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('maintenance_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchProfiles();
      toast.success('Maintenance profile updated');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update maintenance profile';
      toast.error(message);
      throw err;
    }
  };

  const archiveProfile = async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from('maintenance_profiles')
        .update({ is_archived: true })
        .eq('id', id);

      if (updateError) throw updateError;

      setProfiles(prev => prev.filter(p => p.id !== id));
      toast.success('Maintenance profile archived');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive maintenance profile';
      toast.error(message);
      throw err;
    }
  };

  const completeService = async (id: string, completionMileage?: number, cost?: number, notes?: string) => {
    try {
      const { data, error: rpcError } = await supabase.rpc('complete_maintenance_profile', {
        p_profile_id: id,
        p_completion_mileage: completionMileage ?? null,
        p_completion_cost: cost ?? null,
        p_notes: notes ?? null,
      });

      if (rpcError) throw rpcError;

      // Parse the JSON response
      const result = data as { success?: boolean; error?: string; next_due_date?: string; next_due_mileage?: number } | null;

      if (result && !result.success) {
        throw new Error(result.error || 'Failed to complete maintenance');
      }

      await logActivity({
        entityType: 'maintenance_profile',
        entityId: id,
        action: 'completed',
        description: `Maintenance completed${cost ? ` (₦${cost.toLocaleString()})` : ''}`,
        tenantId: tenantId || '',
        actorId: user?.id,
        actorName: user?.name,
      });

      await fetchProfiles();
      toast.success('Maintenance completed', {
        description: result?.next_due_date 
          ? `Next service due: ${new Date(result.next_due_date).toLocaleDateString()}`
          : undefined,
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete maintenance';
      toast.error(message);
      throw err;
    }
  };

  // Computed statistics
  const stats = {
    upcoming: profiles.filter(p => p.lifecycle_status === 'upcoming').length,
    due: profiles.filter(p => p.lifecycle_status === 'due').length,
    overdue: profiles.filter(p => p.lifecycle_status === 'overdue').length,
    total: profiles.length,
  };

  // Group profiles by status
  const groupedProfiles = {
    overdue: profiles.filter(p => p.lifecycle_status === 'overdue'),
    due: profiles.filter(p => p.lifecycle_status === 'due'),
    upcoming: profiles.filter(p => p.lifecycle_status === 'upcoming'),
  };

  return {
    profiles,
    groupedProfiles,
    stats,
    isLoading,
    error,
    fetchProfiles,
    addProfile,
    updateProfile,
    archiveProfile,
    completeService,
  };
}
