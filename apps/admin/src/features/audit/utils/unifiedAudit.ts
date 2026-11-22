import type { SystemAuditLogEntry } from "@truckmoov/api/auth";
import type {
  AuditOutcome, AuditSeverity,
} from "@/features/audit/utils/auditEvents";
import {
  endOfDay, isAfter, isBefore, startOfDay,
} from "@truckmoov/app-core/utils/time-utils";

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
