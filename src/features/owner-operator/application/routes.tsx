import type { FeatureRoute, ProtectRoute } from "@/shared/routes/route-types";
import {
  OWNER_OPERATOR_DOCUMENTS_PATH,
  OWNER_OPERATOR_HOME_PATH,
  OWNER_OPERATOR_JOBS_PATH,
  OWNER_OPERATOR_VEHICLE_DETAIL_PATH,
  OWNER_OPERATOR_VEHICLES_PATH,
} from "../domain/owner-operator-routes";
import {
  OwnerOperatorDashboardPageView,
  OwnerOperatorDocumentsPageView,
  OwnerOperatorJobsPageView,
  OwnerOperatorVehicleDetailPageView,
  OwnerOperatorVehiclesPageView,
} from "../ui/OwnerOperatorPages";

export function buildOwnerOperatorRoutes(protect: ProtectRoute): FeatureRoute[] {
  return [
    { path: OWNER_OPERATOR_HOME_PATH, element: protect(<OwnerOperatorDashboardPageView />) },
    { path: OWNER_OPERATOR_VEHICLE_DETAIL_PATH, element: protect(<OwnerOperatorVehicleDetailPageView />) },
    { path: OWNER_OPERATOR_VEHICLES_PATH, element: protect(<OwnerOperatorVehiclesPageView />) },
    { path: OWNER_OPERATOR_DOCUMENTS_PATH, element: protect(<OwnerOperatorDocumentsPageView />) },
    { path: OWNER_OPERATOR_JOBS_PATH, element: protect(<OwnerOperatorJobsPageView />) },
  ];
}
