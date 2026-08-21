import {
  useApiKeys, useConsoleAuditLog, useConsoleWebhooks,
} from "@truckmoov/api/console";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity, BarChart3, BookOpen, Key, Webhook,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { ApiDocumentation } from "./ApiDocumentation";
import { ApiKeyManagement } from "./ApiKeyManagement";
import { ApiUsageAnalytics } from "./ApiUsageAnalytics";
import { WebhookManagementPanel } from "./WebhookManagementPanel";

export function DeveloperPortal() {
  const { data: keysResponse } = useApiKeys();
  const { data: webhooksResponse } = useConsoleWebhooks();
  const {
    data: auditResponse, isLoading: auditLoading, isError: auditError, refetch: refetchAudit,
  } = useConsoleAuditLog();

  const apiKeys = keysResponse?.data ?? [];
  const subscriptions = webhooksResponse?.data ?? [];
  const auditLogs = auditResponse?.data ?? [];

  const activeKeysCount = apiKeys.filter(k => k.status === "active").length;
  const enabledWebhooksCount = subscriptions.filter(w => w.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeKeysCount}</div>
            <p className="text-xs text-muted-foreground">Active keys</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledWebhooksCount}</div>
            <p className="text-xs text-muted-foreground">Enabled subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">Integration events</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="api-keys">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto flex-wrap gap-1 p-1 lg:flex-nowrap">
            <TabsTrigger
              value="api-keys"
              className="shrink-0"
            >
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger
              value="webhooks"
              className="shrink-0"
            >
              <Webhook className="h-4 w-4 mr-2" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="shrink-0"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Usage Analytics
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="shrink-0"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              API Reference
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="shrink-0"
            >
              <Activity className="h-4 w-4 mr-2" />
              Audit Log
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="api-keys"
          className="mt-6"
        >
          <ApiKeyManagement />
        </TabsContent>

        <TabsContent
          value="webhooks"
          className="mt-6"
        >
          <WebhookManagementPanel />
        </TabsContent>

        <TabsContent
          value="usage"
          className="mt-6"
        >
          <ApiUsageAnalytics />
        </TabsContent>

        <TabsContent
          value="docs"
          className="mt-6"
        >
          <ApiDocumentation />
        </TabsContent>

        <TabsContent
          value="activity"
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Integration Audit Log</CardTitle>
              <CardDescription>
                Track all API key and webhook configuration changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading
                ? (
                    <p className="text-muted-foreground">Loading...</p>
                  )
                : auditError
                  ? (
                      <p className="text-sm text-muted-foreground">
                        Couldn't load the audit log.
                        {" "}
                        <Button
                          variant="link"
                          className="h-auto p-0"
                          onClick={() => refetchAudit()}
                        >
                          Retry
                        </Button>
                      </p>
                    )
                  : auditLogs.length === 0
                    ? (
                        <p className="text-muted-foreground">No audit events recorded</p>
                      )
                    : (
                        <ScrollArea className="h-96">
                          <div className="space-y-3">
                            {auditLogs.map(log => (
                              <div
                                key={log.id}
                                className="flex items-start gap-3 p-3 border rounded-lg"
                              >
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  {log.resourceType === "api_key"
                                    ? (
                                        <Key className="h-4 w-4" />
                                      )
                                    : (
                                        <Webhook className="h-4 w-4" />
                                      )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {/* ponytail: the audit entry carries no actor name, only
                                      actorId — show the id until the API resolves one. */}
                                    <span className="font-medium text-sm">{log.actorId || "—"}</span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {log.action}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {log.resourceType}
                                    {" "}
                                    •
                                    {formatWithPattern(
                                      log.occurredAt,
                                      "MMM d, yyyy HH:mm:ss",
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
