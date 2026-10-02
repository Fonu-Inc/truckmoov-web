import { queryOptions, useQuery } from "@tanstack/react-query";
import { getMessagingUnreadSummary } from "@truckmoov/api/notification";
import { messagingKeys } from "./messagingQueries";
import { MESSAGING_READ } from "./useMessagingAccess";

export const unreadSummaryOptions = () => queryOptions({
  queryKey: messagingKeys.unreadSummary,
  queryFn: getMessagingUnreadSummary,
  refetchInterval: 60_000,
  staleTime: 30_000,
});

/** Conversations waiting for a read, for the navigation badge and the tab title. */
export function useUnreadSummary(permissions: string[] | undefined) {
  const allowed = Boolean(permissions?.includes(MESSAGING_READ));
  const query = useQuery({ ...unreadSummaryOptions(), enabled: allowed });
  return allowed ? query.data : undefined;
}
