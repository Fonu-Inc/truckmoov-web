import type { UserRole } from "@truckmoov/api/auth";

/** Human labels for the tenant-facing roles. */
export const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  ENTERPRISE_ADMIN: "Enterprise Admin",
  AGGREGATOR_ADMIN: "Aggregator Admin",
  OWNER_OPERATOR: "Owner Operator",
  FLEET_ADMIN: "Fleet Admin",
  OPERATIONS_MANAGER: "Operations Manager",
  DISPATCHER: "Dispatcher",
  FINANCE_VIEWER: "Finance Viewer",
};

/** Compact form for the sidebar badge, where width is tight. */
export const ROLE_SHORT_LABELS: Partial<Record<UserRole, string>> = {
  ENTERPRISE_ADMIN: "ENTERPRISE",
  AGGREGATOR_ADMIN: "AGGREGATOR",
  OWNER_OPERATOR: "OPERATOR",
  FLEET_ADMIN: "FLEET",
  OPERATIONS_MANAGER: "OPERATIONS",
  DISPATCHER: "DISPATCHER",
  FINANCE_VIEWER: "FINANCE",
};

/**
 * ponytail: the three admin roles (SUPER_ADMIN, SYSTEM_ADMIN, PLATFORM_ADMIN) are
 * deliberately absent from the maps above — snake_case → Title Case already renders
 * them as "Super Admin" / "System Admin" / "Platform Admin". Add an entry the day a
 * role needs a label its identifier does not spell.
 */
function titleCase(role: string): string {
  return role
    .toLowerCase()
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Label for a backend role. Takes `string` rather than `UserRole` because every
 * call site holds `user?.role` off the auth store, which is optional.
 */
export function getRoleLabel(role?: string | null, fallback = "User"): string {
  if (!role)
    return fallback;
  return ROLE_LABELS[role as UserRole] ?? titleCase(role);
}

/** Sidebar badge variant. Falls back to the uppercased full label. */
export function getRoleShortLabel(role?: string | null, fallback = "User"): string {
  if (!role)
    return fallback;
  return ROLE_SHORT_LABELS[role as UserRole] ?? getRoleLabel(
    role,
    fallback,
  ).toUpperCase();
}
