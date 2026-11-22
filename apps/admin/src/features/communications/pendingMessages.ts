import type {
  MessageStatusEvent, MessagingMessage,
} from "@truckmoov/api/notification";
import { create } from "zustand";
import {
  applyStatusEvent, errorText,
} from "./messagingLogic";

type PendingState = {
  byConversation: Record<string, MessagingMessage[]>;
  add: (conversationId: string, message: MessagingMessage) => void;
  fail: (conversationId: string, clientMessageId: string, code: string) => void;
  applyStatus: (event: MessageStatusEvent) => void;
  drop: (conversationId: string, clientMessageId: string) => void;
  expire: (conversationId: string, clientMessageId: string) => void;
  requeue: (conversationId: string, clientMessageId: string) => void;
};

const NONE: MessagingMessage[] = [];

export const usePendingMessages = create<PendingState>(set => ({
  byConversation: {},
  add: (conversationId, message) => set(s => ({
    byConversation: {
      ...s.byConversation,
      [conversationId]: [
        ...(s.byConversation[conversationId] ?? NONE),
        message,
      ],
    },
  })),
  fail: (conversationId, clientMessageId, code) => set(s => ({
    byConversation: {
      ...s.byConversation,
      [conversationId]: (s.byConversation[conversationId] ?? NONE).map(m =>
        m.client_message_id === clientMessageId
          ? {
              ...m, status: "failed", error: {
                code, message: errorText(code),
              },
            }
          : m),
    },
  })),
  expire: (conversationId, clientMessageId) => set(s => ({
    byConversation: {
      ...s.byConversation,
      [conversationId]: (s.byConversation[conversationId] ?? NONE).map(m =>
        m.client_message_id === clientMessageId && m.status === "queued"
          ? {
              ...m, status: "failed", error: {
                code: "unavailable", message: errorText("unavailable"),
              },
            }
          : m),
    },
  })),
  requeue: (conversationId, clientMessageId) => set(s => ({
    byConversation: {
      ...s.byConversation,
      [conversationId]: (s.byConversation[conversationId] ?? NONE).map(m =>
        m.client_message_id === clientMessageId ? {
          ...m, status: "queued", error: undefined,
        } : m),
    },
  })),
  applyStatus: event => set(s => ({
    byConversation: {
      ...s.byConversation,
      [event.conversation_id]: applyStatusEvent(
        s.byConversation[event.conversation_id] ?? NONE,
        event,
      ),
    },
  })),
  drop: (conversationId, clientMessageId) => set(s => ({
    byConversation: {
      ...s.byConversation,
      [conversationId]: (s.byConversation[conversationId] ?? NONE).filter(
        m => m.client_message_id !== clientMessageId,
      ),
    },
  })),
}));

export function selectPending(conversationId: string | null) {
  return (s: PendingState) =>
    (conversationId ? s.byConversation[conversationId] : undefined) ?? NONE;
}
