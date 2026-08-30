import { useAuthStore } from "@/features/auth/stores/authStore";

export function useAIConfigPermissions() {
  const { user } = useAuthStore();
  const isPlatformAdmin = user?.role === "platform_admin";

  const hasRole = (_keys: string[]) => false;

  const canConfigureTenantAI = isPlatformAdmin || hasRole([
    "ADMIN",
    "OPERATIONS_MANAGER",
  ]);
  const canRunAIMatching = isPlatformAdmin || hasRole([
    "ADMIN",
    "OPERATIONS_MANAGER",
    "DISPATCHER",
  ]);
  const canViewAIResults = isPlatformAdmin || hasRole([
    "ADMIN",
    "OPERATIONS_MANAGER",
    "DISPATCHER",
    "FINANCE",
    "VIEWER",
  ]);
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
