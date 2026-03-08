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

      return Array.from(aggregated.values()).sort((a, b) => b.total_requests - a.total_requests);
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

      return Array.from(aggregated.values()).sort((a, b) => a.success_rate - b.success_rate);
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

      return statuses;
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

      return data?.map(log => ({
        ...log,
        tenant_name: tenantMap.get(log.tenant_id) || "Unknown",
      }));
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
