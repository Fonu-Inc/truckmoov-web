import { useAuthStore } from "@/stores/authStore";

export function useSupportPermissions() {
  const { user } = useAuthStore();
  const role = user?.role;
  const isPlatformAdmin = role === "platform_admin";

  const hasOrgRole = (_keys: string[]) => false;

  const canCreateTicket = isPlatformAdmin || hasOrgRole([
    "ADMIN",
    "OPERATIONS_MANAGER",
  ]);
  const canViewTickets = isPlatformAdmin || hasOrgRole([
    "ADMIN",
    "OPERATIONS_MANAGER",
    "DISPATCHER",
  ]);
  const canCommentOnTickets = isPlatformAdmin || hasOrgRole([
    "ADMIN",
    "OPERATIONS_MANAGER",
  ]);
  const canManageAllTickets = isPlatformAdmin;
  const canEscalateTickets = isPlatformAdmin;
  const canChangeTicketStatus = isPlatformAdmin || hasOrgRole(["ADMIN"]);
  const canSeeInternalNotes = isPlatformAdmin;
  const hasNoAccess = !isPlatformAdmin && !hasOrgRole([
    "ADMIN",
    "OPERATIONS_MANAGER",
    "DISPATCHER",
  ]);

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
