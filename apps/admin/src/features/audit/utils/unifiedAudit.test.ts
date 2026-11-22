import type { SystemAuditLogEntry } from "@truckmoov/api/auth";
import {
  describe, expect, it,
} from "vitest";
import { auditEventHref } from "@/features/dashboard/utils/notifications";
import {
  categoryOf, filterUnifiedAudit, fromSystemAuditEntry, type UnifiedAuditEntry,
} from "@/features/audit/utils/unifiedAudit";

function entry(overrides: Partial<UnifiedAuditEntry>): UnifiedAuditEntry {
  return {
    id: "a1",
    timestamp: "2026-11-20T10:00:00.000Z",
    actorName: "Adaeze Okafor",
    actorEmail: "adaeze@mtn.ng",
    eventType: "user.login",
    action: "User login",
    category: "security",
    outcome: "success",
    severity: "info",
    resource: "User",
    tenantId: "t1",
    tenantName: "Lagos Express Logistics",
    source: "system",
    description: "Signed in",
    details: {},
    ...overrides,
  };
}

const rows: UnifiedAuditEntry[] = [
  entry({ id: "a1" }),
  entry({
    id: "a2",
    category: "sim",
    eventType: "sim.activated",
    action: "SIM activated",
    source: "integration",
  }),
  entry({
    id: "a3",
    category: "kyc",
    eventType: "kyc.verified",
    action: "KYC verified",
    source: "integration",
  }),
  entry({
    id: "a4",
    actorName: "Tunde Bakare",
    actorEmail: "tunde@fleetpro.ng",
    category: "billing",
    eventType: "invoice.approved",
    action: "Invoice approved",
    source: "integration",
  }),
  entry({
    id: "a5",
    actorName: "System Auto",
    actorEmail: "system@truckmoov.com",
    category: "webhook",
    eventType: "webhook.failed",
    action: "Webhook failed",
    outcome: "failure",
  }),
  entry({
    id: "a6",
    actorName: "Platform Admin",
    actorEmail: "platform@truckmoov.com",
    category: "api_key",
    eventType: "api_key.rotated",
    action: "API key rotated",
    source: "security",
  }),
  entry({
    id: "a7",
    actorName: "Chika Eze",
    actorEmail: "chika@lagosexpress.ng",
    category: "tenant",
    eventType: "user.invited",
    action: "User invited",
    source: "integration",
  }),
];

describe("unified audit log", () => {
  it("security Events view shows only security and API-key entries", () => {
    const filtered = filterUnifiedAudit(rows, { view: "security" });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(r => r.category === "security" || r.category === "api_key")).toBe(true);
  });

  it("SIM Audit view shows only SIM entries", () => {
    const filtered = filterUnifiedAudit(rows, { view: "sim" });
    expect(filtered).toHaveLength(1);
    expect(filtered.every(r => r.category === "sim")).toBe(true);
  });

  it("classifies every live category", () => {
    const categories = new Set(rows.map(r => r.category));
    for (const category of [
      "security",
      "sim",
      "kyc",
      "billing",
      "webhook",
      "api_key",
      "tenant",
    ]) {
      expect(categories.has(category as UnifiedAuditEntry["category"])).toBe(true);
    }
  });

  it("filters by actor and source together", () => {
    const filtered = filterUnifiedAudit(rows, {
      actor: "adaeze",
      source: "integration",
    });
    expect(filtered).toHaveLength(2);
  });

  it("excludes entries outside the date range", () => {
    expect(filterUnifiedAudit(rows, {
      from: "2000-01-01",
      to: "2000-01-02",
    })).toHaveLength(0);
  });

  it("classifies live event types", () => {
    expect(categoryOf("sim.activated", "sim")).toBe("sim");
    expect(categoryOf("user.login", "user")).toBe("security");
    expect(categoryOf("superadmin.logged_in", "user")).toBe("security");
    expect(categoryOf("user.logged_out", "user")).toBe("security");
    expect(categoryOf("invoice.voided", "invoice")).toBe("billing");
  });

  it("maps a refused security action to a failure with high severity", () => {
    const mapped = fromSystemAuditEntry({
      id: "a2",
      occurredAt: "2026-11-20T10:00:00Z",
      actorId: null,
      actorName: "Platform Admin",
      actorEmail: "platform@truckmoov.com",
      actorRole: null,
      action: "login.failed",
      resourceType: "user",
      resourceId: null,
      tenantId: null,
      tenantName: null,
      ipAddress: "102.89.34.12",
      source: "auth",
      summary: null,
    });
    expect(mapped).toMatchObject({
      category: "security",
      outcome: "failure",
      severity: "high",
      source: "security",
    });
  });

  it("treats an automated batch as system and a person's action as integration", () => {
    const base: SystemAuditLogEntry = {
      id: "a3",
      occurredAt: "2026-11-20T10:00:00Z",
      actorId: null,
      actorName: "System Auto",
      actorEmail: "system@truckmoov.com",
      actorRole: null,
      action: "sim.activated",
      resourceType: "sim_batch",
      resourceId: null,
      tenantId: "t1",
      tenantName: "Lagos Express Logistics",
      ipAddress: null,
      source: "auth",
      summary: null,
    };
    expect(fromSystemAuditEntry(base).source).toBe("system");
    expect(fromSystemAuditEntry({
      ...base,
      actorName: "Platform Admin",
      actorEmail: "platform@truckmoov.com",
      action: "sim.request.approved",
      resourceType: "sim_request",
    }).source).toBe("integration");
  });

  it("maps a system audit-log row", () => {
    const live: SystemAuditLogEntry = {
      id: "a1",
      occurredAt: "2026-11-20T10:00:00Z",
      actorId: "u1",
      actorName: null,
      actorEmail: null,
      actorRole: "SUPER_ADMIN",
      action: "kyc.rejected",
      resourceType: "tenant",
      resourceId: "t1",
      tenantId: null,
      tenantName: null,
      ipAddress: null,
      source: "admin",
      summary: null,
      reason: "Blurry ID",
    };
    const mapped = fromSystemAuditEntry(live);
    expect(mapped).toMatchObject({
      actorName: "System",
      category: "kyc",
      outcome: "failure",
      severity: "medium",
      tenantName: "Platform",
      source: "system",
      action: "Kyc rejected",
    });
    expect(mapped.details.Reason).toBe("Blurry ID");
  });

  it("deep-links an audit entry", () => {
    expect(auditEventHref("entry-1")).toBe(
      "/audit-compliance?view=security&event=entry-1",
    );
  });
});
