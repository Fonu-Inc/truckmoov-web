import type { MessagingConversation, PlatformMessagingSocket } from "@truckmoov/api/notification";
import { useEffect, useRef } from "react";

export function useMarkRead(
  socket: PlatformMessagingSocket | null,
  connected: boolean,
  conversation: MessagingConversation | undefined,
  canManage: boolean,
) {
  const lastSent = useRef("");
  const unread = conversation?.unread_count ?? 0;
  const id = conversation?.id;

  useEffect(
    () => {
      if (!socket || !connected || !canManage || !id || unread === 0)
        return;
      const key = `${id}:${unread}`;
      if (lastSent.current === key)
        return;
      lastSent.current = key;
      void socket.markRead(id);
    },
    [
      socket,
      connected,
      canManage,
      id,
      unread,
    ],
  );
}
