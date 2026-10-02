import type { ReactNode } from "react";
import {
  FileText, Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/shadcn/button";

/**
 * Shared loading / error / empty gate used by every report page. Kept as a
 * component so each page still owns its own React Query calls and stays a
 * self-contained lazy chunk. `isPending` is the report still loading; `hasData`
 * is false only when there is nothing to report on at all (no vehicles).
 */
export function AnalyticsGate({
  isPending, isError = false, onRetry, hasData, children,
}: {
  isPending: boolean;
  isError?: boolean;
  onRetry?: () => void;
  hasData: boolean;
  children: ReactNode;
}) {
  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
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
