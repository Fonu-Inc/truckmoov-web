import {
  ErpTmsEndpointConfig,
  IntegrationHealthSnapshot,
  IpAllowlistEntry,
  ProviderHealthStatus,
  RecentIntegrationFailure,
  WebhookSecurityConfig,
} from "./types";

export const defaultWebhookSecurityConfig: WebhookSecurityConfig = {
  signatureHeader: "X-Truckmoov-Signature",
  timestampHeader: "X-Truckmoov-Timestamp",
  algorithm: "HMAC_SHA256",
  enforceSignatureValidation: true,
  enforceIpAllowlist: true,
  rejectUnsignedPayloads: true,
};

export const defaultIpAllowlistEntries: IpAllowlistEntry[] = [
  {
    id: "allow-1",
    value: "34.120.10.0/24",
    description: "CPaaS Production Cluster",
    addedAt: "2026-03-28T10:18:00Z",
  },
  {
    id: "allow-2",
    value: "52.140.33.18",
    description: "Webhook Relay Node",
    addedAt: "2026-03-29T16:02:00Z",
  },
];

export const defaultErpTmsEndpoints: ErpTmsEndpointConfig[] = [
  {
    id: "erp-1",
    name: "Sage ERP - Job Sync",
    systemType: "ERP",
    baseUrl: "https://erp.example.com",
    inboundPath: "/truckmoov/inbound/jobs",
    outboundPath: "/truckmoov/outbound/jobs",
    inboundJobWebhook: true,
    outboundJobWebhook: true,
    eventMapJobCreated: "create_work_order",
    eventMapJobUpdated: "update_work_order",
    retryAttempts: 3,
    deadLetterQueue: true,
    createdAt: "2026-03-24T09:12:00Z",
  },
];

export const defaultIntegrationHealthSnapshot: IntegrationHealthSnapshot = {
  totalWebhooksToday: 1842,
  failedWebhooksToday: 42,
  failureRatePercent: 2.28,
  lastWebhookReceivedAt: "2026-03-30T19:42:00Z",
};

export const defaultProviderHealthStatuses: ProviderHealthStatus[] = [
  {
    id: "provider-1",
    providerName: "CPaaS WhatsApp Provider",
    status: "healthy",
    lastWebhookReceivedAt: "2026-03-30T19:42:00Z",
    failureRatePercent: 1.1,
    successRatePercent: 98.9,
    avgLatencyMs: 180,
  },
  {
    id: "provider-2",
    providerName: "GPS Ingestion Gateway",
    status: "degraded",
    lastWebhookReceivedAt: "2026-03-30T19:35:00Z",
    failureRatePercent: 4.6,
    successRatePercent: 95.4,
    avgLatencyMs: 420,
  },
  {
    id: "provider-3",
    providerName: "ERP/TMS Sync Bridge",
    status: "healthy",
    lastWebhookReceivedAt: "2026-03-30T19:31:00Z",
    failureRatePercent: 0.8,
    successRatePercent: 99.2,
    avgLatencyMs: 210,
  },
];

export const defaultRecentIntegrationFailures: RecentIntegrationFailure[] = [
  {
    id: "failure-1",
    providerName: "GPS Ingestion Gateway",
    endpoint: "/integrations/gps/push",
    errorCode: "HTTP_504",
    occurredAt: "2026-03-30T19:16:00Z",
    retryCount: 2,
  },
  {
    id: "failure-2",
    providerName: "CPaaS WhatsApp Provider",
    endpoint: "/integrations/webhooks/replies",
    errorCode: "SIGNATURE_MISMATCH",
    occurredAt: "2026-03-30T18:44:00Z",
    retryCount: 0,
  },
  {
    id: "failure-3",
    providerName: "ERP/TMS Sync Bridge",
    endpoint: "/integrations/erp/outbound/jobs",
    errorCode: "HTTP_429",
    occurredAt: "2026-03-30T17:58:00Z",
    retryCount: 3,
  },
];
