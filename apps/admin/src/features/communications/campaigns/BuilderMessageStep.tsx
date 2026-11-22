import type { BuilderDraft } from "./builderState";
import { useQuery } from "@tanstack/react-query";
import { getSystemWhatsAppTemplatesQueryOptions } from "@truckmoov/api/notification";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import {
  bodyTextOf, isSendableFromInbox, variableNumbersOf,
} from "../components/whatsapp/templateComponents";
import { smsTemplatesOptions } from "../sms/smsTemplateQueries";
import { SMS_LIMIT } from "./builderState";

type Props = {
  draft: BuilderDraft;
  onChange: (change: Partial<BuilderDraft>) => void;
};

function WhatsAppTemplatePicker({
  draft, onChange,
}: Props) {
  const templates = useQuery(getSystemWhatsAppTemplatesQueryOptions({ limit: 100 }));
  const usable = (templates.data?.data.data ?? []).filter(template =>
    template.status === "APPROVED" && isSendableFromInbox(template.components) && variableNumbersOf(template.components).length === 0);
  const chosen = usable.find(template => template.name === draft.templateName);

  return (
    <div className="space-y-2">
      <Label>WhatsApp template</Label>
      <Select
        value={draft.templateName}
        onValueChange={templateName => onChange({ templateName })}
      >
        <SelectTrigger aria-label="WhatsApp template">
          <SelectValue placeholder={templates.isLoading ? "Loading templates..." : "Choose an approved template"} />
        </SelectTrigger>
        <SelectContent>
          {usable.map(template => (
            <SelectItem
              key={template.name}
              value={template.name ?? ""}
            >
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {templates.isError && <p className="text-xs text-destructive">Could not load templates.</p>}
      {!templates.isLoading && !templates.isError && usable.length === 0 && (
        <p className="text-xs text-muted-foreground">No approved template without variables, media or links. Create one on the WhatsApp Setup page.</p>
      )}
      {chosen && <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">{bodyTextOf(chosen.components)}</p>}
    </div>
  );
}

function SmsTemplateStarter({ onPick }: { onPick: (content: string) => void }) {
  const templates = useQuery(smsTemplatesOptions());
  const active = (templates.data ?? []).filter(template => template.is_active);
  if (active.length === 0)
    return null;
  return (
    <Select
      value=""
      onValueChange={id => onPick(active.find(template => template.id === id)?.content ?? "")}
    >
      <SelectTrigger aria-label="Start from a template"><SelectValue placeholder="Start from a saved template" /></SelectTrigger>
      <SelectContent>
        {active.map(template => (
          <SelectItem
            key={template.id}
            value={template.id}
          >
            {template.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function BuilderMessageStep({
  draft, onChange,
}: Props) {
  return (
    <div className="space-y-5">
      {draft.channels.includes("whatsapp") && (
        <WhatsAppTemplatePicker
          draft={draft}
          onChange={onChange}
        />
      )}
      {draft.channels.includes("sms") && (
        <div className="space-y-2">
          <Label htmlFor="campaign-sms">SMS</Label>
          <SmsTemplateStarter onPick={smsBody => onChange({ smsBody })} />
          <Textarea
            id="campaign-sms"
            rows={4}
            maxLength={SMS_LIMIT}
            value={draft.smsBody}
            onChange={e => onChange({ smsBody: e.target.value })}
          />
          <p className="text-right text-xs text-muted-foreground">{`${draft.smsBody.length}/${SMS_LIMIT}`}</p>
        </div>
      )}
      {draft.channels.includes("email") && (
        <div className="space-y-2">
          <Label htmlFor="campaign-email">Email</Label>
          <Textarea
            id="campaign-email"
            rows={6}
            maxLength={5000}
            value={draft.emailBody}
            onChange={e => onChange({ emailBody: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
