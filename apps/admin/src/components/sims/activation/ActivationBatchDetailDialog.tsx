import type { SystemSimBatch } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import { formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import { DetailSkeleton } from "@/components/ui/skeletons";
import {
  ActivationStatusBadge,
  emptyValue,
  getProgressPercentage,
} from "./activationShared";

type Props = {
  open: boolean;
  batch: SystemSimBatch | null;
  isLoading: boolean;
  isError: boolean;
  onRetryLoad: () => void;
  onClose: () => void;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="font-medium">{children}</div>
    </div>
  );
}

function BatchBody({ batch }: { batch: SystemSimBatch }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status"><ActivationStatusBadge status={batch.status} /></Field>
        <Field label="Devices requested">
          {batch.quantity}
          {" "}
          device(s)
        </Field>
        <Field label="Carrier">{batch.operator || "Any"}</Field>
        <Field label="Tenant">{batch.tenantName || batch.tenantId}</Field>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>
            {batch.simsActivated}
            {" "}
            activated,
            {" "}
            {batch.simsFailed}
            {" "}
            failed
          </span>
        </div>
        <Progress value={getProgressPercentage(batch)} />
      </div>

      {batch.errorMessage && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {batch.errorMessage}
        </div>
      )}

      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Created</p>
          <p>{formatDayMonthTime(batch.createdAt, emptyValue)}</p>
        </div>
        {batch.startedAt && (
          <div>
            <p className="text-muted-foreground">Started</p>
            <p>{formatDayMonthTime(batch.startedAt, emptyValue)}</p>
          </div>
        )}
        {batch.completedAt && (
          <div>
            <p className="text-muted-foreground">Completed</p>
            <p>{formatDayMonthTime(batch.completedAt, emptyValue)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivationBatchDetailDialog({
  open,
  batch,
  isLoading,
  isError,
  onRetryLoad,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Activation Batch Details</DialogTitle>
          <DialogDescription>
            {batch ? `Batch #${batch.id.slice(0, 8)} • ${batch.tenantName}` : "Loading batch details..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-5" aria-hidden>
            <DetailSkeleton items={6} />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        )}
        {isError && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <p>Unable to load batch details.</p>
            <Button variant="link" onClick={onRetryLoad}>Try again</Button>
          </div>
        )}
        {batch && !isLoading && <BatchBody batch={batch} />}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
