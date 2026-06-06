import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useActiveOrgStore } from '@/stores/activeOrgStore';

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

  const createRequest = useCallback(async (_input: CreateDeviceSetupRequest) => null, []);

  const updateRequestStatus = useCallback(async (
    _requestId: string,
    _newStatus: DeviceSetupRequestStatus,
    _updates: Partial<{
      assigned_to_user_id: string;
      assigned_to_name: string;
      configurator_org_id: string;
      configurator_notes: string;
      rejection_reason: string;
      resulting_device_id: string;
      is_support_mode: boolean;
      support_actor_id: string;
    }> = {},
    _notes?: string
  ) => null, []);

  const uploadFile = useCallback(async (_file: File, _requestId: string, _type: 'device_photo' | 'receipt') => null, []);

  return {
    requests: [] as DeviceSetupRequest[],
    loading: false,
    error: null as string | null,
    refetch: () => {},
    createRequest,
    updateRequestStatus,
    uploadFile,
    pendingCount: 0,
    assignedCount: 0,
    awaitingHeartbeatCount: 0,
  };
}
