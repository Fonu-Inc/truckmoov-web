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

export function getOrgLabel(role: UserRole) {
 return OrgLabelMap[role]
}