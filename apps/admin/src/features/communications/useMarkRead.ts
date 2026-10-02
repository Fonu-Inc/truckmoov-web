import type { MessagingConversation, PlatformMessagingSocket } from "@truckmoov/api/notification";
import { useEffect, useRef, useState } from "react";
import { usePageAttention } from "./usePageAttention";

const RETRY_DELAY_MS = 3000;

export function useMarkRead(
  socket: PlatformMessagingSocket | null,
  connected: boolean,
  conversation: MessagingConversation | undefined,
  canManage: boolean,
) {
  const lastSent = useRef("");
  const [attempt, setAttempt] = useState(0);
  const attending = usePageAttention();
  const unread = conversation?.unread_count ?? 0;
  const id = conversation?.id;

  useEffect(
    () => {
      if (!socket || !connected || !canManage || !attending || !id || unread === 0)
        return;
      const key = `${id}:${unread}`;
      if (lastSent.current === key)
        return;
      lastSent.current = key;
      let timer: number | undefined;
      void socket.markRead(id).then((ack) => {
        if (ack.ok || lastSent.current !== key)
          return;
        lastSent.current = "";
        timer = window.setTimeout(() => setAttempt(n => n + 1), RETRY_DELAY_MS);
      });
      return () => window.clearTimeout(timer);
    },
    [
      socket,
      connected,
      canManage,
      attending,
      id,
      unread,
      attempt,
    ],
  );
}
