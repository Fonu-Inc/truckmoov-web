import { useQuery } from "@tanstack/react-query";
import {
  getStaffPermissionsQueryOptions,
  getStaffRolesQueryOptions,
} from "@truckmoov/api/auth";
import {
  useCallback, useMemo,
} from "react";
import {
  toPermissionDomains,
  toPlatformRoles,
} from "@/features/settings/utils/platformPermissions";

/** Staff roles and the grantable permission catalog, shaped for Team & Access. */
export function useStaffAccess() {
  const rolesQuery = useQuery(getStaffRolesQueryOptions());
  const permissionsQuery = useQuery(getStaffPermissionsQueryOptions());

  const roles = useMemo(
    () => toPlatformRoles(
      rolesQuery.data?.data.predefined ?? [],
      rolesQuery.data?.data.custom ?? [],
    ),
    [rolesQuery.data],
  );
  const domains = useMemo(
    () => toPermissionDomains(permissionsQuery.data?.data.permissions ?? []),
    [permissionsQuery.data],
  );

  /** What a staff member can do now: their custom or personal role, else their predefined role. */
  const effectivePermissions = useCallback(
    (member: {
      role: string; customRoleId?: string | null;
    }): string[] => {
      const data = rolesQuery.data?.data;
      if (member.customRoleId) {
        const held = data?.custom.find(r => r.id === member.customRoleId)
          ?? data?.personal.find(r => r.id === member.customRoleId);
        if (held)
          return held.permissions;
      }
      return data?.predefined.find(r => r.role === member.role)?.permissions ?? [];
    },
    [rolesQuery.data],
  );

  /** True when the member's permissions come from their own personal role. */
  const hasPersonalRole = useCallback(
    (customRoleId?: string | null) => !!customRoleId && !!rolesQuery.data?.data.personal.some(r => r.id === customRoleId),
    [rolesQuery.data],
  );

  return {
    roles,
    domains,
    effectivePermissions,
    hasPersonalRole,
    isLoading: rolesQuery.isLoading || permissionsQuery.isLoading,
    error: rolesQuery.error ?? permissionsQuery.error,
  };
}
