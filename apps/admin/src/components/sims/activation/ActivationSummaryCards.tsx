import type { SystemSimBatchesSummary } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  icon: ReactNode;
  value: number | undefined;
  note: string;
  isLoading: boolean;
  valueClassName?: string;
  className?: string;
};

function StatCard({
  title,
  icon,
  value,
  note,
  isLoading,
  valueClassName,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading
          ? <Skeleton className="h-8 w-16" />
          : (
              <div className={cn(
                "text-2xl font-bold",
                valueClassName,
              )}
              >
                {value ?? "-"}
              </div>
            )}
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

type Props = {
  summary: SystemSimBatchesSummary | undefined;
  isLoading: boolean;
};

export function ActivationSummaryCards({
  summary,
  isLoading,
}: Props) {
  const needsAttention = summary?.needsAttention ?? 0;
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <StatCard
        title="Total SIMs Queued"
        icon={<Zap className="h-4 w-4 text-warning" />}
        value={summary?.totalSimsQueued}
        note="Awaiting activation"
        isLoading={isLoading}
        valueClassName="text-warning"
      />
      <StatCard
        title="Pending Activation"
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        value={summary?.pendingActivation}
        note="Awaiting auto-activation"
        isLoading={isLoading}
      />
      <StatCard
        title="In Progress"
        icon={<Loader2 className="h-4 w-4 animate-spin text-primary" />}
        value={summary?.inProgress}
        note="Currently activating"
        isLoading={isLoading}
        valueClassName="text-primary"
      />
      <StatCard
        title="Completed"
        icon={<CheckCircle2 className="h-4 w-4 text-success" />}
        value={summary?.completed}
        note="Activation finished"
        isLoading={isLoading}
        valueClassName="text-success"
      />
      <StatCard
        title="Needs Attention"
        icon={(
          <AlertCircle className={cn(
            "h-4 w-4",
            needsAttention > 0 ? "text-warning" : "text-muted-foreground",
          )}
          />
        )}
        value={summary?.needsAttention}
        note={needsAttention > 0 ? "Failed or partial batches" : "No batches need attention"}
        isLoading={isLoading}
        valueClassName={needsAttention > 0 ? "text-warning" : undefined}
        className={needsAttention > 0 ? "border-warning/50" : undefined}
      />
    </div>
  );
}
