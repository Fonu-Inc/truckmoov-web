import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  const [config, setConfig] = useState<PlatformAIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { logAIConfigChange } = useAIConfigAudit();

  const defaultConfig: PlatformAIConfig = {
    id: '',
    openai_enabled: true,
    anthropic_enabled: true,
    lovable_enabled: true,
    openai_allowed_models: ['gpt-4o', 'gpt-4o-mini'],
    anthropic_allowed_models: ['claude-3-5-sonnet'],
    lovable_allowed_models: ['lovable-default'],
    default_provider: 'lovable',
    default_model: 'lovable-default',
    max_tokens_per_request: 4096,
    max_requests_per_minute: 60,
    max_tokens_per_day_per_tenant: 1000000,
    redact_phone_numbers: true,
    redact_driver_names: false,
    redact_vehicle_plates: false,
    store_prompts_responses: false,
    ai_job_matching_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_ai_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setConfig(data ? (data as PlatformAIConfig) : defaultConfig);
    } catch (error) {
      console.error('Failed to fetch platform AI config:', error);
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<PlatformAIConfig>) => {
    if (!config) return;
    
    setIsSaving(true);
    try {
      const prevConfig = config;
      
      const { error } = await supabase
        .from('platform_ai_config')
        .update(updates)
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, ...updates });

      // Audit log the changes
      if ('openai_enabled' in updates || 'anthropic_enabled' in updates || 'lovable_enabled' in updates) {
        logAIConfigChange({
          action: 'PLATFORM_AI_PROVIDER_TOGGLED',
          description: 'Platform AI provider availability changed',
          metadata: {
            openai: updates.openai_enabled ?? prevConfig.openai_enabled,
            anthropic: updates.anthropic_enabled ?? prevConfig.anthropic_enabled,
            lovable: updates.lovable_enabled ?? prevConfig.lovable_enabled,
          },
        });
      }
      if ('openai_allowed_models' in updates || 'anthropic_allowed_models' in updates || 'lovable_allowed_models' in updates) {
        logAIConfigChange({
          action: 'PLATFORM_AI_MODELS_UPDATED',
          description: 'Platform allowed AI models updated',
          metadata: updates,
        });
      }
      if ('max_tokens_per_request' in updates || 'max_requests_per_minute' in updates || 'max_tokens_per_day_per_tenant' in updates ||
          'redact_phone_numbers' in updates || 'redact_driver_names' in updates || 'redact_vehicle_plates' in updates) {
        logAIConfigChange({
          action: 'PLATFORM_AI_GUARDRAILS_UPDATED',
          description: 'Platform AI guardrails updated',
          metadata: updates,
        });
      }
      if ('default_provider' in updates || 'default_model' in updates) {
        logAIConfigChange({
          action: 'PLATFORM_AI_DEFAULTS_CHANGED',
          description: `Platform AI defaults changed to ${updates.default_provider || prevConfig.default_provider} / ${updates.default_model || prevConfig.default_model}`,
          metadata: {
            from: { provider: prevConfig.default_provider, model: prevConfig.default_model },
            to: { provider: updates.default_provider, model: updates.default_model },
          },
        });
      }

      toast.success('AI configuration updated');
    } catch (error) {
      console.error('Failed to update platform AI config:', error);
      toast.error('Failed to update AI configuration');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    isLoading,
    isSaving,
    updateConfig,
    refetch: fetchConfig,
  };
}



