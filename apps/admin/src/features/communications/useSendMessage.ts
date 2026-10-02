import type { MessagingMessage, PlatformMessagingSocket } from "@truckmoov/api/notification";
import { useCallback } from "react";
import { usePendingMessages } from "./pendingMessages";

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

export function useSendMessage(socket: PlatformMessagingSocket | null) {
  return useCallback(
    async (conversationId: string, rawText: string) => {
      const text = rawText.trim();
      if (!text)
        return;
      const pending = usePendingMessages.getState();
      const clientMessageId = crypto.randomUUID();
      pending.add(conversationId, optimistic(clientMessageId, text));
      const ack = socket
        ? await socket.send({
            client_message_id: clientMessageId,
            conversation_id: conversationId,
            text,
          })
        : null;
      if (!ack)
        pending.fail(conversationId, clientMessageId, "unavailable");
      else if ("error" in ack)
        pending.fail(conversationId, clientMessageId, ack.error.code);
    },
    [socket],
  );
}
