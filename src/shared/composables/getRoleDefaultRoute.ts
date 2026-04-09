import { UserRole } from "@/features/auth/api/types";
import { APP_ROUTES } from "../lib/appRoutes";

export function getRoleDefaultRoute(role: UserRole) {
  switch (role) {
    case "ENTERPRISE_ADMIN":
    case "FLEET_ADMIN":
    case "DISPATCHER":
    case "OPERATIONS_MANAGER":
      return APP_ROUTES.dashboard
    case "PLATFORM_ADMIN":
      return APP_ROUTES.systemDashboard
    default:
      return APP_ROUTES.organizationsSettings;
  }
}