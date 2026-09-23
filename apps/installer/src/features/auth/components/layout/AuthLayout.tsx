import { AuthBrandingPanel } from "@truckmoov/reusables/components/layouts/AuthBrandingPanel";
import { Outlet } from "react-router";

/**
 * Layout route for the installer auth screen.
 *
 * ponytail: no `helpMode` — AuthHelpDialog only ships "sign-in" / "sign-up" /
 * "admin" FAQ sets, none of which answer an installer's questions. Omitting it
 * hides the help button rather than pointing installers at the wrong FAQ.
 */
export function AuthLayout() {
  return (
    <AuthBrandingPanel subtitle="Installer Portal">
      <Outlet />
    </AuthBrandingPanel>
  );
}
