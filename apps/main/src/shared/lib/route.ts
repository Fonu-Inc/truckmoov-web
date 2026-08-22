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
import DataBundles from "@/pages/admin/DataBundles";
import DeviceInstallation from "@/pages/admin/DeviceInstallation";
import DeviceManagement from "@/pages/admin/DeviceManagement";
import DriverBehaviorDashboard from "@/pages/admin/DriverBehaviorDashboard";
import DriverFatigueDashboard from "@/pages/admin/DriverFatigueDashboard";
import DriverManagement from "@/pages/admin/DriverManagement";
import FleetManagement from "@/pages/admin/FleetManagement";
import Integrations from "@/pages/admin/Integrations";
import JobDispatch from "@/pages/admin/JobDispatch";
import JobOffers from "@/pages/admin/JobOffers";
import LiveMap from "@/pages/admin/LiveMap";
import MessagingCenter from "@/pages/admin/MessagingCenter";
import OmnichannelInbox from "@/pages/admin/OmnichannelInbox";
import Reports from "@/pages/admin/Reports";
import Settings from "@/pages/admin/Settings";
import SIMManagement from "@/pages/admin/SIMManagement";
import SubscriptionInvoices from "@/pages/admin/SubscriptionInvoices";
import Sustainability from "@/pages/admin/Sustainability";
import TenantAdminDashboard from "@/pages/admin/TenantAdminDashboard";
import TenantWallet from "@/pages/admin/TenantWallet";
import VehiclePLStatementPreview from "@/pages/admin/VehiclePLStatementPreview";
import WaybillInvoices from "@/pages/admin/WaybillInvoices";
import AggregatorDashboard from "@/pages/aggregator/AggregatorDashboard";
import Architecture from "@/pages/Architecture";
import DebugMap from "@/pages/debug/DebugMap";
import DispatcherAlerts from "@/pages/dispatcher/DispatcherAlerts";
import DispatcherDashboard from "@/pages/dispatcher/DispatcherDashboard";
import DispatcherDevices from "@/pages/dispatcher/DispatcherDevices";
import DispatcherDispatch from "@/pages/dispatcher/DispatcherDispatch";
import DispatcherDrivers from "@/pages/dispatcher/DispatcherDrivers";
import DispatcherInbox from "@/pages/dispatcher/DispatcherInbox";
import DispatcherLiveMap from "@/pages/dispatcher/DispatcherLiveMap";
import DispatcherMessages from "@/pages/dispatcher/DispatcherMessages";
import DispatcherReports from "@/pages/dispatcher/DispatcherReports";
import DispatcherSIMs from "@/pages/dispatcher/DispatcherSIMs";
import EnterpriseLogisticsDashboard from "@/pages/enterprise/EnterpriseLogisticsDashboard";
import ActivationOnboarding from "@/pages/onboarding/ActivationOnboarding";
import KycOnboarding from "@/pages/onboarding/KycOnboarding";
import SubscriptionOnboarding from "@/pages/onboarding/SubscriptionOnboarding";
import WelcomeDashboard from "@/pages/onboarding/WelcomeDashboard";
import OwnerOperatorDashboard from "@/pages/owner-operator/OwnerOperatorDashboard";
import OwnerOperatorDocuments from "@/pages/owner-operator/OwnerOperatorDocuments";
import OwnerOperatorJobs from "@/pages/owner-operator/OwnerOperatorJobs";
import OwnerOperatorVehicleDetail from "@/pages/owner-operator/OwnerOperatorVehicleDetail";
import OwnerOperatorVehicles from "@/pages/owner-operator/OwnerOperatorVehicles";
import SupervisorAlerts from "@/pages/supervisor/SupervisorAlerts";
import SupervisorDashboard from "@/pages/supervisor/SupervisorDashboard";
import SupervisorDispatch from "@/pages/supervisor/SupervisorDispatch";
import SupervisorDrivers from "@/pages/supervisor/SupervisorDrivers";
import SupervisorLiveMap from "@/pages/supervisor/SupervisorLiveMap";
import SupervisorMessages from "@/pages/supervisor/SupervisorMessages";
import SupervisorReports from "@/pages/supervisor/SupervisorReports";
import HelpSupport from "@/pages/support/HelpSupport";
import TechnicalArchitecture from "@/pages/TechnicalArchitecture";

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

      // Onboarding
      {
        path: "/onboarding",
        Component: SubscriptionOnboarding,
      },
      {
        path: "/onboarding/kyc",
        Component: KycOnboarding,
      },
      {
        path: "/onboarding/activate",
        Component: ActivationOnboarding,
      },
      {
        path: "/onboarding/quick-access",
        Component: WelcomeDashboard,
      },

      // Enterprise
      {
        path: "/enterprise",
        Component: EnterpriseLogisticsDashboard,
      },

      // Aggregator
      {
        path: "/aggregator",
        Component: AggregatorDashboard,
      },

      // Owner-Operator
      {
        path: "/owner-operator",
        Component: OwnerOperatorDashboard,
      },
      {
        path: "/owner-operator/vehicle/:vehicleId",
        Component: OwnerOperatorVehicleDetail,
      },
      {
        path: "/owner-operator/vehicles",
        Component: OwnerOperatorVehicles,
      },
      {
        path: "/owner-operator/documents",
        Component: OwnerOperatorDocuments,
      },
      {
        path: "/owner-operator/jobs",
        Component: OwnerOperatorJobs,
      },

      // Tenant Admin / Fleet Provider
      {
        path: "/overview",
        Component: TenantAdminDashboard,
      },
      {
        path: "/fleet",
        Component: FleetManagement,
      },
      {
        path: "/drivers",
        Component: DriverManagement,
      },
      {
        path: "/devices",
        Component: DeviceManagement,
      },
      {
        path: "/sims",
        Component: SIMManagement,
      },
      {
        path: "/data-bundles",
        Component: DataBundles,
      },
      {
        path: "/jobs",
        Component: JobDispatch,
      },
      {
        path: "/map",
        Component: LiveMap,
      },
      {
        path: "/behavior",
        Component: DriverBehaviorDashboard,
      },
      {
        path: "/fatigue",
        Component: DriverFatigueDashboard,
      },
      {
        path: "/messages",
        Component: MessagingCenter,
      },
      {
        path: "/inbox",
        Component: OmnichannelInbox,
      },
      {
        path: "/wallet",
        Component: TenantWallet,
      },
      {
        path: "/installation",
        Component: DeviceInstallation,
      },
      {
        path: "/integrations",
        Component: Integrations,
      },
      {
        path: "/job-offers",
        Component: JobOffers,
      },
      {
        path: "/reports",
        Component: Reports,
      },
      {
        path: "/waybill-invoices",
        Component: WaybillInvoices,
      },
      {
        path: "/subscription-invoices",
        Component: SubscriptionInvoices,
      },
      {
        path: "/sustainability",
        Component: Sustainability,
      },
      {
        path: "/fleet/pl-statement",
        Component: VehiclePLStatementPreview,
      },
      {
        path: "/settings",
        Component: Settings,
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

      // Supervisor
      {
        path: "/supervisor",
        Component: SupervisorDashboard,
      },
      {
        path: "/supervisor/map",
        Component: SupervisorLiveMap,
      },
      {
        path: "/supervisor/dispatch",
        Component: SupervisorDispatch,
      },
      {
        path: "/supervisor/drivers",
        Component: SupervisorDrivers,
      },
      {
        path: "/supervisor/alerts",
        Component: SupervisorAlerts,
      },
      {
        path: "/supervisor/messages",
        Component: SupervisorMessages,
      },
      {
        path: "/supervisor/inbox",
        Component: OmnichannelInbox,
      },
      {
        path: "/supervisor/reports",
        Component: SupervisorReports,
      },
      {
        path: "/supervisor/*",
        Component: SupervisorDashboard,
      },

      // Dispatcher Portal (independent — do not share with Supervisor/Admin)
      {
        path: "/dispatcher",
        Component: DispatcherDashboard,
      },
      {
        path: "/dispatcher/dispatch",
        Component: DispatcherDispatch,
      },
      {
        path: "/dispatcher/map",
        Component: DispatcherLiveMap,
      },
      {
        path: "/dispatcher/drivers",
        Component: DispatcherDrivers,
      },
      {
        path: "/dispatcher/devices",
        Component: DispatcherDevices,
      },
      {
        path: "/dispatcher/sims",
        Component: DispatcherSIMs,
      },
      {
        path: "/dispatcher/alerts",
        Component: DispatcherAlerts,
      },
      {
        path: "/dispatcher/messages",
        Component: DispatcherMessages,
      },
      {
        path: "/dispatcher/inbox",
        Component: DispatcherInbox,
      },
      {
        path: "/dispatcher/reports",
        Component: DispatcherReports,
      },
      {
        path: "/dispatcher/*",
        Component: DispatcherDashboard,
      },

      // Debug
      {
        path: "/debug/map",
        Component: DebugMap,
      },

      // Architecture documentation
      {
        path: "/architecture",
        Component: Architecture,
      },
      {
        path: "/technical-architecture",
        Component: TechnicalArchitecture,
      },

      // Help & Support
      {
        path: "/help",
        Component: HelpSupport,
      },

      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
