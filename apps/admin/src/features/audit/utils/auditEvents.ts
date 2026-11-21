import { subMinutes } from "@truckmoov/app-core/utils/time-utils";

export type AuditEventType
  = | "login_success" | "login_failed" | "logout" | "session_refresh" | "account_locked"
    | "account_unlocked" | "unusual_location" | "permission_change" | "password_change"
    | "mfa_enabled" | "mfa_disabled" | "api_key_created" | "api_key_revoked" | "data_export";

export type AuditOutcome = "success" | "failure" | "flagged";
export type AuditSeverity = "info" | "low" | "medium" | "high" | "critical";

export type SecurityAuditEvent = {
  id: string;
  timestamp: string;
  tenant: string;
  tenantId: string;
  userName?: string;
  email: string;
  eventType: AuditEventType;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  description: string;
  ipAddress?: string;
  location?: string;
  device?: string;
  browser?: string;
  failureReason?: string;
  attempts?: number;
  metadata?: Record<string, string>;
};

export const EVENT_TYPE_LABELS: Record<AuditEventType, string> = {
  login_success: "Successful login",
  login_failed: "Failed login",
  logout: "Logout",
  session_refresh: "Session refresh",
  account_locked: "Account lockout",
  account_unlocked: "Account unlocked",
  unusual_location: "Unusual-location alert",
  permission_change: "Permission change",
  password_change: "Password change",
  mfa_enabled: "Two-factor enabled",
  mfa_disabled: "Two-factor disabled",
  api_key_created: "API key created",
  api_key_revoked: "API key revoked",
  data_export: "Data export",
};

export const AUDIT_PATH = "/audit-compliance";

/**
 * Deep link to one entry in the Security Events view; the page opens its detail
 * dialog. Ready for the notifications bell (admin's bell has nothing to link yet).
 */
export function auditEventHref(id: string) {
  return `${AUDIT_PATH}?view=security&event=${encodeURIComponent(id)}`;
}

/** Notifications for suspicious logins link to this audit event. */
export const SUSPICIOUS_LOGIN_EVENT_ID = "sae-001";

/** ISO timestamp `mins` minutes before now — keeps the demo log looking recent. */
export function minutesAgo(mins: number) {
  return subMinutes(
    new Date(),
    mins,
  )?.toISOString() ?? "";
}

