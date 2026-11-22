import type {
  SendSystemWhatsAppTemplateResponse, WhatsAppTemplate,
} from "@truckmoov/api/notification";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemWhatsAppTemplatesQueryOptions,
  useSendSystemWhatsAppTemplate,
} from "@truckmoov/api/notification";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  bodyTextOf,
  fillPlaceholders,
  isSendableFromInbox,
  variableNumbersOf,
} from "./templateComponents";

const TEMPLATE_PAGE = 100;

type StartConversationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reopen this locked conversation. Omit to start a new one with a phone number. */
  conversationId?: string;
  onSent?: (result: NonNullable<SendSystemWhatsAppTemplateResponse["data"]>) => void;
};

function approvedSendable(templates: WhatsAppTemplate[]) {
  return templates.filter(template => template.status === "APPROVED");
}

/**
 * Sends an approved template from the platform number: the only way to start a
 * conversation, or to reopen one whose 24-hour window has closed.
 */
export function StartConversationDialog({
  open,
  onOpenChange,
  conversationId,
  onSent,
}: StartConversationDialogProps) {
  const [
    phone,
    setPhone,
  ] = useState("");
  const [
    name,
    setName,
  ] = useState("");
  const [
    templateKey,
    setTemplateKey,
  ] = useState("");
  const [
    values,
    setValues,
  ] = useState<Record<string, string>>({});
  const send = useSendSystemWhatsAppTemplate();
  const templatesQuery = useQuery({
    ...getSystemWhatsAppTemplatesQueryOptions({ limit: TEMPLATE_PAGE }),
    enabled: open,
  });

  const approved = approvedSendable(templatesQuery.data?.data.data ?? []);
  const sendable = approved.filter(template => isSendableFromInbox(template.components));
  const skipped = approved.length - sendable.length;
  const template = sendable.find(item => `${item.name}|${item.language}` === templateKey);
  const variables = variableNumbersOf(template?.components);
  const preview = template ? fillPlaceholders(
    bodyTextOf(template.components),
    values,
  ) : "";
  const missingValue = variables.some(number => !values[String(number)]?.trim());
  const missingPhone = !conversationId && phone.replace(
    /\D/g,
    "",
  ).length < 8;

  const close = (next: boolean) => {
    if (!next) {
      setPhone("");
      setName("");
      setTemplateKey("");
      setValues({});
    }
    onOpenChange(next);
  };

  const submit = () => {
    if (!template?.name)
      return;
    send.mutate(
      {
        data: {
          conversation_id: conversationId,
          phone: conversationId ? undefined : phone,
          name: name.trim() || undefined,
          template_name: template.name,
          language: template.language,
          variables: values,
          client_message_id: crypto.randomUUID(),
        },
      },
      {
        onSuccess: (response) => {
          if (response.data.message?.status === "failed")
            toast.error(response.data.message.error?.message || "Meta did not accept the message.");
          else
            toast.success("Template sent.");
          if (response.data.message?.status !== "failed")
            close(false);
          onSent?.(response.data);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{conversationId ? "Reopen with a template" : "Start a conversation"}</DialogTitle>
          <DialogDescription>
            WhatsApp only lets us message first with an approved template. Once the driver replies, you can send free text for 24 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!conversationId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="outreach-phone">Phone number</Label>
                <Input
                  id="outreach-phone"
                  inputMode="tel"
                  placeholder="2348012345678"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">With country code, digits only.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outreach-name">Name (optional)</Label>
                <Input
                  id="outreach-name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={templateKey}
              onValueChange={(next) => {
                setTemplateKey(next);
                setValues({});
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={templatesQuery.isLoading ? "Loading templates..." : "Choose a template"} />
              </SelectTrigger>
              <SelectContent>
                {sendable.map(item => (
                  <SelectItem
                    key={`${item.name}|${item.language}`}
                    value={`${item.name}|${item.language}`}
                  >
                    {item.name}
                    {" "}
                    ·
                    {item.language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templatesQuery.isError && (
              <p className="text-xs text-destructive">
                Couldn&apos;t load templates:
                {templatesQuery.error.message}
              </p>
            )}
            {!templatesQuery.isLoading && !templatesQuery.isError && sendable.length === 0 && (
              <p className="text-xs text-muted-foreground">No approved templates yet. Create one on the WhatsApp Setup page.</p>
            )}
            {skipped > 0 && (
              <p className="text-xs text-muted-foreground">
                {skipped}
                {" "}
                approved template
                {skipped === 1 ? " needs" : "s need"}
                {" "}
                a media header or button link, which can&apos;t be sent from here yet.
              </p>
            )}
          </div>

          {variables.map(number => (
            <div
              key={number}
              className="space-y-2"
            >
              <Label htmlFor={`outreach-var-${number}`}>{`Value for {{${number}}}`}</Label>
              <Input
                id={`outreach-var-${number}`}
                value={values[String(number)] ?? ""}
                onChange={event => setValues(current => ({
                  ...current, [String(number)]: event.target.value,
                }))}
              />
            </div>
          ))}

          {template && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Preview</p>
              <p className="whitespace-pre-wrap text-sm">{preview}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => close(false)}
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={submit}
            loading={send.isPending}
            disabled={!template || missingValue || missingPhone}
          >
            Send template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
