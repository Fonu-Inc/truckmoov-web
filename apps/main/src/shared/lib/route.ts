import NotAuthorized from "@truckmoov/reusables/components/pages/NotAuthorized";
import NotFound from "@truckmoov/reusables/components/pages/NotFound";
import {
  createBrowserRouter, redirect,
} from "react-router";
import App from "@/App";
import { AuthLayout } from "@/features/auth/components/layout/AuthLayout";
import AuthPage from "@/features/auth/components/pages/AuthPage";
import ForgotPasswordPage from "@/features/auth/components/pages/ForgotPasswordPage";
import InvitePage from "@/features/auth/components/pages/InvitePage";
import ResetPasswordPage from "@/features/auth/components/pages/ResetPasswordPage";
import SignUpPage from "@/features/auth/components/pages/SignUpPage";
import { RoleHomeRedirect } from "@/features/auth/components/ui/RoleHomeRedirect";
import { DashboardLayout } from "@/features/dashboard/components/layout/DashboardLayout";

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
      {
        path: "/subscription",
        loader: () => redirect("/settings?tab=subscription"),
      },

      // Everything inside the dashboard shell. Pages render their own content
      // only; the sidebar, top bar and page title come from DashboardLayout.
      {
        Component: DashboardLayout,
        children: [
          // Onboarding
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

          // Enterprise
          {
            path: "/enterprise",
            lazy: async () => ({ Component: (await import("@/features/dashboard/components/pages/EnterpriseLogisticsDashboard")).default }),
          },

          // Aggregator
          {
            path: "/aggregator",
            lazy: async () => ({ Component: (await import("@/features/dashboard/components/pages/AggregatorDashboard")).default }),
          },

          // Owner-Operator
          {
            path: "/owner-operator",
            lazy: async () => ({ Component: (await import("@/features/dashboard/components/pages/OwnerOperatorDashboard")).default }),
          },
          {
            path: "/owner-operator/vehicle/:vehicleId",
            lazy: async () => ({ Component: (await import("@/pages/owner-operator/OwnerOperatorVehicleDetail")).default }),
          },
          {
            path: "/owner-operator/vehicles",
            lazy: async () => ({ Component: (await import("@/pages/owner-operator/OwnerOperatorVehicles")).default }),
          },
          {
            path: "/owner-operator/documents",
            lazy: async () => ({ Component: (await import("@/pages/owner-operator/OwnerOperatorDocuments")).default }),
          },
          {
            path: "/owner-operator/jobs",
            lazy: async () => ({ Component: (await import("@/pages/owner-operator/OwnerOperatorJobs")).default }),
          },

          // Tenant Admin / Fleet Provider
          {
            path: "/overview",
            lazy: async () => ({ Component: (await import("@/features/dashboard/components/pages/TenantAdminDashboard")).default }),
          },
          {
            path: "/fleet",
            lazy: async () => ({ Component: (await import("@/pages/admin/FleetManagement")).default }),
          },
          {
            path: "/drivers",
            lazy: async () => ({ Component: (await import("@/pages/admin/DriverManagement")).default }),
          },
          {
            path: "/devices",
            lazy: async () => ({ Component: (await import("@/pages/admin/DeviceManagement")).default }),
          },
          {
            path: "/sims",
            lazy: async () => ({ Component: (await import("@/pages/admin/SIMManagement")).default }),
          },
          {
            path: "/data-bundles",
            lazy: async () => ({ Component: (await import("@/pages/admin/DataBundles")).default }),
          },
          {
            path: "/jobs",
            lazy: async () => ({ Component: (await import("@/pages/admin/JobDispatch")).default }),
          },
          {
            path: "/map",
            lazy: async () => ({ Component: (await import("@/pages/admin/LiveMap")).default }),
          },
          {
            path: "/behavior",
            lazy: async () => ({ Component: (await import("@/pages/admin/DriverBehaviorDashboard")).default }),
          },
          {
            path: "/fatigue",
            lazy: async () => ({ Component: (await import("@/pages/admin/DriverFatigueDashboard")).default }),
          },
          {
            path: "/messages",
            lazy: async () => ({ Component: (await import("@/pages/admin/MessagingCenter")).default }),
          },
          {
            path: "/inbox",
            lazy: async () => ({ Component: (await import("@/pages/admin/OmnichannelInbox")).default }),
          },
          {
            path: "/wallet",
            lazy: async () => ({ Component: (await import("@/pages/admin/TenantWallet")).default }),
          },
          {
            path: "/installation",
            lazy: async () => ({ Component: (await import("@/pages/admin/DeviceInstallation")).default }),
          },
          {
            path: "/integrations",
            lazy: async () => ({ Component: (await import("@/pages/admin/Integrations")).default }),
          },
          {
            path: "/job-offers",
            lazy: async () => ({ Component: (await import("@/pages/admin/JobOffers")).default }),
          },
          {
            path: "/reports",
            lazy: async () => ({ Component: (await import("@/pages/admin/Reports")).default }),
          },
          {
            path: "/waybill-invoices",
            lazy: async () => ({ Component: (await import("@/pages/admin/WaybillInvoices")).default }),
          },
          {
            path: "/sustainability",
            lazy: async () => ({ Component: (await import("@/pages/admin/Sustainability")).default }),
          },
          {
            path: "/settings",
            lazy: async () => ({ Component: (await import("@/pages/admin/Settings")).default }),
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
