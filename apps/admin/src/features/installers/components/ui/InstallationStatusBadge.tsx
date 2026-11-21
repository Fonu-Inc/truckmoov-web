import type { BadgeProps } from "@/components/shadcn/badge";
import type { InstallationStatus } from "@/features/installers/utils/platformInstallations";
import { Badge } from "@/components/shadcn/badge";
import { INSTALLATION_STATUS_LABEL } from "@/features/installers/utils/platformInstallations";

const variants: Record<InstallationStatus, BadgeProps["variant"]> = {
  pending: "installationAwaiting",
  awaiting_assignment: "installationAwaiting",
  scheduled: "installationScheduled",
  in_progress: "installationProgress",
  completed: "installationCompleted",
  cancelled: "installationCancelled",
  requires_attention: "installationAttention",
};

export function InstallationStatusBadge({ status }: { status: InstallationStatus }) {
  return (
    <Badge
      variant={variants[status]}
      className="max-w-[160px] whitespace-normal"
    >
      {INSTALLATION_STATUS_LABEL[status]}
    </Badge>
  );
}
