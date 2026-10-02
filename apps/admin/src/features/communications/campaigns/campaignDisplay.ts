import type { CampaignProgress, CampaignRecipientState, CampaignStatus } from "@truckmoov/api/notification";

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sending: "Sending",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const STATE_LABEL: Record<CampaignRecipientState, string> = {
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
  suppressed: "Opted out",
};

export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/** Share of what was sent that arrived. */
export function deliveryRate(progress: CampaignProgress): number {
  return percent(progress.delivered, progress.sent);
}

/** Reads only exist on WhatsApp, so the share is of what was delivered. */
export function readRate(progress: CampaignProgress): number {
  return percent(progress.read, progress.delivered);
}

export function statusTone(status: CampaignStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed": return "default";
    case "failed": return "destructive";
    case "sending":
    case "scheduled": return "secondary";
    default: return "outline";
  }
}

export function canSend(status: CampaignStatus) {
  return status === "draft" || status === "scheduled" || status === "sending";
}

export function canCancel(status: CampaignStatus) {
  return status === "draft" || status === "scheduled";
}
