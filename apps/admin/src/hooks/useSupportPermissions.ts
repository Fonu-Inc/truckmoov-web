import { useAuthStore } from '@/stores/authStore';
import { useOrgContext } from '@/hooks/useOrgContext';

/**
 * Support ticket permissions — org-scoped.
 * 
 * ADMIN: Create, view, comment, change status
 * OPERATIONS_MANAGER: Create, view, comment
 * DISPATCHER: View only
 * FINANCE: No access
 * VIEWER: No access
 * Platform Admin: Full access
 */
export function useSupportPermissions() {
  const { user } = useAuthStore();
  const orgCtx = useOrgContext();
  const role = user?.role;
  const isPlatformAdmin = role === 'platform_admin';

  const hasOrgRole = (keys: string[]) => keys.some(k => orgCtx.hasOrgRole(k));

  const canCreateTicket = isPlatformAdmin || hasOrgRole(['ADMIN', 'OPERATIONS_MANAGER']);
  const canViewTickets = isPlatformAdmin || hasOrgRole(['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER']);
  const canCommentOnTickets = isPlatformAdmin || hasOrgRole(['ADMIN', 'OPERATIONS_MANAGER']);
  const canManageAllTickets = isPlatformAdmin;
  const canEscalateTickets = isPlatformAdmin;
  const canChangeTicketStatus = isPlatformAdmin || hasOrgRole(['ADMIN']);
  const canSeeInternalNotes = isPlatformAdmin;
  const hasNoAccess = !isPlatformAdmin && !hasOrgRole(['ADMIN', 'OPERATIONS_MANAGER', 'DISPATCHER']);

  return {
    canCreateTicket,
    canViewTickets,
    canViewBillingTicketsOnly: false,
    canCommentOnTickets,
    canManageAllTickets,
    canEscalateTickets,
    canChangeTicketStatus,
    canSeeInternalNotes,
    hasNoAccess,
    role,
  };
}



