// Demo data fallbacks for the Developer Portal & ERP/WMS panels.
// Used when the real backend tables are empty so the UI is always populated.
import { subDays, subHours, subMinutes, format } from "date-fns";
import type { ApiKey } from "@/hooks/useApiKeys";
import type { WebhookSubscription, WebhookDeliveryLog } from "@/hooks/useWebhookSubscriptions";
import type {
  DailyApiUsage,
  EndpointUsage,
  ApiKeyUsage,
  ApiUsageSummary,
} from "@/hooks/useApiUsageAnalytics";
import type { IntegrationAuditLog } from "@/hooks/useIntegrationAudit";
import type { ERPConnector } from "@/hooks/useERPIntegration";

const now = () => new Date();

export const demoApiKeys: ApiKey[] = [
  {
    id: "demo-key-1",
    name: "ERP Production Integration",
    key_prefix: "tm_live_8fA2x",
    scopes: ["jobs.read", "jobs.write", "vehicles.read", "drivers.read"],
    status: "active",
    rate_limit_per_minute: 60,
    rate_limit_per_day: 50000,
    expires_at: subDays(now(), -180).toISOString(),
    last_used_at: subMinutes(now(), 12).toISOString(),
    created_at: subDays(now(), 92).toISOString(),
    created_by: null,
  },
  {
    id: "demo-key-2",
    name: "Mobile App Backend",
    key_prefix: "tm_live_3kQ9p",
    scopes: ["vehicles.read", "drivers.read", "alerts.read", "fuel.read"],
    status: "active",
    rate_limit_per_minute: 120,
    rate_limit_per_day: 100000,
    expires_at: null,
    last_used_at: subMinutes(now(), 4).toISOString(),
    created_at: subDays(now(), 45).toISOString(),
    created_by: null,
  },
  {
    id: "demo-key-3",
    name: "Webhook Manager",
    key_prefix: "tm_live_zWb1c",
    scopes: ["webhooks.manage", "alerts.read"],
    status: "active",
    rate_limit_per_minute: 30,
    rate_limit_per_day: 20000,
    expires_at: subDays(now(), -30).toISOString(),
    last_used_at: subHours(now(), 6).toISOString(),
    created_at: subDays(now(), 14).toISOString(),
    created_by: null,
  },
  {
    id: "demo-key-4",
    name: "Analytics Read-only",
    key_prefix: "tm_live_yT4Lm",
    scopes: ["jobs.read", "vehicles.read", "drivers.read", "maintenance.read"],
    status: "active",
    rate_limit_per_minute: 60,
    rate_limit_per_day: 30000,
    expires_at: null,
    last_used_at: subHours(now(), 2).toISOString(),
    created_at: subDays(now(), 220).toISOString(),
    created_by: null,
  },
  {
    id: "demo-key-5",
    name: "Legacy CRM (Deprecated)",
    key_prefix: "tm_live_dPq7r",
    scopes: ["jobs.read"],
    status: "revoked",
    rate_limit_per_minute: 60,
    rate_limit_per_day: 10000,
    expires_at: null,
    last_used_at: subDays(now(), 60).toISOString(),
    created_at: subDays(now(), 320).toISOString(),
    created_by: null,
  },
];

