import { useAuthStore } from '@/stores/authStore';
import { useOrgContext } from '@/hooks/useOrgContext';

/**
 * AI config permissions — org-scoped.
 * ADMIN + OPS_MANAGER can configure tenant AI.
 * ADMIN + OPS_MANAGER + DISPATCHER can run matching.
 * All org members can view results.
 * Only platform_admin can configure platform-wide AI settings.
 */
export function useAIConfigPermissions() {
  const { user } = useAuthStore();
  const orgCtx = useOrgContext();
  const isPlatformAdmin = user?.role === 'platform_admin';

  const hasRole = (keys: string[]) => keys.some(k => orgCtx.hasOrgRole(k));

  const canConfigureTenantAI = isPlatformAdmin || hasRole(['ADMIN', 'OPERATIONS_MANAGER']);
  const canRunAIMatching = isPlatformAdmin || hasRole(['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER']);
  const canViewAIResults = isPlatformAdmin || hasRole(['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER', 'FINANCE', 'VIEWER']);
  const canConfigurePlatformAI = isPlatformAdmin;

  return {
    canConfigureTenantAI,
    canRunAIMatching,
    canViewAIResults,
    canConfigurePlatformAI,
    isPlatformAdmin,
    role: user?.role,
  };
}
