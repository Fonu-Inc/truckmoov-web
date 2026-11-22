import type {
  CampaignChannel, CreatePlatformCampaignInput,
} from "@truckmoov/api/notification";

export type AudienceTenant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
};

export type Recipient = CreatePlatformCampaignInput["recipients"][number];

export type Reach = {
  recipients: Recipient[];
  /** Tenants with an address on the channel. */
  reachable: Record<CampaignChannel, number>;
  /** Tenants left out of the channel because they have no address for it. */
  missing: Record<CampaignChannel, number>;
};

/** WhatsApp and SMS take country-code digits; a Nigerian 0-prefixed number is widened. */
export function normalizePhone(raw: string | null): string | null {
  const digits = (raw ?? "").replace(
    /\D/g,
    "",
  );
  if (digits.length === 11 && digits.startsWith("0"))
    return `234${digits.slice(1)}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function normalizeEmail(raw: string | null): string | null {
  const email = (raw ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email) ? email : null;
}

function destinationFor(tenant: AudienceTenant, channel: CampaignChannel): string | null {
  return channel === "email" ? normalizeEmail(tenant.email) : normalizePhone(tenant.phone);
}

const EMPTY_COUNTS: Record<CampaignChannel, number> = {
  whatsapp: 0, sms: 0, email: 0,
};

export function buildRecipients(tenants: AudienceTenant[], channels: CampaignChannel[]): Reach {
  const reach: Reach = {
    recipients: [], reachable: { ...EMPTY_COUNTS }, missing: { ...EMPTY_COUNTS },
  };
  for (const tenant of tenants) {
    for (const channel of channels) {
      const destination = destinationFor(
        tenant,
        channel,
      );
      if (!destination) {
        reach.missing[channel] += 1;
        continue;
      }
      reach.reachable[channel] += 1;
      reach.recipients.push({
        audience_ref: tenant.id, channel, destination,
      });
    }
  }
  return reach;
}

export const MESSAGEABLE_STATUSES = [
  "active",
  "trial",
];

export function isMessageable(tenant: AudienceTenant) {
  return MESSAGEABLE_STATUSES.includes(tenant.status);
}
