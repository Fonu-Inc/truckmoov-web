import type { UserRole } from "@truckmoov/api/auth";

export const ROLE_REDIRECT_MAP: Partial<Record<UserRole, string>> = {
  ENTERPRISE_ADMIN: "/",
  AGGREGATOR_ADMIN: "/aggregator",
  OWNER_OPERATOR: "/",
  FLEET_ADMIN: "/overview",
  OPERATIONS_MANAGER: "/overview",
  DISPATCHER: "/jobs",
  FINANCE_VIEWER: "/fleet?tab=analytics",
};

const FALLBACK_PATH = "/not-authorized";

export function getPostLoginRedirectPath(role: UserRole): string {
  return ROLE_REDIRECT_MAP[role] ?? FALLBACK_PATH;
}
