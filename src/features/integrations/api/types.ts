export type SignatureAlgorithm = "HMAC_SHA256" | "HMAC_SHA512";

export type IntegrationStatus = "healthy" | "degraded" | "down";

export type EndpointSystemType = "ERP" | "TMS" | "BOTH";

export interface WebhookSecurityConfig {
  signatureHeader: string;
  timestampHeader: string;
  algorithm: SignatureAlgorithm;
  enforceSignatureValidation: boolean;
  enforceIpAllowlist: boolean;
  rejectUnsignedPayloads: boolean;
}

export interface IpAllowlistEntry {
  id: string;
  value: string;
  description: string;
  addedAt: string;
}

export interface ErpTmsEndpointConfig {
  id: string;
  name: string;
  systemType: EndpointSystemType;
  baseUrl: string;
  inboundPath: string;
  outboundPath: string;
  inboundJobWebhook: boolean;
  outboundJobWebhook: boolean;
  eventMapJobCreated: string;
  eventMapJobUpdated: string;
  retryAttempts: number;
  deadLetterQueue: boolean;
  createdAt: string;
}

export interface IntegrationHealthSnapshot {
  totalWebhooksToday: number;
  failedWebhooksToday: number;
  failureRatePercent: number;
  lastWebhookReceivedAt: string;
}

export interface ProviderHealthStatus {
  id: string;
  providerName: string;
  status: IntegrationStatus;
  lastWebhookReceivedAt: string;
  failureRatePercent: number;
  successRatePercent: number;
  avgLatencyMs: number;
}

export interface RecentIntegrationFailure {
  id: string;
  providerName: string;
  endpoint: string;
  errorCode: string;
  occurredAt: string;
  retryCount: number;
}
