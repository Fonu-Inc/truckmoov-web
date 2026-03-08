import { useAuthStore } from '@/stores/authStore';
import { useOrgContext } from '@/hooks/useOrgContext';

/**
 * Hook to check device management permissions using org-scoped RBAC.
 *
 * Permissions:
 * - ADMIN / OPERATIONS_MANAGER role keys: Full CRUD
 * - DISPATCHER / SUPERVISOR / VIEWER / FINANCE: Read-only
 * - Platform SuperAdmin: Read-only oversight
 * - Driver: No access
 */
export function useDevicePermissions() {
  const { user } = useAuthStore();
  const { hasOrgRole } = useOrgContext();

  const isPlatformAdmin = user?.role === 'platform_admin';
  const canManage = hasOrgRole('ADMIN') || hasOrgRole('OPERATIONS_MANAGER');
  const canView =
    isPlatformAdmin ||
    canManage ||
    hasOrgRole('DISPATCHER') ||
    hasOrgRole('SUPERVISOR') ||
    hasOrgRole('VIEWER') ||
    hasOrgRole('FINANCE');

  return {
    canView,
    canManage,
    canRegister: canManage,
    canEdit: canManage,
    canDelete: canManage,
    canAssign: canManage,
    canGenerateCredentials: canManage,
    role: user?.role,
  };
}
