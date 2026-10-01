// The dispatch API reports created / assigned / en-route / arrived / loaded /
// delivered / cancelled; the page groups them into fleetflow's five stages.
export type JobStatusTone = "created" | "assigned" | "in_progress" | "completed" | "cancelled";

const TONE: Record<string, JobStatusTone> = {
  "pending": "created",
  "created": "created",
  "assigned": "assigned",
  "accepted": "in_progress",
  "in_progress": "in_progress",
  "en-route": "in_progress",
  "arrived": "in_progress",
  "loaded": "in_progress",
  "completed": "completed",
  "delivered": "completed",
  "cancelled": "cancelled",
};

export function jobStatusTone(status: string): JobStatusTone {
  return TONE[status] ?? "created";
}

export function jobStatusLabel(status: string) {
  const tone = jobStatusTone(status);
  return tone === "created" ? "unassigned" : tone.replace(
    "_",
    " ",
  );
}

export const STATUS_BADGE: Record<JobStatusTone, string> = {
  created: "bg-muted text-muted-foreground border-muted",
  assigned: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-muted",
  normal: "bg-primary/20 text-primary border-primary/30",
  high: "bg-warning/20 text-warning border-warning/30",
  urgent: "bg-destructive/20 text-destructive border-destructive/30",
};
