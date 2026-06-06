import { useAIConfigAudit } from './useAIConfigAudit';

export interface TenantAIConfig {
  id: string;
  tenant_id: string;
  enabled: boolean;
  provider: 'openai' | 'anthropic' | 'lovable' | null;
  model: string | null;
  api_key_encrypted: string | null;
  api_key_last_four: string | null;
  weight_capacity_fit: number;
  weight_distance_pickup: number;
  weight_eta_delivery: number;
  weight_driver_availability: number;
  weight_cost_efficiency: number;
  constraint_max_load: boolean;
  constraint_truck_type: boolean;
  constraint_refrigeration: boolean;
  constraint_driver_hours: boolean;
  confidence_threshold: number;
  require_dispatcher_approval: boolean;
  last_connection_test_at: string | null;
  last_connection_test_success: boolean | null;
  last_connection_test_error: string | null;
  created_at: string;
  updated_at: string;
}

export function useTenantAIConfig(_tenantId: string | null) {
  const { logAIConfigChange } = useAIConfigAudit();

  return {
    config: null as TenantAIConfig | null,
    isLoading: false,
    isSaving: false,
    isTesting: false,
    createOrUpdateConfig: async (_updates: Partial<TenantAIConfig>) => {},
    testConnection: async () => {},
    refetch: async () => {},
  };
}
