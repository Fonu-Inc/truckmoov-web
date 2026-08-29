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
import CompleteProfilePage from "@/features/auth/components/pages/CompleteProfilePage";
import ForgotPasswordPage from "@/features/auth/components/pages/ForgotPasswordPage";
import InvitePage from "@/features/auth/components/pages/InvitePage";
import ResetPasswordPage from "@/features/auth/components/pages/ResetPasswordPage";
import SignUpPage from "@/features/auth/components/pages/SignUpPage";
import VerifyEmailPage from "@/features/auth/components/pages/VerifyEmailPage";
import { RoleHomeRedirect } from "@/features/auth/components/ui/RoleHomeRedirect";
import { DashboardLayout } from "@/features/dashboard/components/layout/DashboardLayout";
import { getRolesForHref } from "@/features/dashboard/utils/sidebarNav";
import { SettingsLayout } from "@/features/settings/components/layout/SettingsLayout";
import { SETTINGS_TABS } from "@/features/settings/utils/settingsNav";
import { useAuthStore } from "@/stores/authStore";

const useRole = () => useAuthStore(s => s.user?.role);

/**
 * Wrap a lazy Component with a role check. URL-typing a page the current role
 * can't see lands on /not-authorized before the chunk mounts. Two variants:
 *
 *  - `guarded(href, importer)` — role list comes from the sidebar entry; a
 *    typo means the boot-time throw fires instead of the guard leaking.
 *  - `guardedBy(allow, importer)` — for routes that aren't in the sidebar
 *    (details, aliases already redirect elsewhere) or where a settings tab
 *    supplies the list.
 *
 * These return the object react-router's `lazy` expects, so the route table
 * still reads leaf-per-line: `{ path, lazy: guarded("/fleet", () => import(…)) }`.
 */
type LazyImporter = () => Promise<{ default: React.ComponentType<unknown> }>;
type NamedLazyImporter<K extends string> = () => Promise<Record<K, React.ComponentType<unknown>>>;

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

function guarded(href: string, importer: LazyImporter) {
  const allow = getRolesForHref(href);
  if (!allow)
    throw new Error(`route.tsx: no sidebar entry for ${href}`);
  return async () => ({
    Component: withGuard(
      allow,
      (await importer()).default,
    ),
  });
}

function guardedBy(allow: UserRole[], importer: LazyImporter) {
  return async () => ({
    Component: withGuard(
      allow,
      (await importer()).default,
    ),
  });
}

function guardedByNamed<K extends string>(allow: UserRole[], importer: NamedLazyImporter<K>, key: K) {
  return async () => ({
    Component: withGuard(
      allow,
      (await importer())[key],
    ),
  });
}

/**
 * Role list for a `/settings/*` child — reads straight from SETTINGS_TABS
 * so the tab bar and the URL guard cannot disagree. Returns `undefined` when
 * the tab is visible to every role, so the caller skips the wrapper.
 */
function settingsTabRoles(to: string): UserRole[] | undefined {
  const tab = SETTINGS_TABS.find(t => t.to === to);
  if (!tab)
    throw new Error(`route.tsx: no SETTINGS_TABS entry for ${to}`);
  return tab.hasPermissions.length === 0 ? undefined : tab.hasPermissions;
}

/**
 * SettingsLayout, wrapped in the sidebar's /settings role list so URL-typing
 * `/settings/*` from a role that isn't in that list (DISPATCHER, FINANCE_VIEWER)
 * lands on /not-authorized before any child tab loads. Built once at import so
 * the wrapper identity is stable across renders.
 */
