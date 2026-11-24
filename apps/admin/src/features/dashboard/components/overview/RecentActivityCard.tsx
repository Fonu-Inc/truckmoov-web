import type { ActivityLog } from "@truckmoov/api/auth";
import type { DashboardPeriod } from "@/features/dashboard/utils/dashboardPeriod";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemActivityLogQueryOptions,
  getSystemTenantsQueryOptions,
} from "@truckmoov/api/auth";
import { formatCompactRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Building2,
  Clock,
  Cpu,
  CreditCard,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { filterByPeriod } from "@/features/dashboard/utils/dashboardPeriod";
import { WidgetBody } from "./WidgetBody";

const ACTIVITY_LOG_LIMIT = 5;
// The log takes no date params, so a period filters a wider recent window client-side.
const PERIOD_WINDOW_LIMIT = 100;

type ActivityType = "tenant_created" | "device_provisioned" | "sim_activated" | "alert" | "payment" | "other";

/** Buckets a live log entry into fleetflow's five activity kinds (icon + tint). */
function activityType(activity: ActivityLog): ActivityType {
  const text = `${activity.service} ${activity.entityType} ${activity.action}`.toLowerCase();
  if (/alert|incident|error|fail/.test(text))
    return "alert";
  if (/payment|invoice|billing|subscription/.test(text))
    return "payment";
  if (/sim/.test(text))
    return "sim_activated";
  if (/device|sensor/.test(text))
    return "device_provisioned";
  if (/tenant|organi[sz]ation|onboarding/.test(text))
    return "tenant_created";
  return "other";
}

export function RecentActivityCard({ period }: { period: DashboardPeriod }) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    getSystemActivityLogQueryOptions({ params: { limit: period === "overall" ? ACTIVITY_LOG_LIMIT : PERIOD_WINDOW_LIMIT } }),
  );
  const tenants = useQuery(getSystemTenantsQueryOptions());
  const tenantNames = new Map((tenants.data?.data.tenants ?? []).map(t => [
    t.id,
    t.name,
  ]));
  const activities = filterByPeriod(
    data?.data ?? [],
    period,
    undefined,
    a => a.occurredAt,
  ).slice(
    0,
    ACTIVITY_LOG_LIMIT,
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Platform Activity
        </CardTitle>
        <CardDescription>Latest events across tenants: onboarding, devices, SIMs, alerts and payments</CardDescription>
      </CardHeader>
      <CardContent>
        <WidgetBody
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={activities.length === 0}
          emptyMessage={period === "overall" ? "No recent activity found." : "No activity in this period."}
        >
          <div className="space-y-3">
            {activities.map((activity) => {
              const type = activityType(activity);
              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      type === "alert"
                        ? "bg-warning/10"
                        : type === "payment"
                          ? "bg-success/10"
                          : "bg-primary/10"
                    }`}
                    >
                      {type === "tenant_created" && <Building2 className="h-4 w-4 text-primary" />}
                      {type === "device_provisioned" && <Cpu className="h-4 w-4 text-primary" />}
                      {type === "sim_activated" && <Smartphone className="h-4 w-4 text-primary" />}
                      {type === "alert" && <AlertTriangle className="h-4 w-4 text-warning" />}
                      {type === "payment" && <CreditCard className="h-4 w-4 text-success" />}
                      {type === "other" && <Clock className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.summary}</p>
                      <p className="text-xs text-muted-foreground">{tenantNames.get(activity.tenantId) ?? "System"}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatCompactRelative(activity.occurredAt)}</span>
                </div>
              );
            })}
          </div>
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
