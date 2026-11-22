import type { AuthUser } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import { getMeQueryOptions } from "@truckmoov/api/auth";
import { useAuthStore } from "@/features/auth/stores/authStore";

type OrganizationType = NonNullable<AuthUser["organizationType"]>;

/**
 * The signed-in account's type (enterprise, owner_operator, …). Sessions issued
 * before login carried it fall back to /auth/me. Null while unknown.
 */
export function useOrganizationType(): OrganizationType | null {
  const user = useAuthStore(s => s.user);
  const fromSession = user?.organizationType;
  const me = useQuery({
    ...getMeQueryOptions(), enabled: !!user && fromSession === undefined, staleTime: Infinity,
  });
  if (fromSession !== undefined)
    return fromSession;
  const fromMe = me.data?.data?.organizationType;
  return typeof fromMe === "string" ? fromMe as OrganizationType : null;
}

/** Inside an owner operator's account, whatever the user's own role. */
export function useIsOwnerOperatorAccount(): boolean {
  const role = useAuthStore(s => s.user?.role);
  const organizationType = useOrganizationType();
  return role === "OWNER_OPERATOR" || organizationType === "owner_operator";
}
