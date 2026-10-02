import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  MessagingBulkInput,
  MessagingConversationUpdate,
} from "@truckmoov/api/notification";
import {
  addMessagingNote,
  bulkUpdateMessagingConversations,
  cancelScheduledMessagingMessage,
  retryMessagingMessage,
  scheduleMessagingMessage,
  sendMessagingMedia,
  updateMessagingConversation,
} from "@truckmoov/api/notification";
import { toast } from "sonner";
import { patchConversation, patchMessageCreated, patchMessageDeleted } from "./messagingCache";
import { CONVERSATIONS_ROOT } from "./messagingQueries";

function failed(error: unknown) {
  toast.error(error instanceof Error ? error.message : (error as { message?: string })?.message || "Something went wrong.");
}

export function useConversationActions(conversationId: string) {
  const client = useQueryClient();

  const update = useMutation({
    mutationFn: (change: MessagingConversationUpdate) => updateMessagingConversation(conversationId, change),
    onSuccess: conversation => patchConversation(client, { conversation }),
    onError: failed,
  });

  const note = useMutation({
    mutationFn: (text: string) => addMessagingNote(conversationId, text),
    onSuccess: message => patchMessageCreated(client, { conversation_id: conversationId, message }),
    onError: failed,
  });

  const media = useMutation({
    mutationFn: (input: { file: File; caption?: string }) =>
      sendMessagingMedia({ conversationId, clientMessageId: crypto.randomUUID(), ...input }),
    onSuccess: message => patchMessageCreated(client, { conversation_id: conversationId, message }),
    onError: failed,
  });

  const schedule = useMutation({
    mutationFn: (input: { text: string; sendAt: string }) =>
      scheduleMessagingMessage({ conversationId, clientMessageId: crypto.randomUUID(), ...input }),
    onSuccess: (message) => {
      patchMessageCreated(client, { conversation_id: conversationId, message });
      toast.success("Message scheduled.");
    },
    onError: failed,
  });

  const cancelScheduled = useMutation({
    mutationFn: (messageId: string) => cancelScheduledMessagingMessage(conversationId, messageId),
    onSuccess: (_, messageId) => patchMessageDeleted(client, { conversation_id: conversationId, message_id: messageId }),
    onError: failed,
  });

  const retry = useMutation({
    mutationFn: (messageId: string) => retryMessagingMessage(conversationId, messageId),
    onSuccess: message => patchMessageCreated(client, { conversation_id: conversationId, message }),
    onError: failed,
  });

  return { update, note, media, schedule, cancelScheduled, retry };
}

export function useBulkConversationActions() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: MessagingBulkInput) => bulkUpdateMessagingConversations(input),
    onSuccess: () => client.invalidateQueries({ queryKey: CONVERSATIONS_ROOT }),
    onError: failed,
  });
}
