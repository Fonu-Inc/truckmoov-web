import type { ReactNode } from "react";
import {
  FileText, Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

/**
 * Shared loading / empty gate used by every report page. Kept as a
 * component so each page still owns its own React Query calls and stays a
 * self-contained lazy chunk. `isPending` is any of the tab's queries still
 * loading; `hasData` is at least one of the datasets it cares about has rows.
 */
export function ReportsGate({
  isPending, hasData, children,
}: {
  isPending: boolean;
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
