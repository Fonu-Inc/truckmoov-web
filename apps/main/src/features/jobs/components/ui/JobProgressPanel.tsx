import type { DispatchJob } from "@truckmoov/api/dispatch";
import {
  useConfirmDriverStatusRequest,
  useResendDriverInstruction,
  useUpdateJobStatus,
} from "@truckmoov/api/dispatch";
import { format } from "date-fns";
import {
  AlertTriangle, Ban, CheckCircle2, Loader2, MessageSquare, RotateCw, Send,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  canResendInstruction,
  instructionState,
  nextStep,
  pendingReports,
  STEP_ACTION,
  stepLabel,
} from "@/features/jobs/utils/jobProgress";

type JobProgressPanelProps = {
  job: DispatchJob;
  onCancel: () => void;
};

function InstructionLine({ job }: { job: DispatchJob }) {
  const resend = useResendDriverInstruction();
  const state = instructionState(job);

  if (!job.assigned_driver_id || job.status === "cancelled")
    return null;

  const text = {
    waiting: "Message to the driver: waiting to go out",
    sent: "Message to the driver: sent",
    not_sent: `Message to the driver: not sent${"reason" in state && state.reason ? ` (${state.reason})` : ""}`,
    failed: `Message to the driver: could not be delivered${"reason" in state && state.reason ? ` (${state.reason})` : ""}`,
  }[state.kind];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
      <p className="flex items-center gap-2 text-sm">
        {state.kind === "sent"
          ? <Send className="h-4 w-4 text-success" />
          : <MessageSquare className={state.kind === "waiting" ? "h-4 w-4 text-muted-foreground" : "h-4 w-4 text-warning"} />}
        <span>{text}</span>
      </p>
      {canResendInstruction(job) && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={resend.isPending}
          onClick={() => resend.mutate(
            { jobId: job.id ?? "" },
            {
              onSuccess: () => toast.success("Message queued. The result shows here shortly."),
              onError: error => toast.error(error.message),
            },
          )}
        >
          {resend.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCw className="mr-1.5 h-3.5 w-3.5" />}
          Send again
        </Button>
      )}
    </div>
  );
}

function DriverReports({ job }: { job: DispatchJob }) {
  const confirm = useConfirmDriverStatusRequest();
  const reports = pendingReports(job);

  if (reports.length === 0)
    return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-warning">
        Waiting for you to confirm
      </p>
      {reports.map(({
        request, actionable,
      }) => (
        <div
          key={request.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{`Driver says: ${stepLabel(request.requested_status).toLowerCase()}`}</p>
            <p className="text-[11px] text-muted-foreground">
              {[
                request.requested_at ? format(
                  new Date(request.requested_at),
                  "MMM dd, HH:mm",
                ) : undefined,
                request.raw_message ? `"${request.raw_message}"` : undefined,
              ].filter(Boolean).join(" · ")}
            </p>
            {!actionable && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                {`This does not match where the job is now (${stepLabel(job.status).toLowerCase()}).`}
              </p>
            )}
          </div>
          {actionable && (
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={confirm.isPending}
              onClick={() => confirm.mutate(
                {
                  jobId: job.id ?? "", requestId: request.id ?? "",
                },
                {
                  onSuccess: () => toast.success("Status confirmed"),
                  onError: error => toast.error(error.message),
                },
              )}
            >
              {confirm.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
              Confirm
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusStep({ job }: { job: DispatchJob }) {
  const updateStatus = useUpdateJobStatus();
  const next = nextStep(job.status);

  if (!next) {
    const hint = job.status === "created" ? "Assign a driver to start this job." : undefined;
    return hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null;
  }

  return (
    <Button
      size="sm"
      disabled={updateStatus.isPending}
      onClick={() => updateStatus.mutate(
        {
          jobId: job.id ?? "", data: { status: next },
        },
        {
          onSuccess: () => toast.success(`Job is now: ${stepLabel(next).toLowerCase()}`),
          onError: error => toast.error(error.message),
        },
      )}
    >
      {updateStatus.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
      {STEP_ACTION[next]}
    </Button>
  );
}

export function JobProgressPanel({
  job, onCancel,
}: JobProgressPanelProps) {
  const finished = job.status === "delivered" || job.status === "cancelled";

  return (
    <section className="space-y-3 rounded-2xl border border-border/60 bg-background/40 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">Progress</h3>
        <Badge
          variant="outline"
          className="text-[10px]"
        >
          {stepLabel(job.status)}
        </Badge>
      </header>

      <InstructionLine job={job} />
      <DriverReports job={job} />

      {job.status === "cancelled" && job.cancellation_reason && (
        <p className="text-sm text-muted-foreground">{`Cancelled: ${job.cancellation_reason}`}</p>
      )}

      {!finished && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusStep job={job} />
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={onCancel}
          >
            <Ban className="mr-1.5 h-3.5 w-3.5" />
            Cancel job
          </Button>
        </div>
      )}
    </section>
  );
}
