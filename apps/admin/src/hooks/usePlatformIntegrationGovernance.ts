interface AggregateApiUsage {
  tenant_id: string;
  tenant_name: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  last_request_at: string | null;
}

interface WebhookHealthSummary {
  tenant_id: string;
  tenant_name: string;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  active_subscriptions: number;
  dead_letter_count: number;
}

interface TenantIntegrationStatus {
  tenant_id: string;
  tenant_name: string;
  api_enabled: boolean;
  webhooks_enabled: boolean;
  active_api_keys: number;
  active_webhooks: number;
  last_activity: string | null;
}

export function usePlatformIntegrationGovernance() {
  return {
    apiUsage: [] as AggregateApiUsage[] | undefined,
    loadingApiUsage: false,
    webhookHealth: [] as WebhookHealthSummary[] | undefined,
    loadingWebhookHealth: false,
    tenantStatuses: [] as TenantIntegrationStatus[] | undefined,
    loadingTenantStatuses: false,
    auditLogs: [] as any[] | undefined,
    loadingAuditLogs: false,
    disableTenantIntegrations: {
      mutate: (_tenantId: string) => {},
      mutateAsync: async (_tenantId: string) => {},
      isPending: false,
    },
    enableTenantIntegrations: {
      mutate: (_tenantId: string) => {},
      mutateAsync: async (_tenantId: string) => {},
      isPending: false,
    },
  };
}
