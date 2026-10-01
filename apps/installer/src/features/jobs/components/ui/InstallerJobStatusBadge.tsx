import type { InstallerJobStatus } from "@truckmoov/api/auth";
import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";

/** Labels and tints as appdemo's installer pages render them. */
const STATUS: Record<InstallerJobStatus, {
  label: string; className: string;
}> = {
  unassigned: {
    label: "Unassigned", className: "bg-muted text-muted-foreground",
  },
  assigned: {
    label: "Offer pending", className: "bg-primary/10 text-primary",
  },
  scheduled: {
    label: "Scheduled", className: "bg-secondary text-secondary-foreground",
  },
  in_progress: {
    label: "In progress", className: "bg-warning/10 text-warning",
  },
  overdue: {
    label: "Overdue", className: "bg-destructive/10 text-destructive",
  },
  issue_reported: {
    label: "Issue reported", className: "bg-destructive/10 text-destructive",
  },
  completed: {
    label: "Completed", className: "bg-success/10 text-success",
  },
  cancelled: {
    label: "Cancelled", className: "bg-muted text-muted-foreground",
  },
};

/** Status of a real installer-portal job (TRU-FE-19/20). */
export function InstallerJobStatusBadge({ status }: { status: InstallerJobStatus }) {
  const s = STATUS[status];
  return (
    <Badge
      variant="muted"
      className={cn(
        "rounded-full px-2.5 whitespace-nowrap",
        s.className,
      )}
    >
      {s.label}
    </Badge>
  );
}
