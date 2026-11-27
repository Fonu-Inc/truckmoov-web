import type { VerificationStatus } from "@/features/jobs/hooks/useJobVerification";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";

const BADGE: Record<VerificationStatus, {
  label: string;
  variant: "muted" | "installationAttention" | "installationCompleted" | "installationCancelled";
}> = {
  not_started: {
    label: "Not started", variant: "muted",
  },
  waiting: {
    label: "Waiting for the device to report", variant: "installationAttention",
  },
  verified: {
    label: "Verified", variant: "installationCompleted",
  },
  failed: {
    label: "Failed", variant: "installationCancelled",
  },
};

export function DeviceVerificationCell({
  status, reason, controls, beforeStart, busy, onVerify, onCheck,
}: {
  status: VerificationStatus;
  reason: string | null;
  /** The job is in progress, the only time verification can be started. */
  controls: boolean;
  beforeStart: boolean;
  busy: boolean;
  onVerify: () => void;
  onCheck: () => void;
}) {
  const {
    label, variant,
  } = BADGE[status];
  const action = status === "waiting" ? "Check status" : "Verify device";

  return (
    <div className="space-y-1.5 py-1">
      <Badge
        variant={variant}
        className="whitespace-normal"
      >
        {label}
      </Badge>
      {reason && <p className="max-w-[16rem] text-xs text-muted-foreground">{reason}</p>}
      {controls && status !== "verified" && (
        <div>
          <Button
            size="sm"
            variant="outline"
            loading={busy}
            aria-label={action}
            onClick={status === "waiting" ? onCheck : onVerify}
          >
            {action}
          </Button>
        </div>
      )}
      {!controls && beforeStart && status !== "verified" && (
        <p className="max-w-[16rem] text-xs text-muted-foreground">Verification starts when the installation is started.</p>
      )}
    </div>
  );
}
