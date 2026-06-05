import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useMemo } from 'react';
import type { OrgMembership, UserOrgContext } from '@/types/orgRoles';

/**
 * Fetches the current user's organization memberships and org-scoped roles.
 * Provides helpers for role/type checks used by sidebar gating, permission hooks, etc.
 */
export function useOrgContext(): UserOrgContext & { isLoading: boolean } {
  const { user, isAuthenticated } = useAuthStore();

  const { data: rawMemberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ['user-org-memberships', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_org_memberships')
        .select(`
          org_id,
          membership_status,
          organizations!user_org_memberships_org_id_fkey (
            id, name, organization_type
          )
        `)
        .eq('user_id', user!.id)
        .eq('membership_status', 'active');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const { data: rawRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['user-org-roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_org_roles')
        .select(`
          org_id,
          role_key,
          org_role_definitions!user_org_roles_role_key_fkey (
            role_scope
          )
        `)
        .eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const memberships: OrgMembership[] = useMemo(() => {
    return rawMemberships.map((m: any) => {
      const org = m.organizations;
      const roles = rawRoles.filter((r: any) => r.org_id === m.org_id);
      return {
        orgId: m.org_id,
        orgName: org?.name || 'Unknown',
        orgType: org?.organization_type || 'FLEET_PROVIDER',
        roleKeys: roles.map((r: any) => r.role_key),
        roleScope: roles[0]?.org_role_definitions?.role_scope || 'ORG',
      };
    });
  }, [rawMemberships, rawRoles]);

  const orgIds = useMemo(() => memberships.map(m => m.orgId), [memberships]);

  const ctx: UserOrgContext & { isLoading: boolean } = useMemo(() => ({
    memberships,
    orgIds,
    isLoading: membershipsLoading || rolesLoading,
    hasOrgRole: (roleKey: string) => memberships.some(m => m.roleKeys.includes(roleKey)),
    hasOrgType: (orgType: string) => memberships.some(m => m.orgType === orgType),
    getByOrgType: (orgType: string) => memberships.filter(m => m.orgType === orgType),
  }), [memberships, orgIds, membershipsLoading, rolesLoading]);

  return ctx;
}
