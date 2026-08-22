import type { ReactNode } from "react";
import {
  Navigate, useLocation,
} from "react-router";
import { PUBLIC_ROUTES } from "@/features/auth/utils/publicRoutes";
import { useAuthStore } from "@/stores/authStore";

/**
 * Logged out -> public routes only. Logged in -> everything.
 *
 * Sits above the router Outlet, so no route needs to declare whether it is
 * protected: membership in PUBLIC_ROUTES is the whole rule.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const {
    isAuthenticated, isAuthReady,
  } = useAuthStore();

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

  // Signed in and sitting on the login screen — send them to the dashboard.
  if (isAuthenticated && isPublic) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <>{children}</>;
}