export const demoWebhookSubscriptions: WebhookSubscription[] = [
  {
    id: "demo-wh-1",
    tenant_id: "demo",
    name: "ERP Order Sync",
    url: "https://erp.lagosexpress.com/webhooks/fleetpro",
    signing_secret: "whsec_demoErpOrderSyncKey1234567890ab",
    event_types: ["job.created", "job.completed", "job.cancelled"],
    is_enabled: true,
    headers: { "X-Source": "fleetpro" },
    retry_count: 5,
    timeout_seconds: 30,
    created_at: subDays(now(), 60).toISOString(),
    updated_at: subDays(now(), 3).toISOString(),
  },
  {
    id: "demo-wh-2",
    tenant_id: "demo",
    name: "Customer Notification Service",
    url: "https://notify.lagosexpress.com/inbound/fleet",
    signing_secret: "whsec_demoCustomerNotifyKeyabcdef1234",
    event_types: ["geofence.enter", "geofence.exit", "sla.breached"],
    is_enabled: true,
    headers: {},
    retry_count: 3,
    timeout_seconds: 20,
    created_at: subDays(now(), 30).toISOString(),
    updated_at: subDays(now(), 1).toISOString(),
  },
  {
    id: "demo-wh-3",
    tenant_id: "demo",
    name: "Fuel Anomaly Slack Bot",
    url: "https://hooks.slack.com/services/T0/B0/demoFuelAlertChannel",
    signing_secret: "whsec_demoFuelAnomalySlackKey56789012",
    event_types: ["fuel.anomaly.detected", "alert.created"],
    is_enabled: true,
    headers: {},
    retry_count: 3,
    timeout_seconds: 15,
    created_at: subDays(now(), 14).toISOString(),
    updated_at: subDays(now(), 14).toISOString(),
  },
  {
    id: "demo-wh-4",
    tenant_id: "demo",
    name: "Maintenance Workshop Sync",
    url: "https://workshop.partner.com/api/v1/maintenance-events",
    signing_secret: "whsec_demoMaintenanceWorkshop4321xyz0",
    event_types: ["maintenance.due", "device.status.changed"],
    is_enabled: false,
    headers: {},
    retry_count: 3,
    timeout_seconds: 30,
    created_at: subDays(now(), 7).toISOString(),
    updated_at: subDays(now(), 7).toISOString(),
  },
];

const wh1 = demoWebhookSubscriptions[0].id;
const wh2 = demoWebhookSubscriptions[1].id;
const wh3 = demoWebhookSubscriptions[2].id;

export const demoDeliveryLogs: WebhookDeliveryLog[] = Array.from({ length: 24 }).map((_, i) => {
  const subId = [wh1, wh2, wh3][i % 3];
  const sub = demoWebhookSubscriptions.find((s) => s.id === subId)!;
  const failed = i % 7 === 0;
  const retrying = i % 11 === 0 && !failed;
  const status: WebhookDeliveryLog["status"] = failed ? "failed" : retrying ? "retrying" : "success";
  const created = subHours(now(), i * 3 + Math.floor(i / 4));
  return {
    id: `demo-log-${i}`,
    webhook_event_id: `evt_${i}`,
    subscription_id: subId,
    status,
    attempt_number: failed ? 3 : retrying ? 2 : 1,
    request_url: sub.url,
    request_body: { event: sub.event_types[i % sub.event_types.length], demo: true },
    response_status_code: failed ? 502 : retrying ? 429 : 200,
    response_body: failed ? '{"error":"upstream timeout"}' : '{"ok":true}',
    error_message: failed ? "Upstream gateway timeout after 30s" : null,
    duration_ms: failed ? 30000 : 120 + (i * 17) % 380,
    created_at: created.toISOString(),
    completed_at: created.toISOString(),
  };
});

// ---------- API usage analytics ----------
export function buildDemoDailyUsage(daysRange: number): DailyApiUsage[] {
  const out: DailyApiUsage[] = [];
  for (let i = daysRange - 1; i >= 0; i--) {
    const date = format(subDays(now(), i), "yyyy-MM-dd");
    const base = 1800 + Math.round(Math.sin(i * 0.45) * 600 + Math.cos(i * 0.18) * 250);
    const requests = Math.max(400, base + (i % 7 === 0 ? -700 : 0));
    const errors = Math.max(2, Math.round(requests * (0.012 + Math.abs(Math.sin(i * 0.7)) * 0.018)));
    out.push({
      date,
      requests,
      successCount: requests - errors,
      errorCount: errors,
      avgLatencyMs: 145 + Math.round(Math.sin(i * 0.5) * 35 + Math.cos(i * 0.2) * 18),
    });
  }
  return out;
}

