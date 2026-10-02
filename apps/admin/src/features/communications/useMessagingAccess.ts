import { useQuery } from "@tanstack/react-query";
import { capabilitiesOptions } from "./messagingQueries";

export const MESSAGING_READ = "admin.messaging.read";
export const MESSAGING_MANAGE = "admin.messaging.manage";

export function hasPermission(permissions: string[] | undefined, key: string) {
  return Boolean(permissions?.includes(key));
}

export function useMessagingAccess() {
  const query = useQuery(capabilitiesOptions());
  const permissions = query.data?.permissions;
  return {
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    canRead: hasPermission(permissions, MESSAGING_READ),
    canManage: hasPermission(permissions, MESSAGING_MANAGE),
  };
}
