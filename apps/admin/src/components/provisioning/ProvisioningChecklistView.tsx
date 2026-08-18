import { formatDateTime, formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import { CheckCircle2, Loader2, Circle, Settings } from "lucide-react";
import {
  DEVICE_PROVISIONING_STEPS,
  SIM_PROVISIONING_STEPS,
  type ProvisioningStep,
} from "@/lib/provisioningEngineSim";

interface Props {
  /** Saved checklist from DB (may be null/undefined before approval). */
  checklist?: ProvisioningStep[] | null;
  type: "device" | "sim";
  startedAt?: string | null;
  completedAt?: string | null;
}

/**
 * Visualises the External Provisioning Engine progress.
 * Renders the 4-step checklist with per-step status icons and timestamps.
 * The engine is treated as a black box — we just show what it reports.
 */
export function ProvisioningChecklistView({
  checklist,
  type,
  startedAt,
  completedAt,
}: Props) {
  const fallback =
    type === "device" ? DEVICE_PROVISIONING_STEPS : SIM_PROVISIONING_STEPS;
  const steps =
    Array.isArray(checklist) && checklist.length > 0 ? checklist : fallback;

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const total = steps.length;
  const pct = Math.round((completedCount / total) * 100);

  return (
    <div className="rounded-md border border-border p-4 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Provisioning Engine
        </p>
        <span className="text-xs text-muted-foreground">
          {completedCount} / {total} steps · {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2 pt-1">
        {steps.map((step) => (
          <li key={step.key} className="flex items-start gap-2 text-sm">
            {step.status === "completed" ? (
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
            ) : step.status === "in_progress" ? (
              <Loader2 className="h-4 w-4 text-info mt-0.5 shrink-0 animate-spin" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={
                  step.status === "completed"
                    ? "text-foreground"
                    : step.status === "in_progress"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                }
              >
                {step.label}
              </p>
              {step.completed_at && (
                <p className="text-xs text-muted-foreground">
                  {formatWithPattern(step.completed_at, "MMM d, HH:mm:ss")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {(startedAt || completedAt) && (
        <div className="text-xs text-muted-foreground pt-2 border-t border-border space-y-0.5">
          {startedAt && (
            <p>Started: {formatDateTime(startedAt)}</p>
          )}
          {completedAt && (
            <p>Completed: {formatDateTime(completedAt)}</p>
          )}
        </div>
      )}
    </div>
  );
}



