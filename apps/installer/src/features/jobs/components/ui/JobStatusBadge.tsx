import type { InstallationJobStatus } from "@/features/jobs/demoData";
import { Badge } from "@/components/shadcn/badge";
import { JOB_STATUS_LABEL } from "@/features/jobs/demoData";
import { cn } from "@/lib/utils";

const jobTone: Record<InstallationJobStatus, string> = {
  created: "bg-muted text-muted-foreground",
  awaiting_assignment: "bg-muted text-muted-foreground",
  accepted: "bg-info/10 text-info",
  scheduled: "bg-chart-4/10 text-chart-4",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  issue_reported: "bg-destructive/10 text-destructive",
  unable_to_complete: "bg-destructive/10 text-destructive",
};

export function JobStatusBadge({
  status,
  className,
}: {
  status: InstallationJobStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent",
        jobTone[status],
        className,
      )}
    >
      {JOB_STATUS_LABEL[status]}
    </Badge>
  );
}
