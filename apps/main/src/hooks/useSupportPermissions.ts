import { useAuthStore } from "@/features/auth/stores/authStore";

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
  const role = user?.role;
  const isPlatformAdmin = role === "platform_admin";

  const canCreateTicket = isPlatformAdmin;
  const canViewTickets = isPlatformAdmin;
  const canCommentOnTickets = isPlatformAdmin;
  const canManageAllTickets = isPlatformAdmin;
  const canEscalateTickets = isPlatformAdmin;
  const canChangeTicketStatus = isPlatformAdmin;
  const canSeeInternalNotes = isPlatformAdmin;
  const hasNoAccess = !isPlatformAdmin;

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
