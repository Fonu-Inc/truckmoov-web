import type { SystemAuditLogEntry } from "@truckmoov/api/auth";
import { formatDateInTimezone } from "@truckmoov/app-core/utils/time-utils";
import { usePreferences } from "@/contexts/PreferencesContext";
import { actorName } from "./devicesSimsData";
import { SectionCard } from "./SectionCard";

type Props = {
  history: SystemAuditLogEntry[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

const SIM_ACTIONS = new Set([
  "system.sim.suspension_changed",
  "system.sim.reassigned",
  "system.sim.updated",
]);

function describe(entry: SystemAuditLogEntry) {
  const who = actorName(entry);
  const company = entry.tenantName ? ` (${entry.tenantName})` : "";
  switch (entry.action) {
    case "system.sim.reassigned":
      return `${who} moved a SIM to another company${company}.`;
    case "system.sim.updated":
      return `${who} changed a SIM's plan or details${company}.`;
    default:
      return entry.summary?.toLowerCase().includes("reactivat")
        ? `${who} reinstated a SIM${company}.`
        : `${who} suspended a SIM${company}.`;
  }
}

export function SimHistorySection({
  history,
  isLoading,
  isError,
  onRetry,
}: Props) {
  const { timezone } = usePreferences();
  const rows = history.filter(e => SIM_ACTIONS.has(e.action));
  return (
    <SectionCard
      title="SIM history"
      description="Recent SIM changes made by staff, newest first."
      rows={rows}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      emptyText="No SIM changes recorded."
      rowKey={e => e.id}
      renderRow={e => (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">{describe(e)}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateInTimezone(
              e.occurredAt,
              timezone,
              { dateStyle: "medium", timeStyle: "short" },
            )}
          </p>
        </div>
      )}
    />
  );
}
