import { formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, CheckCircle2, HeartPulse, Link2Off } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  defaultIntegrationHealthSnapshot,
  defaultProviderHealthStatuses,
  defaultRecentIntegrationFailures,
  IntegrationStatus,
} from "@/features/integrations/api";

const statusMeta: Record<IntegrationStatus, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-green-100 text-green-700" },
  degraded: { label: "Degraded", className: "bg-amber-100 text-amber-700" },
  down: { label: "Down", className: "bg-red-100 text-red-700" },
};

export default function IntegrationHealthSection() {
  const summary = defaultIntegrationHealthSnapshot;
  const providers = defaultProviderHealthStatuses;
  const failures = defaultRecentIntegrationFailures;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5" />
            Integration Health Monitoring
          </CardTitle>
          <CardDescription>
            Track inbound webhook freshness, failure rate, and provider integration status.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Last Webhook Received</p>
            <p className="mt-1 font-semibold">
              {formatDistanceToNowStrict(new Date(summary.lastWebhookReceivedAt), { addSuffix: true })}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Webhooks Today</p>
            <p className="mt-1 font-semibold">{summary.totalWebhooksToday.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Failed Webhooks Today</p>
            <p className="mt-1 font-semibold text-destructive">{summary.failedWebhooksToday.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Failure Rate</p>
            <p className="mt-1 font-semibold">{summary.failureRatePercent.toFixed(2)}%</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider Status</CardTitle>
          <CardDescription>Real-time status snapshot for connected integration providers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <div key={provider.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{provider.providerName}</p>
                <Badge className={statusMeta[provider.status].className}>{statusMeta[provider.status].label}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>Success: {provider.successRatePercent.toFixed(1)}%</p>
                <p>Failure: {provider.failureRatePercent.toFixed(1)}%</p>
                <p>Latency: {provider.avgLatencyMs}ms</p>
                <p>
                  Last webhook {formatDistanceToNowStrict(new Date(provider.lastWebhookReceivedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Integration Failures</CardTitle>
          <CardDescription>Latest failed deliveries and webhook processing errors.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Occurred</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failures.map((failure) => (
                <TableRow key={failure.id}>
                  <TableCell className="font-medium">{failure.providerName}</TableCell>
                  <TableCell><code>{failure.endpoint}</code></TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {failure.errorCode}
                    </Badge>
                  </TableCell>
                  <TableCell>{failure.retryCount}</TableCell>
                  <TableCell>{formatDistanceToNowStrict(new Date(failure.occurredAt), { addSuffix: true })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Healthy provider links are stable.
            </div>
            <div className="flex items-center gap-1">
              <Link2Off className="h-4 w-4 text-destructive" />
              Alerting threshold triggers at 5% failure rate.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
