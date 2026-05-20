import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Key, Webhook, BookOpen, Activity, BarChart3 } from 'lucide-react';
import { ApiKeyManagement } from './ApiKeyManagement';
import { WebhookManagementPanel } from './WebhookManagementPanel';
import { ApiUsageAnalytics } from './ApiUsageAnalytics';
import { ApiDocumentation } from './ApiDocumentation';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useWebhookSubscriptions } from '@/hooks/useWebhookSubscriptions';
import { useIntegrationAudit } from '@/hooks/useIntegrationAudit';
import { demoApiKeys, demoWebhookSubscriptions, demoAuditLogs } from './demoIntegrationData';
import { format } from 'date-fns';

export function DeveloperPortal() {
  const { apiKeys: realKeys } = useApiKeys();
  const { subscriptions: realSubs } = useWebhookSubscriptions();
  const { auditLogs: realLogs, isLoading: auditLoading } = useIntegrationAudit();

  const apiKeys = realKeys.length > 0 ? realKeys : demoApiKeys;
  const subscriptions = realSubs.length > 0 ? realSubs : demoWebhookSubscriptions;
  const auditLogs = realLogs.length > 0 ? realLogs : demoAuditLogs;

  const activeKeysCount = apiKeys.filter(k => k.status === 'active').length;
  const enabledWebhooksCount = subscriptions.filter(w => w.is_enabled).length;

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
            <TabsTrigger value="api-keys" className="shrink-0">
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="shrink-0">
              <Webhook className="h-4 w-4 mr-2" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="usage" className="shrink-0">
              <BarChart3 className="h-4 w-4 mr-2" />
              Usage Analytics
            </TabsTrigger>
            <TabsTrigger value="docs" className="shrink-0">
              <BookOpen className="h-4 w-4 mr-2" />
              API Reference
            </TabsTrigger>
            <TabsTrigger value="activity" className="shrink-0">
              <Activity className="h-4 w-4 mr-2" />
              Audit Log
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="api-keys" className="mt-6">
          <ApiKeyManagement />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <WebhookManagementPanel />
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <ApiUsageAnalytics />
        </TabsContent>

        <TabsContent value="docs" className="mt-6">
          <ApiDocumentation />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Audit Log</CardTitle>
              <CardDescription>
                Track all API key and webhook configuration changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : auditLogs.length === 0 ? (
                <p className="text-muted-foreground">No audit events recorded</p>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {log.resource_type === 'api_key' ? (
                            <Key className="h-4 w-4" />
                          ) : (
                            <Webhook className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{log.actor_name || 'System'}</span>
                            <Badge variant="outline" className="text-xs">{log.action}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {log.resource_type} • {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
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
