import type { SystemTenant } from "@truckmoov/api/auth";
import type { CustomerRow } from "./paymentsAccessModel";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import {
  cascadeWarning, dueDateText, stageBadge, suspensionCauseText,
} from "./enforcementModel";
import {
  isSuspended, paymentState,
} from "./paymentsAccessModel";

const TONE_CLASS = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function PaymentCell({
  row, walletsReady,
}: {
  row: CustomerRow; walletsReady: boolean;
}) {
  const state = paymentState(
    row.wallet,
    walletsReady,
  );
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge
        variant="outline"
        className={cn(
          "rounded-full border-transparent",
          TONE_CLASS[state.tone],
        )}
      >
        {state.label}
      </Badge>
      {state.detail ? <span className="text-xs text-muted-foreground">{state.detail}</span> : null}
    </div>
  );
}

export function GraceCell({ row }: { row: CustomerRow }) {
  const badge = stageBadge(row.enforcement);
  const due = dueDateText(row.enforcement);
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge
        variant="outline"
        className={cn(
          "rounded-full border-transparent",
          TONE_CLASS[badge.tone],
        )}
      >
        {badge.label}
      </Badge>
      {due ? <span className="text-xs text-muted-foreground">{due}</span> : null}
    </div>
  );
}

export function AccessCell({ row }: { row: CustomerRow }) {
  const { tenant } = row;
  if (!isSuspended(tenant)) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "rounded-full border-transparent",
          TONE_CLASS.success,
        )}
      >
        Active
      </Badge>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge
        variant="outline"
        className={cn(
          "rounded-full border-transparent",
          TONE_CLASS.destructive,
        )}
      >
        Suspended
      </Badge>
      <span className="text-xs text-muted-foreground">
        {tenant.suspendedAt ? `Since ${formatDateTime(tenant.suspendedAt)}` : "Date not recorded"}
      </span>
      <span className="max-w-xs text-xs text-muted-foreground">
        {suspensionCauseText(
          row.enforcement,
          tenant.suspendedByName,
          tenant.suspensionReason,
        )}
      </span>
      {cascadeWarning(row.enforcement?.cascadeStatus)
        ? <span className="max-w-xs text-xs text-warning">{cascadeWarning(row.enforcement?.cascadeStatus)}</span>
        : null}
    </div>
  );
}

export function ActionCell({
  tenant,
  onSuspend,
  onRestore,
}: {
  tenant: SystemTenant;
  onSuspend: (t: SystemTenant) => void;
  onRestore: (t: SystemTenant) => void;
}) {
  if (isSuspended(tenant)) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onRestore(tenant)}
      >
        Restore access
      </Button>
    );
  }
  if (tenant.status === "terminated" || tenant.status === "inactive")
    return null;
  return (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive"
      onClick={() => onSuspend(tenant)}
    >
      Suspend access
    </Button>
  );
}
