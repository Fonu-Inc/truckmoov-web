import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { visibleThread } from "./messagingLogic";
import { threadOptions } from "./messagingQueries";
import { selectPending, usePendingMessages } from "./pendingMessages";

export function useThread(conversationId: string | null) {
  const query = useInfiniteQuery({
    ...threadOptions(conversationId ?? ""),
    enabled: Boolean(conversationId),
  });
  const pending = usePendingMessages(selectPending(conversationId));

  const messages = useMemo(
    () => {
      const pages = query.data?.pages ?? [];
      const server = [...pages].reverse().flatMap(page => page.items);
      return visibleThread(server, pending);
    },
    [
      query.data,
      pending,
    ],
  );

  return {
    messages,
    isLoading: query.isPending && Boolean(conversationId),
    isError: query.isError,
    refetch: query.refetch,
    hasEarlier: Boolean(query.hasNextPage),
    loadEarlier: query.fetchNextPage,
    isLoadingEarlier: query.isFetchingNextPage,
  };
}
