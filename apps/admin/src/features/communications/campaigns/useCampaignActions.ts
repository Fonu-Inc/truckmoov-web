import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelPlatformCampaign,
  createPlatformCampaign,
  sendPlatformCampaign,
} from "@truckmoov/api/notification";
import { toast } from "sonner";
import { campaignKeys } from "./campaignQueries";

function failed(error: { message?: string }) {
  toast.error(error.message || "Something went wrong.");
}

export function useCampaignActions() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: campaignKeys.root });

  const create = useMutation({
    mutationFn: createPlatformCampaign,
    onSuccess: refresh,
    onError: failed,
  });

  const send = useMutation({
    mutationFn: ({ id, retryFailedOnly }: { id: string; retryFailedOnly?: boolean }) => sendPlatformCampaign(id, retryFailedOnly),
    onSuccess: async (result) => {
      await refresh();
      toast.success(result.attempted === 0 ? "Nobody left to send to." : `Sent to ${result.attempted} recipient${result.attempted === 1 ? "" : "s"}.`);
    },
    onError: failed,
  });

  const cancel = useMutation({
    mutationFn: cancelPlatformCampaign,
    onSuccess: async () => {
      await refresh();
      toast.success("Campaign cancelled.");
    },
    onError: failed,
  });

  return { create, send, cancel };
}
