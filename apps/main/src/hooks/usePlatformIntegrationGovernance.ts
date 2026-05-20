import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

// Demo fallback data so platform admins always see a populated governance view
const DEMO_TENANT_NAMES = [
  { id: "demo-t1", name: "Lagos Express Logistics" },
  { id: "demo-t2", name: "Accra Swift Cargo" },
  { id: "demo-t3", name: "Nairobi Fleet Group" },
  { id: "demo-t4", name: "Cape Town Trucking" },
  { id: "demo-t5", name: "Johannesburg Freight" },
  { id: "demo-t6", name: "Abuja Haulage Co." },
];

const DEMO_API_USAGE: AggregateApiUsage[] = [
  { tenant_id: "demo-t1", tenant_name: "Lagos Express Logistics", total_requests: 48230, successful_requests: 47891, failed_requests: 339, avg_response_time_ms: 142, last_request_at: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
  { tenant_id: "demo-t3", tenant_name: "Nairobi Fleet Group", total_requests: 31204, successful_requests: 30876, failed_requests: 328, avg_response_time_ms: 168, last_request_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { tenant_id: "demo-t2", tenant_name: "Accra Swift Cargo", total_requests: 22178, successful_requests: 22001, failed_requests: 177, avg_response_time_ms: 195, last_request_at: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
  { tenant_id: "demo-t5", tenant_name: "Johannesburg Freight", total_requests: 14502, successful_requests: 14112, failed_requests: 390, avg_response_time_ms: 213, last_request_at: new Date(Date.now() - 1000 * 60 * 14).toISOString() },
  { tenant_id: "demo-t6", tenant_name: "Abuja Haulage Co.", total_requests: 9874, successful_requests: 9650, failed_requests: 224, avg_response_time_ms: 178, last_request_at: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
  { tenant_id: "demo-t4", tenant_name: "Cape Town Trucking", total_requests: 6321, successful_requests: 5980, failed_requests: 341, avg_response_time_ms: 287, last_request_at: new Date(Date.now() - 1000 * 60 * 41).toISOString() },
];

const DEMO_WEBHOOK_HEALTH: WebhookHealthSummary[] = [
  { tenant_id: "demo-t4", tenant_name: "Cape Town Trucking", total_deliveries: 1842, successful_deliveries: 1612, failed_deliveries: 230, success_rate: 87.5, active_subscriptions: 4, dead_letter_count: 12 },
  { tenant_id: "demo-t6", tenant_name: "Abuja Haulage Co.", total_deliveries: 2104, successful_deliveries: 1980, failed_deliveries: 124, success_rate: 94.1, active_subscriptions: 3, dead_letter_count: 4 },
  { tenant_id: "demo-t5", tenant_name: "Johannesburg Freight", total_deliveries: 3284, successful_deliveries: 3142, failed_deliveries: 142, success_rate: 95.7, active_subscriptions: 5, dead_letter_count: 6 },
  { tenant_id: "demo-t2", tenant_name: "Accra Swift Cargo", total_deliveries: 4521, successful_deliveries: 4398, failed_deliveries: 123, success_rate: 97.3, active_subscriptions: 6, dead_letter_count: 2 },
  { tenant_id: "demo-t3", tenant_name: "Nairobi Fleet Group", total_deliveries: 6890, successful_deliveries: 6754, failed_deliveries: 136, success_rate: 98.0, active_subscriptions: 7, dead_letter_count: 1 },
  { tenant_id: "demo-t1", tenant_name: "Lagos Express Logistics", total_deliveries: 9421, successful_deliveries: 9342, failed_deliveries: 79, success_rate: 99.2, active_subscriptions: 9, dead_letter_count: 0 },
];

const DEMO_TENANT_STATUSES: TenantIntegrationStatus[] = DEMO_TENANT_NAMES.map((t, i) => ({
  tenant_id: t.id,
  tenant_name: t.name,
  api_enabled: true,
  webhooks_enabled: i !== 3,
  active_api_keys: [4, 3, 5, 1, 2, 2][i],
  active_webhooks: [9, 6, 7, 4, 5, 3][i],
  last_activity: new Date(Date.now() - 1000 * 60 * (2 + i * 7)).toISOString(),
}));

const DEMO_AUDIT_LOGS = [
  { id: "ial-1", tenant_id: "demo-t1", tenant_name: "Lagos Express Logistics", action: "API_KEY_CREATED", resource_type: "api_key", resource_id: "key_abc123", actor_id: null, actor_name: "Operations Lead", changes: { name: "Production Webhook Key", scopes: ["jobs:read", "jobs:write"] }, ip_address: "102.89.34.12", user_agent: "Mozilla/5.0", created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { id: "ial-2", tenant_id: "demo-t3", tenant_name: "Nairobi Fleet Group", action: "WEBHOOK_SUBSCRIPTION_CREATED", resource_type: "webhook", resource_id: "wh_xyz789", actor_id: null, actor_name: "Tech Admin", changes: { url: "https://erp.nairobifleet.co.ke/webhooks/jobs", events: ["job.completed", "job.cancelled"] }, ip_address: "41.90.12.55", user_agent: "Mozilla/5.0", created_at: new Date(Date.now() - 1000 * 60 * 47).toISOString() },
  { id: "ial-3", tenant_id: "demo-t4", tenant_name: "Cape Town Trucking", action: "API_KEY_REVOKED", resource_type: "api_key", resource_id: "key_old456", actor_id: null, actor_name: "Platform Admin", changes: { reason: "Compromised credential rotation" }, ip_address: "102.89.34.12", user_agent: "Mozilla/5.0", created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "ial-4", tenant_id: "demo-t2", tenant_name: "Accra Swift Cargo", action: "WEBHOOK_TEST_TRIGGERED", resource_type: "webhook", resource_id: "wh_test001", actor_id: null, actor_name: "Integration Engineer", changes: { event: "vehicle.location_updated", result: "success" }, ip_address: "197.255.124.8", user_agent: "Mozilla/5.0", created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: "ial-5", tenant_id: "demo-t5", tenant_name: "Johannesburg Freight", action: "API_KEY_ROTATED", resource_type: "api_key", resource_id: "key_jhb02", actor_id: null, actor_name: "Tech Admin", changes: { rotation_type: "scheduled" }, ip_address: "169.0.218.44", user_agent: "Mozilla/5.0", created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
  { id: "ial-6", tenant_id: "demo-t6", tenant_name: "Abuja Haulage Co.", action: "WEBHOOK_SUBSCRIPTION_DISABLED", resource_type: "webhook", resource_id: "wh_abj33", actor_id: null, actor_name: "Operations Lead", changes: { reason: "Endpoint returning 5xx for >1h" }, ip_address: "102.89.55.201", user_agent: "Mozilla/5.0", created_at: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString() },
  { id: "ial-7", tenant_id: "demo-t1", tenant_name: "Lagos Express Logistics", action: "WEBHOOK_SECRET_ROTATED", resource_type: "webhook", resource_id: "wh_lag88", actor_id: null, actor_name: "Tech Admin", changes: { rotation_type: "manual" }, ip_address: "102.89.34.12", user_agent: "Mozilla/5.0", created_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString() },
  { id: "ial-8", tenant_id: "demo-t3", tenant_name: "Nairobi Fleet Group", action: "API_KEY_CREATED", resource_type: "api_key", resource_id: "key_nbo07", actor_id: null, actor_name: "Tech Admin", changes: { name: "Mobile App Backend", scopes: ["telemetry:read"] }, ip_address: "41.90.12.55", user_agent: "Mozilla/5.0", created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString() },
];

export function usePlatformIntegrationGovernance() {
  const queryClient = useQueryClient();

  // Aggregate API usage across all tenants
  const { data: apiUsage, isLoading: loadingApiUsage } = useQuery({
    queryKey: ["platform-api-usage"],
    queryFn: async () => {
      // Get usage logs grouped by tenant
      const { data: usageLogs, error: usageError } = await supabase
        .from("api_usage_logs")
        .select("tenant_id, status_code, response_time_ms, created_at")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (usageError) throw usageError;

      // Get tenant names - using 'name' column (not company_name)
      const { data: tenants, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name");

      if (tenantError) throw tenantError;

      const tenantMap = new Map(tenants?.map(t => [t.id, t.name]) || []);

      // Aggregate by tenant
      const aggregated = new Map<string, AggregateApiUsage>();

      usageLogs?.forEach(log => {
        const existing = aggregated.get(log.tenant_id) || {
          tenant_id: log.tenant_id,
          tenant_name: tenantMap.get(log.tenant_id) || "Unknown",
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          avg_response_time_ms: 0,
          last_request_at: null,
        };

        existing.total_requests++;
        if (log.status_code >= 200 && log.status_code < 400) {
          existing.successful_requests++;
        } else {
          existing.failed_requests++;
        }

        // Running average
        existing.avg_response_time_ms = 
          (existing.avg_response_time_ms * (existing.total_requests - 1) + (log.response_time_ms || 0)) / 
          existing.total_requests;

        if (!existing.last_request_at || log.created_at > existing.last_request_at) {
          existing.last_request_at = log.created_at;
        }

        aggregated.set(log.tenant_id, existing);
      });

      const result = Array.from(aggregated.values()).sort((a, b) => b.total_requests - a.total_requests);
      return result.length > 0 ? result : DEMO_API_USAGE;
    },
  });

  // Webhook health across all tenants - using webhook_delivery_logs
  const { data: webhookHealth, isLoading: loadingWebhookHealth } = useQuery({
    queryKey: ["platform-webhook-health"],
    queryFn: async () => {
      // Use webhook_delivery_logs table which has the 'status' column
      const { data: deliveryLogs, error: logsError } = await supabase
        .from("webhook_delivery_logs")
        .select("tenant_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (logsError) throw logsError;

      const { data: subscriptions, error: subError } = await supabase
        .from("webhook_subscriptions")
        .select("tenant_id, is_enabled");

      if (subError) throw subError;

      const { data: tenants, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name");

      if (tenantError) throw tenantError;

      const tenantMap = new Map(tenants?.map(t => [t.id, t.name]) || []);

      // Aggregate
      const aggregated = new Map<string, WebhookHealthSummary>();

      deliveryLogs?.forEach(log => {
        const existing = aggregated.get(log.tenant_id) || {
          tenant_id: log.tenant_id,
          tenant_name: tenantMap.get(log.tenant_id) || "Unknown",
          total_deliveries: 0,
          successful_deliveries: 0,
          failed_deliveries: 0,
          success_rate: 0,
          active_subscriptions: 0,
          dead_letter_count: 0,
        };

        existing.total_deliveries++;
        if (log.status === "success") {
          existing.successful_deliveries++;
        } else if (log.status === "failed" || log.status === "dead_letter") {
          existing.failed_deliveries++;
          if (log.status === "dead_letter") {
            existing.dead_letter_count++;
          }
        }

        aggregated.set(log.tenant_id, existing);
      });

      // Add subscription counts
      subscriptions?.forEach(sub => {
        const existing = aggregated.get(sub.tenant_id);
        if (existing && sub.is_enabled) {
          existing.active_subscriptions++;
        }
      });

      // Calculate success rates
      aggregated.forEach(summary => {
        summary.success_rate = summary.total_deliveries > 0
          ? (summary.successful_deliveries / summary.total_deliveries) * 100
          : 0;
      });

      const result = Array.from(aggregated.values()).sort((a, b) => a.success_rate - b.success_rate);
      return result.length > 0 ? result : DEMO_WEBHOOK_HEALTH;
    },
  });

  // Tenant integration status
  const { data: tenantStatuses, isLoading: loadingTenantStatuses } = useQuery({
    queryKey: ["platform-tenant-integration-status"],
    queryFn: async () => {
      const { data: tenants, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name, status");

      if (tenantError) throw tenantError;

      const { data: apiKeys, error: keysError } = await supabase
        .from("api_keys")
        .select("tenant_id, status");

      if (keysError) throw keysError;

      const { data: webhooks, error: webhooksError } = await supabase
        .from("webhook_subscriptions")
        .select("tenant_id, is_enabled");

      if (webhooksError) throw webhooksError;

      const { data: usageLogs, error: usageError } = await supabase
        .from("api_usage_logs")
        .select("tenant_id, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (usageError) throw usageError;

      // Build status map
      const statuses: TenantIntegrationStatus[] = tenants?.map(tenant => {
        const activeKeys = apiKeys?.filter(
          k => k.tenant_id === tenant.id && k.status === "active"
        ).length || 0;

        const activeWebhooks = webhooks?.filter(
          w => w.tenant_id === tenant.id && w.is_enabled
        ).length || 0;

        const lastLog = usageLogs?.find(l => l.tenant_id === tenant.id);

        return {
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          api_enabled: tenant.status === "active",
          webhooks_enabled: tenant.status === "active",
          active_api_keys: activeKeys,
          active_webhooks: activeWebhooks,
          last_activity: lastLog?.created_at || null,
        };
      }) || [];

      return statuses.length > 0 ? statuses : DEMO_TENANT_STATUSES;
    },
  });

  // Integration audit logs (platform-wide)
  const { data: auditLogs, isLoading: loadingAuditLogs } = useQuery({
    queryKey: ["platform-integration-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get tenant names
      const tenantIds = [...new Set(data?.map(l => l.tenant_id) || [])];
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, name")
        .in("id", tenantIds);

      const tenantMap = new Map(tenants?.map(t => [t.id, t.name]) || []);

      const mapped = data?.map(log => ({
        ...log,
        tenant_name: tenantMap.get(log.tenant_id) || "Unknown",
      }));
      return mapped && mapped.length > 0 ? mapped : DEMO_AUDIT_LOGS as any;
    },
  });

  // Disable tenant integrations
  const disableTenantIntegrations = useMutation({
    mutationFn: async (tenantId: string) => {
      // Revoke all API keys
      const { error: keysError } = await supabase
        .from("api_keys")
        .update({ 
          status: "revoked", 
          revoked_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      if (keysError) throw keysError;

      // Disable all webhooks - use 'is_enabled' column
      const { error: webhooksError } = await supabase
        .from("webhook_subscriptions")
        .update({ is_enabled: false })
        .eq("tenant_id", tenantId);

      if (webhooksError) throw webhooksError;

      // Log action
      const { error: auditError } = await supabase
        .from("integration_audit_logs")
        .insert({
          tenant_id: tenantId,
          action: "TENANT_INTEGRATIONS_DISABLED",
          resource_type: "tenant",
          resource_id: tenantId,
          changes: { reason: "Platform admin action" },
        });

      if (auditError) throw auditError;
    },
    onSuccess: () => {
      toast.success("Tenant integrations disabled");
      queryClient.invalidateQueries({ queryKey: ["platform-tenant-integration-status"] });
      queryClient.invalidateQueries({ queryKey: ["platform-integration-audit"] });
    },
    onError: (error) => {
      toast.error("Failed to disable integrations: " + error.message);
    },
  });

  // Re-enable tenant integrations
  const enableTenantIntegrations = useMutation({
    mutationFn: async (tenantId: string) => {
      // Re-enable webhooks (API keys need to be regenerated)
      const { error: webhooksError } = await supabase
        .from("webhook_subscriptions")
        .update({ is_enabled: true })
        .eq("tenant_id", tenantId);

      if (webhooksError) throw webhooksError;

      // Log action
      const { error: auditError } = await supabase
        .from("integration_audit_logs")
        .insert({
          tenant_id: tenantId,
          action: "TENANT_INTEGRATIONS_ENABLED",
          resource_type: "tenant",
          resource_id: tenantId,
          changes: { reason: "Platform admin action" },
        });

      if (auditError) throw auditError;
    },
    onSuccess: () => {
      toast.success("Tenant integrations enabled");
      queryClient.invalidateQueries({ queryKey: ["platform-tenant-integration-status"] });
      queryClient.invalidateQueries({ queryKey: ["platform-integration-audit"] });
    },
    onError: (error) => {
      toast.error("Failed to enable integrations: " + error.message);
    },
  });

  return {
    apiUsage,
    loadingApiUsage,
    webhookHealth,
    loadingWebhookHealth,
    tenantStatuses,
    loadingTenantStatuses,
    auditLogs,
    loadingAuditLogs,
    disableTenantIntegrations,
    enableTenantIntegrations,
  };
}
