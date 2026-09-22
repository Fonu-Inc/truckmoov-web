import type { UserRole } from "@truckmoov/api/auth";
import type React from "react";
import { RequireRole } from "@truckmoov/reusables/components/auth/RequireRole";
import NotAuthorized from "@truckmoov/reusables/components/pages/NotAuthorized";
import NotFound from "@truckmoov/reusables/components/pages/NotFound";
import { createBrowserRouter } from "react-router";
import App from "@/App";
import { AuthLayout } from "@/features/auth/components/layout/AuthLayout";
import AuthPage from "@/features/auth/components/pages/AuthPage";
import InvitePage from "@/features/auth/components/pages/InvitePage";
import { DashboardLayout } from "@/features/dashboard/components/layout/DashboardLayout";
import { ADMIN_ROLES } from "@/features/dashboard/utils/sidebarNav";
import { SecurityLayout } from "@/features/security/components/layout/SecurityLayout";
import { SettingsLayout } from "@/features/settings/components/layout/SettingsLayout";
import { useAuthStore } from "@/stores/authStore";

const useRole = () => useAuthStore(s => s.user?.role);

/**
 * Wrap a Component with a role check. URL-typing a page from a role that
 * isn't in `allow` lands on /not-authorized instead of rendering. Every
 * route in the admin app shares the same three ADMIN_ROLES, so guarding
 * `DashboardLayout` covers the whole shell in one line — child routes
 * inherit through the outlet. Same for the `/settings` layout.
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
  ADMIN_ROLES,
  DashboardLayout,
);
const GuardedSettingsLayout = withGuard(
  ADMIN_ROLES,
  SettingsLayout,
);
const GuardedSecurityLayout = withGuard(
  ADMIN_ROLES,
  SecurityLayout,
);

/**
 * App is a pathless layout route: it owns the provider tower, the AuthGuard
 * and the Outlet. Children therefore keep absolute paths.
 *
 * Which of these need a session is decided by AuthGuard from PUBLIC_ROUTES
 * (features/auth/utils/publicRoutes.ts), not by nesting here.
 *
 * DashboardLayout is a second pathless layout route holding everything that
 * renders the dashboard shell, so the sidebar and top bar mount once instead
 * of per page. Auth and the 404/403 screens sit outside it — they own their
 * own chrome.
 *
 * `/settings` is the one pathful layout route: SettingsLayout owns the tab bar,
 * each tab is a child route. Tabs are routes, not local state — see the block
 * further down and features/settings/utils/settingsNav.ts.
 *
 * Pages are loaded through react-router's `lazy`, not imported at the top: each
 * becomes its own chunk that arrives when the route is first visited. Eagerly
 * importing all of them put every platform table, chart and simulator into the
 * initial bundle, so the first paint waited on code for pages nobody had opened.
 * `DashboardLayout` renders the router's pending state while a chunk loads.
 *
 * `App`, the two layouts, the auth page and the status screens stay eager —
 * they are small and on the critical path, and a spinner in place of the login
 * form would be worse than the bytes.
 */
export const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        Component: AuthLayout,
        children: [
          {
            path: "/auth",
            Component: AuthPage,
          },
        ],
      },
      {
        path: "/auth/invite",
        Component: InvitePage,
      },
      {
        path: "/not-authorized",
        Component: NotAuthorized,
      },

      // Everything inside the dashboard shell. Pages render their own content
      // only; the sidebar, top bar and page title come from DashboardLayout.
      {
        Component: GuardedDashboardLayout,
        children: [
          {
            path: "/",
            lazy: async () => ({ Component: (await import("@/features/dashboard/components/pages/PlatformDashboard")).default }),
          },
          {
            path: "/tenants",
            lazy: async () => ({ Component: (await import("@/features/tenants/components/pages/TenantsPage")).default }),
          },
          {
            path: "/tenants/:id",
            lazy: async () => ({ Component: (await import("@/features/tenants/components/pages/TenantDetailPage")).default }),
          },
          {
            path: "/devices",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformDevices")).default }),
          },
          {
            path: "/sims",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformSIMs")).default }),
          },
          {
            path: "/data-bundles",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformDataBundles")).default }),
          },
          {
            path: "/simulator",
            lazy: async () => ({ Component: (await import("@/pages/platform/DeviceSimulator")).default }),
          },
          {
            path: "/messaging",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformMessagingCenter")).default }),
          },
          // Communications group. `/messaging` above is the separate email
          // surface and stays off the nav.
          {
            path: "/whatsapp",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformWhatsAppSetup")).default }),
          },
          {
            path: "/inbox",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformInbox")).default }),
          },
          {
            path: "/subscription",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformBilling")).default }),
          },
          {
            path: "/security",
            Component: GuardedSecurityLayout,
            children: [
              {
                index: true, lazy: async () => ({ Component: (await import("@/features/security/components/pages/SecurityOverviewPage")).default }),
              },
              {
                path: "login-history", lazy: async () => ({ Component: (await import("@/features/security/components/pages/LoginHistoryPage")).default }),
              },
              {
                path: "failed-attempts", lazy: async () => ({ Component: (await import("@/features/security/components/pages/FailedAttemptsPage")).default }),
              },
              {
                path: "blocked-ips", lazy: async () => ({ Component: (await import("@/features/security/components/pages/BlockedIpsPage")).default }),
              },
              {
                path: "notifications", lazy: async () => ({ Component: (await import("@/features/security/components/pages/NotificationsPage")).default }),
              },
              {
                path: "events", lazy: async () => ({ Component: (await import("@/features/security/components/pages/SecurityEventsPage")).default }),
              },
              {
                path: "sim-audit", lazy: async () => ({ Component: (await import("@/features/security/components/pages/SimAuditPage")).default }),
              },
            ],
          },
          {
            path: "/compliance-audit",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformComplianceAudit")).default }),
          },
          // Settings is a pathful layout route: SettingsLayout owns the tab bar
          // and the Outlet, one child route per tab. The tab list it renders is
          // features/settings/utils/settingsNav.ts — keep the two in step.
          //
          // A tab that is exactly one panel is routed straight off that panel's
          // named export; only tabs needing props or extra markup have a page.
          {
            path: "/settings",
            Component: GuardedSettingsLayout,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/features/settings/components/pages/GeneralSettingsPage")).default }),
              },
              {
                path: "team",
                lazy: async () => ({ Component: (await import("@/features/settings/components/pages/TeamSettingsPage")).default }),
              },
              {
                path: "ai-providers",
                lazy: async () => ({ Component: (await import("@/features/settings/components/ui/PlatformAISettings")).PlatformAISettings }),
              },
              {
                path: "telephony",
                lazy: async () => ({ Component: (await import("@/features/settings/components/pages/TelephonySettingsPage")).default }),
                children: [
                  {
                    index: true, lazy: async () => ({ Component: (await import("@/features/settings/components/ui/TelephonySettings")).TelephonySettings }),
                  },
                  {
                    path: "numbers", lazy: async () => ({ Component: (await import("@/features/settings/components/ui/PhoneNumberManagement")).PhoneNumberManagement }),
                  },
                  {
                    path: "sender-ids", lazy: async () => ({ Component: (await import("@/features/settings/components/ui/SenderIdApprovalQueue")).SenderIdApprovalQueue }),
                  },
                ],
              },
              {
                path: "notifications",
                lazy: async () => ({ Component: (await import("@/features/settings/components/pages/NotificationsSettingsPage")).default }),
              },
            ],
          },
          {
            path: "/support",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformSupport")).default }),
          },
        ],
      },

      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
