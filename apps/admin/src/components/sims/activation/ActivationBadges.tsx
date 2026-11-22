import type { SystemSimBatch } from "@truckmoov/api/auth";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Progress } from "@/components/shadcn/progress";
import {
  emptyValue,
  getProgressPercentage,
} from "./activationShared";

export function ActivationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge className="border-muted bg-muted text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "in_progress":
    case "activation_in_progress":
      return (
        <Badge className="border-primary/30 bg-primary/10 text-primary">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          In Progress
        </Badge>
      );
    case "completed":
      return (
        <Badge className="border-success/30 bg-success/10 text-success">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    case "partially_completed":
      return (
        <Badge className="border-warning/30 bg-warning/10 text-warning">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Needs Attention
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status || emptyValue}</Badge>;
  }
}

export function ProgressCell({ batch }: { batch: SystemSimBatch }) {
  return (
    <div className="w-32 space-y-1">
      <Progress
        value={getProgressPercentage(batch)}
        className="h-2"
      />
      <p className="text-xs text-muted-foreground">
        {`${batch.simsActivated} / ${batch.quantity}`}
        {batch.simsFailed > 0 && (
          <span className="ml-1 text-destructive">{`(${batch.simsFailed} failed)`}</span>
        )}
      </p>
    </div>
  );
}
