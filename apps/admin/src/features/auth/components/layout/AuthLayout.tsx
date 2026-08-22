import type { AuthHelpMode } from "@truckmoov/reusables/components/app/AuthHelpDialog";
import { AuthBrandingPanel } from "@truckmoov/reusables/components/layouts/AuthBrandingPanel";
import {
  Outlet, useLocation,
} from "react-router";

/**
 * Which FAQ set the panel's help button opens, per route. An unlisted path
 * yields undefined, which hides the help affordance entirely.
 */
const HELP_MODE: Record<string, AuthHelpMode> = { "/auth": "admin" };

/** Layout route for the admin auth screen. */
export function AuthLayout() {
  const { pathname } = useLocation();

  return (
    <AuthBrandingPanel
      subtitle="Platform Admin"
      helpMode={HELP_MODE[pathname]}
    >
      <Outlet />
    </AuthBrandingPanel>
  );
}
