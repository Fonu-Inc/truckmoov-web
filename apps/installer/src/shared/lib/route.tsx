import type { UserRole } from "@truckmoov/api/auth";
import type React from "react";
import { RequireRole } from "@truckmoov/reusables/components/auth/RequireRole";
import NotAuthorized from "@truckmoov/reusables/components/pages/NotAuthorized";
import NotFound from "@truckmoov/reusables/components/pages/NotFound";
import { createBrowserRouter } from "react-router";
import App from "@/App";
import { AuthLayout } from "@/features/auth/components/layout/AuthLayout";
import AuthPage from "@/features/auth/components/pages/AuthPage";
import { DashboardLayout } from "@/features/dashboard/components/layout/DashboardLayout";
import { INSTALLER_ROLES } from "@/features/dashboard/utils/sidebarNav";
import { useAuthStore } from "@/stores/authStore";

const useRole = () => useAuthStore(s => s.user?.role);

/**
 * Wrap a Component with a role check. URL-typing a page as a non-installer
 * lands on /not-authorized instead of rendering. Every route in this app
 * shares INSTALLER_ROLES, so guarding `DashboardLayout` covers the whole
 * shell in one line — child routes inherit through the outlet.
 */
function withGuard(allow: UserRole[], Loaded: React.ComponentType<unknown>) {
  return function Guarded(props: Record<string, unknown>) {
    const role = useRole();
    if (!role || !allow.includes(role)) {
      return (
        <RequireRole
          allow={allow}
          useRole={useRole}
        />
      );
    }
    return <Loaded {...props} />;
  };
}

const GuardedDashboardLayout = withGuard(
  INSTALLER_ROLES,
  DashboardLayout,
);

/**
 * App is a pathless layout route: it owns the provider tower, the AuthGuard
 * and the Outlet. Children therefore keep absolute paths.
 *
 * Which of these need a session is decided by AuthGuard from PUBLIC_ROUTES
 * (features/auth/utils/publicRoutes.ts), not by nesting here.
 *
 * Pages load through `lazy` — one chunk each. `DashboardLayout` renders the
 * pending state as a top progress bar, so there is no Suspense boundary.
 */
export const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        Component: AuthLayout,
        children: [
          {
            path: "/auth", Component: AuthPage,
          },
          {
            path: "/auth/forgot-password",
            lazy: async () => ({ Component: (await import("@/features/auth/components/pages/ForgotPasswordPage")).default }),
          },
        ],
      },
      // Standalone card screens reached from email links — no branding panel.
      {
        path: "/auth/invite",
        lazy: async () => ({ Component: (await import("@/features/auth/components/pages/InvitePage")).default }),
      },
      {
        path: "/auth/reset-password",
        lazy: async () => ({ Component: (await import("@/features/auth/components/pages/ResetPasswordPage")).default }),
      },
      // The platform's reset email uses apps/main's link shape: /auth/verify-email?token=&type=reset-password.
      {
        path: "/auth/verify-email",
        lazy: async () => ({ Component: (await import("@/features/auth/components/pages/ResetPasswordPage")).default }),
      },
      {
        path: "/not-authorized", Component: NotAuthorized,
      },
      {
        Component: GuardedDashboardLayout,
        children: [
          {
            path: "/",
            lazy: async () => ({ Component: (await import("@/features/jobs/components/pages/DashboardPage")).default }),
          },
          {
            path: "/jobs",
            lazy: async () => ({ Component: (await import("@/features/jobs/components/pages/JobsPage")).default }),
          },
          {
            path: "/jobs/:jobId",
            lazy: async () => ({ Component: (await import("@/features/jobs/components/pages/JobDetailPage")).default }),
          },
          {
            path: "/notifications",
            lazy: async () => ({ Component: (await import("@/features/jobs/components/pages/NotificationsPage")).default }),
          },
          {
            path: "/support",
            lazy: async () => ({ Component: (await import("@/features/support/components/pages/SupportPage")).default }),
          },
          {
            path: "/settings",
            lazy: async () => ({ Component: (await import("@/features/profile/components/pages/SettingsPage")).default }),
          },
        ],
      },
      {
        path: "*", Component: NotFound,
      },
    ],
  },
]);
