import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deletePlatformMailCredentials,
  getPlatformMailAttachmentLink,
  savePlatformMailCredentials,
  sendPlatformMail,
  setPlatformMailStarred,
} from "@truckmoov/api/auth";
import { toast } from "sonner";
import { emailKeys } from "./emailQueries";

function failed(error: { message?: string }) {
  toast.error(error.message || "Something went wrong.");
}

export function useEmailActions(onSent?: () => void) {
  const client = useQueryClient();
  const refreshMail = () => client.invalidateQueries({ queryKey: emailKeys.root });

  const saveCredentials = useMutation({
    mutationFn: savePlatformMailCredentials,
    onSuccess: async () => {
      await refreshMail();
      toast.success("Mailbox saved. Mail starts syncing shortly.");
    },
    onError: failed,
  });

  const disconnect = useMutation({
    mutationFn: deletePlatformMailCredentials,
    onSuccess: async () => {
      await refreshMail();
      toast.success("Mailbox disconnected.");
    },
    onError: failed,
  });

  const send = useMutation({
    mutationFn: sendPlatformMail,
    onSuccess: async (result) => {
      await refreshMail();
      toast.success(result.filedToSent ? "Sent." : "Sent. It could not be filed to the Sent folder.");
      onSent?.();
    },
    onError: failed,
  });

  const star = useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) => setPlatformMailStarred(id, starred),
    onSuccess: () => client.invalidateQueries({ queryKey: emailKeys.root }),
    onError: failed,
  });

  const openAttachment = useMutation({
    mutationFn: ({ messageId, index }: { messageId: string; index: number }) => getPlatformMailAttachmentLink(messageId, index),
    onSuccess: url => window.open(url, "_blank", "noopener,noreferrer"),
    onError: failed,
  });

  return { saveCredentials, disconnect, send, star, openAttachment };
}
