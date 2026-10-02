import type { EnforcementCascadeStatus, EnforcementRow } from "@truckmoov/api/billing";
import { BILLING_QUERY_KEY } from "@truckmoov/api/billing";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";

export type StageBadge = { label: string; tone: "success" | "warning" | "destructive" | "muted" };

const MS_PER_DAY = 86_400_000;

export function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

export function stageBadge(row: EnforcementRow | undefined): StageBadge {
  if (!row || row.stage === "current")
    return { label: "Not overdue", tone: "success" };
  if (row.stage === "in_grace") {
    const left = row.graceDaysLeft ?? 0;
    return {
      label: left === 0 ? "In grace: last day" : `In grace: ${plural(left, "day")} left`,
      tone: "warning",
    };
  }
  const graceDays = daysBetween(row.dueDate, row.graceEndsAt);
  const ago = Math.max(0, row.daysOverdue - graceDays);
  return {
    label: ago === 0 ? "Grace ended today" : `Grace ended ${plural(ago, "day")} ago`,
    tone: "destructive",
  };
}

export function dueDateText(row: EnforcementRow | undefined) {
  return row ? `Due ${formatDate(row.dueDate)}` : null;
}

export function suspensionCauseText(row: EnforcementRow | undefined, suspendedByName: string | null, reason: string | null) {
  if (row?.suspensionCause === "non_payment")
    return `Suspended automatically: unpaid since ${formatDate(row.dueDate)}`;
  const who = suspendedByName ?? "staff";
  return reason ? `Suspended by ${who}: ${reason}` : `Suspended by ${who}`;
}

export function cascadeWarning(status: EnforcementCascadeStatus | null | undefined) {
  if (!status || status === "complete")
    return null;
  return "Suspension not finished for all items, retrying";
}

export function invalidateEnforcement() {
  void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.enforcementRoot });
}
