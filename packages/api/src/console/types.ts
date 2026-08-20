import type { ServerResponse } from '../lib/types'

// ─── API keys ─────────────────────────────────────────────────────────────────

export type ApiKeyStatus = 'active' | 'revoked'

export type ApiKey = {
  id: string
  tenantId: string
  name: string
  keyPrefix: string
  scopes: string[]
  status: ApiKeyStatus
  createdBy: string
  createdAt: string
  revokedAt: string | null
  lastUsedAt: string | null
  expiresAt: string | null
}

/** `rawKey` is returned only once, on creation. */
export type CreatedApiKey = ApiKey & {
  rawKey?: string
}

export type ApiKeyListResponse = ServerResponse<ApiKey[]>
export type ApiKeyResponse = ServerResponse<ApiKey>
export type CreateApiKeyResponse = ServerResponse<CreatedApiKey>

export type CreateApiKeyPayload = {
  data: {
    name: string
    scopes: string[]
    expiresAt?: string | null
  }
}

export type RevokeApiKeyPayload = {
  id: string
}

// ─── Introspection ────────────────────────────────────────────────────────────

// ponytail: server declares the generic StandardApiResponse envelope here, so
// `data` is untyped. Narrow it once the spec describes the scope payload.
export type IntrospectResponse = ServerResponse<Record<string, unknown>>

// ─── Audit log ────────────────────────────────────────────────────────────────

export type ConsoleActorType = 'user' | 'api_key'

export type ConsoleAuditLogEntry = {
  id: string
  tenantId: string
  actorType: ConsoleActorType
  actorId: string
  action: string
  resourceType: string
  resourceId: string | null
  metadata: Record<string, unknown>
  occurredAt: string
}

export type ConsoleAuditLogResponse = ServerResponse<ConsoleAuditLogEntry[]>

export type ConsoleAuditLogQuery = {
  params?: {
    actorType?: ConsoleActorType
    action?: string
    resourceType?: string
  }
}

// ─── Usage analytics ──────────────────────────────────────────────────────────

export type ConsoleUsageAnalyticsBucket = {
  apiKeyId: string
  tenantId: string
  hourBucket: string
  requestCount: number
  errorCount: number
  avgLatencyMs: number
}

export type ConsoleUsageAnalyticsResponse = ServerResponse<ConsoleUsageAnalyticsBucket[]>

export type ConsoleUsageAnalyticsQuery = {
  params?: {
    apiKeyId?: string
  }
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export type ConsoleWebhookStatus = 'active' | 'paused'

export type ConsoleWebhook = {
  id: string
  tenantId: string
  url: string
  eventTypes: string[]
  status: ConsoleWebhookStatus
  createdBy: string
  createdAt: string
}

/** `signingSecret` is returned only once, on registration. */
export type RegisteredConsoleWebhook = ConsoleWebhook & {
  signingSecret?: string
}

export type ConsoleWebhookListResponse = ServerResponse<ConsoleWebhook[]>
export type ConsoleWebhookResponse = ServerResponse<ConsoleWebhook>
export type RegisterConsoleWebhookResponse = ServerResponse<RegisteredConsoleWebhook>

export type RegisterConsoleWebhookPayload = {
  data: {
    url: string
    eventTypes: string[]
  }
}

export type PauseConsoleWebhookPayload = {
  id: string
}
