import type { UserRole } from '@/features/auth/api/types';

export type StakeholderType = 'ENTERPRISE' | 'AGGREGATOR' | 'OWNER_OPERATOR';
export type LegacyRole =
  | 'platform_admin'
  | 'tenant_admin'
  | 'operations_manager'
  | 'dispatcher'
  | 'viewer_finance'
  | 'supervisor'
  | 'driver'
  | 'installer';

type CompatRole = UserRole | LegacyRole | null | undefined;

export function toLegacyRole(role: CompatRole): LegacyRole | undefined {
  if (!role) return undefined;
  switch (role) {
    case 'PLATFORM_ADMIN':
    case 'platform_admin':
      return 'platform_admin';
    case 'FLEET_ADMIN':
    case 'tenant_admin':
      return 'tenant_admin';
    case 'OPERATIONS_MANAGER':
    case 'operations_manager':
      return 'operations_manager';
    case 'DISPATCHER':
    case 'dispatcher':
      return 'dispatcher';
    case 'FINANCE_VIEWER':
    case 'viewer_finance':
      return 'viewer_finance';
    case 'ENTERPRISE_ADMIN':
    case 'AGGREGATOR_ADMIN':
    case 'OWNER_OPERATOR':
      return 'tenant_admin';
    // TODO: remove once legacy-only roles are retired from frontend state.
    case 'supervisor':
    case 'driver':
    case 'installer':
      return role;
    default:
      return undefined;
  }
}

export function toStakeholderType(role: CompatRole): StakeholderType | null {
  switch (role) {
    case 'ENTERPRISE_ADMIN':
      return 'ENTERPRISE';
    case 'AGGREGATOR_ADMIN':
      return 'AGGREGATOR';
    case 'OWNER_OPERATOR':
      return 'OWNER_OPERATOR';
    default:
      return null;
  }
}

export function isPlatformAdmin(role: CompatRole): boolean {
  return role === 'PLATFORM_ADMIN' || role === 'platform_admin';
}

// Backward-compatible aliases during migration.
export const normalizeLegacyRole = toLegacyRole;
export const getStakeholderFromRole = toStakeholderType;
export const isPlatformAdminRole = isPlatformAdmin;
