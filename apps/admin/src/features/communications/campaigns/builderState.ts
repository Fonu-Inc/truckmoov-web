import type { CampaignChannel, CreatePlatformCampaignInput } from "@truckmoov/api/notification";
import type { Reach } from "./audience";

export const STEPS = ["Details", "Message", "Audience", "Review"] as const;

export type BuilderDraft = {
  name: string;
  channels: CampaignChannel[];
  smsBody: string;
  emailBody: string;
  templateName: string;
  audienceIds: string[];
  sendLater: boolean;
  /** Value of a datetime-local input. */
  sendAt: string;
};

export const SMS_LIMIT = 480;

export const EMPTY_DRAFT: BuilderDraft = {
  name: "",
  channels: [],
  smsBody: "",
  emailBody: "",
  templateName: "",
  audienceIds: [],
  sendLater: false,
  sendAt: "",
};

/** What stops the person leaving a step, in words, or null when they may go on. */
export function stepProblem(step: number, draft: BuilderDraft, reach: Reach): string | null {
  switch (step) {
    case 0:
      if (!draft.name.trim())
        return "Give the campaign a name.";
      return draft.channels.length === 0 ? "Choose at least one channel." : null;
    case 1:
      return messageProblem(draft);
    case 2:
      if (draft.audienceIds.length === 0)
        return "Choose who receives it.";
      return reach.recipients.length === 0 ? "None of the chosen tenants has an address on these channels." : null;
    default:
      return draft.sendLater && !draft.sendAt ? "Pick when to send." : null;
  }
}

function messageProblem(draft: BuilderDraft): string | null {
  if (draft.channels.includes("whatsapp") && !draft.templateName)
    return "Choose an approved WhatsApp template.";
  if (draft.channels.includes("sms") && !draft.smsBody.trim())
    return "Write the SMS.";
  if (draft.channels.includes("sms") && /\{\{.*?\}\}/.test(draft.smsBody))
    return "Replace the {{values}} in the SMS with the real text.";
  if (draft.channels.includes("email") && !draft.emailBody.trim())
    return "Write the email.";
  return null;
}

export function toInput(draft: BuilderDraft, reach: Reach): CreatePlatformCampaignInput {
  const bodies: CreatePlatformCampaignInput["bodies"] = {};
  if (draft.channels.includes("sms"))
    bodies.sms = draft.smsBody.trim();
  if (draft.channels.includes("email"))
    bodies.email = draft.emailBody.trim();
  if (draft.channels.includes("whatsapp"))
    bodies.whatsapp = `Template ${draft.templateName}`;
  return {
    name: draft.name.trim(),
    channels: draft.channels,
    bodies,
    template_name: draft.channels.includes("whatsapp") ? draft.templateName : undefined,
    scheduled_for: draft.sendLater ? new Date(draft.sendAt).toISOString() : undefined,
    recipients: reach.recipients,
  };
}
