import type { AuthHelpMode } from "@truckmoov/reusables/components/app/AuthHelpDialog";
import { AuthBrandingPanel } from "@truckmoov/reusables/components/layouts/AuthBrandingPanel";
import {
  Outlet, useLocation,
} from "react-router";

/**
 * Which FAQ set the panel's help button opens, per route. An unlisted path
 * yields undefined, which hides the help affordance entirely.
 */
const HELP_MODE: Record<string, AuthHelpMode> = {
  "/auth": "sign-in",
  "/auth/forgot-password": "sign-in",
};

/**
 * Layout route for the auth screens that use the split branding panel.
 * /auth/reset-password and /auth/invite sit outside it — they use their own
 * centred card shell.
 */
export function AuthLayout() {
  const { pathname } = useLocation();

  return (
    <AuthBrandingPanel
      subtitle="Enterprise Fleet"
      helpMode={HELP_MODE[pathname]}
    >
      <Outlet />
    </AuthBrandingPanel>
  );
}
