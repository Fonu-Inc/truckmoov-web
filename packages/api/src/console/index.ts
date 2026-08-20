import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { queryClient } from '../lib/query-client'
import {
  createApiKey,
  getApiKeys,
  getConsoleAuditLog,
  getConsoleUsageAnalytics,
  getConsoleWebhooks,
  introspectApiKey,
  pauseConsoleWebhook,
  registerConsoleWebhook,
  revokeApiKey,
} from './requests'

export type * from './types'

import type { ConsoleAuditLogQuery, ConsoleUsageAnalyticsQuery } from './types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const CONSOLE_QUERY_KEY = {
  apiKeys: ['console', 'keys'],
  introspect: ['console', 'introspect'],
  auditLog: (payload?: ConsoleAuditLogQuery) => ['console', 'auditLog', payload],
  usageAnalytics: (payload?: ConsoleUsageAnalyticsQuery) => ['console', 'usageAnalytics', payload],
  webhooks: ['console', 'webhooks'],
} as const

// ─── queryOptions factories ───────────────────────────────────────────────────

export function getApiKeysQueryOptions() {
  return queryOptions({
    queryKey: CONSOLE_QUERY_KEY.apiKeys,
    queryFn: getApiKeys,
  })
}

export function getIntrospectQueryOptions() {
  return queryOptions({
    queryKey: CONSOLE_QUERY_KEY.introspect,
    queryFn: introspectApiKey,
  })
}

export function getConsoleAuditLogQueryOptions(payload?: ConsoleAuditLogQuery) {
  return queryOptions({
    queryKey: CONSOLE_QUERY_KEY.auditLog(payload),
    queryFn: () => getConsoleAuditLog(payload),
  })
}

export function getConsoleUsageAnalyticsQueryOptions(payload?: ConsoleUsageAnalyticsQuery) {
  return queryOptions({
    queryKey: CONSOLE_QUERY_KEY.usageAnalytics(payload),
    queryFn: () => getConsoleUsageAnalytics(payload),
  })
}

export function getConsoleWebhooksQueryOptions() {
  return queryOptions({
    queryKey: CONSOLE_QUERY_KEY.webhooks,
    queryFn: getConsoleWebhooks,
  })
}

// ─── useQuery hooks ────────────────────────────────────────────────────────────

export function useApiKeys() {
  return useQuery(getApiKeysQueryOptions())
}

export function useIntrospect() {
  return useQuery(getIntrospectQueryOptions())
}

export function useConsoleAuditLog(payload?: ConsoleAuditLogQuery) {
  return useQuery(getConsoleAuditLogQueryOptions(payload))
}

export function useConsoleUsageAnalytics(payload?: ConsoleUsageAnalyticsQuery) {
  return useQuery(getConsoleUsageAnalyticsQueryOptions(payload))
}

export function useConsoleWebhooks() {
  return useQuery(getConsoleWebhooksQueryOptions())
}

// ─── useMutation hooks ────────────────────────────────────────────────────────

export function useCreateApiKey() {
  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSOLE_QUERY_KEY.apiKeys })
    },
  })
}

export function useRevokeApiKey() {
  return useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSOLE_QUERY_KEY.apiKeys })
    },
  })
}

export function useRegisterConsoleWebhook() {
  return useMutation({
    mutationFn: registerConsoleWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSOLE_QUERY_KEY.webhooks })
    },
  })
}

export function usePauseConsoleWebhook() {
  return useMutation({
    mutationFn: pauseConsoleWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSOLE_QUERY_KEY.webhooks })
    },
  })
}
