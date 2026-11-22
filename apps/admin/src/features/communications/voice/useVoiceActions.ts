import type { IvrPromptInput } from "@truckmoov/api/notification";
import {
  useMutation, useQueryClient,
} from "@tanstack/react-query";
import {
  deleteVoicePrompt,
  initiateVoiceCall,
  saveVoicePrompt,
  updateVoiceCallNotes,
} from "@truckmoov/api/notification";
import { toast } from "sonner";
import { voiceKeys } from "./voiceQueries";

function failed(error: { message?: string }) {
  toast.error(error.message || "Something went wrong.");
}

export function useVoiceActions(onDone?: () => void) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: voiceKeys.root });

  const savePrompt = useMutation({
    mutationFn: ({
      id, input,
    }: {
      id?: string; input: IvrPromptInput;
    }) => saveVoicePrompt(
      input,
      id,
    ),
    onSuccess: async () => {
      await refresh();
      onDone?.();
    },
    onError: failed,
  });

  const deletePrompt = useMutation({
    mutationFn: deleteVoicePrompt, onSuccess: refresh, onError: failed,
  });

  const call = useMutation({
    mutationFn: initiateVoiceCall,
    onSuccess: async () => {
      await refresh();
      toast.success("Call placed.");
      onDone?.();
    },
    onError: failed,
  });

  const saveNotes = useMutation({
    mutationFn: ({
      id, notes,
    }: {
      id: string; notes: string;
    }) => updateVoiceCallNotes(
      id,
      notes,
    ),
    onSuccess: async () => {
      await refresh();
      onDone?.();
    },
    onError: failed,
  });

  return {
    savePrompt, deletePrompt, call, saveNotes,
  };
}
