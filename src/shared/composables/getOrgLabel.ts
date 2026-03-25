import { UserRole } from "@/features/auth/api/types";

const OrgLabelMap: Record<UserRole, string> = {
 ENTERPRISE_ADMIN: "enterpise admin",
 AGGREGATOR_ADMIN: "aggregator",
 OWNER_OPERATOR: "owner operator",
 DISPATCHER: "dispatcher",
 FINANCE_VIEWER: "finance viewer",
 FLEET_ADMIN: "fleet admin",
 OPERATIONS_MANAGER: "operations manager",
 PLATFORM_ADMIN: "platform admin"
}

const OrgAltLabelMap: Record<UserRole, string> = {
 ENTERPRISE_ADMIN: "enterprise",
 AGGREGATOR_ADMIN: "aggregator",
 OWNER_OPERATOR: "owner-operator",
 DISPATCHER: "dispatcher",
 FINANCE_VIEWER: "finance",
 FLEET_ADMIN: "fleet provider",
 OPERATIONS_MANAGER: "operations manager",
 PLATFORM_ADMIN: "platform admin"
}

export function getOrgLabel(role: UserRole, alt?: boolean) {
 if(alt) {
  return OrgAltLabelMap[role] ?? "" 
 }
 return OrgLabelMap[role] ?? ""
}