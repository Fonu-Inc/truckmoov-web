import type { MessagingConversation } from "@truckmoov/api/notification";
import type { MessagingConnection } from "./useMessagingSocket";

const READ_ONLY = "You can read messages but not reply.";

export function composerDisabledReason(
  conversation: Pick<MessagingConversation, "is_locked">,
  canManage: boolean,
  connection: MessagingConnection,
): string | null {
  if (!canManage)
    return READ_ONLY;
  if (conversation.is_locked)
    return "The 24-hour window has closed. Send a template to reopen it, or add a private note.";
  if (connection !== "connected")
    return "You can reply once the connection is back.";
  return null;
}

/** Attachments and scheduled sends go over REST, so only permission and the window matter. */
export function restSendDisabledReason(locked: boolean, canManage: boolean): string | null {
  if (!canManage)
    return READ_ONLY;
  return locked ? "The 24-hour window has closed. Send a template to reopen it." : null;
}

export function noteDisabledReason(canManage: boolean): string | null {
  return canManage ? null : READ_ONLY;
}

export const ATTACHMENT_ACCEPT = "image/jpeg,image/png,video/mp4,video/3gpp,audio/aac,audio/mp4,audio/mpeg,audio/amr,audio/ogg,application/pdf,application/msword,application/vnd.ms-excel,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain";

const MB = 1024 * 1024;

export function attachmentProblem(file: File): string | null {
  const type = file.type.toLowerCase();
  if (!ATTACHMENT_ACCEPT.split(",").includes(type))
    return "WhatsApp cannot send this type of file.";
  if (type.startsWith("image/") && file.size > 5 * MB)
    return "Images can be at most 5 MB.";
  if ((type.startsWith("video/") || type.startsWith("audio/")) && file.size > 16 * MB)
    return "Video and audio can be at most 16 MB.";
  return file.size > 20 * MB ? "Files can be at most 20 MB." : null;
}
