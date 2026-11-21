import type { SystemAuditLogEntry } from "@truckmoov/api/auth";
import type {
  AuditOutcome, AuditSeverity,
} from "@/features/audit/utils/auditEvents";
import {
  endOfDay, isAfter, isBefore, startOfDay,
} from "@truckmoov/app-core/utils/time-utils";
import {
  DEMO_SECURITY_AUDIT_EVENTS, EVENT_TYPE_LABELS, minutesAgo,
} from "@/features/audit/utils/auditEvents";

export type {
  AuditOutcome, AuditSeverity,
};

export type AuditCategory = "security" | "sim" | "kyc" | "billing" | "webhook" | "api_key" | "tenant" | "device" | "other";
export type AuditSource = "security" | "integration" | "system";

export type UnifiedAuditEntry = {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail?: string;
  eventType: string;
  action: string;
  category: AuditCategory;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  resource: string;
  tenantId: string;
  tenantName: string;
  ipAddress?: string;
  location?: string;
  device?: string;
  source: AuditSource;
  description: string;
  details: Record<string, string>;
};

export const CATEGORY_LABELS: Record<AuditCategory, string> = {
  security: "Security & sign-in",
  sim: "SIM",
  kyc: "KYC",
  billing: "Invoices & billing",
  webhook: "Webhooks",
  api_key: "API keys",
  tenant: "Tenants & users",
  device: "Devices",
  other: "Other",
};
export const OUTCOME_LABELS: Record<AuditOutcome, string> = {
  success: "Success", failure: "Failure", flagged: "Flagged",
};
export const SEVERITY_LABELS: Record<AuditSeverity, string> = {
  info: "Info", low: "Low", medium: "Medium", high: "High", critical: "Critical",
};
export const SOURCE_LABELS: Record<AuditSource, string> = {
  security: "Security", integration: "Integration", system: "System",
};

/** Saved views — presets over the single audit log, never separate logs. */
export type AuditView = "all" | "security" | "sim";
export const VIEWS: AuditView[] = [
  "all",
  "security",
  "sim",
];
export const VIEW_LABELS: Record<AuditView, string> = {
  all: "All activity", security: "Security Events", sim: "SIM Audit",
};
export const VIEW_CATEGORIES: Record<AuditView, AuditCategory[] | null> = {
  all: null, security: [
    "security",
    "api_key",
  ], sim: ["sim"],
};

export function categoryOf(eventType: string, resource = ""): AuditCategory {
  const s = `${eventType} ${resource}`.toLowerCase();
  if (s.includes("sim"))
    return "sim";
  if (s.includes("kyc") || s.includes("kyb"))
    return "kyc";
  if (s.includes("invoice") || s.includes("payment") || s.includes("wallet"))
    return "billing";
  if (s.includes("webhook"))
    return "webhook";
  if (s.includes("api_key"))
    return "api_key";
  if (s.includes("device") || s.includes("geofence"))
    return "device";
  if (/login|logout|session|lock|password|mfa|permission|role|unusual|suspicious|ip_|export/.test(s))
    return "security";
  if (s.includes("tenant") || s.includes("user"))
    return "tenant";
  return "other";
}

function outcomeOf(eventType: string, sev: AuditSeverity): AuditOutcome {
  return /fail|reject|error|denied/.test(eventType.toLowerCase()) ? "failure" : sev === "high" || sev === "critical" ? "flagged" : "success";
}
function humanize(t: string) {
  return t.replace(
    /[._]/g,
    " ",
  ).replace(
    /^\w/,
    c => c.toUpperCase(),
  );
}
const sourceOf = (s: string): AuditSource => (s === "security" || s === "integration" ? s : "system");

/**
 * Maps a row of GET /auth/system/audit-log onto the unified shape — the admin
 * counterpart of fleetflow's `fromPlatformEntry`. The endpoint carries no
 * severity, location or device, so severity is always "info" and the outcome
 * comes from the action name alone.
 */
export function fromSystemAuditEntry(e: SystemAuditLogEntry): UnifiedAuditEntry {
  const severity: AuditSeverity = "info";
  const details: Record<string, string> = {};
  if (e.actorRole)
    details["Actor role"] = e.actorRole;
  if (e.resourceId)
    details["Resource ID"] = e.resourceId;
  if (e.reason)
    details.Reason = e.reason;
  return {
    id: e.id,
    timestamp: e.occurredAt,
    actorName: e.actorName || "System",
    actorEmail: e.actorEmail || undefined,
    eventType: e.action,
    action: humanize(e.action),
    category: categoryOf(
      e.action,
      e.resourceType,
    ),
    outcome: outcomeOf(
      e.action,
      severity,
    ),
    severity,
    resource: e.resourceType,
    tenantId: e.tenantId || "none",
    tenantName: e.tenantName || (e.tenantId ? "Unknown tenant" : "Platform"),
    ipAddress: e.ipAddress || undefined,
    source: sourceOf(e.source),
    description: e.summary || humanize(e.action),
    details,
  };
}

