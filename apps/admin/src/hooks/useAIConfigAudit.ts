import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

type AIConfigAction = 
  | 'AI_CONFIG_ENABLED'
  | 'AI_CONFIG_DISABLED'
  | 'AI_PROVIDER_CHANGED'
  | 'AI_MODEL_CHANGED'
  | 'AI_KEY_UPDATED'
  | 'AI_WEIGHTS_UPDATED'
  | 'AI_CONSTRAINTS_UPDATED'
  | 'AI_THRESHOLD_CHANGED'
  | 'AI_APPROVAL_TOGGLED'
  | 'PLATFORM_AI_PROVIDER_TOGGLED'
  | 'PLATFORM_AI_MODELS_UPDATED'
  | 'PLATFORM_AI_GUARDRAILS_UPDATED'
  | 'PLATFORM_AI_DEFAULTS_CHANGED';

interface AuditLogParams {
  action: AIConfigAction;
  description: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

export function useAIConfigAudit() {
  const { user } = useAuthStore();

  const logAIConfigChange = async ({
    action,
    description,
    tenantId,
    metadata = {},
  }: AuditLogParams) => {
    if (!user) return;

    try {
      await supabase.from('security_audit_logs').insert({
        event_type: action,
        severity: 'info',
        user_id: user.id,
        user_email: user.email,
        user_name: user.name || user.email,
        tenant_id: tenantId || user.tenantId,
        tenant_name: null,
        description,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          source: 'ai_config',
        },
      });
    } catch (error) {
      console.error('Failed to log AI config change:', error);
    }
  };

  return { logAIConfigChange };
}



