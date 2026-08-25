import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Key,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Webhook,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ExportButton } from "@/components/shadcn/export-button";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shadcn/data-table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";

export function IntegrationsGovernance() {
  const integrations: any[] = [];
  void integrations;
  const apiUsage: any[] = [];
  const loadingApiUsage = false;
  const webhookHealth: any[] = [];
  const loadingWebhookHealth = false;
  const tenantStatuses: any[] = [];
  const loadingTenantStatuses = false;
  const auditLogs: any[] = [];
  const loadingAuditLogs = false;
  const disableTenantIntegrations = {
    mutate: async (_id: string) => {},
    isPending: false,
  };
  const enableTenantIntegrations = {
    mutate: async (_id: string) => {},
    isPending: false,
  };

  const [
    confirmDisable,
    setConfirmDisable,
  ] = useState<string | null>(null);
  const [
    confirmEnable,
    setConfirmEnable,
  ] = useState<string | null>(null);
  const [
    apiSearch,
    setApiSearch,
  ] = useState("");
  const [
    apiStatusFilter,
    setApiStatusFilter,
  ] = useState("all");
  const [
    webhookSearch,
    setWebhookSearch,
  ] = useState("");
  const [
    webhookStatusFilter,
    setWebhookStatusFilter,
  ] = useState("all");
  const [
    tenantSearch,
    setTenantSearch,
  ] = useState("");
  const [
    tenantStatusFilter,
    setTenantStatusFilter,
  ] = useState("all");
  const [
    auditSearch,
    setAuditSearch,
  ] = useState("");

  const filteredApiUsage = (apiUsage ?? []).filter((t) => {
    const matchesSearch = !apiSearch || t.tenant_name.toLowerCase().includes(apiSearch.toLowerCase());
    const matchesStatus
      = apiStatusFilter === "all"
        || (apiStatusFilter === "successful" && t.failed_requests === 0)
        || (apiStatusFilter === "failed" && t.failed_requests > 0);
    return matchesSearch && matchesStatus;
  });

  const filteredWebhookHealth = (webhookHealth ?? []).filter((t) => {
    const matchesSearch = !webhookSearch || t.tenant_name.toLowerCase().includes(webhookSearch.toLowerCase());
    const status = t.success_rate >= 95 ? "healthy" : t.success_rate >= 80 ? "degraded" : "critical";
    const matchesStatus = webhookStatusFilter === "all" || status === webhookStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTenantStatuses = (tenantStatuses ?? []).filter((t) => {
    const matchesSearch = !tenantSearch || t.tenant_name.toLowerCase().includes(tenantSearch.toLowerCase());
    const matchesStatus
      = tenantStatusFilter === "all"
        || (tenantStatusFilter === "enabled" && t.api_enabled)
        || (tenantStatusFilter === "disabled" && !t.api_enabled);
    return matchesSearch && matchesStatus;
  });

  const filteredAuditLogs = (auditLogs ?? []).filter((log: any) => {
    if (!auditSearch)
      return true;
    const q = auditSearch.toLowerCase();
    return (
      (log.action || "").toLowerCase().includes(q)
      || (log.entity_type || "").toLowerCase().includes(q)
      || (log.actor_name || "").toLowerCase().includes(q)
      || (log.tenant_name || "").toLowerCase().includes(q)
    );
  });

  // Calculate summary stats
  const totalRequests = apiUsage?.reduce(
    (sum, t) => sum + t.total_requests,
    0,
  ) || 0;
  const totalFailedRequests = apiUsage?.reduce(
    (sum, t) => sum + t.failed_requests,
    0,
  ) || 0;
  const overallSuccessRate = totalRequests > 0
    ? ((totalRequests - totalFailedRequests) / totalRequests * 100).toFixed(1)
    : "0";

  const totalWebhookDeliveries = webhookHealth?.reduce(
    (sum, t) => sum + t.total_deliveries,
    0,
  ) || 0;
  const totalDeadLetters = webhookHealth?.reduce(
    (sum, t) => sum + t.dead_letter_count,
    0,
  ) || 0;
  const webhookSuccessRate = totalWebhookDeliveries > 0
    ? (webhookHealth?.reduce(
        (sum, t) => sum + t.successful_deliveries,
        0,
      ) || 0) / totalWebhookDeliveries * 100
    : 0;

  const handleDisable = (tenantId: string) => {
    disableTenantIntegrations.mutate(tenantId);
    setConfirmDisable(null);
  };

  const handleEnable = (tenantId: string) => {
    enableTenantIntegrations.mutate(tenantId);
    setConfirmEnable(null);
  };

  const apiUsageColumns: ColumnDef<any>[] = [
    {
      accessorKey: "tenant_name",
      header: "Tenant",
      cell: ({ row }) => <span className="font-medium">{row.original.tenant_name}</span>,
    },
    {
      accessorKey: "total_requests",
      header: () => <div className="text-right">Total Requests</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => row.original.total_requests.toLocaleString(),
    },
    {
      accessorKey: "successful_requests",
      header: () => <div className="text-right">Successful</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => <span className="text-success">{row.original.successful_requests.toLocaleString()}</span>,
    },
    {
      accessorKey: "failed_requests",
      header: () => <div className="text-right">Failed</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <span className={row.original.failed_requests > 0 ? "text-destructive" : ""}>
          {row.original.failed_requests.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "avg_response_time_ms",
      header: () => <div className="text-right">Avg Response</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <>
          {row.original.avg_response_time_ms.toFixed(0)}
          ms
        </>
      ),
    },
    {
      accessorKey: "last_request_at",
      header: "Last Request",
      cell: ({ row }) => (
        row.original.last_request_at
          ? <span className="text-muted-foreground text-sm">{formatRelative(row.original.last_request_at)}</span>
          : "-"
      ),
    },
  ];

  const webhookHealthColumns: ColumnDef<any>[] = [
    {
      accessorKey: "tenant_name",
      header: "Tenant",
      cell: ({ row }) => <span className="font-medium">{row.original.tenant_name}</span>,
    },
    {
      accessorKey: "active_subscriptions",
      header: () => <div className="text-right">Active Webhooks</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => row.original.active_subscriptions,
    },
    {
      accessorKey: "total_deliveries",
      header: () => <div className="text-right">Total Deliveries</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => row.original.total_deliveries.toLocaleString(),
    },
    {
      accessorKey: "success_rate",
      header: () => <div className="text-right">Success Rate</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {row.original.success_rate >= 95
            ? <TrendingUp className="h-4 w-4 text-success" />
            : row.original.success_rate < 80
              ? <TrendingDown className="h-4 w-4 text-destructive" />
              : null}
          <span className={
            row.original.success_rate >= 95
              ? "text-success"
              : row.original.success_rate < 80
                ? "text-destructive"
                : ""
          }
          >
            {row.original.success_rate.toFixed(1)}
            %
          </span>
        </div>
      ),
    },
    {
      accessorKey: "dead_letter_count",
      header: () => <div className="text-right">Dead Letters</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        row.original.dead_letter_count > 0
          ? <Badge variant="destructive">{row.original.dead_letter_count}</Badge>
          : <span className="text-muted-foreground">0</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        row.original.success_rate >= 95
          ? (
              <Badge variant="outline" className="text-success border-success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            )
          : row.original.success_rate >= 80
            ? (
                <Badge variant="outline" className="text-warning border-warning">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Degraded
                </Badge>
              )
            : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Critical
                </Badge>
              )
      ),
    },
  ];

  const tenantControlColumns: ColumnDef<any>[] = [
    {
      accessorKey: "tenant_name",
      header: "Tenant",
      cell: ({ row }) => <span className="font-medium">{row.original.tenant_name}</span>,
    },
    {
      accessorKey: "active_api_keys",
      header: () => <div className="text-center">API Keys</div>,
      meta: { className: "text-center" },
      cell: ({ row }) => (
        <Badge variant={row.original.active_api_keys > 0 ? "default" : "secondary"}>
          {row.original.active_api_keys}
        </Badge>
      ),
    },
    {
      accessorKey: "active_webhooks",
      header: () => <div className="text-center">Webhooks</div>,
      meta: { className: "text-center" },
      cell: ({ row }) => (
        <Badge variant={row.original.active_webhooks > 0 ? "default" : "secondary"}>
          {row.original.active_webhooks}
        </Badge>
      ),
    },
    {
      accessorKey: "last_activity",
      header: "Last Activity",
      cell: ({ row }) => (
        row.original.last_activity
          ? <span className="text-muted-foreground text-sm">{formatRelative(row.original.last_activity)}</span>
          : <span className="text-muted-foreground text-sm">Never</span>
      ),
    },
    {
      accessorKey: "api_enabled",
      header: "Status",
      cell: ({ row }) => (
        row.original.api_enabled
          ? (
              <Badge variant="outline" className="text-success border-success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            )
          : (
              <Badge variant="destructive">
                <Ban className="h-3 w-3 mr-1" />
                Disabled
              </Badge>
            )
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => {
        const tenant = row.original;
        const hasActiveIntegrations = tenant.active_api_keys > 0 || tenant.active_webhooks > 0;
        return hasActiveIntegrations
          ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDisable(tenant.tenant_id)}
                disabled={disableTenantIntegrations.isPending}
              >
                <Ban className="h-4 w-4 mr-1" />
                Disable
              </Button>
            )
          : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmEnable(tenant.tenant_id)}
                disabled={enableTenantIntegrations.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Enable
              </Button>
            );
      },
    },
  ];

  const auditColumns: ColumnDef<any>[] = [
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{formatRelative(row.original.created_at)}</span>
      ),
    },
    {
      accessorKey: "tenant_name",
      header: "Tenant",
      cell: ({ row }) => <span className="font-medium">{row.original.tenant_name}</span>,
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Badge variant={
          row.original.action.includes("CREATED")
            ? "default"
            : row.original.action.includes("REVOKED") || row.original.action.includes("DISABLED")
              ? "destructive"
              : "secondary"
        }
        >
          {row.original.action.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.resource_type}
          :
          {row.original.resource_id?.slice(0, 8)}
          ...
        </span>
      ),
    },
    {
      id: "actor",
      header: "Actor",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.actor_id?.slice(0, 8) || "System"}
          ...
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Total API Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overallSuccessRate}
              % success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary" />
              Webhook Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWebhookDeliveries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {webhookSuccessRate.toFixed(1)}
              % delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Dead Letter Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalDeadLetters}</div>
            <p className="text-xs text-muted-foreground">
              Failed after max retries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Active Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantStatuses?.filter(t => t.active_api_keys > 0 || t.active_webhooks > 0).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tenants with active keys/webhooks
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="api-usage"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="api-usage">API Usage</TabsTrigger>
          <TabsTrigger value="webhook-health">Webhook Health</TabsTrigger>
          <TabsTrigger value="tenant-controls">Tenant Controls</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
        </TabsList>

        {/* API Usage Tab */}
        <TabsContent value="api-usage">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Aggregate API Usage by Tenant</CardTitle>
                  <CardDescription>
                    Platform-wide view of API consumption (no payload data visible)
                  </CardDescription>
                </div>
                <ExportButton
                  filename="api-usage"
                  rows={filteredApiUsage}
                  columns={[
                    {
                      header: "Tenant",
                      accessor: (t: any) => t.tenant_name,
                    },
                    {
                      header: "Total Requests",
                      accessor: (t: any) => t.total_requests,
                    },
                    {
                      header: "Successful",
                      accessor: (t: any) => t.successful_requests,
                    },
                    {
                      header: "Failed",
                      accessor: (t: any) => t.failed_requests,
                    },
                    {
                      header: "Avg Response (ms)",
                      accessor: (t: any) => t.avg_response_time_ms,
                    },
                    {
                      header: "Last Request",
                      accessor: (t: any) => t.last_request_at || "",
                    },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <TableToolbar
                search={apiSearch}
                onSearchChange={setApiSearch}
                searchPlaceholder="Search tenants..."
                status={apiStatusFilter}
                onStatusChange={setApiStatusFilter}
                statusOptions={[
                  {
                    value: "successful",
                    label: "Successful",
                  },
                  {
                    value: "failed",
                    label: "Failed",
                  },
                ]}
                filterContent={(
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Only show tenants by...</p>
                    <p className="text-muted-foreground text-xs">Last Request, Total Requests, Tenant</p>
                  </div>
                )}
              />
              <DataTable
                columns={apiUsageColumns}
                data={filteredApiUsage}
                isLoading={loadingApiUsage}
                hasActiveFilters={!!apiSearch || apiStatusFilter !== "all"}
                emptyState="No API usage data available"
                filteredEmptyState="No API usage data matches your filters."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook Health Tab */}
        <TabsContent value="webhook-health">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Webhook Delivery Health</CardTitle>
                  <CardDescription>
                    Aggregate delivery success rates and dead letter counts
                  </CardDescription>
                </div>
                <ExportButton
                  filename="webhook-health"
                  rows={filteredWebhookHealth}
                  columns={[
                    {
                      header: "Tenant",
                      accessor: (t: any) => t.tenant_name,
                    },
                    {
                      header: "Active Webhooks",
                      accessor: (t: any) => t.active_subscriptions,
                    },
                    {
                      header: "Total Deliveries",
                      accessor: (t: any) => t.total_deliveries,
                    },
                    {
                      header: "Success Rate %",
                      accessor: (t: any) => t.success_rate,
                    },
                    {
                      header: "Dead Letters",
                      accessor: (t: any) => t.dead_letter_count,
                    },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <TableToolbar
                search={webhookSearch}
                onSearchChange={setWebhookSearch}
                searchPlaceholder="Search webhooks..."
                status={webhookStatusFilter}
                onStatusChange={setWebhookStatusFilter}
                statusOptions={[
                  {
                    value: "healthy",
                    label: "Healthy",
                  },
                  {
                    value: "degraded",
                    label: "Degraded",
                  },
                  {
                    value: "critical",
                    label: "Critical",
                  },
                ]}
                filterContent={(
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Only show webhooks by...</p>
                    <p className="text-muted-foreground text-xs">Event type, duration, tenant</p>
                  </div>
                )}
              />
              <DataTable
                columns={webhookHealthColumns}
                data={filteredWebhookHealth}
                isLoading={loadingWebhookHealth}
                hasActiveFilters={!!webhookSearch || webhookStatusFilter !== "all"}
                emptyState="No webhook data available"
                filteredEmptyState="No webhook data matches your filters."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenant Controls Tab */}
        <TabsContent value="tenant-controls">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Tenant Integration Controls
                  </CardTitle>
                  <CardDescription>
                    Manage tenant access to integrations platform. Disable abusive or compromised tenants.
                  </CardDescription>
                </div>
                <ExportButton
                  filename="tenant-integration-controls"
                  rows={filteredTenantStatuses}
                  columns={[
                    {
                      header: "Tenant",
                      accessor: (t: any) => t.tenant_name,
                    },
                    {
                      header: "API Keys",
                      accessor: (t: any) => t.active_api_keys,
                    },
                    {
                      header: "Webhooks",
                      accessor: (t: any) => t.active_webhooks,
                    },
                    {
                      header: "Status",
                      accessor: (t: any) => (t.api_enabled ? "Enabled" : "Disabled"),
                    },
                    {
                      header: "Last Activity",
                      accessor: (t: any) => t.last_activity || "",
                    },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <TableToolbar
                search={tenantSearch}
                onSearchChange={setTenantSearch}
                searchPlaceholder="Search tenants..."
                status={tenantStatusFilter}
                onStatusChange={setTenantStatusFilter}
                statusOptions={[
                  {
                    value: "enabled",
                    label: "Enabled",
                  },
                  {
                    value: "disabled",
                    label: "Disabled",
                  },
                ]}
                filterContent={(
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Only show tenants by...</p>
                    <p className="text-muted-foreground text-xs">API keys, webhooks, activity</p>
                  </div>
                )}
              />
              <DataTable
                columns={tenantControlColumns}
                data={filteredTenantStatuses}
                isLoading={loadingTenantStatuses}
                hasActiveFilters={!!tenantSearch || tenantStatusFilter !== "all"}
                emptyState="No tenants found"
                filteredEmptyState="No tenants match your filters."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Integration Audit Logs</CardTitle>
                  <CardDescription>
                    Platform-wide log of all API key and webhook configuration changes
                  </CardDescription>
                </div>
                <ExportButton
                  filename="integration-audit-logs"
                  rows={filteredAuditLogs}
                  columns={[
                    {
                      header: "Timestamp",
                      accessor: (l: any) => l.created_at,
                    },
                    {
                      header: "Tenant",
                      accessor: (l: any) => l.tenant_name || "",
                    },
                    {
                      header: "Action",
                      accessor: (l: any) => l.action,
                    },
                    {
                      header: "Entity",
                      accessor: (l: any) => l.entity_type,
                    },
                    {
                      header: "Actor",
                      accessor: (l: any) => l.actor_name || "",
                    },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <TableToolbar
                search={auditSearch}
                onSearchChange={setAuditSearch}
                searchPlaceholder="Search audit logs..."
                filterContent={(
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Only show events by...</p>
                    <p className="text-muted-foreground text-xs">Event, Time, Severity</p>
                  </div>
                )}
              />
              <DataTable
                columns={auditColumns}
                data={filteredAuditLogs}
                isLoading={loadingAuditLogs}
                hasActiveFilters={!!auditSearch}
                emptyState="No audit logs available"
                filteredEmptyState="No audit logs match your search."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Disable Dialog */}
      <AlertDialog
        open={!!confirmDisable}
        onOpenChange={() => setConfirmDisable(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Tenant Integrations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke all API keys and disable all webhooks for this tenant.
              They will need to generate new API keys to regain access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDisable && handleDisable(confirmDisable)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disable All Integrations
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Enable Dialog */}
      <AlertDialog
        open={!!confirmEnable}
        onOpenChange={() => setConfirmEnable(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-enable Tenant Integrations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will re-enable webhooks for this tenant. Note: API keys that were revoked
              cannot be restored - the tenant will need to generate new keys.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmEnable && handleEnable(confirmEnable)}>
              Enable Integrations
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
