/**
 * The top-bar bell's notifications. Ported from fleetflow's
 * `lib/dummyNotifications.ts` (platform-admin set only) and
 * `lib/security/auditEvents.ts` (the audit deep link).
 */
export type PlatformNotification = {
  id: string;
  type: "tenant_created" | "device_provisioned" | "sim_activated" | "alert" | "payment" | "security" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  severity: "info" | "warning" | "error" | "success";
  metadata?: Record<string, unknown>;
};

/** Notifications for suspicious logins link to this audit event. */
export const SUSPICIOUS_LOGIN_EVENT_ID = "sae-001";

/** Fleetflow's `/platform/audit-compliance` deep link, minus the `/platform` prefix. */
export function auditEventHref(id: string) {
  return `/audit-compliance?view=security&event=${encodeURIComponent(id)}`;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

function make(
  id: string,
  type: PlatformNotification["type"],
  severity: PlatformNotification["severity"],
  title: string,
  message: string,
  minsAgo: number,
  read = false,
): PlatformNotification {
  return {
    id,
    type,
    severity,
    title,
    message,
    timestamp: minutesAgo(minsAgo),
    read,
  };
}

/** Built per call so the "x minutes ago" stamps are relative to when the shell mounts. */
export function getPlatformAdminNotifications(): PlatformNotification[] {
  // ponytail: mock data from fleetflow parity port — wire to packages/api
  return [
    make(
      "pa-1",
      "tenant_created",
      "success",
      "New Tenant Onboarded",
      "Lagos Express Logistics completed KYC and is now active.",
      5,
    ),
    {
      ...make(
        "pa-2",
        "security",
        "error",
        "Suspicious Login Attempt",
        "Sign-in from an unusual location (Moscow, Russia) after 5 failed attempts.",
        22,
      ),
      metadata: { auditEventId: SUSPICIOUS_LOGIN_EVENT_ID },
    },
    make(
      "pa-3",
      "sim_activated",
      "info",
      "Bulk SIM Activation",
      "120 IoT SIMs activated for MTN Fleet Co.",
      60,
      true,
    ),
    make(
      "pa-4",
      "payment",
      "success",
      "Wallet Top-up Received",
      "₦2,500,000 funded by Sahara Logistics.",
      180,
      true,
    ),
    make(
      "pa-5",
      "system",
      "warning",
      "Edge Function Latency High",
      "fonu-webhook avg latency exceeded 800ms.",
      240,
      true,
    ),
  ];
}
