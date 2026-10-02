import { useQuery } from "@tanstack/react-query";
import { getSystemActivityLogQueryOptions } from "@truckmoov/api/auth";
import { formatCompactRelative } from "@truckmoov/app-core/utils/time-utils";
import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { WidgetBody } from "./WidgetBody";

const ACTIVITY_LOG_LIMIT = 5;

export function RecentActivityCard() {
  const { data, isLoading, isError, refetch } = useQuery(
    getSystemActivityLogQueryOptions({ params: { limit: ACTIVITY_LOG_LIMIT } }),
  );
  const activities = (data?.data ?? []).slice(0, ACTIVITY_LOG_LIMIT);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Platform Activity
        </CardTitle>
        <CardDescription>Latest events across tenants - onboarding, devices, SIMs, alerts and payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <WidgetBody
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={activities.length === 0}
          emptyMessage="No recent activity found."
        >
          {activities.map(activity => (
            <div
              key={activity.id}
              className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium truncate">{activity.summary}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatCompactRelative(activity.occurredAt)}
              </span>
            </div>
          ))}
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
