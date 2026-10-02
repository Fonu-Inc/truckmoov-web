import type {
  MessagingConversationPage,
  MessagingMessagePage,
} from "@truckmoov/api/notification";
import {
  getMessagingCapabilities,
  getMessagingConversation,
  getMessagingConversations,
  getMessagingMessages,
} from "@truckmoov/api/notification";
import type { InfiniteData } from "@tanstack/react-query";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

export type ConversationFilters = { query: string; state: "all" | "unread" };

export type ConversationsData = InfiniteData<MessagingConversationPage, string>;
export type ThreadData = InfiniteData<MessagingMessagePage, string>;

export const CONVERSATIONS_ROOT = ["platform-messaging", "conversations"] as const;

export const messagingKeys = {
  capabilities: ["platform-messaging", "capabilities"] as const,
  conversations: (filters: ConversationFilters) => [...CONVERSATIONS_ROOT, filters] as const,
  conversation: (id: string) => ["platform-messaging", "conversation", id] as const,
  threadRoot: ["platform-messaging", "thread"] as const,
  thread: (id: string) => ["platform-messaging", "thread", id] as const,
};

export const capabilitiesOptions = () => queryOptions({
  queryKey: messagingKeys.capabilities,
  queryFn: getMessagingCapabilities,
  staleTime: 60_000,
});

export const conversationsOptions = (filters: ConversationFilters) => infiniteQueryOptions({
  queryKey: messagingKeys.conversations(filters),
  queryFn: ({ pageParam }) => getMessagingConversations({
    cursor: pageParam,
    query: filters.query,
    state: filters.state,
  }),
  initialPageParam: "",
  getNextPageParam: last => last.next_cursor ?? undefined,
});

export const threadOptions = (conversationId: string) => infiniteQueryOptions({
  queryKey: messagingKeys.thread(conversationId),
  queryFn: ({ pageParam }) => getMessagingMessages({ conversationId, before: pageParam }),
  initialPageParam: "",
  getNextPageParam: last => last.next_before ?? undefined,
});

export const conversationOptions = (id: string) => queryOptions({
  queryKey: messagingKeys.conversation(id),
  queryFn: () => getMessagingConversation(id),
  enabled: Boolean(id),
});
