import type { DispatchJob } from "@truckmoov/api/dispatch";
import { useCancelJob } from "@truckmoov/api/dispatch";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";

type CancelJobDialogProps = {
  job: DispatchJob | null;
  onOpenChange: (open: boolean) => void;
};

function CancelJobForm({
  job, onOpenChange, onPendingChange,
}: {
  job: DispatchJob;
  onOpenChange: (open: boolean) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const cancelJob = useCancelJob();
  const [
    reason,
    setReason,
  ] = useState("");
  const trimmed = reason.trim();

  const handleCancel = () => {
    if (!job.id || !trimmed)
      return;
    onPendingChange(true);
    cancelJob.mutate(
      {
        jobId: job.id,
        data: { reason: trimmed },
      },
      {
        onSuccess: () => {
          toast.success("Job cancelled");
          onOpenChange(false);
        },
        onError: error => toast.error(error.message),
        onSettled: () => onPendingChange(false),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cancel this job?</DialogTitle>
        <DialogDescription>
          {`Job ${job.reference || job.id || ""} will be cancelled and any assigned driver or vehicle released. Tell us why, so the record shows it.`}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label
          htmlFor="cancel-reason"
          required
        >
          Reason for cancelling
        </Label>
        <Textarea
          id="cancel-reason"
          rows={3}
          maxLength={300}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="For example: the customer called the delivery off"
        />
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          disabled={cancelJob.isPending}
          onClick={() => onOpenChange(false)}
        >
          Keep Job
        </Button>
        <Button
          variant="destructive"
          disabled={!trimmed || cancelJob.isPending}
          onClick={handleCancel}
        >
          {cancelJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cancel Job
        </Button>
      </DialogFooter>
    </>
  );
}

/** Asks why before cancelling: the reason is kept on the job's timeline. */
export function CancelJobDialog({
  job, onOpenChange,
}: CancelJobDialogProps) {
  const [
    pending,
    setPending,
  ] = useState(false);

  return (
    <Dialog
      open={job !== null}
      onOpenChange={(open) => {
        if (!pending)
          onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md bg-card border-border">
        {job && (
          <CancelJobForm
            key={job.id}
            job={job}
            onOpenChange={onOpenChange}
            onPendingChange={setPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
