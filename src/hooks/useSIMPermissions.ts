import { useAuthStore } from '@/stores/authStore';
import { useOrgContext } from '@/hooks/useOrgContext';

/**
 * Hook to check SIM management permissions using org-scoped RBAC.
 *
 * Permissions:
 * - ADMIN (Fleet Provider): Can request SIM activation, assign SIM to device
 * - Platform SuperAdmin: Can approve/reject requests, provision via Fonu, full lifecycle
 * - OPERATIONS_MANAGER / DISPATCHER / SUPERVISOR: View SIMs only
 * - VIEWER / FINANCE: Read-only usage data
 * - Driver: No access
 */
export function useSIMPermissions() {
  const { user } = useAuthStore();
  const { hasOrgRole } = useOrgContext();

  const isPlatformAdmin = user?.role === 'platform_admin';
  const isAdmin = hasOrgRole('ADMIN');

  const canView =
    isPlatformAdmin ||
    isAdmin ||
    hasOrgRole('OPERATIONS_MANAGER') ||
    hasOrgRole('DISPATCHER') ||
    hasOrgRole('SUPERVISOR') ||
    hasOrgRole('VIEWER') ||
    hasOrgRole('FINANCE');

  const canViewUsage = isPlatformAdmin || isAdmin || hasOrgRole('FINANCE');

  return {
    canView,
    canRequestActivation: isAdmin,
    canApprove: isPlatformAdmin,
    canConfigureFonu: isPlatformAdmin,
    canAssign: isAdmin,
    canViewUsage,
    canManageLifecycle: isPlatformAdmin,
    canProvision: isPlatformAdmin,
    role: user?.role,
    tenantId: user?.tenantId,
  };
}
