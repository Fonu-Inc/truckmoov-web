import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";

/**
 * Page-shaped placeholder (stat cards, chart, table) shown while a report
 * loads, so the page header above the gate stays usable.
 */
function AnalyticsSkeleton({ stats }: { stats: number }) {
  return (
    <div
      aria-label="Loading report"
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from(
          { length: stats },
          (_, i) => (
            <Card
              key={i}
              className="border-border/50"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>
      <Card className="border-border/50">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from(
            { length: 6 },
            (_, i) => (
              <Skeleton
                key={i}
                className="h-10 w-full"
              />
            ),
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Shared loading / error / empty gate used by every report page. Kept as a
 * component so each page still owns its own React Query calls and stays a
 * self-contained lazy chunk. `isPending` is the report still loading; `hasData`
 * is false only when there is nothing to report on at all (no vehicles).
 * Pages render their header above the gate so it shows while loading.
 */
export function AnalyticsGate({
  isPending, isError = false, onRetry, hasData, stats = 4, children,
}: {
  isPending: boolean;
  isError?: boolean;
  onRetry?: () => void;
  hasData: boolean;
  /** Number of stat cards in the loading skeleton. */
  stats?: number;
  children: ReactNode;
}) {
  if (isPending) {
    return <AnalyticsSkeleton stats={stats} />;
  }
  if (isError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm">This report could not be loaded.</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }
  if (!hasData) {
    return (
      <EmptyState
        icon={FileText}
        title="No data for reports"
        description="Add vehicles, drivers, and jobs to generate reports"
        actionLabel="Go to Fleet"
        actionHref="/fleet"
      />
    );
  }
  return <>{children}</>;
}
