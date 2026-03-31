import { RouteObject } from "react-router-dom";
import MainLayout from "@/shared/layouts/MainLayout";
import {
  AuthPageView,
  ChangePasswordPageView,
  ForgotPasswordPageView,
  InvitationSignUpPageView,
  NotAuthorizedPageView,
  SignUpPageView,
} from "@/features/auth/ui/AuthPages";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import SettingsLayout from "@/features/setting/layouts/OrganizationsSettings";
import Settings from "@/features/setting/pages/Settings";
import NotificationSettings from "@/features/setting/pages/NotificationSettings";
import BrandingSettings from "@/features/setting/pages/BrandingSettings";
import UserSettings from "@/features/setting/pages/UserSettings";
import VerifyEmail from "@/features/auth/ui/pages/VerifyEmail";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import Fleet from "@/features/fleet/layouts/Fleet";
import Vehicles from "@/features/fleet/pages/Vehicles";
import Driver from "@/features/fleet/pages/Driver";
import Devices from "@/features/fleet/pages/Devices";
import Job from "@/features/dispatch/pages/Job";
import DispatchSettings from "@/features/setting/pages/DispatchSettings";
import Alerts from "@/features/fleet/pages/Alerts";
import Documents from "@/features/fleet/pages/Documents";
import DriverAvailability from "@/features/dispatch/pages/DriverAvailability";
import Incidents from "@/features/fleet/pages/Incidents";
import EventStreams from "@/features/dashboard/pages/EventStreams";
import TenantOverridesSettings from "@/features/setting/pages/TenantOverridesSettings";
import DataComplianceSettings from "@/features/setting/pages/DataComplianceSettings";
import FuelManagement from "@/features/fleet/pages/FuelManagement";
import IntegrationsPage from "@/features/integrations/ui/pages/Integrations";

export function buildAppRoutes(): RouteObject[] {
  return [
    { path: APP_ROUTES.signIn, element: <AuthPageView /> },
    { path: APP_ROUTES.signUp, element: <SignUpPageView /> },
    { path: APP_ROUTES.invitedSignUp, element: <InvitationSignUpPageView /> },
    { path: APP_ROUTES.forgetPassword, element: <ForgotPasswordPageView /> },
    { path: APP_ROUTES.verifyEmail, element: <VerifyEmail /> },
    { path: APP_ROUTES.change, element: <ChangePasswordPageView /> },
    { path: APP_ROUTES.notAuthorized, element: <NotAuthorizedPageView /> },
    {
      path: APP_ROUTES.main,
      element: <MainLayout />,
      children: [
        // Enterprise Role Pages
        {
          path: APP_ROUTES.dashboard,
          element: <Dashboard />,
        },
        {
          path: APP_ROUTES.jobs,
          element: <Job />,
        },
        {
          path: APP_ROUTES.driverAvailability,
          element: <DriverAvailability />,
        },
        {
          path: APP_ROUTES.fleet,
          element: <Fleet />,
          children: [
            {
              index: true,
              element: <Vehicles />,
            },
            {
              path: APP_ROUTES.fuelManagement,
              element: <FuelManagement />,
            },
            {
              path: APP_ROUTES.fleetIncidents,
              element: <Incidents />,
            },
          ],
        },
        {
          path: APP_ROUTES.driver,
          element: <Driver />,
        },
        {
          path: APP_ROUTES.device,
          element: <Devices />,
        },
        {
          path: APP_ROUTES.alerts,
          element: <Alerts />,
        },
        {
          path: APP_ROUTES.documents,
          element: <Documents />,
        },
        {
          path: APP_ROUTES.integrations,
          element: <IntegrationsPage />,
        },
        {
          path: APP_ROUTES.eventStreams,
          element: <EventStreams />,
        },

        // Settings Page
        {
          path: APP_ROUTES.organizationsSettings,
          element: <SettingsLayout />,
          children: [
            {
              index: true,
              element: <Settings />,
            },
            {
              path: APP_ROUTES.notificationSettings,
              element: <NotificationSettings />,
            },
            {
              path: APP_ROUTES.brandingSettings,
              element: <BrandingSettings />,
            },
            {
              path: APP_ROUTES.userSettings,
              element: <UserSettings />,
            },
            {
              path: APP_ROUTES.dispatchSettings,
              element: <DispatchSettings />,
            },
            {
              path: APP_ROUTES.tenantOverridesSettings,
              element: <TenantOverridesSettings />,
            },
            {
              path: APP_ROUTES.dataComplianceSettings,
              element: <DataComplianceSettings />,
            },
          ],
        },
      ],
    },
  ];
}
