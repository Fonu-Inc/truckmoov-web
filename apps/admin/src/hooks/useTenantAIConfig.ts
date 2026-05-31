import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

export function useTenantAIConfig(tenantId: string | null) {
  const [config, setConfig] = useState<TenantAIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { logAIConfigChange } = useAIConfigAudit();

  const fetchConfig = async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenant_ai_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setConfig(data as TenantAIConfig);
      } else {
        // Provide default config so UI is interactive even before first save
        setConfig({
          id: '',
          tenant_id: tenantId,
          enabled: false,
          provider: null,
          model: null,
          api_key_encrypted: null,
          api_key_last_four: null,
          weight_capacity_fit: 80,
          weight_distance_pickup: 70,
          weight_eta_delivery: 60,
          weight_driver_availability: 75,
          weight_cost_efficiency: 50,
          constraint_max_load: true,
          constraint_truck_type: true,
          constraint_refrigeration: true,
          constraint_driver_hours: true,
          confidence_threshold: 0.75,
          require_dispatcher_approval: true,
          last_connection_test_at: null,
          last_connection_test_success: null,
          last_connection_test_error: null,
          created_at: '',
          updated_at: '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch tenant AI config:', error);
      toast.error('Failed to load AI configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const createOrUpdateConfig = async (updates: Partial<TenantAIConfig>) => {
    if (!tenantId) return;
    
    setIsSaving(true);
    try {
      const prevConfig = config;
      
      if (config && config.id) {
        const { error } = await supabase
          .from('tenant_ai_config')
          .update(updates)
          .eq('id', config.id);

        if (error) throw error;
        setConfig({ ...config, ...updates } as TenantAIConfig);
      } else {
        // Create new
        const { data, error } = await supabase
          .from('tenant_ai_config')
          .insert({ tenant_id: tenantId, ...updates })
          .select()
          .single();

        if (error) throw error;
        setConfig(data as TenantAIConfig);
      }

      // Audit log the changes
      if ('enabled' in updates) {
        logAIConfigChange({
          action: updates.enabled ? 'AI_CONFIG_ENABLED' : 'AI_CONFIG_DISABLED',
          description: `AI Job Matching ${updates.enabled ? 'enabled' : 'disabled'} for tenant`,
          tenantId,
          metadata: { enabled: updates.enabled },
        });
      }
      if ('provider' in updates && updates.provider !== prevConfig?.provider) {
        logAIConfigChange({
          action: 'AI_PROVIDER_CHANGED',
          description: `AI provider changed from ${prevConfig?.provider || 'none'} to ${updates.provider}`,
          tenantId,
          metadata: { from: prevConfig?.provider, to: updates.provider },
        });
      }
      if ('model' in updates && updates.model !== prevConfig?.model) {
        logAIConfigChange({
          action: 'AI_MODEL_CHANGED',
          description: `AI model changed to ${updates.model}`,
          tenantId,
          metadata: { from: prevConfig?.model, to: updates.model },
        });
      }
      if ('api_key_encrypted' in updates) {
        logAIConfigChange({
          action: 'AI_KEY_UPDATED',
          description: 'API key updated for AI provider',
          tenantId,
          metadata: { last_four: updates.api_key_last_four },
        });
      }
      if ('confidence_threshold' in updates) {
        logAIConfigChange({
          action: 'AI_THRESHOLD_CHANGED',
          description: `Confidence threshold changed to ${updates.confidence_threshold}`,
          tenantId,
          metadata: { from: prevConfig?.confidence_threshold, to: updates.confidence_threshold },
        });
      }
      if ('require_dispatcher_approval' in updates) {
        logAIConfigChange({
          action: 'AI_APPROVAL_TOGGLED',
          description: `Dispatcher approval ${updates.require_dispatcher_approval ? 'enabled' : 'disabled'}`,
          tenantId,
          metadata: { require_approval: updates.require_dispatcher_approval },
        });
      }

      toast.success('AI configuration saved');
    } catch (error) {
      console.error('Failed to save tenant AI config:', error);
      toast.error('Failed to save AI configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!tenantId || !config?.provider) {
      toast.error('Please configure a provider first');
      return;
    }

    setIsTesting(true);
    try {
      // Call the edge function with a simple test
      const { data, error } = await supabase.functions.invoke('ai-load-matching', {
        body: {
          tenant_id: tenantId,
          job: {
            id: 'test',
            reference: 'TEST-CONNECTION',
            pickup: { address: 'Test Pickup', lat: 0, lng: 0 },
            delivery: { address: 'Test Delivery', lat: 0, lng: 0 },
            cargo: { type: 'Test', weight: 1, description: 'Connection test' },
            amount: 0,
          },
          vehicles: [{
            id: 'test-vehicle',
            registrationNumber: 'TEST-001',
            make: 'Test',
            model: 'Vehicle',
            type: 'truck',
            status: 'active',
            capacity: 10,
          }],
          drivers: [{
            id: 'test-driver',
            name: 'Test Driver',
            phone: '+1234567890',
            status: 'available',
            rating: 5,
            totalTrips: 100,
          }],
        },
      });

      if (error) throw error;

      // Update test status
      await supabase
        .from('tenant_ai_config')
        .update({
          last_connection_test_at: new Date().toISOString(),
          last_connection_test_success: true,
          last_connection_test_error: null,
        })
        .eq('id', config.id);

      setConfig({
        ...config,
        last_connection_test_at: new Date().toISOString(),
        last_connection_test_success: true,
        last_connection_test_error: null,
      });

      toast.success('Connection test successful!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (config) {
        await supabase
          .from('tenant_ai_config')
          .update({
            last_connection_test_at: new Date().toISOString(),
            last_connection_test_success: false,
            last_connection_test_error: errorMessage,
          })
          .eq('id', config.id);

        setConfig({
          ...config,
          last_connection_test_at: new Date().toISOString(),
          last_connection_test_success: false,
          last_connection_test_error: errorMessage,
        });
      }

      toast.error('Connection test failed', { description: errorMessage });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [tenantId]);

  return {
    config,
    isLoading,
    isSaving,
    isTesting,
    createOrUpdateConfig,
    testConnection,
    refetch: fetchConfig,
  };
}



