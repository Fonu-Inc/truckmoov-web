import type {
  InfiniteData, QueryClient,
} from "@tanstack/react-query";
import type {
  ConversationUpdatedEvent,
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageStatusEvent,
} from "@truckmoov/api/notification";
import type {
  ConversationFilters, ConversationsData, ThreadData,
} from "./messagingQueries";
import { useAuthStore as useApiAuthStore } from "@truckmoov/api/lib/auth-store";
import {
  getMessagingConversations, getMessagingMessages,
} from "@truckmoov/api/notification";
import {
  applyStatusEvent,
  matchesFilters,
  mergeConversationPage,
  removeConversation,
  removeMessage,
  updateConversations,
  upsertMessages,
} from "./messagingLogic";
import {
  CONVERSATIONS_ROOT, messagingKeys,
} from "./messagingQueries";
import { usePendingMessages } from "./pendingMessages";

function mapFirstPage<T, P>(
  data: InfiniteData<T, P>,
  fn: (page: T) => T,
): InfiniteData<T, P> {
  const [
    first,
    ...rest
  ] = data.pages;
  return first ? {
    ...data, pages: [
      fn(first),
      ...rest,
    ],
  } : data;
}

function filtersOf(key: readonly unknown[]): ConversationFilters {
  return key[2] as ConversationFilters;
}

function patchList(
  data: ConversationsData,
  filters: ConversationFilters,
  conversation: ConversationUpdatedEvent["conversation"],
): ConversationsData {
  const fits = matchesFilters(
    filters,
    conversation,
    useApiAuthStore.getState().user?.id ?? null,
  );
  const insert = fits && !filters.query;
  return {
    ...data,
    pages: data.pages.map((page, index) => {
      if (!fits) {
        return {
          ...page, items: removeConversation(
            page.items,
            conversation.id,
          ),
        };
      }
      return {
        ...page,
        items: index === 0
          ? updateConversations(
              page.items,
              conversation,
              { insert },
            )
          : page.items.map(c => (c.id === conversation.id ? conversation : c)),
      };
    }),
  };
}

export function patchConversation(client: QueryClient, event: ConversationUpdatedEvent) {
  client.setQueryData(
    messagingKeys.conversation(event.conversation.id),
    event.conversation,
  );
  void client.invalidateQueries({ queryKey: messagingKeys.unreadSummary });
  const entries = client.getQueriesData<ConversationsData>({ queryKey: CONVERSATIONS_ROOT });
  for (const [
    key,
    data,
  ] of entries) {
    if (data) {
      client.setQueryData(
        key,
        patchList(
          data,
          filtersOf(key),
          event.conversation,
        ),
      );
    }
  }
}

export function patchMessageCreated(client: QueryClient, event: MessageCreatedEvent) {
  client.setQueryData<ThreadData>(
    messagingKeys.thread(event.conversation_id),
    (data) => {
      if (!data)
        return data;
      return mapFirstPage(
        data,
        page => ({
          ...page,
          items: upsertMessages(
            page.items,
            [event.message],
          ),
        }),
      );
    },
  );
  if (event.message.client_message_id) {
    usePendingMessages.getState().drop(
      event.conversation_id,
      event.message.client_message_id,
    );
  }
}

export function patchMessageDeleted(client: QueryClient, event: MessageDeletedEvent) {
  client.setQueryData<ThreadData>(
    messagingKeys.thread(event.conversation_id),
    (data) => {
      if (!data)
        return data;
      return {
        ...data, pages: data.pages.map(page => ({
          ...page, items: removeMessage(
            page.items,
            event.message_id,
          ),
        })),
      };
    },
  );
}

export function patchMessageStatus(client: QueryClient, event: MessageStatusEvent) {
  client.setQueryData<ThreadData>(
    messagingKeys.thread(event.conversation_id),
    (data) => {
      if (!data)
        return data;
      return {
        ...data,
        pages: data.pages.map(page => ({
          ...page, items: applyStatusEvent(
            page.items,
            event,
          ),
        })),
      };
    },
  );
  usePendingMessages.getState().applyStatus(event);
}

async function resyncConversations(client: QueryClient) {
  const entries = client.getQueriesData<ConversationsData>({ queryKey: CONVERSATIONS_ROOT });
  await Promise.all(entries.map(async ([
    key,
    data,
  ]) => {
    if (!data)
      return;
    const filters = filtersOf(key);
    const fresh = await getMessagingConversations({
      query: filters.query,
      state: filters.state,
      status: filters.status || undefined,
      assignee: filters.assignee || undefined,
      tag: filters.tag || undefined,
    });
    client.setQueryData<ConversationsData>(
      key,
      current => current && mapFirstPage(
        current,
        page => ({
          ...page,
          items: mergeConversationPage(
            page.items,
            fresh.items,
          ),
        }),
      ),
    );
  }));
}

async function resyncThread(client: QueryClient, conversationId: string) {
  const fresh = await getMessagingMessages({ conversationId });
  client.setQueryData<ThreadData>(
    messagingKeys.thread(conversationId),
    current =>
      current && mapFirstPage(
        current,
        page => ({
          ...page,
          items: upsertMessages(
            page.items,
            fresh.items,
          ),
        }),
      ),
  );
  for (const message of fresh.items) {
    if (message.client_message_id) {
      usePendingMessages.getState().drop(
        conversationId,
        message.client_message_id,
      );
    }
  }
}

export async function resyncMessaging(client: QueryClient, openConversationId: string | null) {
  await Promise.allSettled([
    resyncConversations(client),
    openConversationId ? resyncThread(
      client,
      openConversationId,
    ) : Promise.resolve(),
    openConversationId
      ? client.invalidateQueries({ queryKey: messagingKeys.conversation(openConversationId) })
      : Promise.resolve(),
  ]);
}