const GuardedSettingsLayout = withGuard(
  getRolesForHref("/settings") ?? [],
  SettingsLayout,
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
 * of per page. Routes outside it — auth, the redirects, the print preview,
 * 404/403 — own their own chrome.
 *
 * `/settings` is the one pathful layout route: SettingsLayout owns the tab bar,
 * each tab is a child route. Tabs are routes, not query params — see the block
 * further down and features/settings/utils/settingsNav.ts.
 *
 * Pages are loaded through react-router's `lazy`, not imported at the top: each
 * becomes its own chunk that arrives when the route is first visited. Eagerly
 * importing all fifty-odd of them put every dashboard, table, chart and map into
 * the initial bundle, so the first paint waited on code for pages nobody had
 * opened. `DashboardLayout` renders the router's pending state while a chunk
 * loads. No `Suspense` boundary is involved — the router owns the wait.
 *
 * `App`, the two layouts, the auth pages, `RoleHomeRedirect` and the status
 * screens stay eager: they are small and on the critical path, and a spinner in
 * place of the login form would be worse than the bytes.
 */
export const router = createBrowserRouter([
  {
    Component: App,
    children: [
      // Auth screens that share the split branding panel. AuthLayout derives
      // the help mode from the pathname, so it wraps them rather than each
      // page rendering the panel itself.
      {
        Component: AuthLayout,
        children: [
          {
            path: "/auth",
            Component: AuthPage,
          },
          {
            path: "/auth/signup",
            Component: SignUpPage,
          },
          {
            path: "/auth/forgot-password",
            Component: ForgotPasswordPage,
          },
        ],
      },

      // These two use their own centred card shell, not the panel.
      {
        path: "/auth/reset-password",
        Component: ResetPasswordPage,
      },
      {
        path: "/auth/invite",
        Component: InvitePage,
      },
      {
        path: "/auth/verify-email",
        Component: VerifyEmailPage,
      },
      {
        path: "/auth/complete-profile",
        Component: CompleteProfilePage,
      },

      {
        path: "/",
        Component: RoleHomeRedirect,
      },
      {
        path: "/not-authorized",
        Component: NotAuthorized,
      },

      // No dashboard shell of their own: a bare redirect, a print-only
      // preview, and a scratch page.
      {
        path: "/subscription-invoices",
        lazy: async () => ({ Component: (await import("@/pages/admin/SubscriptionInvoices")).default }),
      },
      {
        path: "/fleet/pl-statement",
        lazy: async () => ({ Component: (await import("@/pages/admin/VehiclePLStatementPreview")).default }),
      },
      {
        path: "/debug/map",
        lazy: async () => ({ Component: (await import("@/pages/debug/DebugMap")).default }),
      },

      // Aliases for pages that are now a tab on another page. A loader
      // redirect resolves before render, unlike the <Navigate> these replaced.
      {
        path: "/ivr-dashboard",
        loader: () => redirect("/messages?tab=ivr-dashboard"),
      },
      {
        path: "/analytics",
        loader: () => redirect("/fleet?tab=analytics"),
      },
      {
        path: "/maintenance",
        loader: () => redirect("/fleet?tab=maintenance"),
      },
      {
        path: "/fuel",
        loader: () => redirect("/fleet?tab=fuel"),
      },
      {
        path: "/compliance",
        loader: () => redirect("/fleet?tab=compliance"),
      },

      // Everything inside the dashboard shell. Pages render their own content
      // only; the sidebar, top bar and page title come from DashboardLayout.
      //
      // Routes whose href appears in the sidebar are guarded via `guarded()` —
      // the role list is read from `getRolesForHref`, so typing a hidden URL
      // returns /not-authorized instead of rendering. Routes that aren't in
      // the sidebar (onboarding, detail pages, the supervisor tree, help and
      // architecture docs) stay open to any logged-in role, matching today.
      {
        Component: DashboardLayout,
        children: [
          // Onboarding — no sidebar entry, no guard.
          {
            path: "/onboarding",
            lazy: async () => ({ Component: (await import("@/pages/onboarding/SubscriptionOnboarding")).default }),
          },
          {
            path: "/onboarding/kyc",
            lazy: async () => ({ Component: (await import("@/pages/onboarding/KycOnboarding")).default }),
          },
          {
            path: "/onboarding/activate",
            lazy: async () => ({ Component: (await import("@/pages/onboarding/ActivationOnboarding")).default }),
          },
          {
            path: "/onboarding/quick-access",
            lazy: async () => ({ Component: (await import("@/pages/onboarding/WelcomeDashboard")).default }),
          },

          // Role dashboards (each home has a single-role sidebar entry).
          {
            path: "/enterprise",
            lazy: guarded(
              "/enterprise",
              () => import("@/features/dashboard/components/pages/EnterpriseLogisticsDashboard"),
            ),
          },
          {
            path: "/aggregator",
            lazy: guarded(
              "/aggregator",
              () => import("@/features/dashboard/components/pages/AggregatorDashboard"),
            ),
          },
          {
            path: "/owner-operator",
            lazy: guarded(
              "/owner-operator",
              () => import("@/features/dashboard/components/pages/OwnerOperatorDashboard"),
            ),
          },
          {
            // Detail page for the same feature as /owner-operator/vehicles.
            path: "/owner-operator/vehicle/:vehicleId",
            lazy: guardedBy(
              ["OWNER_OPERATOR"],
              () => import("@/pages/owner-operator/OwnerOperatorVehicleDetail"),
            ),
          },
          {
            path: "/owner-operator/vehicles",
            lazy: guarded(
              "/owner-operator/vehicles",
              () => import("@/pages/owner-operator/OwnerOperatorVehicles"),
            ),
          },
          {
            path: "/owner-operator/documents",
            lazy: guarded(
              "/owner-operator/documents",
              () => import("@/pages/owner-operator/OwnerOperatorDocuments"),
            ),
          },
          {
            path: "/owner-operator/jobs",
            lazy: guarded(
              "/owner-operator/jobs",
              () => import("@/pages/owner-operator/OwnerOperatorJobs"),
            ),
          },

          // Tenant Admin / Fleet Provider
          {
            path: "/overview",
            lazy: guarded(
              "/overview",
              () => import("@/features/dashboard/components/pages/TenantAdminDashboard"),
            ),
          },
          {
            path: "/fleet",
            lazy: guarded(
              "/fleet",
              () => import("@/pages/admin/FleetManagement"),
            ),
          },
          {
            path: "/drivers",
            lazy: guarded(
              "/drivers",
              () => import("@/pages/admin/DriverManagement"),
            ),
          },
          {
            path: "/devices",
            lazy: guarded(
              "/devices",
              () => import("@/pages/admin/DeviceManagement"),
            ),
          },
          {
            path: "/sims",
            lazy: guarded(
              "/sims",
              () => import("@/pages/admin/SIMManagement"),
            ),
          },
          {
            path: "/data-bundles",
            lazy: guarded(
              "/data-bundles",
              () => import("@/pages/admin/DataBundles"),
            ),
          },
          {
            path: "/jobs",
            lazy: guarded(
              "/jobs",
              () => import("@/pages/admin/JobDispatch"),
            ),
          },
          {
            path: "/map",
            lazy: guarded(
              "/map",
              () => import("@/pages/admin/LiveMap"),
            ),
          },
          {
            // Not in the sidebar — no guard, same as today.
            path: "/behavior",
            lazy: async () => ({ Component: (await import("@/pages/admin/DriverBehaviorDashboard")).default }),
          },
          {
            path: "/fatigue",
            lazy: async () => ({ Component: (await import("@/pages/admin/DriverFatigueDashboard")).default }),
          },
          // Messages is a pathful layout route: CommunicationsLayout owns the
          // outer tab bar, each tab is a child route (see design.md "Tabs are
          // routes, not query params"). Email nests one more layout for its
          // Inbox / Provider Settings sub-tabs. Outer guard covers the subtree.
          {
            path: "/messages",
            lazy: guarded(
              "/messages",
              () => import("@/features/communications/components/layout/CommunicationsLayout"),
            ),
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/features/communications/components/pages/CampaignsPage")).CampaignsPage }),
              },
              {
                path: "whatsapp",
                lazy: async () => ({ Component: (await import("@/features/communications/components/ui/WhatsAppBusinessSetup")).WhatsAppBusinessSetup }),
              },
              {
                path: "email",
                lazy: async () => ({ Component: (await import("@/features/communications/components/layout/EmailLayout")).EmailLayout }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({ Component: (await import("@/features/communications/components/ui/EmailInbox")).EmailInbox }),
                  },
                  {
                    path: "settings",
                    lazy: async () => ({ Component: (await import("@/features/communications/components/ui/EmailProviderSettings")).EmailProviderSettings }),
                  },
                ],
              },
              {
                path: "templates",
                lazy: async () => ({ Component: (await import("@/features/communications/components/ui/SMSTemplatesManager")).SMSTemplatesManager }),
              },
              {
                path: "voice",
                lazy: async () => ({ Component: (await import("@/features/communications/components/ui/VoiceIVRManager")).VoiceIVRManager }),
              },
              {
                path: "recordings",
                lazy: async () => ({ Component: (await import("@/features/communications/components/ui/CallRecordingsManager")).CallRecordingsManager }),
              },
              {
                path: "ivr-dashboard",
                lazy: async () => ({ Component: (await import("@/features/communications/components/ui/IVRDashboardTab")).IVRDashboardTab }),
              },
            ],
          },
          {
            path: "/inbox",
            lazy: guarded(
              "/inbox",
              () => import("@/pages/admin/OmnichannelInbox"),
            ),
          },
          {
            path: "/wallet",
            lazy: guarded(
              "/wallet",
              () => import("@/pages/admin/TenantWallet"),
            ),
          },
          {
            path: "/installation",
            lazy: guarded(
              "/installation",
              () => import("@/pages/admin/DeviceInstallation"),
            ),
          },
          {
            path: "/integrations",
            lazy: guarded(
              "/integrations",
              () => import("@/pages/admin/Integrations"),
            ),
          },
          {
            path: "/job-offers",
            lazy: guarded(
              "/job-offers",
              () => import("@/pages/admin/JobOffers"),
            ),
          },
          {
            path: "/reports",
            lazy: guarded(
              "/reports",
              () => import("@/pages/admin/Reports"),
            ),
          },
          {
            path: "/waybill-invoices",
            lazy: guarded(
              "/waybill-invoices",
              () => import("@/pages/admin/WaybillInvoices"),
            ),
          },
          {
            path: "/sustainability",
            lazy: guarded(
              "/sustainability",
              () => import("@/pages/admin/Sustainability"),
            ),
          },
          // Settings is a pathful layout route: SettingsLayout owns the tab bar
          // and the Outlet, one child route per tab. The tab list it renders is
          // features/settings/utils/settingsNav.ts — keep the two in step.
          //
          // Two levels of guarding: the whole subtree is behind the sidebar
          // guard (four tenant admin roles), and each restricted tab wraps its
          // lazy Component with `settingsTabRoles(to)`. A tab with an empty
          // `hasPermissions` skips the wrapper. Subscription nests one more
          // layout — Plan (index) and Invoices — under a sub-tab bar.
          {
            path: "/settings",
            Component: GuardedSettingsLayout,
            children: [
              {
                index: true,
                lazy: guardedBy(
                  settingsTabRoles("/settings") ?? [],
                  () => import("@/features/settings/components/pages/OrganizationSettingsPage"),
                ),
              },
              {
                path: "subscription",
                lazy: guardedBy(
                  settingsTabRoles("/settings/subscription") ?? [],
                  () => import("@/features/settings/components/pages/SubscriptionSettingsPage"),
                ),
                children: [
                  {
                    index: true,
                    lazy: async () => ({ Component: (await import("@/features/settings/components/ui/TenantSubscriptionCard")).TenantSubscriptionCard }),
                  },
                  {
                    path: "invoices",
                    lazy: async () => ({ Component: (await import("@/features/settings/components/ui/SubscriptionInvoicesPanel")).SubscriptionInvoicesPanel }),
                  },
                ],
              },
              {
                path: "storage",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/storage") ?? [],
                  () => import("@/features/settings/components/ui/StoragePanel"),
                  "StoragePanel",
                ),
              },
              {
                path: "invoicing",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/invoicing") ?? [],
                  () => import("@/features/settings/components/ui/TenantInvoiceConfigPanel"),
                  "TenantInvoiceConfigPanel",
                ),
              },
              {
                path: "kyc",
                lazy: guardedBy(
                  settingsTabRoles("/settings/kyc") ?? [],
                  () => import("@/features/settings/components/pages/KycSettingsPage"),
                ),
              },
              {
                path: "fleet",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/fleet") ?? [],
                  () => import("@/features/settings/components/ui/MaintenanceConfigPanel"),
                  "MaintenanceConfigPanel",
                ),
              },
              {
                path: "ai",
                lazy: guardedBy(
                  settingsTabRoles("/settings/ai") ?? [],
                  () => import("@/features/settings/components/pages/AiSettingsPage"),
                ),
              },
              {
                path: "ai-usage",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/ai-usage") ?? [],
                  () => import("@/features/settings/components/ui/AIUsageAnalyticsPanel"),
                  "AIUsageAnalyticsPanel",
                ),
              },
              {
                path: "notifications",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/notifications") ?? [],
                  () => import("@/features/settings/components/ui/NotificationPreferencesPanel"),
                  "NotificationPreferencesPanel",
                ),
              },
              {
                path: "dispatch",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/dispatch") ?? [],
                  () => import("@/features/settings/components/ui/DispatchPreferencesPanel"),
                  "DispatchPreferencesPanel",
                ),
              },
              {
                path: "communication",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/communication") ?? [],
                  () => import("@/features/settings/components/ui/TenantCommunicationSettings"),
                  "TenantCommunicationSettings",
                ),
              },
              {
                path: "users",
                lazy: guardedBy(
                  settingsTabRoles("/settings/users") ?? [],
                  () => import("@/features/settings/components/pages/UsersSettingsPage"),
                ),
              },
              {
                path: "branding",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/branding") ?? [],
                  () => import("@/features/settings/components/ui/TenantBrandingPanel"),
                  "TenantBrandingPanel",
                ),
              },
              {
                path: "integrations",
                lazy: guardedBy(
                  settingsTabRoles("/settings/integrations") ?? [],
                  () => import("@/features/settings/components/pages/IntegrationsSettingsPage"),
                ),
              },
              {
                path: "upgrade",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/upgrade") ?? [],
                  () => import("@/features/settings/components/ui/UpgradeSettingsPanel"),
                  "UpgradeSettingsPanel",
                ),
              },
            ],
          },

          // Supervisor
          {
            path: "/supervisor",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorDashboard")).default }),
          },
          {
            path: "/supervisor/map",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorLiveMap")).default }),
          },
          {
            path: "/supervisor/dispatch",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorDispatch")).default }),
          },
          {
            path: "/supervisor/drivers",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorDrivers")).default }),
          },
          {
            path: "/supervisor/alerts",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorAlerts")).default }),
          },
          {
            path: "/supervisor/messages",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorMessages")).default }),
          },
          {
            path: "/supervisor/inbox",
            lazy: async () => ({ Component: (await import("@/pages/admin/OmnichannelInbox")).default }),
          },
          {
            path: "/supervisor/reports",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorReports")).default }),
          },
          {
            path: "/supervisor/*",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorDashboard")).default }),
          },

          // Dispatcher Portal (independent — do not share with Supervisor/Admin)
          {
            path: "/dispatcher",
            lazy: async () => ({ Component: (await import("@/features/dashboard/components/pages/DispatcherDashboard")).default }),
          },
          {
            path: "/dispatcher/dispatch",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherDispatch")).default }),
          },
          {
            path: "/dispatcher/map",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherLiveMap")).default }),
          },
          {
            path: "/dispatcher/drivers",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherDrivers")).default }),
          },
          {
            path: "/dispatcher/devices",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherDevices")).default }),
          },
          {
            path: "/dispatcher/sims",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherSIMs")).default }),
          },
          {
            path: "/dispatcher/alerts",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherAlerts")).default }),
          },
          {
            path: "/dispatcher/messages",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherMessages")).default }),
          },
          {
            path: "/dispatcher/inbox",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherInbox")).default }),
          },
          {
            path: "/dispatcher/reports",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherReports")).default }),
          },
          {
            path: "/dispatcher/*",
            lazy: async () => ({ Component: (await import("@/features/dashboard/components/pages/DispatcherDashboard")).default }),
          },

          // Architecture documentation
          {
            path: "/architecture",
            lazy: async () => ({ Component: (await import("@/pages/Architecture")).default }),
          },
          {
            path: "/technical-architecture",
            lazy: async () => ({ Component: (await import("@/pages/TechnicalArchitecture")).default }),
          },

          // Help & Support
          {
            path: "/help",
            lazy: async () => ({ Component: (await import("@/pages/support/HelpSupport")).default }),
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
