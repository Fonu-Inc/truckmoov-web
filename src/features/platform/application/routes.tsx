import type { FeatureRoute, ProtectRoute } from "@/shared/routes/route-types";
import {
  PLATFORM_BILLING_PATH,
  PLATFORM_DEVICES_PATH,
  PLATFORM_FALLBACK_PATH,
  PLATFORM_HOME_PATH,
  PLATFORM_SECURITY_PATH,
  PLATFORM_SETTINGS_PATH,
  PLATFORM_SIMS_PATH,
  PLATFORM_SIMULATOR_PATH,
  PLATFORM_SUPPORT_PATH,
  PLATFORM_TENANTS_PATH,
} from "../domain/platform-routes";
import {
  DeviceSimulatorPageView,
  PlatformBillingPageView,
  PlatformDashboardPageView,
  PlatformDevicesPageView,
  PlatformSecurityPageView,
  PlatformSettingsPageView,
  PlatformSIMsPageView,
  PlatformSupportPageView,
  PlatformTenantsPageView,
} from "../ui/PlatformPages";

export function buildPlatformRoutes(protect: ProtectRoute): FeatureRoute[] {
  return [
    { path: PLATFORM_HOME_PATH, element: protect(<PlatformDashboardPageView />) },
    { path: PLATFORM_DEVICES_PATH, element: protect(<PlatformDevicesPageView />) },
    { path: PLATFORM_SIMS_PATH, element: protect(<PlatformSIMsPageView />) },
    { path: PLATFORM_TENANTS_PATH, element: protect(<PlatformTenantsPageView />) },
    { path: PLATFORM_BILLING_PATH, element: protect(<PlatformBillingPageView />) },
    { path: PLATFORM_SECURITY_PATH, element: protect(<PlatformSecurityPageView />) },
    { path: PLATFORM_SETTINGS_PATH, element: protect(<PlatformSettingsPageView />) },
    { path: PLATFORM_SIMULATOR_PATH, element: protect(<DeviceSimulatorPageView />) },
    { path: PLATFORM_SUPPORT_PATH, element: protect(<PlatformSupportPageView />) },
    { path: PLATFORM_FALLBACK_PATH, element: protect(<PlatformDashboardPageView />) },
  ];
}
