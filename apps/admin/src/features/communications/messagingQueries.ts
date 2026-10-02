import type {
  MessagingConversationPage,
  MessagingConversationStatus,
  MessagingMessagePage,
} from "@truckmoov/api/notification";
import {
  getMessagingCannedReplies,
  getMessagingCapabilities,
  getMessagingConversation,
  getMessagingConversations,
  getMessagingMessages,
} from "@truckmoov/api/notification";
import type { InfiniteData } from "@tanstack/react-query";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

export type ConversationFilters = {
  query: string;
  state: "all" | "unread";
  status: MessagingConversationStatus | "";
  /** A user id, "me", "unassigned" or "" for everyone. */
  assignee: string;
  tag: string;
};

export const NO_FILTERS: ConversationFilters = { query: "", state: "all", status: "", assignee: "", tag: "" };

export type ConversationsData = InfiniteData<MessagingConversationPage, string>;
export type ThreadData = InfiniteData<MessagingMessagePage, string>;

export const CONVERSATIONS_ROOT = ["platform-messaging", "conversations"] as const;

export const messagingKeys = {
  capabilities: ["platform-messaging", "capabilities"] as const,
  conversations: (filters: ConversationFilters) => [...CONVERSATIONS_ROOT, filters] as const,
  conversation: (id: string) => ["platform-messaging", "conversation", id] as const,
  threadRoot: ["platform-messaging", "thread"] as const,
  thread: (id: string) => ["platform-messaging", "thread", id] as const,
  canned: ["platform-messaging", "canned-replies"] as const,
  unreadSummary: ["platform-messaging", "unread-summary"] as const,
  staff: ["platform-messaging", "staff"] as const,
};

export const cannedRepliesOptions = () => queryOptions({
  queryKey: messagingKeys.canned,
  queryFn: getMessagingCannedReplies,
  staleTime: 60_000,
});

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
    status: filters.status || undefined,
    assignee: filters.assignee || undefined,
    tag: filters.tag || undefined,
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
