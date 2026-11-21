import type { SystemAuditLogEntry } from "@truckmoov/api/auth";
import {
  describe, expect, it,
} from "vitest";
import {
  auditEventHref, DEMO_SECURITY_AUDIT_EVENTS, SUSPICIOUS_LOGIN_EVENT_ID,
} from "@/features/audit/utils/auditEvents";
import {
  buildDemoAuditEntries, categoryOf, filterUnifiedAudit, fromSystemAuditEntry,
} from "@/features/audit/utils/unifiedAudit";

const rows = buildDemoAuditEntries();
describe(
  "unified audit log",
  () => {
    it(
      "demo set holds 30 entries: 17 security events, 6 SIM",
      () => {
        expect(rows).toHaveLength(30);
        expect(filterUnifiedAudit(
          rows,
          { view: "security" },
        )).toHaveLength(17);
        expect(filterUnifiedAudit(
          rows,
          { view: "sim" },
        )).toHaveLength(6);
      },
    );
    it(
      "security Events view shows only security and API-key entries",
      () => {
        const r = filterUnifiedAudit(
          rows,
          { view: "security" },
        );
        expect(r.every(e => e.category === "security" || e.category === "api_key")).toBe(true);
      },
    );
    it(
      "sIM Audit view shows only SIM entries",
      () => {
        const r = filterUnifiedAudit(
          rows,
          { view: "sim" },
        );
        expect(r.every(e => e.category === "sim")).toBe(true);
      },
    );
    it(
      "one log holds logins, lockouts, SIM, KYC, invoices, webhooks and tenant changes",
      () => {
        const cats = new Set<string>(rows.map(e => e.category));
        for (const c of [
          "security",
          "sim",
          "kyc",
          "billing",
          "webhook",
          "api_key",
          "tenant",
        ]) expect(cats.has(c)).toBe(true);
      },
    );
    it(
      "filters by actor and source together",
      () => {
        const r = filterUnifiedAudit(
          rows,
          {
            actor: "adaeze", source: "integration",
          },
        );
        expect(r.length).toBe(2);
      },
    );
    it(
      "excludes entries outside the date range",
      () => {
        expect(filterUnifiedAudit(
          rows,
          {
            from: "2000-01-01", to: "2000-01-02",
          },
        )).toHaveLength(0);
      },
    );
    it(
      "classifies live event types",
      () => {
        expect(categoryOf(
          "sim.activated",
          "sim",
        )).toBe("sim");
        expect(categoryOf(
          "user.login",
          "user",
        )).toBe("security");
        expect(categoryOf(
          "invoice.voided",
          "invoice",
        )).toBe("billing");
      },
    );
    it(
      "maps a system audit-log row",
      () => {
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
        const e = fromSystemAuditEntry(live);
        expect(e).toMatchObject({
          actorName: "System", category: "kyc", outcome: "failure", severity: "info", tenantName: "Platform", source: "system", action: "Kyc rejected",
        });
        expect(e.details.Reason).toBe("Blurry ID");
      },
    );
    it(
      "suspicious-login notifications link to an existing unusual-location event",
      () => {
        expect(DEMO_SECURITY_AUDIT_EVENTS.find(e => e.id === SUSPICIOUS_LOGIN_EVENT_ID)?.eventType).toBe("unusual_location");
        expect(auditEventHref(SUSPICIOUS_LOGIN_EVENT_ID)).toBe("/audit-compliance?view=security&event=sae-001");
      },
    );
  },
);
