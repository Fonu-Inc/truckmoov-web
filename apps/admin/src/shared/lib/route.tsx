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
import {
  guardedByPermission, guardedByPermissionNamed,
} from "@/shared/lib/permissionRoute";
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
 * Fine-grained permission gates use guardedByPermission (catalog keys aligned
 * with API @Requires / @OnResource, see shared/lib/permissionRoute.tsx).
 * Missing permission → /not-authorized, decided on every render and before
 * the page chunk is fetched.
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

      {
        Component: GuardedDashboardLayout,
        children: [
          {
            path: "/",
            lazy: guardedByPermission(
              "/",
              () => import("@/features/dashboard/components/pages/PlatformDashboard"),
            ),
          },
          {
            path: "/tenants",
            lazy: guardedByPermission(
              "/tenants",
              () => import("@/features/tenants/components/pages/TenantsPage"),
            ),
          },
          {
            path: "/tenants/onboarding/:id",
            lazy: guardedByPermission(
              "/tenants/onboarding",
              () => import("@/features/tenants/components/pages/OnboardingApplicationPage"),
            ),
          },
          {
            path: "/tenants/:id",
            lazy: guardedByPermission(
              "/tenants",
              () => import("@/features/tenants/components/pages/TenantDetailPage"),
            ),
          },
          {
            path: "/installers",
            lazy: guardedByPermission(
              "/installers",
              () => import("@/features/installers/components/pages/InstallersPage"),
            ),
          },
          {
            path: "/devices",
            lazy: guardedByPermission(
              "/devices",
              () => import("@/pages/platform/PlatformDevices"),
            ),
          },
          {
            path: "/sims",
            lazy: guardedByPermission(
              "/sims",
              () => import("@/pages/platform/PlatformSIMs"),
            ),
          },
          {
            path: "/data-bundles",
            lazy: guardedByPermission(
              "/data-bundles",
              () => import("@/pages/platform/PlatformDataBundles"),
            ),
          },
          {
            path: "/simulator",
            lazy: guardedByPermission(
              "/simulator",
              () => import("@/pages/platform/DeviceSimulator"),
            ),
          },
          {
            path: "/messaging",
            lazy: guardedByPermission(
              "/messaging",
              () => import("@/pages/platform/PlatformMessagingCenter"),
            ),
          },
          {
            path: "/whatsapp",
            lazy: guardedByPermission(
              "/whatsapp",
              () => import("@/pages/platform/PlatformWhatsAppSetup"),
            ),
          },
          {
            path: "/inbox",
            lazy: guardedByPermission(
              "/inbox",
              () => import("@/pages/platform/PlatformInbox"),
            ),
          },
          {
            path: "/sms-templates",
            lazy: guardedByPermission(
              "/sms-templates",
              () => import("@/pages/platform/PlatformSmsTemplates"),
            ),
          },
          {
            path: "/voice",
            lazy: guardedByPermission(
              "/voice",
              () => import("@/pages/platform/PlatformVoice"),
            ),
          },
          {
            path: "/campaigns",
            lazy: guardedByPermission(
              "/campaigns",
              () => import("@/pages/platform/PlatformCampaigns"),
            ),
          },
          {
            path: "/subscription",
            lazy: guardedByPermission(
              "/subscription",
              () => import("@/pages/platform/PlatformCommercialBilling"),
            ),
          },
          {
            path: "/security",
            Component: GuardedSecurityLayout,
            children: [
              {
                index: true,
                lazy: guardedByPermission(
                  "/security",
                  () => import("@/features/security/components/pages/SecurityOverviewPage"),
                ),
              },
              {
                path: "payments-access",
                lazy: guardedByPermission(
                  "/security",
                  () => import("@/features/security/components/pages/PaymentsAccessPage"),
                ),
              },
              {
                path: "devices-sims",
                lazy: guardedByPermission(
                  "/security",
                  () => import("@/features/security/components/pages/DevicesSimsPage"),
                ),
              },
            ],
          },
          {
            path: "/compliance-audit",
            lazy: guardedByPermission(
              "/compliance-audit",
              () => import("@/pages/platform/PlatformComplianceAudit"),
            ),
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
                lazy: guardedByPermission(
                  "/settings",
                  () => import("@/features/settings/components/pages/GeneralSettingsPage"),
                ),
              },
              {
                path: "team",
                lazy: guardedByPermission(
                  "/settings/team",
                  () => import("@/features/settings/components/pages/TeamSettingsPage"),
                ),
              },
              {
                path: "ai-providers",
                lazy: guardedByPermissionNamed(
                  "/settings/ai-providers",
                  () => import("@/features/settings/components/ui/PlatformAISettings"),
                  "PlatformAISettings",
                ),
              },
              {
                path: "telephony",
                lazy: guardedByPermission(
                  "/settings/telephony",
                  () => import("@/features/settings/components/pages/TelephonySettingsPage"),
                ),
                children: [
                  {
                    index: true,
                    lazy: guardedByPermissionNamed(
                      "/settings/telephony",
                      () => import("@/features/settings/components/ui/TelephonySettings"),
                      "TelephonySettings",
                    ),
                  },
                  {
                    path: "numbers",
                    lazy: guardedByPermissionNamed(
                      "/settings/telephony",
                      () => import("@/features/settings/components/ui/PhoneNumberManagement"),
                      "PhoneNumberManagement",
                    ),
                  },
                  {
                    path: "sender-ids",
                    lazy: guardedByPermissionNamed(
                      "/settings/telephony",
                      () => import("@/features/settings/components/ui/SenderIdApprovalQueue"),
                      "SenderIdApprovalQueue",
                    ),
                  },
                ],
              },
              {
                path: "notifications",
                lazy: guardedByPermission(
                  "/settings/notifications",
                  () => import("@/features/settings/components/pages/NotificationsSettingsPage"),
                ),
              },
              {
                // Own two-factor — no catalog permission (any signed-in admin).
                path: "security",
                lazy: guardedByPermissionNamed(
                  "/settings/security",
                  () => import("@truckmoov/reusables/components/auth/TwoFactorSetupCard"),
                  "TwoFactorSetupCard",
                ),
              },
            ],
          },
          {
            path: "/support",
            lazy: guardedByPermission(
              "/support",
              () => import("@/pages/platform/PlatformSupport"),
            ),
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
