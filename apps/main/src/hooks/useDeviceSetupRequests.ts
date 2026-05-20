import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useActiveOrgStore } from '@/stores/activeOrgStore';
import { toast } from 'sonner';

export type DeviceSetupRequestStatus =
  | 'pending_review'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_heartbeat'
  | 'active'
  | 'rejected'
  | 'cancelled';

export interface DeviceSetupRequest {
  id: string;
  tenant_id: string;
  requesting_org_id: string;
  requester_user_id: string;
  requester_name: string | null;
  manufacturer: string;
  model: string | null;
  catalog_id: string | null;
  imei: string;
  tracker_type: string;
  sim_iccid: string | null;
  needs_sim: boolean;
  linked_sim_request_id: string | null;
  vehicle_id: string | null;
  vehicle_name: string | null;
  installation_state: string | null;
  installation_city: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  device_photo_path: string | null;
  receipt_photo_path: string | null;
  status: DeviceSetupRequestStatus;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  configurator_org_id: string | null;
  assigned_at: string | null;
  resulting_device_id: string | null;
  is_support_mode: boolean;
  support_actor_id: string | null;
  requester_notes: string | null;
  configurator_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDeviceSetupRequest {
  manufacturer: string;
  model?: string;
  catalog_id?: string;
  // IMEI is required by the table; the minimal Get Started flow auto-generates a placeholder.
  imei?: string;
  tracker_type?: string;
  sim_iccid?: string;
  needs_sim?: boolean;
  vehicle_id?: string;
  vehicle_name?: string;
  installation_state?: string;
  installation_city?: string;
  preferred_date?: string;
  preferred_time?: string;
  device_photo_path?: string;
  receipt_photo_path?: string;
  requester_notes?: string;
  use_case?: string;
  quantity?: number;
}

export function useDeviceSetupRequests() {
  const { user } = useAuthStore();
  const orgCtx = useOrgContext();
  const { resolveActiveOrg } = useActiveOrgStore();
  const activeOrg = resolveActiveOrg(orgCtx.memberships);
  const activeOrgId = activeOrg?.orgId ?? null;

  const [requests, setRequests] = useState<DeviceSetupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('device_setup_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setRequests((data || []) as unknown as DeviceSetupRequest[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching device setup requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  const createRequest = useCallback(async (input: CreateDeviceSetupRequest) => {
    if (!user || !activeOrgId) {
      toast.error('No active organization');
      return null;
    }

    try {
      // Minimal Get Started flow may not provide IMEI/tracker_type yet; insert placeholders
      const placeholderImei =
        input.imei && input.imei.trim()
          ? input.imei.trim()
          : `PENDING-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const payload = {
        tenant_id: user.tenantId || '',
        requesting_org_id: activeOrgId,
        requester_user_id: user.id,
        requester_name: user.name || null,
        manufacturer: input.manufacturer,
        model: input.model || null,
        catalog_id: input.catalog_id || null,
        imei: placeholderImei,
        tracker_type: input.tracker_type || 'unspecified',
        use_case: input.use_case || null,
        quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
        sim_iccid: input.sim_iccid || null,
        needs_sim: input.needs_sim || false,
        vehicle_id: input.vehicle_id || null,
        vehicle_name: input.vehicle_name || null,
        installation_state: input.installation_state || null,
        installation_city: input.installation_city || null,
        preferred_date: input.preferred_date || null,
        preferred_time: input.preferred_time || null,
        device_photo_path: input.device_photo_path || null,
        receipt_photo_path: input.receipt_photo_path || null,
        requester_notes: input.requester_notes || null,
        status: 'pending_review',
      };

      const { data, error: insertError } = await supabase
        .from('device_setup_requests')
        .insert(payload as any)
        .select()
        .single();

      if (insertError) throw insertError;

      // Log the creation event
      await supabase.from('device_setup_request_events').insert({
        request_id: data.id,
        event_type: 'created',
        previous_status: null,
        new_status: 'pending_review',
        actor_id: user.id,
        actor_name: user.name || null,
      } as any);

      // If "I need SIM" is checked, create a linked SIM provisioning request
      if (input.needs_sim) {
        try {
          const { data: simRequest } = await supabase
            .from('sim_provisioning_requests')
            .insert({
              request_type: 'new_activation',
              tenant_id: user.tenantId || '',
              requested_by: user.id,
              requested_by_name: user.name || null,
              status: 'pending',
              number_of_sims: 1,
              notes: `Linked to device setup request. IMEI: ${input.imei}, Vehicle: ${input.vehicle_name || 'N/A'}`,
              use_case: 'vehicle_tracking',
              priority: 'normal',
            } as any)
            .select('id')
            .single();

          if (simRequest) {
            // Link the SIM request to the device setup request
            await supabase
              .from('device_setup_requests')
              .update({ linked_sim_request_id: simRequest.id })
              .eq('id', data.id);
          }
        } catch (simErr) {
          console.warn('Failed to create linked SIM request:', simErr);
          // Non-blocking — device request still succeeds
        }
      }

      toast.success('Device setup request submitted', {
        description: input.needs_sim
          ? 'Your request and SIM request are pending review.'
          : 'Your request is pending review.',
      });

      await fetchRequests();
      return data as unknown as DeviceSetupRequest;
    } catch (err) {
      console.error('Error creating device setup request:', err);
      toast.error('Failed to submit request');
      return null;
    }
  }, [user, activeOrgId, fetchRequests]);

  const updateRequestStatus = useCallback(async (
    requestId: string,
    newStatus: DeviceSetupRequestStatus,
    updates: Partial<{
      assigned_to_user_id: string;
      assigned_to_name: string;
      configurator_org_id: string;
      configurator_notes: string;
      rejection_reason: string;
      resulting_device_id: string;
      is_support_mode: boolean;
      support_actor_id: string;
    }> = {},
    notes?: string
  ) => {
    if (!user) return null;

    try {
      // Get current status
      const currentRequest = requests.find(r => r.id === requestId);
      const previousStatus = currentRequest?.status || 'pending_review';

      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        ...updates,
      };

      // Auto-set support_actor_id when support mode is enabled
      if (updates.is_support_mode) {
        updatePayload.support_actor_id = user.id;
      }

      if (newStatus === 'assigned' && !updates.assigned_to_user_id) {
        updatePayload.assigned_to_user_id = user.id;
        updatePayload.assigned_to_name = user.name || null;
        updatePayload.assigned_at = new Date().toISOString();
        updatePayload.configurator_org_id = activeOrgId || null;
      }

      const { error: updateError } = await supabase
        .from('device_setup_requests')
        .update(updatePayload)
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Log event
      await supabase.from('device_setup_request_events').insert({
        request_id: requestId,
        event_type: newStatus === 'assigned' ? 'assigned'
          : newStatus === 'in_progress' ? 'started'
          : newStatus === 'awaiting_heartbeat' ? 'heartbeat_waiting'
          : newStatus === 'active' ? 'completed'
          : newStatus === 'rejected' ? 'rejected'
          : newStatus === 'cancelled' ? 'cancelled'
          : newStatus,
        previous_status: previousStatus,
        new_status: newStatus,
        actor_id: user.id,
        actor_name: user.name || null,
        notes: notes || null,
      } as any);

      const statusLabels: Record<string, string> = {
        assigned: 'Request assigned',
        in_progress: 'Configuration in progress',
        awaiting_heartbeat: 'Waiting for device heartbeat',
        active: 'Device is now active!',
        rejected: 'Request rejected',
        cancelled: 'Request cancelled',
      };

      toast.success(statusLabels[newStatus] || 'Status updated');

      // Trigger WhatsApp notification + auto-link for key status transitions
      if (['assigned', 'awaiting_heartbeat', 'active'].includes(newStatus)) {
        try {
          await supabase.functions.invoke('device-setup-notify', {
            body: {
              requestId,
              newStatus,
              actorName: user.name || undefined,
              resultingDeviceId: updates.resulting_device_id || undefined,
            },
          });
        } catch (notifyErr) {
          console.warn('Notification send failed (non-blocking):', notifyErr);
        }
      }

      await fetchRequests();
      return true;
    } catch (err) {
      console.error('Error updating request:', err);
      toast.error('Failed to update request');
      return null;
    }
  }, [user, activeOrgId, requests, fetchRequests]);

  const uploadFile = useCallback(async (file: File, requestId: string, type: 'device_photo' | 'receipt') => {
    const path = `${requestId}/${type}_${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('device-setup-uploads')
      .upload(path, file);

    if (uploadError) {
      toast.error('Failed to upload file');
      return null;
    }
    return path;
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('device-setup-requests-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'device_setup_requests',
      }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Derived counts
  const pendingCount = requests.filter(r => r.status === 'pending_review').length;
  const assignedCount = requests.filter(r => r.status === 'assigned' || r.status === 'in_progress').length;
  const awaitingHeartbeatCount = requests.filter(r => r.status === 'awaiting_heartbeat').length;

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    createRequest,
    updateRequestStatus,
    uploadFile,
    pendingCount,
    assignedCount,
    awaitingHeartbeatCount,
  };
}