export function buildDemoAuditEntries(): UnifiedAuditEntry[] {
  const security: UnifiedAuditEntry[] = DEMO_SECURITY_AUDIT_EVENTS.map(e => ({
    id: e.id,
    timestamp: e.timestamp,
    actorName: e.userName ?? "Unknown user",
    actorEmail: e.email,
    eventType: e.eventType,
    action: EVENT_TYPE_LABELS[e.eventType],
    category: e.eventType.startsWith("api_key") ? "api_key" : "security",
    outcome: e.outcome,
    severity: e.severity,
    resource: e.eventType.startsWith("api_key") ? "API key" : "User account",
    tenantId: e.tenantId,
    tenantName: e.tenant,
    ipAddress: e.ipAddress,
    location: e.location,
    device: [
      e.device,
      e.browser,
    ].filter(Boolean).join(" · ") || undefined,
    source: "security",
    description: e.description,
    details: {
      ...(e.failureReason ? { "Failure reason": e.failureReason } : {}), ...(e.attempts ? { Attempts: String(e.attempts) } : {}), ...(e.metadata ?? {}),
    },
  }));
  // ponytail: mock data from fleetflow parity port — wire to packages/api
  const T = {
    lagos: [
      "demo-t1",
      "Lagos Express Logistics",
    ],
    accra: [
      "demo-t2",
      "Accra Swift Cargo",
    ],
    cape: [
      "demo-t4",
      "Cape Town Trucking",
    ],
    nairobi: [
      "demo-t3",
      "Nairobi Fleet Group",
    ],
    jhb: [
      "demo-t5",
      "Johannesburg Freight",
    ],
    abuja: [
      "demo-t6",
      "Abuja Haulage Co.",
    ],
  } as const;
  const op = (id: string, m: number, t: readonly [string, string], actor: [string, string], eventType: string, action: string, category: AuditCategory, severity: AuditSeverity, outcome: AuditOutcome, resource: string, description: string, details: Record<string, string>, source: AuditSource = "system", ip?: string): UnifiedAuditEntry => ({
    id,
    timestamp: minutesAgo(m),
    actorName: actor[0],
    actorEmail: actor[1],
    eventType,
    action,
    category,
    outcome,
    severity,
    resource,
    tenantId: t[0],
    tenantName: t[1],
    ipAddress: ip,
    location: ip ? "Lagos, Nigeria" : undefined,
    device: ip ? "Desktop · Chrome 120" : undefined,
    source,
    description,
    details,
  });
  // ponytail: mock data from fleetflow parity port — wire to packages/api
  const admin: [string, string] = [
    "Platform Admin",
    "platform@truckmoov.com",
  ];
  // ponytail: mock data from fleetflow parity port — wire to packages/api
  const sys: [string, string] = [
    "System Auto",
    "system@truckmoov.com",
  ];
  // ponytail: mock data from fleetflow parity port — wire to packages/api
  const sim: UnifiedAuditEntry[] = [
    op(
      "sim-1",
      8,
      T.lagos,
      admin,
      "sim_request_approved",
      "SIM request approved",
      "sim",
      "info",
      "success",
      "SIM request",
      "Approved SIM activation request for 25 SIMs",
      { Quantity: "25" },
      "integration",
      "102.89.34.12",
    ),
    op(
      "sim-2",
      7,
      T.lagos,
      sys,
      "sim_activated",
      "SIM activated",
      "sim",
      "info",
      "success",
      "SIM batch",
      "Auto-activated 25 SIMs via Fonu",
      {
        Quantity: "25", Provider: "Fonu",
      },
    ),
    op(
      "sim-3",
      45,
      T.cape,
      admin,
      "sim_request_rejected",
      "SIM request rejected",
      "sim",
      "medium",
      "failure",
      "SIM request",
      "Rejected SIM request — business documents incomplete",
      {
        Quantity: "10", Reason: "Missing business registration",
      },
      "integration",
      "102.89.34.12",
    ),
    op(
      "sim-4",
      120,
      T.accra,
      sys,
      "sim_activated",
      "SIM activated",
      "sim",
      "info",
      "success",
      "SIM batch",
      "Auto-activated 12 SIMs via Fonu",
      {
        Quantity: "12", Provider: "Fonu",
      },
    ),
    op(
      "sim-5",
      300,
      T.nairobi,
      admin,
      "sim_request_approved",
      "SIM request approved",
      "sim",
      "info",
      "success",
      "SIM request",
      "Approved SIM activation request for 50 SIMs",
      { Quantity: "50" },
      "integration",
      "102.89.34.12",
    ),
    op(
      "sim-6",
      1440,
      T.abuja,
      sys,
      "sim_activation_failed",
      "SIM activation failed",
      "sim",
      "high",
      "failure",
      "SIM",
      "Fonu activation failed for 1 SIM — invalid ICCID",
      { Error: "Invalid ICCID" },
    ),
  ];
  // ponytail: mock data from fleetflow parity port — wire to packages/api
  const other: UnifiedAuditEntry[] = [
    op(
      "op-1",
      15,
      T.lagos,
      [
        "Adaeze Okafor",
        "adaeze.okafor@mtn.ng",
      ],
      "kyc.verified",
      "KYC verified",
      "kyc",
      "info",
      "success",
      "KYC document",
      "Business registration verified",
      { Document: "CAC certificate" },
      "integration",
      "102.89.34.18",
    ),
    op(
      "op-2",
      55,
      T.jhb,
      [
        "Tunde Bakare",
        "tunde.bakare@fleetpro.ng",
      ],
      "invoice.approved",
      "Invoice approved",
      "billing",
      "info",
      "success",
      "Invoice",
      "Monthly subscription invoice approved",
      { Amount: "₦1,250,000" },
      "integration",
      "197.210.65.221",
    ),
    op(
      "op-3",
      90,
      T.accra,
      sys,
      "webhook.failed",
      "Webhook delivery failed",
      "webhook",
      "medium",
      "failure",
      "Webhook",
      "job.completed webhook returned HTTP 500 — retry queued",
      {
        Endpoint: "https://erp.example.com/hooks", Attempt: "3",
      },
    ),
    op(
      "op-4",
      200,
      T.nairobi,
      [
        "Ifeoma Nwosu",
        "ifeoma.nwosu@mtn.ng",
      ],
      "tenant.suspended",
      "Tenant suspended",
      "tenant",
      "high",
      "flagged",
      "Tenant",
      "Tenant suspended for overdue balance",
      { Reason: "Overdue invoice" },
      "integration",
      "105.112.45.9",
    ),
    op(
      "op-5",
      400,
      T.lagos,
      [
        "Chika Eze",
        "chika.eze@lagosexpress.ng",
      ],
      "user.invited",
      "User invited",
      "tenant",
      "info",
      "success",
      "User",
      "Dispatcher invited to the tenant",
      { Role: "Dispatcher" },
      "integration",
      "154.113.22.7",
    ),
    op(
      "op-6",
      600,
      T.cape,
      [
        "Bola Adeyemi",
        "bola.adeyemi@truckmoov.com",
      ],
      "api_key.rotated",
      "API key rotated",
      "api_key",
      "medium",
      "success",
      "API key",
      "Production API key rotated",
      { "Key name": "Production" },
      "security",
      "41.58.99.3",
    ),
    op(
      "op-7",
      800,
      T.abuja,
      sys,
      "device.assigned",
      "Device assigned",
      "device",
      "info",
      "success",
      "Device",
      "Tracker assigned to vehicle",
      { Model: "Teltonika FMB920" },
    ),
    op(
      "op-8",
      1600,
      T.jhb,
      [
        "Adaeze Okafor",
        "adaeze.okafor@mtn.ng",
      ],
      "kyc.rejected",
      "KYC rejected",
      "kyc",
      "medium",
      "failure",
      "KYC document",
      "Director ID rejected — image unreadable",
      { Document: "Director ID" },
      "integration",
      "102.89.34.18",
    ),
  ];
  return [
    ...security,
    ...sim,
    ...other,
  ];
}

