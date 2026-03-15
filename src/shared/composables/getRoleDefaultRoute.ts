import { UserRole } from "@/features/auth/api/types";
import { APP_ROUTES } from "../lib/appRoutes";

export function getRoleDefaultRoute(role: UserRole) {
 switch(role) {
  case "ENTERPRISE_ADMIN":
   return APP_ROUTES.organizationsSettings;
  case "PLATFORM_ADMIN":
  case "AGGREGATOR_ADMIN":
  case "OWNER_OPERATOR":
  case "FLEET_ADMIN":
  case "OPERATIONS_MANAGER":
  case "DISPATCHER":
  case "FINANCE_VIEWER":
  default:
   return APP_ROUTES.main;
 }
}