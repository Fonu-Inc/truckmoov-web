import NotAuthorized from "@truckmoov/reusables/components/pages/NotAuthorized";
import NotFound from "@truckmoov/reusables/components/pages/NotFound";
import { createBrowserRouter } from "react-router";
import App from "@/App";
import { AuthLayout } from "@/features/auth/components/layout/AuthLayout";
import AuthPage from "@/features/auth/components/pages/AuthPage";
import DeviceSimulator from "@/pages/platform/DeviceSimulator";
import PlatformBilling from "@/pages/platform/PlatformBilling";
import PlatformCommunications from "@/pages/platform/PlatformCommunications";
import PlatformComplianceAudit from "@/pages/platform/PlatformComplianceAudit";
import PlatformDashboard from "@/pages/platform/PlatformDashboard";
import PlatformDataBundles from "@/pages/platform/PlatformDataBundles";
import PlatformDevices from "@/pages/platform/PlatformDevices";
import PlatformMessagingCenter from "@/pages/platform/PlatformMessagingCenter";
import PlatformSecurity from "@/pages/platform/PlatformSecurity";
import PlatformSettings from "@/pages/platform/PlatformSettings";
import PlatformSIMs from "@/pages/platform/PlatformSIMs";
import PlatformSupport from "@/pages/platform/PlatformSupport";
import PlatformTenants from "@/pages/platform/PlatformTenants";

/**
 * App is a pathless layout route: it owns the provider tower, the AuthGuard
 * and the Outlet. Children therefore keep absolute paths.
 *
 * Which of these need a session is decided by AuthGuard from PUBLIC_ROUTES
 * (features/auth/utils/publicRoutes.ts), not by nesting here.
 */
export const router = createBrowserRouter([
  {
    Component: App,
    children: [
      // AuthLayout supplies the branding panel and derives its help mode from
      // the pathname, so it wraps the auth screen rather than the page
      // rendering the panel itself.
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
        path: "/not-authorized",
        Component: NotAuthorized,
      },
      {
        path: "/",
        Component: PlatformDashboard,
      },
      {
        path: "/tenants",
        Component: PlatformTenants,
      },
      {
        path: "/devices",
        Component: PlatformDevices,
      },
      {
        path: "/sims",
        Component: PlatformSIMs,
      },
      {
        path: "/data-bundles",
        Component: PlatformDataBundles,
      },
      {
        path: "/simulator",
        Component: DeviceSimulator,
      },
      {
        path: "/communications",
        Component: PlatformCommunications,
      },
      {
        path: "/messaging",
        Component: PlatformMessagingCenter,
      },
      {
        path: "/billing",
        Component: PlatformBilling,
      },
      {
        path: "/security",
        Component: PlatformSecurity,
      },
      {
        path: "/compliance-audit",
        Component: PlatformComplianceAudit,
      },
      {
        path: "/settings",
        Component: PlatformSettings,
      },
      {
        path: "/support",
        Component: PlatformSupport,
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