export const demoEndpointUsage: EndpointUsage[] = [
  { endpoint: "/v1/jobs", method: "GET", requests: 18420, successRate: 99, avgLatencyMs: 142 },
  { endpoint: "/v1/vehicles", method: "GET", requests: 12380, successRate: 100, avgLatencyMs: 98 },
  { endpoint: "/v1/drivers", method: "GET", requests: 9210, successRate: 100, avgLatencyMs: 110 },
  { endpoint: "/v1/jobs", method: "POST", requests: 4520, successRate: 97, avgLatencyMs: 245 },
  { endpoint: "/v1/devices/telemetry", method: "GET", requests: 3870, successRate: 99, avgLatencyMs: 168 },
  { endpoint: "/v1/geofences", method: "GET", requests: 2940, successRate: 100, avgLatencyMs: 87 },
  { endpoint: "/v1/alerts", method: "GET", requests: 2110, successRate: 98, avgLatencyMs: 125 },
  { endpoint: "/v1/fuel/transactions", method: "GET", requests: 1840, successRate: 99, avgLatencyMs: 132 },
  { endpoint: "/v1/jobs/{id}", method: "PATCH", requests: 1320, successRate: 95, avgLatencyMs: 198 },
  { endpoint: "/v1/maintenance", method: "GET", requests: 980, successRate: 100, avgLatencyMs: 154 },
];

export const demoApiKeyUsage: ApiKeyUsage[] = [
  { keyId: demoApiKeys[0].id, keyName: demoApiKeys[0].name, keyPrefix: demoApiKeys[0].key_prefix, requests: 28450, successRate: 99, lastUsed: demoApiKeys[0].last_used_at },
  { keyId: demoApiKeys[1].id, keyName: demoApiKeys[1].name, keyPrefix: demoApiKeys[1].key_prefix, requests: 19820, successRate: 100, lastUsed: demoApiKeys[1].last_used_at },
  { keyId: demoApiKeys[3].id, keyName: demoApiKeys[3].name, keyPrefix: demoApiKeys[3].key_prefix, requests: 8120, successRate: 100, lastUsed: demoApiKeys[3].last_used_at },
  { keyId: demoApiKeys[2].id, keyName: demoApiKeys[2].name, keyPrefix: demoApiKeys[2].key_prefix, requests: 1540, successRate: 97, lastUsed: demoApiKeys[2].last_used_at },
];

export function buildDemoSummary(daily: DailyApiUsage[]): ApiUsageSummary {
  const totalRequests = daily.reduce((s, d) => s + d.requests, 0);
  const totalSuccess = daily.reduce((s, d) => s + d.successCount, 0);
  const totalLatency = daily.reduce((s, d) => s + d.avgLatencyMs * d.requests, 0);
  const today = daily[daily.length - 1];
  return {
    totalRequests,
    successRate: totalRequests > 0 ? Math.round((totalSuccess / totalRequests) * 100) : 100,
    avgLatencyMs: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
    requestsToday: today?.requests ?? 0,
    errorRateToday: today ? Math.round((today.errorCount / Math.max(1, today.requests)) * 100) : 0,
    peakHour: today?.date ?? null,
    peakHourRequests: Math.max(...daily.map((d) => d.requests), 0),
  };
}

