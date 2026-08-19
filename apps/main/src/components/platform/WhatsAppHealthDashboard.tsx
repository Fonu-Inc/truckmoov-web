import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Inbox,
  MessageSquare,
  Send,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ExportButton } from "@/components/shadcn/export-button";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";

type WebhookStats = {
  total: number;
  processed: number;
  failed: number;
  pending: number;
};

type MessageStats = {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
};

type TenantHealth = {
  tenant_id: string;
  tenant_name: string;
  status: string;
  messages_sent: number;
  messages_failed: number;
  last_activity: string | null;
};

export function WhatsAppHealthDashboard() {
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);
  const [
    webhookStats,
    setWebhookStats,
  ] = useState<WebhookStats>({
    total: 0, processed: 0, failed: 0, pending: 0,
  });
  const [
    messageStats,
    setMessageStats,
  ] = useState<MessageStats>({
    sent: 0, delivered: 0, read: 0, failed: 0,
  });
  const [
    tenantHealth,
    setTenantHealth,
  ] = useState<TenantHealth[]>([]);
  const [
    topErrors,
    setTopErrors,
  ] = useState<{
    code: string; count: number;
  }[]>([]);
  const [
    tenantSearch,
    setTenantSearch,
  ] = useState("");
  const [
    tenantStatusFilter,
    setTenantStatusFilter,
  ] = useState("all");

  const filteredTenantHealth = tenantHealth.filter((t) => {
    const matchesSearch = !tenantSearch || t.tenant_name.toLowerCase().includes(tenantSearch.toLowerCase());
    const matchesStatus = tenantStatusFilter === "all" || t.status === tenantStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const fetchStats = async () => {
    setIsLoading(true);
    // Apply demo fallbacks
    setWebhookStats({
      total: 12480, processed: 12089, failed: 287, pending: 104,
    });
    setMessageStats({
      sent: 28412, delivered: 27598, read: 24180, failed: 814,
    });
    setTenantHealth([
      {
        tenant_id: "demo-t1", tenant_name: "Lagos Express Logistics", status: "healthy", messages_sent: 9421, messages_failed: 41, last_activity: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      },
      {
        tenant_id: "demo-t3", tenant_name: "Nairobi Fleet Group", status: "healthy", messages_sent: 6890, messages_failed: 78, last_activity: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
      },
      {
        tenant_id: "demo-t2", tenant_name: "Accra Swift Cargo", status: "healthy", messages_sent: 4521, messages_failed: 52, last_activity: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
      {
        tenant_id: "demo-t5", tenant_name: "Johannesburg Freight", status: "degraded", messages_sent: 3284, messages_failed: 142, last_activity: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
      },
      {
        tenant_id: "demo-t6", tenant_name: "Abuja Haulage Co.", status: "healthy", messages_sent: 2104, messages_failed: 38, last_activity: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
      },
      {
        tenant_id: "demo-t4", tenant_name: "Cape Town Trucking", status: "degraded", messages_sent: 1842, messages_failed: 98, last_activity: new Date(Date.now() - 1000 * 60 * 64).toISOString(),
      },
    ]);
    setTopErrors([
      {
        code: "131026", count: 124,
      },
      {
        code: "131047", count: 87,
      },
      {
        code: "131051", count: 54,
      },
      {
        code: "470", count: 38,
      },
      {
        code: "131056", count: 21,
      },
    ]);
    setIsLoading(false);
  };

  useEffect(
    () => {
      fetchStats();
    },
    [],
  );

  const deliveryRate = messageStats.sent > 0 ? Math.round((messageStats.delivered / messageStats.sent) * 100) : 0;
  const webhookSuccessRate
    = webhookStats.total > 0 ? Math.round((webhookStats.processed / webhookStats.total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            1,
            2,
            3,
            4,
          ].map(i => (
            <Skeleton
              key={i}
              className="h-24 w-full"
            />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            WhatsApp Platform Health
          </h2>
          <p className="text-sm text-muted-foreground">Monitor webhook delivery, message success rates, and tenant health</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <Send className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{messageStats.sent}</p>
                <p className="text-xs text-muted-foreground">Messages Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {deliveryRate}
                  %
                </p>
                <p className="text-xs text-muted-foreground">Delivery Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <Inbox className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{webhookStats.total}</p>
                <p className="text-xs text-muted-foreground">Webhook Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{webhookStats.failed}</p>
                <p className="text-xs text-muted-foreground">Failed Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Health */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            Webhook Processing Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="font-medium">
                {webhookSuccessRate}
                %
              </span>
            </div>
            <Progress
              value={webhookSuccessRate}
              className="h-2"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-success/10">
              <p className="text-lg font-bold text-success">{webhookStats.processed}</p>
              <p className="text-xs text-muted-foreground">Processed</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10">
              <p className="text-lg font-bold text-warning">{webhookStats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10">
              <p className="text-lg font-bold text-destructive">{webhookStats.failed}</p>
              <p className="text-xs text-muted-foreground">Failed (DLQ)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Health (top, expanded) */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-success" />
              Tenant Health
            </CardTitle>
            <ExportButton
              filename="whatsapp-tenant-health"
              rows={tenantHealth}
              columns={[
                {
                  header: "Tenant", accessor: t => t.tenant_name,
                },
                {
                  header: "Status", accessor: t => t.status,
                },
                {
                  header: "Sent", accessor: t => t.messages_sent,
                },
                {
                  header: "Failed", accessor: t => t.messages_failed,
                },
                {
                  header: "Last Activity", accessor: t => t.last_activity || "",
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
                value: "healthy", label: "Healthy",
              },
              {
                value: "degraded", label: "Degraded",
              },
            ]}
            filterContent={(
              <div className="space-y-2 text-sm">
                <p className="font-medium">Filter Tenant Health</p>
                <p className="text-muted-foreground text-xs">
                  Use search and status to refine results.
                </p>
              </div>
            )}
          />
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenantHealth.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-4"
                      >
                        No connected tenants
                      </TableCell>
                    </TableRow>
                  )
                : (
                    filteredTenantHealth.map(t => (
                      <TableRow
                        key={t.tenant_id}
                        className="border-border/50"
                      >
                        <TableCell className="font-medium">{t.tenant_name}</TableCell>
                        <TableCell>
                          <Badge className={t.status === "healthy" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}>
                            {t.status === "healthy" ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{t.messages_sent}</TableCell>
                        <TableCell className={t.messages_failed > 0 ? "text-destructive" : ""}>{t.messages_failed}</TableCell>
                      </TableRow>
                    ))
                  )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Error Codes (below) */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            Top Error Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topErrors.length === 0
            ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p>No errors recorded</p>
                </div>
              )
            : (
                <div className="space-y-3">
                  {topErrors.map(error => (
                    <div
                      key={error.code}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-destructive">{error.code}</span>
                      </div>
                      <Badge variant="outline">
                        {error.count}
                        {" "}
                        occurrences
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WhatsAppHealthDashboard;
