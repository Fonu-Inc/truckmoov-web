import { useQuery } from "@tanstack/react-query";
import { getCapabilitiesQueryOptions } from "@truckmoov/api/auth";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { getRolesForHref } from "@/features/dashboard/utils/sidebarNav";

const BILLING_ROLES = getRolesForHref("/subscription") ?? [];

/**
 * Billing is for whoever may buy and pay for M2M bundles (`tenant.bundles.manage`),
 * which includes an owner operator's operations manager. Aggregators keep their
 * own billing screens, so they never get this one from a permission.
 */
export function useBillingAccess() {
  const user = useAuthStore(s => s.user);
  const {
    data, isPending, isError,
  } = useQuery(getCapabilitiesQueryOptions(user?.id ?? ""));
  const byRole = !!user && BILLING_ROLES.includes(user.role);
  const permissions = data?.data.permissions;

  if (byRole || !permissions) {
    return {
      isLoading: !byRole && !!user && isPending && !isError, canView: byRole,
    };
  }
  return {
    isLoading: false,
    canView: user?.role !== "AGGREGATOR_ADMIN" && permissions.includes("tenant.bundles.manage"),
  };
}
