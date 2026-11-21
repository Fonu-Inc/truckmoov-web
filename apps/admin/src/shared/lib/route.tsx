import type { UserRole } from "@truckmoov/api/auth";
import type React from "react";
import { RequireRole } from "@truckmoov/reusables/components/auth/RequireRole";
import NotAuthorized from "@truckmoov/reusables/components/pages/NotAuthorized";
import NotFound from "@truckmoov/reusables/components/pages/NotFound";
import {
  createBrowserRouter, redirect,
} from "react-router";
import App from "@/App";
import { AuthLayout } from "@/features/auth/components/layout/AuthLayout";
import AuthPage from "@/features/auth/components/pages/AuthPage";
import InvitePage from "@/features/auth/components/pages/InvitePage";
import { DashboardLayout } from "@/features/dashboard/components/layout/DashboardLayout";
import { ADMIN_ROLES } from "@/features/dashboard/utils/sidebarNav";
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
/**
 * The old Security section (and its sub-pages) and Compliance & Audit both open
 * the unified Audit & Compliance page, as fleetflow's LegacyAuditRedirect does:
 * `?tab=events` → `view=security`, `?tab=sim-audit` → `view=sim`, and every
 * other param (`tenant`, `event`) is kept.
 */
function legacyAuditRedirect({ request }: { request: Request }) {
  const params = new URL(request.url).searchParams;
  const tab = params.get("tab");
  if (tab === "events" || tab === "sim-audit") {
    params.delete("tab");
    params.set(
      "view",
      tab === "events" ? "security" : "sim",
    );
  }
  const qs = params.toString();
  return redirect(`/audit-compliance${qs ? `?${qs}` : ""}`);
}

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
            path: "/tenants/onboarding/:id",
            lazy: async () => ({ Component: (await import("@/features/tenants/components/pages/OnboardingApplicationPage")).default }),
          },
          {
            path: "/tenants/:id",
            lazy: async () => ({ Component: (await import("@/features/tenants/components/pages/TenantDetailPage")).default }),
          },
          {
            path: "/installers",
            lazy: async () => ({ Component: (await import("@/features/installers/components/pages/InstallersPage")).default }),
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
          // Communications group. WhatsApp Setup is off the admin nav; its old
          // URL lands on the inbox instead of a 404.
          {
            path: "/whatsapp", loader: () => redirect("/inbox"),
          },
          {
            path: "/inbox",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformInbox")).default }),
          },
          {
            path: "/sms-templates",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformSmsTemplates")).default }),
          },
          {
            path: "/voice",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformVoice")).default }),
          },
          {
            path: "/campaigns",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformCampaigns")).default }),
          },
          {
            path: "/subscription",
            lazy: async () => ({ Component: (await import("@/pages/platform/PlatformCommercialBilling")).default }),
          },
          {
            path: "/audit-compliance",
            lazy: async () => ({ Component: (await import("@/features/audit/components/pages/AuditCompliancePage")).default }),
          },
          // Old Security section and Compliance & Audit URLs land on the unified page.
          {
            path: "/security/*", loader: legacyAuditRedirect,
          },
          {
            path: "/compliance-audit", loader: legacyAuditRedirect,
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
                lazy: async () => ({ Component: (await import("@/features/settings/components/pages/MyProfileSettingsPage")).default }),
              },
              {
                path: "platform-profile",
                lazy: async () => ({ Component: (await import("@/features/settings/components/ui/PlatformProfilePanel")).PlatformProfilePanel }),
              },
              {
                path: "features",
                lazy: async () => ({ Component: (await import("@/features/settings/components/ui/PlatformFeaturesPanel")).PlatformFeaturesPanel }),
              },
              {
                path: "display",
                lazy: async () => ({ Component: (await import("@/features/settings/components/ui/DisplayDefaultsPanel")).DisplayDefaultsPanel }),
              },
              {
                path: "team",
                lazy: async () => ({ Component: (await import("@/features/settings/components/pages/TeamSettingsPage")).default }),
              },
              {
                // Off the tab bar (as in fleetflow) — still reachable by URL.
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
                lazy: async () => ({ Component: (await import("@/features/settings/components/ui/NotificationPreferencesPanel")).NotificationPreferencesPanel }),
              },
              {
                path: "support",
                lazy: async () => ({ Component: (await import("@/features/settings/components/ui/SupportPreferencesPanel")).SupportPreferencesPanel }),
              },
              {
                // The old Security tab (TRU-FE-23 two-factor) now sits on My Profile.
                path: "security", loader: () => redirect("/settings"),
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
