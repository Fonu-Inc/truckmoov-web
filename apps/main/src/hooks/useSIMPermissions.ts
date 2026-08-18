import { useAuthStore } from "@/stores/authStore";

export function useSIMPermissions() {
  const { user } = useAuthStore();
  const hasOrgRole = (_key: string) => false;

  const isPlatformAdmin = user?.role === "platform_admin";
  const isAdmin = hasOrgRole("ADMIN");

  const canView
    = isPlatformAdmin
      || isAdmin
      || hasOrgRole("OPERATIONS_MANAGER")
      || hasOrgRole("DISPATCHER")
      || hasOrgRole("SUPERVISOR")
      || hasOrgRole("VIEWER")
      || hasOrgRole("FINANCE");

  const canViewUsage = isPlatformAdmin || isAdmin || hasOrgRole("FINANCE");

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
