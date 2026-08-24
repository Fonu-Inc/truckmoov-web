import type { UserRole } from "@truckmoov/api/auth";

/**
 * Roles allowed to manage team members on `/settings/users`
 * (invite, edit, change role, disable, remove, resend invite).
 *
 * Add a role here to grant it the full write UI — no other change needed.
 */
export const USER_MANAGEMENT_ROLES: UserRole[] = ["ENTERPRISE_ADMIN"];

export function canManageOrganizationUsers(role?: UserRole | null): boolean {
  return !!role && USER_MANAGEMENT_ROLES.includes(role);
}
