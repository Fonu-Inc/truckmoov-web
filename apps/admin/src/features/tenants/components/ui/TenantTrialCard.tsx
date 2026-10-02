import type { SystemTenantTrial } from "@truckmoov/api/auth";
import {
  useConvertSystemTenantTrial,
  useExtendSystemTenantTrial,
} from "@truckmoov/api/auth";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import { Clock, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";

const DEFAULT_EXTENSION_DAYS = 14;
const MAX_EXTENSION_DAYS = 365;
const MIN_REASON = 5;
const MAX_REASON = 500;

const formatDay = (iso: string) => formatWithPattern(iso, "d MMM yyyy");

function failureMessage(error: unknown, fallback: string) {
  return (error as { message?: string })?.message ?? fallback;
}

function trialHeadline(trial: SystemTenantTrial) {
  if (trial.expired)
    return "Trial ended";
  const days = trial.daysRemaining;
  return `${days} day${days === 1 ? "" : "s"} remaining`;
}

export function TenantTrialCard({ tenantId, trial }: { tenantId: string; trial: SystemTenantTrial }) {
  const extend = useExtendSystemTenantTrial();
  const convert = useConvertSystemTenantTrial();
  const [days, setDays] = useState(DEFAULT_EXTENSION_DAYS);
  const [reason, setReason] = useState("");

  const busy = extend.isPending || convert.isPending;
  const reasonOk = reason.trim().length >= MIN_REASON && reason.trim().length <= MAX_REASON;
  const daysOk = Number.isInteger(days) && days >= 1 && days <= MAX_EXTENSION_DAYS;

  if (trial.converted) {
    return (
      <Card className="p-4 space-y-1">
        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Trial
        </h4>
        <p className="text-sm">
          Converted to paid
          {trial.convertedAt ? ` on ${formatDay(trial.convertedAt)}` : ""}
          {trial.convertedPlanCode ? ` (${trial.convertedPlanCode})` : ""}
          .
        </p>
      </Card>
    );
  }

  const onExtend = async () => {
    try {
      await extend.mutateAsync({ id: tenantId, data: { days, reason: reason.trim() } });
      setReason("");
      toast.success(`Trial extended by ${days} days`);
    }
    catch (error) {
      toast.error(failureMessage(error, "The trial could not be extended"));
    }
  };

  const onConvert = async () => {
    try {
      await convert.mutateAsync({ id: tenantId, data: { reason: reason.trim() || undefined } });
      setReason("");
      toast.success("Trial converted to paid");
    }
    catch (error) {
      toast.error(failureMessage(error, "The trial could not be converted"));
    }
  };

  const urgent = trial.expired || trial.daysRemaining <= 7;

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Trial Status
      </h4>
      <Card className={`p-4 space-y-4 ${urgent ? "border-warning/40 bg-warning/5" : ""}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{trialHeadline(trial)}</p>
            <p className="text-xs text-muted-foreground">
              {`${trial.expired ? "Ended" : "Ends"} ${formatDay(trial.endsAt)}`}
              {trial.extendedCount > 0 ? ` · Extended ${trial.extendedCount} time${trial.extendedCount === 1 ? "" : "s"}` : ""}
            </p>
          </div>
          <Badge variant="outline">{`Started ${formatDay(trial.startedAt)}`}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          The trial end is recorded and shown here. It does not suspend the tenant by itself.
        </p>
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <div className="space-y-1">
            <Label
              htmlFor="trial-days"
              className="text-xs"
            >
              Extend by (days)
            </Label>
            <Input
              id="trial-days"
              type="number"
              min={1}
              max={MAX_EXTENSION_DAYS}
              value={Number.isNaN(days) ? "" : days}
              onChange={event => setDays(event.target.valueAsNumber)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="trial-reason"
              className="text-xs"
            >
              Reason (needed to extend, 5 to 500 characters)
            </Label>
            <Input
              id="trial-reason"
              value={reason}
              maxLength={MAX_REASON}
              onChange={event => setReason(event.target.value)}
              className="h-9"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onExtend}
            disabled={busy || !reasonOk || !daysOk}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Extend trial
          </Button>
          <Button
            size="sm"
            onClick={onConvert}
            disabled={busy || (reason.trim() !== "" && !reasonOk)}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Convert to paid
          </Button>
        </div>
      </Card>
    </div>
  );
}
