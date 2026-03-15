import type { FeatureRoute } from "@/shared/routes/route-types";
import { DEBUG_MAP_PATH } from "../domain/debug-routes";
import { DebugMapPageView } from "../ui/DebugPages";

export function buildDebugRoutes(): FeatureRoute[] {
  return [{ path: DEBUG_MAP_PATH, element: <DebugMapPageView /> }];
}
