import type { InstallerJobStatus } from "@truckmoov/api/auth";
import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";

const STATUS: Record<InstallerJobStatus, {
  label: string; className: string;
}> = {
  unassigned: {
    label: "Unassigned", className: "border-border text-muted-foreground",
  },
  assigned: {
    label: "Offer", className: "border-primary/30 bg-primary/10 text-primary",
  },
  scheduled: {
    label: "Scheduled", className: "border-primary/30 bg-primary/10 text-primary",
  },
  in_progress: {
    label: "In progress", className: "border-warning/30 bg-warning/10 text-warning",
  },
  overdue: {
    label: "Overdue", className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  issue_reported: {
    label: "Issue reported", className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  completed: {
    label: "Completed", className: "border-success/30 bg-success/10 text-success",
  },
  cancelled: {
    label: "Cancelled", className: "border-border text-muted-foreground",
  },
};

/** Status of a real installer-portal job (TRU-FE-19/20) — not the demo `JobStatusBadge`. */
export function InstallerJobStatusBadge({ status }: { status: InstallerJobStatus }) {
  const s = STATUS[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap",
        s.className,
      )}
    >
      {s.label}
    </Badge>
  );
}
