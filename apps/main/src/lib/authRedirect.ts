import type { UserRole } from '@truckmoov/api/auth'

export const ROLE_REDIRECT_MAP: Partial<Record<UserRole, string>> = {
  ENTERPRISE_ADMIN: '/enterprise',
  AGGREGATOR_ADMIN: '/aggregator',
  OWNER_OPERATOR: '/owner-operator',
  FLEET_ADMIN: '/admin',
  OPERATIONS_MANAGER: '/admin',
  DISPATCHER: '/dispatcher',
  FINANCE_VIEWER: '/admin/fleet?tab=analytics',
}

const FALLBACK_PATH = '/not-authorized'

export function getPostLoginRedirectPath(role: UserRole): string {
  return ROLE_REDIRECT_MAP[role] ?? FALLBACK_PATH
}
