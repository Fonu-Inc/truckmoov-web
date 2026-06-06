export interface IoTSIM {
  id: string;
  iccid: string;
  imsi: string | null;
  msisdn: string;
  carrier: string;
  plan: string;
  status: string;
  tenant_id: string | null;
  device_id: string | null;
  data_usage_mb: number;
  data_limit_mb: number;
  sms_usage: number;
  sms_limit: number;
  monthly_cost_ngn: number;
  activation_date: string | null;
  expiry_date: string | null;
  last_activity: string | null;
  signal_strength: number | null;
  network_type: string | null;
  roaming: boolean;
  fonu_sim_id: string | null;
  fonu_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceMappingRow {
  device_name: string;
  imei: string;
  serial_number?: string;
  notes?: string;
}

export interface SIMProvisioningRequest {
  id: string;
  request_type: string;
  sim_id: string | null;
  iccid: string | null;
  msisdn: string | null;
  tenant_id: string;
  tenant_name: string | null;
  requested_plan: string | null;
  requested_data_limit_mb: number | null;
  requested_by: string | null;
  requested_by_name: string | null;
  status: string;
  priority: string | null;
  notes: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  fonu_request_id: string | null;
  fonu_response: any;
  created_at: string;
  updated_at: string;
  number_of_sims: number | null;
  deployment_timeline: string | null;
  device_mapping_enabled: boolean | null;
  device_mapping_file_path: string | null;
  device_mapping_data: DeviceMappingRow[] | any;
  use_case: string | null;
  preferred_operator: string | null;
}

export interface SIMUsageSignal {
  id: string;
  sim_id: string | null;
  iccid: string;
  signal_type: string;
  data_usage_mb: number | null;
  sms_count: number | null;
  signal_strength: number | null;
  network_type: string | null;
  latitude: number | null;
  longitude: number | null;
  raw_data: any;
  recorded_at: string;
  created_at: string;
}

export function useFonuSIM(_tenantId?: string) {
  const sims: IoTSIM[] = [];
  const loading = false;
  const error: string | null = null;

  const activateSIM = async (_iccid: string, _targetTenantId: string, _plan?: string) => {};
  const suspendSIM = async (_iccid: string) => {};
  const resumeSIM = async (_iccid: string) => {};
  const updatePlan = async (_iccid: string, _plan: string, _dataLimitMb?: number) => {};
  const topupData = async (_iccid: string, _dataLimitMb: number) => {};
  const getUsage = async (_iccid: string) => {};
  const provisionSIM = async (_iccid: string, _targetTenantId?: string, _plan?: string, _dataLimitMb?: number, _notes?: string) => {};
  const createSIM = async (_simData: Partial<IoTSIM>) => null;
  const updateSIM = async (_id: string, _updates: Partial<IoTSIM>) => null;
  const deleteSIM = async (_id: string) => {};

  return {
    sims,
    loading,
    error,
    refetch: () => {},
    activateSIM,
    suspendSIM,
    resumeSIM,
    updatePlan,
    topupData,
    getUsage,
    provisionSIM,
    createSIM,
    updateSIM,
    deleteSIM,
  };
}

export function useSIMProvisioningRequests() {
  const requests: SIMProvisioningRequest[] = [];
  const loading = false;

  const approveRequest = async (_requestId: string, _approverName: string, _approverId?: string, _overrideJustification?: string) => {};
  const rejectRequest = async (_requestId: string, _reason: string, _rejecterName?: string, _rejecterId?: string) => {};
  const initiateActivation = async (_batchId: string) => {};

  return {
    requests,
    loading,
    refetch: () => {},
    approveRequest,
    rejectRequest,
    initiateActivation,
  };
}

export function useSIMUsageSignals(_iccid: string) {
  const signals: SIMUsageSignal[] = [];
  const loading = false;

  return { signals, loading, refetch: () => {} };
}
