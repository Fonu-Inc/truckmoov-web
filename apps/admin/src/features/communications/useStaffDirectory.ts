import { useQuery } from "@tanstack/react-query";
import { getOrganizationUsersQueryOptions } from "@truckmoov/api/auth";
import { useMemo } from "react";
import { useCurrentUserId } from "./useCurrentUserId";

export type StaffMember = { id: string; name: string };

function displayName(user: { email: string; profile?: { firstName?: string; lastName?: string; fullName?: string } | null }) {
  const full = user.profile?.fullName || [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ");
  return full.trim() || user.email;
}

/**
 * Platform staff, for naming and picking assignees. The list needs the team
 * permission, so someone without it still gets "You" and "Unassigned".
 */
export function useStaffDirectory() {
  const me = useCurrentUserId();
  const query = useQuery({ ...getOrganizationUsersQueryOptions({ params: { status: "active" } }), retry: false });
  const staff = useMemo<StaffMember[]>(
    () => (query.data?.data.users ?? []).map(user => ({ id: user.userId, name: displayName(user) })),
    [query.data],
  );

  const nameOf = (userId: string | null): string => {
    if (!userId)
      return "Unassigned";
    if (userId === me)
      return "You";
    return staff.find(member => member.id === userId)?.name ?? "A teammate";
  };

  return { staff, nameOf, me, isLoading: query.isLoading };
}
