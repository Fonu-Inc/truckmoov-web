import { FeatureRoute } from "@/shared/routes/route-types";
import { NOT_FOUND_PATH } from "../domain/core-routes";
import { NotFoundPageView } from "../ui/FallbackPages";

export function buildCoreRoutes(): FeatureRoute[] {
  return [{ path: NOT_FOUND_PATH, element: <NotFoundPageView /> }];
}
