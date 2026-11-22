import type {
  DriverBehaviorEvent, DriverBehaviorSeverity,
} from "@truckmoov/api/fleet";
import { format } from "date-fns";
import {
  CarFront, ShieldAlert,
} from "lucide-react";
import { useMemo } from "react";
import {
  DashboardListCard, DashboardListRow, NO_ENDPOINT, RowPill,
} from "./DashboardListCard";

const RECENT_LIMIT = 5;

const severityClasses: Record<DriverBehaviorSeverity, string> = {
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

/**
 * Driver or vehicle violations, derived from one list of behaviour events.
 * There is no per-vehicle violations endpoint, so the vehicle view groups the
 * same events by `vehicleId`.
 */
export function ViolationsCard({
  mode,
  events,
  total,
  criticalCount,
  driverName,
  vehiclePlate,
  isLoading,
  isError,
  onRetry,
}: {
  mode: "driver" | "vehicle";
  /** Most recent events (capped by the query's `limit`). */
  events: DriverBehaviorEvent[];
  /** Server totals for the whole period — `events` may be a capped slice. */
  total: number;
  criticalCount: number;
  driverName: (id: string) => string;
  vehiclePlate: (id: string | null) => string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const isDriver = mode === "driver";

  const stats = useMemo(
    () => {
      const perEntity = new Map<string, number>();
      for (const e of events) {
        const key = isDriver ? e.driverId : e.vehicleId;
        if (key) {
          perEntity.set(
            key,
            (perEntity.get(key) ?? 0) + 1,
          );
        }
      }
      return {
        total,
        critical: criticalCount,
        withViolations: perEntity.size,
        repeat: [...perEntity.values()].filter(n => n > 1).length,
      };
    },
    [
      events,
      isDriver,
      total,
      criticalCount,
    ],
  );

  const recent = useMemo(
    () => [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(
      0,
      RECENT_LIMIT,
    ),
    [events],
  );

  const tiles = [
    {
      label: "Total Violations", value: stats.total,
    },
    {
      label: "Critical Violations", value: stats.critical,
    },
    {
      label: isDriver ? "Drivers with violations" : "Vehicles with violations", value: stats.withViolations,
    },
    {
      label: "Repeat Offenders", value: stats.repeat,
    },
  ];

  return (
    <DashboardListCard
      icon={isDriver ? ShieldAlert : CarFront}
      tint="bg-destructive/10 text-destructive"
      title={isDriver ? "Driver Violations" : "Vehicle Violations"}
      count={isLoading || isError ? undefined : stats.total}
      description={isDriver ? "Summary of all recorded driver violations" : "Summary of all recorded vehicle violations"}
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
            <p className="text-xl font-bold truncate">{t.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Recent Violations</p>
      {recent.length === 0
        ? <p className="py-4 text-center text-sm text-muted-foreground">No violations recorded for this period.</p>
        : recent.map((e) => {
            const driver = driverName(e.driverId);
            const plate = vehiclePlate(e.vehicleId);
            // Reference: "LAG-234-XA · Lagos–Ibadan Expressway · Nov 21, 9:40 PM · 118 km/h (limit 100 km/h)".
            // The events endpoint has no place name, limit or g-force yet, so those read "-".
            const details = [
              isDriver ? plate : driver,
              NO_ENDPOINT,
              format(
                new Date(e.occurredAt),
                "MMM d, h:mm a",
              ),
              e.speedKph != null ? `${Math.round(e.speedKph)} km/h (limit ${NO_ENDPOINT})` : NO_ENDPOINT,
            ].join(" · ");
            return (
              <DashboardListRow
                key={e.id}
                title={`${isDriver ? driver : plate} · ${typeLabel(e.type)}`}
                subtitle={details}
                right={(
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Violation Severity</span>
                    <RowPill className={severityClasses[e.severity] ?? severityClasses.low}>
                      {capitalize(e.severity)}
                    </RowPill>
                  </div>
                )}
              />
            );
          })}
    </DashboardListCard>
  );
}
