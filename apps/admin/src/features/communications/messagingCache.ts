import type {
  ConversationUpdatedEvent,
  MessageCreatedEvent,
  MessageStatusEvent,
} from "@truckmoov/api/notification";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { getMessagingConversations, getMessagingMessages } from "@truckmoov/api/notification";
import {
  applyStatusEvent,
  mergeConversationPage,
  updateConversations,
  upsertMessages,
} from "./messagingLogic";
import type { ConversationFilters, ConversationsData, ThreadData } from "./messagingQueries";
import { CONVERSATIONS_ROOT, messagingKeys } from "./messagingQueries";
import { usePendingMessages } from "./pendingMessages";

function mapFirstPage<T, P>(
  data: InfiniteData<T, P>,
  fn: (page: T) => T,
): InfiniteData<T, P> {
  const [first, ...rest] = data.pages;
  return first ? { ...data, pages: [fn(first), ...rest] } : data;
}

function filtersOf(key: readonly unknown[]): ConversationFilters {
  return key[2] as ConversationFilters;
}

function canInsert(filters: ConversationFilters, unread: number) {
  if (filters.query)
    return false;
  return filters.state === "all" || unread > 0;
}

export function patchConversation(client: QueryClient, event: ConversationUpdatedEvent) {
  client.setQueryData(messagingKeys.conversation(event.conversation.id), event.conversation);
  const entries = client.getQueriesData<ConversationsData>({ queryKey: CONVERSATIONS_ROOT });
  for (const [key, data] of entries) {
    if (!data)
      continue;
    const insert = canInsert(filtersOf(key), event.conversation.unread_count);
    const next = {
      ...data,
      pages: data.pages.map((page, index) => ({
        ...page,
        items: index === 0
          ? updateConversations(page.items, event.conversation, { insert })
          : page.items.map(c => (c.id === event.conversation.id ? event.conversation : c)),
      })),
    };
    client.setQueryData(key, next);
  }
}

export function patchMessageCreated(client: QueryClient, event: MessageCreatedEvent) {
  client.setQueryData<ThreadData>(messagingKeys.thread(event.conversation_id), (data) => {
    if (!data)
      return data;
    return mapFirstPage(data, page => ({
      ...page,
      items: upsertMessages(page.items, [event.message]),
    }));
  });
  if (event.message.client_message_id)
    usePendingMessages.getState().drop(event.conversation_id, event.message.client_message_id);
}

export function patchMessageStatus(client: QueryClient, event: MessageStatusEvent) {
  client.setQueryData<ThreadData>(messagingKeys.thread(event.conversation_id), (data) => {
    if (!data)
      return data;
    return {
      ...data,
      pages: data.pages.map(page => ({ ...page, items: applyStatusEvent(page.items, event) })),
    };
  });
  usePendingMessages.getState().applyStatus(event);
}

async function resyncConversations(client: QueryClient) {
  const entries = client.getQueriesData<ConversationsData>({ queryKey: CONVERSATIONS_ROOT });
  await Promise.all(entries.map(async ([key, data]) => {
    if (!data)
      return;
    const filters = filtersOf(key);
    const fresh = await getMessagingConversations({ query: filters.query, state: filters.state });
    client.setQueryData<ConversationsData>(key, current => current && mapFirstPage(current, page => ({
      ...page,
      items: mergeConversationPage(page.items, fresh.items),
    })));
  }));
}

async function resyncThread(client: QueryClient, conversationId: string) {
  const fresh = await getMessagingMessages({ conversationId });
  client.setQueryData<ThreadData>(messagingKeys.thread(conversationId), current =>
    current && mapFirstPage(current, page => ({
      ...page,
      items: upsertMessages(page.items, fresh.items),
    })));
  for (const message of fresh.items) {
    if (message.client_message_id)
      usePendingMessages.getState().drop(conversationId, message.client_message_id);
  }
}

export async function resyncMessaging(client: QueryClient, openConversationId: string | null) {
  await Promise.allSettled([
    resyncConversations(client),
    openConversationId ? resyncThread(client, openConversationId) : Promise.resolve(),
    openConversationId
      ? client.invalidateQueries({ queryKey: messagingKeys.conversation(openConversationId) })
      : Promise.resolve(),
  ]);
}
