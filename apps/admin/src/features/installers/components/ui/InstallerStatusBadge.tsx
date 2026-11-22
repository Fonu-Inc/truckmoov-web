import type {
  InstallerJobStatus, SystemInstallerStatus,
} from "@truckmoov/api/auth";
import { Badge } from "@/components/shadcn/badge";
import {
  JOB_STATUS_LABEL, STATUS_LABEL,
} from "@/features/installers/installerOptions";
import { cn } from "@/lib/utils";

const installerTone: Record<SystemInstallerStatus, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-destructive/10 text-destructive",
  invited: "bg-warning/10 text-warning",
};

export function InstallerStatusBadge({ status }: { status: SystemInstallerStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent",
        installerTone[status],
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const jobTone: Record<InstallerJobStatus, string> = {
  unassigned: "bg-muted text-muted-foreground",
  assigned: "bg-primary/10 text-primary",
  scheduled: "bg-secondary text-secondary-foreground",
  in_progress: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
  issue_reported: "bg-destructive/10 text-destructive",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
};

export function JobStatusBadge({ status }: { status: InstallerJobStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent",
        jobTone[status],
      )}
    >
      {JOB_STATUS_LABEL[status]}
    </Badge>
  );
}
