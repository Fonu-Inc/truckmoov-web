import type { FeatureRoute, ProtectRoute } from "@/shared/routing/route-types";
import { AGGREGATOR_HOME_PATH, ENTERPRISE_HOME_PATH } from "../domain/business-routes";
import { AggregatorDashboardPageView, EnterpriseLogisticsDashboardPageView } from "../ui/BusinessPages";

export function buildBusinessRoutes(protect: ProtectRoute): FeatureRoute[] {
  return [
    { path: ENTERPRISE_HOME_PATH, element: protect(<EnterpriseLogisticsDashboardPageView />) },
    { path: AGGREGATOR_HOME_PATH, element: protect(<AggregatorDashboardPageView />) },
  ];
}
