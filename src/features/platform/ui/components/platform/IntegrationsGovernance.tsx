import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Key,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Webhook,
  XCircle,
} from "lucide-react";
import { usePlatformIntegrationGovernance } from "@/hooks/usePlatformIntegrationGovernance";
import { formatDistanceToNow } from "date-fns";

export function IntegrationsGovernance() {
  const {
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
  } = usePlatformIntegrationGovernance();

  const [confirmDisable, setConfirmDisable] = useState<string | null>(null);
  const [confirmEnable, setConfirmEnable] = useState<string | null>(null);

  // Calculate summary stats
  const totalRequests = apiUsage?.reduce((sum, t) => sum + t.total_requests, 0) || 0;
  const totalFailedRequests = apiUsage?.reduce((sum, t) => sum + t.failed_requests, 0) || 0;
  const overallSuccessRate = totalRequests > 0 
    ? ((totalRequests - totalFailedRequests) / totalRequests * 100).toFixed(1) 
    : "0";

  const totalWebhookDeliveries = webhookHealth?.reduce((sum, t) => sum + t.total_deliveries, 0) || 0;
  const totalDeadLetters = webhookHealth?.reduce((sum, t) => sum + t.dead_letter_count, 0) || 0;
  const webhookSuccessRate = totalWebhookDeliveries > 0
    ? (webhookHealth?.reduce((sum, t) => sum + t.successful_deliveries, 0) || 0) / totalWebhookDeliveries * 100
    : 0;

  const handleDisable = (tenantId: string) => {
    disableTenantIntegrations.mutate(tenantId);
    setConfirmDisable(null);
  };

  const handleEnable = (tenantId: string) => {
    enableTenantIntegrations.mutate(tenantId);
    setConfirmEnable(null);
  };

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
              {overallSuccessRate}% success rate
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
              {webhookSuccessRate.toFixed(1)}% delivered
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

      <Tabs defaultValue="api-usage" className="space-y-4">
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
              <CardTitle>Aggregate API Usage by Tenant</CardTitle>
              <CardDescription>
                Platform-wide view of API consumption (no payload data visible)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingApiUsage ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">Total Requests</TableHead>
                      <TableHead className="text-right">Successful</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead className="text-right">Avg Response</TableHead>
                      <TableHead>Last Request</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiUsage?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No API usage data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiUsage?.map((tenant) => (
                        <TableRow key={tenant.tenant_id}>
                          <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                          <TableCell className="text-right">{tenant.total_requests.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-emerald-600 dark:text-emerald-400">{tenant.successful_requests.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={tenant.failed_requests > 0 ? "text-destructive" : ""}>
                              {tenant.failed_requests.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {tenant.avg_response_time_ms.toFixed(0)}ms
                          </TableCell>
                          <TableCell>
                            {tenant.last_request_at ? (
                              <span className="text-muted-foreground text-sm">
                                {formatDistanceToNow(new Date(tenant.last_request_at), { addSuffix: true })}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook Health Tab */}
        <TabsContent value="webhook-health">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Delivery Health</CardTitle>
              <CardDescription>
                Aggregate delivery success rates and dead letter counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWebhookHealth ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">Active Webhooks</TableHead>
                      <TableHead className="text-right">Total Deliveries</TableHead>
                      <TableHead className="text-right">Success Rate</TableHead>
                      <TableHead className="text-right">Dead Letters</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookHealth?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No webhook data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      webhookHealth?.map((tenant) => (
                        <TableRow key={tenant.tenant_id}>
                          <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                          <TableCell className="text-right">{tenant.active_subscriptions}</TableCell>
                          <TableCell className="text-right">{tenant.total_deliveries.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {tenant.success_rate >= 95 ? (
                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : tenant.success_rate < 80 ? (
                                <TrendingDown className="h-4 w-4 text-destructive" />
                              ) : null}
                              <span className={
                                tenant.success_rate >= 95 
                                  ? "text-emerald-600 dark:text-emerald-400" 
                                  : tenant.success_rate < 80 
                                    ? "text-destructive" 
                                    : ""
                              }>
                                {tenant.success_rate.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {tenant.dead_letter_count > 0 ? (
                              <Badge variant="destructive">{tenant.dead_letter_count}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {tenant.success_rate >= 95 ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Healthy
                              </Badge>
                            ) : tenant.success_rate >= 80 ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-600 dark:text-amber-400 dark:border-amber-400">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Degraded
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Critical
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenant Controls Tab */}
        <TabsContent value="tenant-controls">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Tenant Integration Controls
              </CardTitle>
              <CardDescription>
                Manage tenant access to integrations platform. Disable abusive or compromised tenants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTenantStatuses ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-center">API Keys</TableHead>
                      <TableHead className="text-center">Webhooks</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenantStatuses?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No tenants found
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenantStatuses?.map((tenant) => {
                        const hasActiveIntegrations = tenant.active_api_keys > 0 || tenant.active_webhooks > 0;
                        return (
                          <TableRow key={tenant.tenant_id}>
                            <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={tenant.active_api_keys > 0 ? "default" : "secondary"}>
                                {tenant.active_api_keys}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={tenant.active_webhooks > 0 ? "default" : "secondary"}>
                                {tenant.active_webhooks}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {tenant.last_activity ? (
                                <span className="text-muted-foreground text-sm">
                                  {formatDistanceToNow(new Date(tenant.last_activity), { addSuffix: true })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">Never</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {tenant.api_enabled ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Enabled
                              </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <Ban className="h-3 w-3 mr-1" />
                                  Disabled
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {hasActiveIntegrations ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setConfirmDisable(tenant.tenant_id)}
                                  disabled={disableTenantIntegrations.isPending}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Disable
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setConfirmEnable(tenant.tenant_id)}
                                  disabled={enableTenantIntegrations.isPending}
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Enable
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs">
          <Card>
            <CardHeader>
              <CardTitle>Integration Audit Logs</CardTitle>
              <CardDescription>
                Platform-wide log of all API key and webhook configuration changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAuditLogs ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Actor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No audit logs available
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="font-medium">{log.tenant_name}</TableCell>
                          <TableCell>
                            <Badge variant={
                              log.action.includes("CREATED") ? "default" :
                              log.action.includes("REVOKED") || log.action.includes("DISABLED") ? "destructive" :
                              "secondary"
                            }>
                              {log.action.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">
                              {log.resource_type}: {log.resource_id?.slice(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground text-sm">
                              {log.actor_id?.slice(0, 8) || "System"}...
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Disable Dialog */}
      <AlertDialog open={!!confirmDisable} onOpenChange={() => setConfirmDisable(null)}>
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
      <AlertDialog open={!!confirmEnable} onOpenChange={() => setConfirmEnable(null)}>
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
