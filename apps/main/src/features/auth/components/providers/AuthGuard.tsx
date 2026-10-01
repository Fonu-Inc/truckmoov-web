import type { ReactNode } from "react";
import {
  Navigate, useLocation,
} from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { getPostLoginRedirectPath } from "@/features/auth/utils/authRedirect";
import {
  OPEN_ROUTE_PREFIXES, PUBLIC_ROUTES,
} from "@/features/auth/utils/publicRoutes";

/**
 * Logged out -> public routes only. Logged in -> everything.
 *
 * Sits above the router Outlet, so no route needs to declare whether it is
 * protected: membership in PUBLIC_ROUTES is the whole rule.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const {
    user, isAuthenticated, isAuthReady,
  } = useAuthStore();

  // Open pages don't depend on a session at all — don't even wait for bootstrap.
  if (OPEN_ROUTE_PREFIXES.some(prefix => location.pathname.startsWith(prefix)))
    return <>{children}</>;

  // Session bootstrap is still in flight — render nothing rather than
  // flashing a redirect we may be about to reverse.
  if (!isAuthReady) {
    return null;
  }

  const isPublic = PUBLIC_ROUTES.includes(location.pathname);

  if (!isAuthenticated && !isPublic) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location }}
      />
    );
  }

  // Signed in and sitting on the login screen — send them to their role's
  // home. "/" is only open to some roles; the rest would land on a 403.
  if (isAuthenticated && isPublic) {
    return (
      <Navigate
        to={user ? getPostLoginRedirectPath(user.role) : "/"}
        replace
      />
    );
  }

  return <>{children}</>;
}
