import type {
  DispatchDriverStatusRequest, DispatchJob, DispatchJobStatus, DispatchJobTimelineEntry,
} from "@truckmoov/api/dispatch";

type StepStatus = Extract<DispatchJobStatus, "en-route" | "arrived" | "loaded" | "delivered">;

const NEXT_STEP: Record<string, StepStatus | undefined> = {
  "assigned": "en-route",
  "en-route": "arrived",
  "arrived": "loaded",
  "loaded": "delivered",
};

/** Plain wording for what the driver is doing at each step. */
export const STEP_LABEL: Record<string, string> = {
  "assigned": "Assigned",
  "en-route": "On the way to pickup",
  "arrived": "Arrived at pickup",
  "loaded": "Loaded and moving",
  "delivered": "Delivered",
};

export const STEP_ACTION: Record<StepStatus, string> = {
  "en-route": "Mark as on the way",
  "arrived": "Mark as arrived",
  "loaded": "Mark as loaded",
  "delivered": "Mark as delivered",
};

/** The one status a job can move to next. Moves are one step at a time. */
export function nextStep(status?: string): StepStatus | undefined {
  return status ? NEXT_STEP[status] : undefined;
}

export function stepLabel(status?: string) {
  return (status && STEP_LABEL[status]) || status || "Unknown";
}

export type PendingReport = {
  request: DispatchDriverStatusRequest;
  /** False when the job has already moved past, or not yet reached, what the driver reported. */
  actionable: boolean;
};

/** Driver replies waiting for a dispatcher, oldest first. */
export function pendingReports(job: Pick<DispatchJob, "status" | "driver_status_requests">): PendingReport[] {
  const expected = nextStep(job.status);
  return (job.driver_status_requests ?? [])
    .filter(request => request.state === "pending")
    .sort((a, b) => (a.requested_at ?? "").localeCompare(b.requested_at ?? ""))
    .map(request => ({
      request, actionable: request.requested_status === expected,
    }));
}

export type InstructionState
  = | { kind: "waiting" }
    | { kind: "sent" }
    | {
      kind: "not_sent" | "failed"; reason?: string;
    };

const INSTRUCTION_TYPES: Record<string, InstructionState["kind"]> = {
  driver_instruction_sent: "sent",
  driver_instruction_not_sent: "not_sent",
  driver_instruction_failed: "failed",
};

/**
 * What became of the message telling the driver about the job, from the
 * timeline. Only the latest attempt counts, and one made for an earlier
 * driver is ignored.
 */
export function instructionState(job: Pick<DispatchJob, "assigned_driver_id" | "timeline">): InstructionState {
  const entries = [...(job.timeline ?? [])].reverse();
  for (const entry of entries) {
    if (entry.type === "job_assigned" || entry.type === "job_reassigned")
      break;
    const kind = entry.type ? INSTRUCTION_TYPES[entry.type] : undefined;
    if (!kind)
      continue;
    if (entry.metadata?.driver_id && entry.metadata.driver_id !== job.assigned_driver_id)
      break;
    return kind === "sent" ? { kind } : {
      kind, reason: entry.metadata?.reason,
    };
  }
  return { kind: "waiting" };
}

/** A message may be sent again only while the driver has not started the job. */
export function canResendInstruction(job: Pick<DispatchJob, "status" | "assigned_driver_id" | "timeline">) {
  if (job.status !== "assigned" || !job.assigned_driver_id)
    return false;
  const state = instructionState(job);
  return state.kind === "not_sent" || state.kind === "failed";
}

export function sortedTimeline(job: Pick<DispatchJob, "timeline">): DispatchJobTimelineEntry[] {
  return [...(job.timeline ?? [])].sort((a, b) => (b.occurred_at ?? "").localeCompare(a.occurred_at ?? ""));
}

/** One line a dispatcher can read for a timeline entry. */
export function timelineText(entry: DispatchJobTimelineEntry): string {
  const meta = entry.metadata ?? {};
  switch (entry.type) {
    case "job_created":
      return "Job created";
    case "job_assigned":
      return "Driver assigned";
    case "job_reassigned":
      return "Job given to a new driver";
    case "vehicle_assigned":
      return "Vehicle assigned";
    case "job_status_updated":
      return `Status changed to ${stepLabel(meta.to_status).toLowerCase()}`;
    case "driver_status_reported":
      return `Driver reported: ${stepLabel(meta.requested_status).toLowerCase()}`;
    case "driver_status_confirmed":
      return `Dispatcher confirmed: ${stepLabel(meta.requested_status).toLowerCase()}`;
    case "driver_instruction_sent":
      return "Message sent to the driver";
    case "driver_instruction_not_sent":
      return meta.reason ? `Message not sent: ${meta.reason}` : "Message not sent";
    case "driver_instruction_failed":
      return meta.reason ? `Message could not be delivered: ${meta.reason}` : "Message could not be delivered";
    case "job_acknowledged":
      return "Driver acknowledged the job";
    case "job_cancelled":
      return meta.reason ? `Job cancelled: ${meta.reason}` : "Job cancelled";
    case "job_note_added":
      return "Note added";
    case "job_details_updated":
      return "Job details updated";
    case "scheduling_updated":
      return "Priority or time window updated";
    case "job_attachment_added":
      return meta.name ? `File attached: ${meta.name}` : "File attached";
    case "pod_attachment_added":
      return "Proof of delivery added";
    case "job_offer_accepted":
      return "Job accepted from another company";
    default:
      return entry.summary || "Update";
  }
}
