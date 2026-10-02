import type {
  MessagingConnectionFailure,
  PlatformMessagingSocket,
} from "@truckmoov/api/notification";
import { createPlatformMessagingSocket } from "@truckmoov/api/notification";
import { useAuthStore as useApiAuthStore } from "@truckmoov/api/lib/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  patchConversation,
  patchMessageCreated,
  patchMessageStatus,
  resyncMessaging,
} from "./messagingCache";

export type MessagingConnection =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "unauthenticated"
  | "forbidden";

function failureState(reason: MessagingConnectionFailure, wasConnected: boolean): MessagingConnection {
  if (reason === "unauthenticated" || reason === "forbidden")
    return reason;
  return wasConnected ? "reconnecting" : "offline";
}

export function useMessagingSocket(enabled: boolean, openConversationId: string | null) {
  const client = useQueryClient();
  const [state, setState] = useState<MessagingConnection>("connecting");
  const [socket, setSocket] = useState<PlatformMessagingSocket | null>(null);
  const openRef = useRef(openConversationId);
  openRef.current = openConversationId;

  useEffect(
    () => {
      if (!enabled)
        return;
      const instance = createPlatformMessagingSocket({
        baseUrl: import.meta.env.VITE_BACKEND_URL,
        getToken: () => useApiAuthStore.getState().accessToken,
      });
      let wasConnected = false;
      const offs = [
        instance.onConnect(() => {
          wasConnected = true;
          setState("connected");
          void resyncMessaging(client, openRef.current);
        }),
        instance.onDisconnect(() => setState("reconnecting")),
        instance.onFailure(reason => setState(failureState(reason, wasConnected))),
        instance.on("message.created", event => patchMessageCreated(client, event)),
        instance.on("message.status", event => patchMessageStatus(client, event)),
        instance.on("conversation.updated", event => patchConversation(client, event)),
      ];
      setSocket(instance);
      setState("connecting");
      return () => {
        offs.forEach(off => off());
        instance.close();
        setSocket(null);
      };
    },
    [
      client,
      enabled,
    ],
  );

  return { state, socket };
}