// ---------- Audit log ----------
const AUDIT_ACTORS = ["Adaeze Okafor", "Ifeanyi Bello", "Chinyere Adeyemi", "Tunde Balogun", "System"];
const AUDIT_ACTIONS: Array<{ a: string; r: "api_key" | "webhook_subscription" | "erp_connector" }> = [
  { a: "api_key.created", r: "api_key" },
  { a: "api_key.revoked", r: "api_key" },
  { a: "api_key.scope_updated", r: "api_key" },
  { a: "webhook.created", r: "webhook_subscription" },
  { a: "webhook.disabled", r: "webhook_subscription" },
  { a: "webhook.secret_rotated", r: "webhook_subscription" },
  { a: "webhook.event_types_updated", r: "webhook_subscription" },
  { a: "erp_connector.connected", r: "erp_connector" },
  { a: "erp_connector.sync_executed", r: "erp_connector" },
  { a: "erp_connector.mapping_updated", r: "erp_connector" },
];

export const demoAuditLogs: IntegrationAuditLog[] = Array.from({ length: 18 }).map((_, i) => {
  const action = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
  return {
    id: `demo-audit-${i}`,
    tenant_id: "demo",
    actor_id: null,
    actor_name: AUDIT_ACTORS[i % AUDIT_ACTORS.length],
    action: action.a,
    resource_type: action.r,
    resource_id: `demo-${action.r}-${i}`,
    changes: null,
    ip_address: `10.0.${(i % 12) + 1}.${(i * 7) % 200}`,
    user_agent: "Mozilla/5.0 FleetPro Console",
    created_at: subHours(now(), i * 5 + 1).toISOString(),
  };
});

// ---------- ERP / WMS connectors ----------
export const demoERPConnectors: ERPConnector[] = [
  {
    id: "demo-erp-1",
    tenant_id: "demo",
    name: "SAP S/4HANA — Production",
    provider: "sap",
    auth_method: "oauth2",
    api_base_url: "https://sap-prod.lagosexpress.com/odata/v2",
    api_version: "v2",
    status: "connected",
    company_name: "Lagos Express Logistics Ltd",
    environment: "production",
    last_connected_at: subMinutes(now(), 18).toISOString(),
    last_sync_at: subMinutes(now(), 22).toISOString(),
    sync_error: null,
    created_at: subDays(now(), 110).toISOString(),
    updated_at: subMinutes(now(), 22).toISOString(),
  },
  {
    id: "demo-erp-2",
    tenant_id: "demo",
    name: "Oracle NetSuite — Finance",
    provider: "oracle",
    auth_method: "oauth2",
    api_base_url: "https://1234567.suitetalk.api.netsuite.com",
    api_version: "2024.1",
    status: "connected",
    company_name: "Lagos Express Holdings",
    environment: "production",
    last_connected_at: subHours(now(), 1).toISOString(),
    last_sync_at: subHours(now(), 1).toISOString(),
    sync_error: null,
    created_at: subDays(now(), 75).toISOString(),
    updated_at: subHours(now(), 1).toISOString(),
  },
  {
    id: "demo-erp-3",
    tenant_id: "demo",
    name: "Odoo Warehouse — Apapa DC",
    provider: "odoo",
    auth_method: "api_key",
    api_base_url: "https://wms-apapa.lagosexpress.com",
    api_version: "17.0",
    status: "error",
    company_name: "Apapa Distribution Center",
    environment: "production",
    last_connected_at: subHours(now(), 14).toISOString(),
    last_sync_at: subHours(now(), 14).toISOString(),
    sync_error: "Auth token expired — please reconnect",
    created_at: subDays(now(), 45).toISOString(),
    updated_at: subHours(now(), 14).toISOString(),
  },
  {
    id: "demo-erp-4",
    tenant_id: "demo",
    name: "Microsoft Dynamics 365 — Sandbox",
    provider: "dynamics",
    auth_method: "oauth2",
    api_base_url: "https://lagosexpress-sandbox.crm.dynamics.com",
    api_version: "9.2",
    status: "disconnected",
    company_name: "Lagos Express Holdings",
    environment: "sandbox",
    last_connected_at: subDays(now(), 4).toISOString(),
    last_sync_at: null,
    sync_error: null,
    created_at: subDays(now(), 21).toISOString(),
    updated_at: subDays(now(), 4).toISOString(),
  },
];



