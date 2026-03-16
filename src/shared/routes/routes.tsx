import { Navigate, RouteObject } from "react-router-dom";
import MainLayout from "@/shared/layouts/MainLayout";
import { AuthPageView, InvitationSignUpPageView, NotAuthorizedPageView, SignUpPageView } from "@/features/auth/ui/AuthPages";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import SettingsLayout from "@/features/setting/layouts/OrganizationsSettings";
import Settings from "@/features/setting/pages/Settings";
import NotificationSettings from "@/features/setting/pages/NotificationSettings";
import BrandingSettings from "@/features/setting/pages/BrandingSettings";
import UserSettings from "@/features/setting/pages/UserSettings";

export function buildAppRoutes(defaultRoute: string): RouteObject[] {
  return [
    {
      path: APP_ROUTES.main, element: <MainLayout />, children: [
        {
          index: true,
          element: <Navigate to={defaultRoute} replace />,
        },
        {
          path: APP_ROUTES.organizationsSettings,
          element: <SettingsLayout />,
          children: [
            {
              path: APP_ROUTES.organizationsSettings,
              element: <Settings />
            },
            {
              path: APP_ROUTES.notificationSettings,
              element: <NotificationSettings />
            },
            {
              path: APP_ROUTES.brandingSettings,
              element: <BrandingSettings />
            },
            {
              path: APP_ROUTES.userSettings,
              element: <UserSettings />
            },
          ]
        }
      ]
    },
    { path: APP_ROUTES.signIn, element: <AuthPageView /> },
    { path: APP_ROUTES.signUp, element: <SignUpPageView /> },
    { path: APP_ROUTES.invitedSignUp, element: <InvitationSignUpPageView /> },
    { path: APP_ROUTES.notAuthorized, element: <NotAuthorizedPageView /> },
  ];
}
