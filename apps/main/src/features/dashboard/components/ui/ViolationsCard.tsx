import type {
  ViolationSeverity, ViolationSummary,
} from "@truckmoov/api/fleet";
import { format } from "date-fns";
import {
  CarFront, ShieldAlert,
} from "lucide-react";
import {
  DashboardListCard, DashboardListRow, NO_ENDPOINT, RowPill,
} from "./DashboardListCard";

const RECENT_LIMIT = 5;

const severityClasses: Record<ViolationSeverity, string> = {
  low: "bg-info/10 text-info border-info/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
};

const TYPE_LABELS: Record<string, string> = {
  speeding: "Overspeeding",
  overspeed: "Overspeeding",
  overspeeding: "Overspeeding",
  harsh_brake: "Harsh Braking",
  harsh_braking: "Harsh Braking",
  hard_brake: "Harsh Braking",
  harsh_accel: "Harsh Acceleration",
  harsh_acceleration: "Harsh Acceleration",
  hard_accel: "Harsh Acceleration",
  sharp_turn: "Sharp Turn",
  harsh_cornering: "Sharp Turn",
};

function typeLabel(type: string) {
  return TYPE_LABELS[type.toLowerCase()]
    ?? type.replace(
      /[_-]+/g,
      " ",
    ).replace(
      /\b\w/g,
      c => c.toUpperCase(),
    );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Driver or vehicle violations from the rules-based `/fleet/violations` summary. */
export function ViolationsCard({
  mode,
  summary,
  driverName,
  vehiclePlate,
  isLoading,
  isError,
  onRetry,
}: {
  mode: "driver" | "vehicle";
  summary: ViolationSummary | undefined;
  driverName: (id: string | null) => string;
  vehiclePlate: (id: string | null) => string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const isDriver = mode === "driver";
  const recent = summary?.items.slice(
    0,
    RECENT_LIMIT,
  ) ?? [];

  const tiles = [
    {
      label: "Total Violations", value: summary?.total,
    },
    {
      label: "Critical Violations", value: summary?.criticalCount,
    },
    {
      label: isDriver ? "Drivers with violations" : "Vehicles with violations", value: summary?.subjectsWithViolations,
    },
    {
      label: "Repeat Offenders", value: summary?.repeatOffenders,
    },
  ];

  return (
    <DashboardListCard
      icon={isDriver ? ShieldAlert : CarFront}
      tint="bg-destructive/10 text-destructive"
      title={isDriver ? "Driver Violations" : "Vehicle Violations"}
      count={isLoading || isError ? undefined : summary?.total}
      description={isDriver ? "Summary of driver violations for the selected period" : "Summary of vehicle violations for the selected period"}
      actionLabel="View All Violations"
      actionHref={isDriver ? "/drivers/violations" : "/fleet/violations"}
      status={{
        isLoading, isError, onRetry, isEmpty: false,
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
        {tiles.map(t => (
          <div
            key={t.label}
            className="rounded-lg bg-muted/40 p-3"
          >
            <p className="text-xs text-muted-foreground truncate">{t.label}</p>
            <p className="text-xl font-bold truncate">{t.value ?? NO_ENDPOINT}</p>
          </div>
        ))}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Recent Violations</p>
      {recent.length === 0
        ? <p className="py-4 text-center text-sm text-muted-foreground">No violations recorded for this period.</p>
        : recent.map((v) => {
            const driver = driverName(v.driverId);
            const plate = vehiclePlate(v.vehicleId);
            const reading = v.recordedValue
              ? (v.threshold ? `${v.recordedValue} (limit ${v.threshold})` : v.recordedValue)
              : NO_ENDPOINT;
            // Violations carry coordinates only, no place name.
            const details = [
              isDriver ? plate : driver,
              NO_ENDPOINT,
              format(
                new Date(v.occurredAt),
                "MMM d, h:mm a",
              ),
              reading,
            ].join(" · ");
            return (
              <DashboardListRow
                key={v.id}
                title={`${isDriver ? driver : plate} · ${v.ruleName || typeLabel(v.type)}`}
                subtitle={details}
                right={(
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Violation Severity</span>
                    <RowPill className={severityClasses[v.severity] ?? severityClasses.low}>
                      {capitalize(v.severity)}
                    </RowPill>
                  </div>
                )}
              />
            );
          })}
    </DashboardListCard>
  );
}
