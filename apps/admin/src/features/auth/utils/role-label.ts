import type { UserRole } from "@truckmoov/api/auth";

/** Human labels for the platform-side roles. */
export const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  SUPER_ADMIN: "Super Admin",
  SYSTEM_ADMIN: "System Admin",
  PLATFORM_ADMIN: "Platform Admin",
};

/**
 * ponytail: only the three platform roles are mapped — snake_case → Title Case
 * covers anything else the backend hands us (including the legacy lowercase
 * "platform_admin", which resolves to "Platform Admin" for free).
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
export function getRoleLabel(role?: string | null, fallback = "Administrator"): string {
  if (!role)
    return fallback;
  return ROLE_LABELS[role as UserRole] ?? titleCase(role);
}
