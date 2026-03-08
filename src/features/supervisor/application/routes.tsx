import type { FeatureRoute, ProtectRoute } from "@/shared/routing/route-types";
import {
  SUPERVISOR_ALERTS_PATH,
  SUPERVISOR_DISPATCH_PATH,
  SUPERVISOR_DRIVERS_PATH,
  SUPERVISOR_FALLBACK_PATH,
  SUPERVISOR_HOME_PATH,
  SUPERVISOR_INBOX_PATH,
  SUPERVISOR_MAP_PATH,
  SUPERVISOR_MESSAGES_PATH,
  SUPERVISOR_REPORTS_PATH,
} from "../domain/supervisor-routes";
import {
  OmnichannelInboxPageView,
  SupervisorAlertsPageView,
  SupervisorDashboardPageView,
  SupervisorDispatchPageView,
  SupervisorDriversPageView,
  SupervisorLiveMapPageView,
  SupervisorMessagesPageView,
  SupervisorReportsPageView,
} from "../ui/SupervisorPages";

export function buildSupervisorRoutes(protect: ProtectRoute): FeatureRoute[] {
  return [
    { path: SUPERVISOR_HOME_PATH, element: protect(<SupervisorDashboardPageView />) },
    { path: SUPERVISOR_MAP_PATH, element: protect(<SupervisorLiveMapPageView />) },
    { path: SUPERVISOR_DISPATCH_PATH, element: protect(<SupervisorDispatchPageView />) },
    { path: SUPERVISOR_DRIVERS_PATH, element: protect(<SupervisorDriversPageView />) },
    { path: SUPERVISOR_ALERTS_PATH, element: protect(<SupervisorAlertsPageView />) },
    { path: SUPERVISOR_MESSAGES_PATH, element: protect(<SupervisorMessagesPageView />) },
    { path: SUPERVISOR_INBOX_PATH, element: protect(<OmnichannelInboxPageView />) },
    { path: SUPERVISOR_REPORTS_PATH, element: protect(<SupervisorReportsPageView />) },
    { path: SUPERVISOR_FALLBACK_PATH, element: protect(<SupervisorDashboardPageView />) },
  ];
}
