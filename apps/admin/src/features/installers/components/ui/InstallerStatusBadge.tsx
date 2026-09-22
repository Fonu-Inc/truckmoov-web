import type {
  InstallationJobStatus,
  InstallerStatus,
} from "@/features/installers/demoData";
import { Badge } from "@/components/shadcn/badge";
import { JOB_STATUS_LABEL } from "@/features/installers/demoData";
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

const installerTone: Record<InstallerStatus, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-destructive/10 text-destructive",
  pending_activation: "bg-warning/10 text-warning",
};

const installerLabel: Record<InstallerStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  pending_activation: "Invitation Sent",
};

export function InstallerStatusBadge({ status }: { status: InstallerStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent",
        installerTone[status],
      )}
    >
      {installerLabel[status]}
    </Badge>
  );
}
