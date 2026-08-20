import { axiosInstance } from '../lib/axios-instance'

import type {
  ApiKeyListResponse,
  ApiKeyResponse,
  ConsoleAuditLogQuery,
  ConsoleAuditLogResponse,
  ConsoleUsageAnalyticsQuery,
  ConsoleUsageAnalyticsResponse,
  ConsoleWebhookListResponse,
  ConsoleWebhookResponse,
  CreateApiKeyPayload,
  CreateApiKeyResponse,
  IntrospectResponse,
  PauseConsoleWebhookPayload,
  RegisterConsoleWebhookPayload,
  RegisterConsoleWebhookResponse,
  RevokeApiKeyPayload,
} from './types'

// ─── API keys ─────────────────────────────────────────────────────────────────

export async function getApiKeys() {
  const { data } = await axiosInstance.get<ApiKeyListResponse>('/console/keys')
  return data
}

export async function createApiKey({ data: body }: CreateApiKeyPayload) {
  const { data } = await axiosInstance.post<CreateApiKeyResponse>('/console/keys', body)
  return data
}

export async function revokeApiKey({ id }: RevokeApiKeyPayload) {
  const { data } = await axiosInstance.delete<ApiKeyResponse>(`/console/keys/${id}`)
  return data
}

// ─── Introspection ────────────────────────────────────────────────────────────

export async function introspectApiKey() {
  const { data } = await axiosInstance.get<IntrospectResponse>('/console/introspect')
  return data
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function getConsoleAuditLog(payload?: ConsoleAuditLogQuery) {
  const { data } = await axiosInstance.get<ConsoleAuditLogResponse>('/console/audit-log', {
    params: payload?.params,
  })
  return data
}

// ─── Usage analytics ──────────────────────────────────────────────────────────

export async function getConsoleUsageAnalytics(payload?: ConsoleUsageAnalyticsQuery) {
  const { data } = await axiosInstance.get<ConsoleUsageAnalyticsResponse>('/console/analytics/usage', {
    params: payload?.params,
  })
  return data
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export async function getConsoleWebhooks() {
  const { data } = await axiosInstance.get<ConsoleWebhookListResponse>('/console/webhooks')
  return data
}

export async function registerConsoleWebhook({ data: body }: RegisterConsoleWebhookPayload) {
  const { data } = await axiosInstance.post<RegisterConsoleWebhookResponse>('/console/webhooks', body)
  return data
}

export async function pauseConsoleWebhook({ id }: PauseConsoleWebhookPayload) {
  const { data } = await axiosInstance.delete<ConsoleWebhookResponse>(`/console/webhooks/${id}`)
  return data
}