// ponytail: mock data from fleetflow parity port — wire to packages/api
export const DEMO_SECURITY_AUDIT_EVENTS: SecurityAuditEvent[] = [
  {
    id: SUSPICIOUS_LOGIN_EVENT_ID, timestamp: minutesAgo(22), tenant: "ABC Logistics", tenantId: "tenant-1", userName: "John Admin", email: "admin@abclogistics.com", eventType: "unusual_location", outcome: "flagged", severity: "critical", description: "Login from an unusual location (Moscow, Russia) after 5 failed attempts", ipAddress: "91.234.56.78", location: "Moscow, Russia", device: "Desktop", browser: "Chrome 120", attempts: 5, metadata: {
      "Previous location": "Lagos, Nigeria", "New location": "Moscow, Russia",
    },
  },
  {
    id: "sae-002", timestamp: minutesAgo(25), tenant: "ABC Logistics", tenantId: "tenant-1", userName: "John Admin", email: "admin@abclogistics.com", eventType: "login_failed", outcome: "failure", severity: "high", description: "Repeated failed sign-in attempts", ipAddress: "185.234.67.89", location: "Unknown (VPN)", device: "Desktop", browser: "Chrome 120", failureReason: "Invalid password", attempts: 5,
  },
  {
    id: "sae-003", timestamp: minutesAgo(38), tenant: "XYZ Transport", tenantId: "tenant-2", userName: "Sarah Ops", email: "ops@xyztransport.com", eventType: "mfa_enabled", outcome: "success", severity: "low", description: "Two-factor authentication enabled for account", ipAddress: "105.112.78.90", location: "Abuja, Nigeria", device: "Mobile", browser: "Safari iOS",
  },
  {
    id: "sae-004", timestamp: minutesAgo(42), tenant: "ABC Logistics", tenantId: "tenant-1", userName: "John Admin", email: "admin@abclogistics.com", eventType: "login_success", outcome: "success", severity: "info", description: "Signed in", ipAddress: "102.89.45.123", location: "Lagos, Nigeria", device: "Desktop", browser: "Chrome 120",
  },
  {
    id: "sae-005", timestamp: minutesAgo(46), tenant: "XYZ Transport", tenantId: "tenant-2", userName: "Sarah Ops", email: "ops@xyztransport.com", eventType: "login_success", outcome: "success", severity: "info", description: "Signed in", ipAddress: "105.112.78.90", location: "Abuja, Nigeria", device: "Mobile", browser: "Safari iOS",
  },
  {
    id: "sae-006", timestamp: minutesAgo(58), tenant: "XYZ Transport", tenantId: "tenant-2", userName: "Tom Locked", email: "locked@xyztransport.com", eventType: "account_locked", outcome: "flagged", severity: "high", description: "Account locked after 5 failed login attempts", ipAddress: "102.89.45.123", location: "Lagos, Nigeria", device: "Desktop", browser: "Edge 120", failureReason: "Too many failed attempts", attempts: 5,
  },
  {
    id: "sae-007", timestamp: minutesAgo(64), tenant: "Quick Movers", tenantId: "tenant-3", userName: "Mike Driver", email: "driver@quickmovers.com", eventType: "logout", outcome: "success", severity: "info", description: "Signed out after a 4h 23m session", ipAddress: "197.210.45.67", location: "Port Harcourt, Nigeria", device: "Mobile", browser: "Chrome Android", metadata: { "Session length": "4h 23m" },
  },
  {
    id: "sae-008", timestamp: minutesAgo(70), tenant: "Quick Movers", tenantId: "tenant-3", userName: "Mike Driver", email: "driver@quickmovers.com", eventType: "login_failed", outcome: "failure", severity: "medium", description: "Two-factor code rejected", ipAddress: "197.210.45.67", location: "Port Harcourt, Nigeria", device: "Mobile", browser: "Chrome Android", failureReason: "Two-factor code failed", attempts: 2,
  },
  {
    id: "sae-009", timestamp: minutesAgo(74), tenant: "Metro Couriers", tenantId: "tenant-4", userName: "James Fleet", email: "fleet@metrocouriers.com", eventType: "login_failed", outcome: "failure", severity: "medium", description: "Sign-in failed", ipAddress: "41.58.123.45", location: "Kano, Nigeria", device: "Desktop", browser: "Firefox 121", failureReason: "Invalid password", attempts: 1,
  },
  {
    id: "sae-010", timestamp: minutesAgo(80), tenant: "Quick Movers", tenantId: "tenant-3", userName: "Alex Dev", email: "dev@quickmovers.com", eventType: "api_key_created", outcome: "success", severity: "medium", description: "New API key created with full read/write permissions", ipAddress: "197.210.45.67", location: "Port Harcourt, Nigeria", device: "Desktop", browser: "Chrome 120", metadata: {
      "Key name": "Production API Key", "Permissions": "read, write",
    },
  },
  {
    id: "sae-011", timestamp: minutesAgo(95), tenant: "Metro Couriers", tenantId: "tenant-4", userName: "James Fleet", email: "fleet@metrocouriers.com", eventType: "permission_change", outcome: "success", severity: "medium", description: "User role elevated from viewer to admin", ipAddress: "41.58.123.45", location: "Kano, Nigeria", device: "Desktop", browser: "Firefox 121", metadata: {
      "Previous role": "viewer", "New role": "admin", "Changed by": "super@metrocouriers.com",
    },
  },
  {
    id: "sae-012", timestamp: minutesAgo(110), tenant: "Swift Delivery", tenantId: "tenant-5", userName: "Linda Super", email: "super@swiftdelivery.com", eventType: "session_refresh", outcome: "success", severity: "info", description: "Session refreshed", ipAddress: "102.67.89.234", location: "Ibadan, Nigeria", device: "Desktop", browser: "Edge 120",
  },
  {
    id: "sae-013", timestamp: minutesAgo(125), tenant: "Swift Delivery", tenantId: "tenant-5", userName: "Linda Super", email: "super@swiftdelivery.com", eventType: "data_export", outcome: "success", severity: "medium", description: "Large data export performed (15,000 records)", ipAddress: "102.67.89.234", location: "Ibadan, Nigeria", device: "Desktop", browser: "Edge 120", metadata: {
      "Records": "15000", "Data type": "customer data",
    },
  },
  {
    id: "sae-014", timestamp: minutesAgo(150), tenant: "Unknown", tenantId: "none", email: "nonexistent@company.com", eventType: "login_failed", outcome: "failure", severity: "high", description: "Sign-in attempted for an unknown account", ipAddress: "91.234.56.78", location: "Moscow, Russia", device: "Desktop", browser: "Unknown", failureReason: "User not found", attempts: 12,
  },
  {
    id: "sae-015", timestamp: minutesAgo(60 * 26), tenant: "ABC Logistics", tenantId: "tenant-1", userName: "John Admin", email: "admin@abclogistics.com", eventType: "password_change", outcome: "success", severity: "low", description: "Password changed", ipAddress: "102.89.45.123", location: "Lagos, Nigeria", device: "Desktop", browser: "Chrome 120",
  },
  {
    id: "sae-016", timestamp: minutesAgo(60 * 30), tenant: "XYZ Transport", tenantId: "tenant-2", userName: "Tom Locked", email: "locked@xyztransport.com", eventType: "account_unlocked", outcome: "success", severity: "low", description: "Account unlocked by platform admin", ipAddress: "102.89.34.12", location: "Lagos, Nigeria", device: "Desktop", browser: "Chrome 120",
  },
];
