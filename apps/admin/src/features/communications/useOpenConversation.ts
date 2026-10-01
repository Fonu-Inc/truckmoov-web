import { useQuery } from "@tanstack/react-query";
import { conversationOptions } from "./messagingQueries";

export function useOpenConversation(id: string | null) {
  const query = useQuery(conversationOptions(id ?? ""));
  return {
    conversation: id ? query.data : undefined,
    isLoading: Boolean(id) && query.isPending,
    isError: Boolean(id) && query.isError,
    refetch: query.refetch,
  };
}
