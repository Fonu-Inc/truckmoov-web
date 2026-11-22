import type {
  SmsTemplateInput, SmsTemplateTestInput,
} from "@truckmoov/api/notification";
import {
  useMutation, useQueryClient,
} from "@tanstack/react-query";
import {
  createSmsTemplate,
  deleteSmsTemplate,
  testSmsTemplate,
  updateSmsTemplate,
} from "@truckmoov/api/notification";
import { toast } from "sonner";
import { smsTemplateKeys } from "./smsTemplateQueries";

function failed(error: { message?: string }) {
  toast.error(error.message || "Something went wrong.");
}

export function useSmsTemplateActions(onSaved?: () => void) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: smsTemplateKeys.all });

  const save = useMutation({
    mutationFn: ({
      id, input,
    }: {
      id?: string; input: SmsTemplateInput;
    }) => (id ? updateSmsTemplate(
      id,
      input,
    ) : createSmsTemplate(input)),
    onSuccess: async () => {
      await refresh();
      onSaved?.();
    },
    onError: failed,
  });

  const remove = useMutation({
    mutationFn: deleteSmsTemplate,
    onSuccess: async () => {
      await refresh();
      toast.success("Template deleted.");
    },
    onError: failed,
  });

  const test = useMutation({
    mutationFn: ({
      id, input,
    }: {
      id: string; input: SmsTemplateTestInput;
    }) => testSmsTemplate(
      id,
      input,
    ),
    onSuccess: () => toast.success("Test message sent."),
    onError: failed,
  });

  return {
    save, remove, test,
  };
}