export type UnifiedAuditFilters = {
  search?: string;
  view?: AuditView;
  tenant?: string;
  actor?: string;
  eventType?: string;
  category?: string;
  outcome?: string;
  severity?: string;
  source?: string;
  /** yyyy-mm-dd, inclusive */
  from?: string;
  /** yyyy-mm-dd, inclusive */
  to?: string;
};

export function filterUnifiedAudit(rows: UnifiedAuditEntry[], f: UnifiedAuditFilters) {
  const q = (f.search ?? "").trim().toLowerCase();
  const actor = (f.actor ?? "").trim().toLowerCase();
  const cats = VIEW_CATEGORIES[f.view ?? "all"];
  // Appending a time makes the yyyy-mm-dd parse as local midnight, not UTC.
  const from = f.from ? startOfDay(`${f.from}T00:00:00`) : null;
  const to = f.to ? endOfDay(`${f.to}T00:00:00`) : null;
  return rows.filter((r) => {
    if (cats && !cats.includes(r.category))
      return false;
    if (f.tenant && r.tenantId !== f.tenant)
      return false;
    if (actor && ![
      r.actorName,
      r.actorEmail,
    ].some(v => v?.toLowerCase().includes(actor))) {
      return false;
    }
    if (f.eventType && r.eventType !== f.eventType)
      return false;
    if (f.category && r.category !== f.category)
      return false;
    if (f.outcome && r.outcome !== f.outcome)
      return false;
    if (f.severity && r.severity !== f.severity)
      return false;
    if (f.source && r.source !== f.source)
      return false;
    if (from && isBefore(
      r.timestamp,
      from,
    )) {
      return false;
    }
    if (to && isAfter(
      r.timestamp,
      to,
    )) {
      return false;
    }
    if (q && ![
      r.actorName,
      r.actorEmail,
      r.action,
      r.resource,
      r.tenantName,
      r.ipAddress,
      r.location,
      r.description,
    ].some(v => v?.toLowerCase().includes(q))) {
      return false;
    }
    return true;
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
