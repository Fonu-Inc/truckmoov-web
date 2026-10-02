import { useQuery } from "@tanstack/react-query";
import { getSystemHealthQueryOptions } from "@truckmoov/api/auth";
import { Activity } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { formatLabel, UNAVAILABLE } from "./overviewFormat";
import { WidgetBody } from "./WidgetBody";

const HEALTH_REFRESH_MS = 30000;

const isWarning = (status?: string) => status === "warning" || status === "degraded";

function dotClass(status?: string) {
  const normalized = status?.toLowerCase();
  if (normalized === "healthy") {
    return "bg-success";
  }
  return isWarning(normalized) ? "bg-warning animate-pulse" : "bg-destructive";
}

function badgeClass(status?: string) {
  const normalized = status?.toLowerCase();
  if (!normalized) {
    return "bg-muted text-muted-foreground border-border";
  }
  if (normalized === "healthy") {
    return "bg-success/10 text-success border-success/30";
  }
  return isWarning(normalized)
    ? "bg-warning/10 text-warning border-warning/30"
    : "bg-destructive/10 text-destructive border-destructive/30";
}

function overallLabel(isLoading: boolean, isError: boolean, overall?: string) {
  if (isLoading) {
    return "Checking status";
  }
  if (isError) {
    return "Status unavailable";
  }
  return overall?.toLowerCase() === "healthy" ? "All Systems Operational" : formatLabel(overall);
}

export function SystemHealthCard() {
  const { data, isLoading, isError, refetch } = useQuery({
    ...getSystemHealthQueryOptions(),
    refetchInterval: HEALTH_REFRESH_MS,
  });
  const health = data?.data;
  const services = health?.services ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Health
          </CardTitle>
          <Badge className={badgeClass(health?.overall)}>{overallLabel(isLoading, isError, health?.overall)}</Badge>
        </div>
        <CardDescription>Real-time service status and performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <WidgetBody
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={services.length === 0}
          emptyMessage="No service health data found."
        >
          {services.map(service => (
            <div
              key={service.name}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${dotClass(service.status)}`} />
                <span className="text-sm font-medium">{service.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {service.latencyMs == null ? UNAVAILABLE : `${service.latencyMs.toLocaleString()}ms`}
                </span>
                <span className="text-muted-foreground hidden md:inline">{formatLabel(service.status)}</span>
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  {service.uptime == null
                    ? UNAVAILABLE
                    : `${service.uptime.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`}
                </Badge>
              </div>
            </div>
          ))}
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
