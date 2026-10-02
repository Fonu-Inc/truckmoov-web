import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MessagingCannedReplyInput } from "@truckmoov/api/notification";
import {
  createMessagingCannedReply,
  deleteMessagingCannedReply,
  updateMessagingCannedReply,
} from "@truckmoov/api/notification";
import { toast } from "sonner";
import { messagingKeys } from "./messagingQueries";

export function useCannedReplyActions(onDone?: () => void) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: messagingKeys.canned });
  const failed = (error: { message?: string }) => toast.error(error.message || "Something went wrong.");

  const save = useMutation({
    mutationFn: (input: MessagingCannedReplyInput & { id?: string }) =>
      input.id ? updateMessagingCannedReply(input.id, input) : createMessagingCannedReply(input),
    onSuccess: async () => {
      await refresh();
      toast.success("Quick reply saved.");
      onDone?.();
    },
    onError: failed,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMessagingCannedReply(id),
    onSuccess: refresh,
    onError: failed,
  });

  return { save, remove };
}
