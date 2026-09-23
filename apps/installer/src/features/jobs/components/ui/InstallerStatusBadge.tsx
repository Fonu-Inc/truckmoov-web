import type { InstallerStatus } from "@/features/jobs/demoData";
import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";

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
