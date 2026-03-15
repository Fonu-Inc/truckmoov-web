import type { FeatureRoute, ProtectRoute } from "@/shared/routes/route-types";
import { HELP_SUPPORT_PATH } from "../domain/support-routes";
import { HelpSupportPageView } from "../ui/SupportPages";

export function buildSupportRoutes(protect: ProtectRoute): FeatureRoute[] {
  return [{ path: HELP_SUPPORT_PATH, element: protect(<HelpSupportPageView />) }];
}
