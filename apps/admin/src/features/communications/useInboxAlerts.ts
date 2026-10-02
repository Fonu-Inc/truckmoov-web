import type { PlatformMessagingSocket } from "@truckmoov/api/notification";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { playInboundSound, readSoundPreference, writeSoundPreference } from "./inboxAlerts";
import { unreadSummaryOptions } from "./useUnreadSummary";

/**
 * Tells staff about messages they are not looking at: a sound when one lands
 * in a conversation they have not got open, and the unread count in the tab
 * title.
 */
export function useInboxAlerts(socket: PlatformMessagingSocket | null, openConversationId: string | null) {
  const [sound, setSound] = useState(readSoundPreference);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const openRef = useRef(openConversationId);
  openRef.current = openConversationId;
  const summary = useQuery(unreadSummaryOptions()).data;

  useEffect(
    () => {
      if (!socket)
        return;
      return socket.on("message.created", (event) => {
        if (event.message.direction !== "inbound" || !soundRef.current)
          return;
        const watching = document.visibilityState === "visible" && document.hasFocus() && openRef.current === event.conversation_id;
        if (!watching)
          playInboundSound();
      });
    },
    [socket],
  );

  const count = summary?.conversations ?? 0;
  useEffect(
    () => {
      const base = document.title.replace(/^\(\d+\+?\)\s/, "");
      document.title = count > 0 ? `(${count}${summary?.at_least ? "+" : ""}) ${base}` : base;
      return () => {
        document.title = base;
      };
    },
    [count, summary?.at_least],
  );

  const toggleSound = () => {
    writeSoundPreference(!sound);
    setSound(!sound);
  };
  return { sound, toggleSound };
}
