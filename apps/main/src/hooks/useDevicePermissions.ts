import { useAuthStore } from "@/features/auth/stores/authStore";

export function useDevicePermissions() {
  const { user } = useAuthStore();
  const hasOrgRole = (_key: string) => false;

  const canManage = hasOrgRole("ADMIN") || hasOrgRole("OPERATIONS_MANAGER");
  const canView
    = canManage
      || hasOrgRole("DISPATCHER")
      || hasOrgRole("SUPERVISOR")
      || hasOrgRole("VIEWER")
      || hasOrgRole("FINANCE");

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
