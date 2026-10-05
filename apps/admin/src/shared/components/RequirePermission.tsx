import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { capabilitiesOptions } from "@/features/communications/messagingQueries";
import { holdsPermission } from "@/shared/lib/routePermissions";

type Props = {
  /** Catalog permission key, e.g. admin.messaging.read. Null/empty = allow. */
  permission: string | null;
  children: ReactNode;
};

/**
 * Fail-closed permission gate for admin deep links. Missing permission
 * redirects to /not-authorized (stricter than MessagingAccessGate's soft
 * notice). Server APIs remain the real authorization boundary.
 */
export function RequirePermission({
  permission, children,
}: Props) {
  const query = useQuery(capabilitiesOptions());

  if (!permission)
    return <>{children}</>;

  if (query.isPending) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground"
        aria-busy="true"
      >
        Checking access…
      </div>
    );
  }

  // Fail closed: no capabilities (first fetch failed) or no grant → redirect.
  // A failed background refetch keeps the last answer the server gave this
  // signed-in user rather than ejecting them mid-task; the cache is cleared
  // on logout (stores/authStore.ts), so it can never be another user's.
  if (!query.data || !holdsPermission(
    query.data.permissions,
    permission,
  )) {
    return (
      <Navigate
        to="/not-authorized"
        replace
      />
    );
  }

  return <>{children}</>;
}
