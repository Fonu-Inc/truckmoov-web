import { UserRole } from "@/features/auth/api/types";
import { APP_ROUTES } from "../lib/appRoutes";

export function getRoleDefaultRoute(role: UserRole) {
  switch (role) {
    case "ENTERPRISE_ADMIN":
      return APP_ROUTES.organizationsSettings
    case "FLEET_ADMIN":
      return APP_ROUTES.fleet;
    case "DISPATCHER":
      return APP_ROUTES.jobs;
    default:
      return APP_ROUTES.dashboard;
  }
}