import type { FeatureRoute, ProtectRoute } from "@/shared/routing/route-types";
import { DRIVER_HOME_PATH } from "../domain/driver-routes";
import { DriverInterfacePageView } from "../ui/DriverPages";

export function buildDriverRoutes(protect: ProtectRoute): FeatureRoute[] {
  return [{ path: DRIVER_HOME_PATH, element: protect(<DriverInterfacePageView />) }];
}
