import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useMemo } from 'react';
import type { OrgMembership, UserOrgContext } from '@/types/orgRoles';
import { toStakeholderType, isPlatformAdmin, toLegacyRole } from '@/features/auth/lib/roleUtils';

// Demo tenant org ID for fallback when user isn't a real UUID
const DEMO_ORG_ID = 'f906c47a-6d00-4166-b9e8-f47871a146c1';
const DEMO_TENANT_ID = 'f7f5af88-fd76-4439-aae3-0461be52f63f';

// Demo org IDs for stakeholder types
const DEMO_ENTERPRISE_ORG_ID = 'e0000001-0000-0000-0000-000000000001';
const DEMO_AGGREGATOR_ORG_ID = 'a0000001-0000-0000-0000-000000000001';
const DEMO_OWNER_OPERATOR_ORG_ID = 'o0000001-0000-0000-0000-000000000001';

/** Simple check: is the string a valid UUID v4? */
function isValidUuid(id: string | undefined): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Fetches the current user's organization memberships and org-scoped roles.
 * Provides helpers for role/type checks used by sidebar gating, permission hooks, etc.
 */
export function useOrgContext(): UserOrgContext & { isLoading: boolean } {
  const { user, isAuthenticated } = useAuthStore();
  const isDemoUser = !!user?.id && !isValidUuid(user.id);

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
    enabled: !!user?.id && isAuthenticated && !isDemoUser,
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
    enabled: !!user?.id && isAuthenticated && !isDemoUser,
    staleTime: 5 * 60 * 1000,
  });

  const memberships: OrgMembership[] = useMemo(() => {
    // Demo fallback: when the user ID isn't a real UUID, return the demo org
    if (isDemoUser) {
      const stakeholder = toStakeholderType(user?.role);
      
      if (stakeholder === 'ENTERPRISE') {
        return [{
          orgId: DEMO_ENTERPRISE_ORG_ID,
          orgName: 'Dangote Industries',
          orgType: 'ENTERPRISE',
          roleKeys: ['ADMIN'],
          roleScope: 'ORG',
        }];
      }
      if (stakeholder === 'AGGREGATOR') {
        return [{
          orgId: DEMO_AGGREGATOR_ORG_ID,
          orgName: 'West Africa Logistics Network',
          orgType: 'AGGREGATOR',
          roleKeys: ['ADMIN'],
          roleScope: 'CROSS_ORG',
        }];
      }
      if (stakeholder === 'OWNER_OPERATOR') {
        return [{
          orgId: DEMO_OWNER_OPERATOR_ORG_ID,
          orgName: 'Chidi Trucking',
          orgType: 'OWNER_OPERATOR',
          roleKeys: ['ADMIN'],
          roleScope: 'ORG',
        }];
      }

      // Platform admin demo: show neutral label
      if (isPlatformAdmin(user?.role)) {
        return [{
          orgId: DEMO_ORG_ID,
          orgName: 'Platform Administration',
          orgType: 'FLEET_PROVIDER',
          roleKeys: ['ADMIN'],
          roleScope: 'ORG',
        }];
      }

      const role = toLegacyRole(user?.role);
      const demoRoleKey = role === 'tenant_admin' ? 'ADMIN'
        : role === 'operations_manager' ? 'OPERATIONS_MANAGER'
        : role === 'dispatcher' ? 'DISPATCHER'
        : 'ADMIN';
      return [{
        orgId: DEMO_ORG_ID,
        orgName: 'Lagos Express Logistics',
        orgType: 'FLEET_PROVIDER',
        roleKeys: [demoRoleKey],
        roleScope: 'ORG',
      }];
    }

    const mappedMemberships = rawMemberships.map((m: any) => {
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
    
    if (mappedMemberships.length > 0) return mappedMemberships;

    const inferredStakeholder = toStakeholderType(user?.role);
    if (!inferredStakeholder) return mappedMemberships;

    const fallbackOrgId = inferredStakeholder === 'ENTERPRISE'
      ? DEMO_ENTERPRISE_ORG_ID
      : inferredStakeholder === 'AGGREGATOR'
        ? DEMO_AGGREGATOR_ORG_ID
        : DEMO_OWNER_OPERATOR_ORG_ID;

    return [{
      orgId: fallbackOrgId,
      orgName: inferredStakeholder === 'ENTERPRISE'
        ? 'Enterprise'
        : inferredStakeholder === 'AGGREGATOR'
          ? 'Aggregator'
          : 'Owner-Operator',
      orgType: inferredStakeholder,
      roleKeys: ['ADMIN'],
      roleScope: 'ORG',
    }];
  }, [rawMemberships, rawRoles, isDemoUser, user?.role]);

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
