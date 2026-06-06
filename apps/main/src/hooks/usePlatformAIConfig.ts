import { useAIConfigAudit } from './useAIConfigAudit';

export interface PlatformAIConfig {
  id: string;
  openai_enabled: boolean;
  anthropic_enabled: boolean;
  lovable_enabled: boolean;
  openai_allowed_models: string[];
  anthropic_allowed_models: string[];
  lovable_allowed_models: string[];
  default_provider: 'openai' | 'anthropic' | 'lovable';
  default_model: string;
  max_tokens_per_request: number;
  max_requests_per_minute: number;
  max_tokens_per_day_per_tenant: number;
  redact_phone_numbers: boolean;
  redact_driver_names: boolean;
  redact_vehicle_plates: boolean;
  store_prompts_responses: boolean;
  ai_job_matching_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function usePlatformAIConfig() {
  const { logAIConfigChange } = useAIConfigAudit();

  return {
    config: null as PlatformAIConfig | null,
    isLoading: false,
    isSaving: false,
    updateConfig: async (_updates: Partial<PlatformAIConfig>) => {},
    refetch: async () => {},
  };
}
