import type { WhatsAppAccount, WhatsAppConnectionStep } from "@truckmoov/api/notification";

export type Tone = "good" | "warn" | "bad" | "neutral";

export const TONE_CLASS: Record<Tone, string> = {
  good: "bg-success/10 text-success border-success/30",
  warn: "bg-warning/10 text-warning border-warning/30",
  bad: "bg-destructive/10 text-destructive border-destructive/30",
  neutral: "bg-muted text-muted-foreground",
};

const QUALITY_TONE: Record<string, Tone> = {
  GREEN: "good",
  YELLOW: "warn",
  RED: "bad",
};

const NUMBER_STATUS_TONE: Record<string, Tone> = {
  CONNECTED: "good",
  PENDING: "warn",
  FLAGGED: "warn",
  RESTRICTED: "bad",
  BANNED: "bad",
  DISCONNECTED: "bad",
  UNVERIFIED: "warn",
};

const TIER_LABEL: Record<string, string> = {
  TIER_50: "50 customers / 24h",
  TIER_250: "250 customers / 24h",
  TIER_1K: "1,000 customers / 24h",
  TIER_2K: "2,000 customers / 24h",
  TIER_10K: "10,000 customers / 24h",
  TIER_100K: "100,000 customers / 24h",
  TIER_UNLIMITED: "Unlimited customers / 24h",
};

const NAME_STATUS_TONE: Record<string, Tone> = {
  APPROVED: "good",
  AVAILABLE_WITHOUT_REVIEW: "good",
  PENDING_REVIEW: "warn",
  DECLINED: "bad",
  EXPIRED: "bad",
  NONE: "neutral",
};

const STEP_LABEL: Record<WhatsAppConnectionStep["name"], string> = {
  token: "Access token stored",
  profile: "Number details read from Meta",
  subscribed: "Webhooks subscribed",
  registered: "Registered for WhatsApp Cloud API",
};

const SIGNUP_STEP_LABEL: Record<string, string> = {
  PHONE_NUMBER_SETUP: "adding the phone number",
  PHONE_NUMBER_VERIFICATION: "verifying the phone number",
  BUSINESS_ACCOUNT_SELECTION: "choosing the business account",
};

export function humanize(value: string | undefined) {
  if (!value)
    return "";
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function qualityTone(rating: string | undefined): Tone {
  return QUALITY_TONE[rating ?? ""] ?? "neutral";
}

export function numberStatusTone(status: string | undefined): Tone {
  return NUMBER_STATUS_TONE[status ?? ""] ?? "neutral";
}

export function nameStatusTone(status: string | undefined): Tone {
  return NAME_STATUS_TONE[status ?? ""] ?? "neutral";
}

export function tierLabel(tier: string | undefined) {
  return TIER_LABEL[tier ?? ""] ?? humanize(tier);
}

export function stepLabel(name: WhatsAppConnectionStep["name"]) {
  return STEP_LABEL[name];
}

export function signupStepLabel(step: string | undefined) {
  return step ? (SIGNUP_STEP_LABEL[step] ?? humanize(step).toLowerCase()) : "";
}

export function needsReconnect(account: WhatsAppAccount | undefined) {
  return account?.token_status === "needs_reconnect";
}

export function failedSteps(account: WhatsAppAccount | undefined) {
  return account?.steps?.filter(step => step.status === "failed") ?? [];
}

/** What staff must act on, most urgent first. Empty when the number is healthy. */
export function attentionNotices(account: WhatsAppAccount | undefined): { tone: Tone; text: string }[] {
  if (!account)
    return [];
  const notices: { tone: Tone; text: string }[] = [];
  if (needsReconnect(account))
    notices.push({ tone: "bad", text: "Meta no longer accepts the saved access token. Messages cannot be sent until you reconnect." });
  if (account.number_status === "FLAGGED" || account.number_status === "RESTRICTED")
    notices.push({ tone: "warn", text: `Meta has marked this number ${humanize(account.number_status).toLowerCase()}. Check WhatsApp Manager.` });
  if (account.name_status === "DECLINED")
    notices.push({ tone: "warn", text: "Meta declined the display name. Edit it in WhatsApp Manager and resubmit." });
  if (account.quality_rating === "RED")
    notices.push({ tone: "warn", text: "The number's quality rating is low. Reduce unsolicited messages to avoid limits." });
  return notices;
}
