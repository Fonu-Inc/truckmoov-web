import type { MessagingMessage, PlatformMessagingSocket } from "@truckmoov/api/notification";
import { useCallback } from "react";
import { usePendingMessages } from "./pendingMessages";

const QUEUED_TIMEOUT_MS = 30_000;

function optimistic(clientMessageId: string, text: string): MessagingMessage {
  return {
    id: `local:${clientMessageId}`,
    client_message_id: clientMessageId,
    direction: "outbound",
    status: "queued",
    text,
    message_type: "text",
    created_at: new Date().toISOString(),
  };
}

async function publish(
  socket: PlatformMessagingSocket | null,
  conversationId: string,
  clientMessageId: string,
  text: string,
) {
  const pending = usePendingMessages.getState();
  const ack = socket
    ? await socket.send({ client_message_id: clientMessageId, conversation_id: conversationId, text })
    : null;
  if (!ack)
    pending.fail(conversationId, clientMessageId, "unavailable");
  else if ("error" in ack)
    pending.fail(conversationId, clientMessageId, ack.error.code);
  else
    window.setTimeout(() => usePendingMessages.getState().expire(conversationId, clientMessageId), QUEUED_TIMEOUT_MS);
}

export function useSendMessage(socket: PlatformMessagingSocket | null) {
  const send = useCallback(
    async (conversationId: string, rawText: string) => {
      const text = rawText.trim();
      if (!text)
        return;
      const clientMessageId = crypto.randomUUID();
      usePendingMessages.getState().add(conversationId, optimistic(clientMessageId, text));
      await publish(socket, conversationId, clientMessageId, text);
    },
    [socket],
  );

  // The server answers a repeated client id with the first result, so a retry cannot double-send.
  const retry = useCallback(
    async (conversationId: string, message: MessagingMessage) => {
      if (!message.client_message_id || !message.text)
        return;
      usePendingMessages.getState().requeue(conversationId, message.client_message_id);
      await publish(socket, conversationId, message.client_message_id, message.text);
    },
    [socket],
  );

  return { send, retry };
}
