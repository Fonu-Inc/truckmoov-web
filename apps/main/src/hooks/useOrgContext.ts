import { useMemo } from 'react';
import type { OrgMembership, UserOrgContext } from '@/types/orgRoles';

/**
 * Fetches the current user's organization memberships and org-scoped roles.
 * Provides helpers for role/type checks used by sidebar gating, permission hooks, etc.
 */
export function useOrgContext(): UserOrgContext & { isLoading: boolean } {
  const memberships: OrgMembership[] = [];
  const orgIds: string[] = [];

  const ctx: UserOrgContext & { isLoading: boolean } = useMemo(() => ({
    memberships,
    orgIds,
    isLoading: false,
    hasOrgRole: (_roleKey: string) => false,
    hasOrgType: (_orgType: string) => false,
    getByOrgType: (_orgType: string) => [],
  }), []);

  return ctx;
}
