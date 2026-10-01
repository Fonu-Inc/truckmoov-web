import type { MessagingConversation } from "@truckmoov/api/notification";
import type { MessagingConnection } from "./useMessagingSocket";

export function composerDisabledReason(
  conversation: Pick<MessagingConversation, "is_locked">,
  canManage: boolean,
  connection: MessagingConnection,
): string | null {
  if (!canManage)
    return "You can read messages but not reply.";
  if (conversation.is_locked)
    return "The 24-hour window has closed. You can reply once the person writes again.";
  if (connection !== "connected")
    return "You can reply once the connection is back.";
  return null;
}
