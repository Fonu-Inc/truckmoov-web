import type { UserRole } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import { getCapabilitiesQueryOptions } from "@truckmoov/api/auth";
import { useAuthStore } from "@/features/auth/stores/authStore";

// Used only when /auth/capabilities can't be read; the staff roles that get support
// inside an owner-operator organisation need the server's answer.
const ALWAYS_SUPPORTED: UserRole[] = [
  "ENTERPRISE_ADMIN",
  "AGGREGATOR_ADMIN",
  "OWNER_OPERATOR",
];

/**
 * Ticketing & Support access from the user's resolved permissions
 * (`tenant.support.read` / `.manage`), which already apply the
 * owner-operator organisation grants.
 */
export function useSupportAccess() {
  const user = useAuthStore(s => s.user);
  const {
    data, isPending, isError,
  } = useQuery(getCapabilitiesQueryOptions(user?.id ?? ""));
  const permissions = data?.data.permissions;

  if (!permissions) {
    const fallback = isError && !!user && ALWAYS_SUPPORTED.includes(user.role);
    return {
      isLoading: !!user && isPending && !isError, canView: fallback, canManage: fallback,
    };
  }
  return {
    isLoading: false,
    canView: permissions.includes("tenant.support.read"),
    canManage: permissions.includes("tenant.support.manage"),
  };
}
