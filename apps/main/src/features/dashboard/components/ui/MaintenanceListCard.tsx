import type { MaintenanceProfile } from "@truckmoov/api/fleet";
import { differenceInCalendarDays } from "date-fns";
import {
  OctagonAlert, Wrench,
} from "lucide-react";
import {
  DashboardListCard, DashboardListRow, RowPill,
} from "./DashboardListCard";

const ROW_LIMIT = 5;

function dueLabel(nextDueDate: string | null, overdue: boolean) {
  if (!nextDueDate)
    return overdue ? "Overdue" : "Due soon";
  const days = differenceInCalendarDays(
    new Date(nextDueDate),
    new Date(),
  );
  if (overdue) {
    const late = Math.max(
      0,
      -days,
    );
    return late === 0 ? "Due today" : `${late} day${late === 1 ? "" : "s"} overdue`;
  }
  if (days <= 0)
    return "Due today";
  return `In ${days} day${days === 1 ? "" : "s"}`;
}

/** Maintenance Due (due + upcoming profiles) or Maintenance Overdue. */
export function MaintenanceListCard({
  variant,
  profiles,
  vehiclePlate,
  isLoading,
  isError,
  onRetry,
}: {
  variant: "due" | "overdue";
  profiles: MaintenanceProfile[];
  vehiclePlate: (id: string | null) => string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const overdue = variant === "overdue";
  return (
    <DashboardListCard
      icon={overdue ? OctagonAlert : Wrench}
      tint={overdue ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}
      title={overdue ? "Maintenance Overdue" : "Maintenance Due"}
      count={isLoading || isError ? undefined : profiles.length}
      description={overdue ? "Services past their due date" : "Upcoming scheduled services"}
      actionLabel="View Maintenance Records"
      actionHref="/fleet/maintenance"
      status={{
        isLoading,
        isError,
        onRetry,
        isEmpty: profiles.length === 0,
        emptyText: overdue ? "Nothing overdue." : "No services due soon.",
      }}
    >
      {profiles.slice(
        0,
        ROW_LIMIT,
      ).map(p => (
        <DashboardListRow
          key={p.id}
          title={`${vehiclePlate(p.vehicleId)} · ${p.serviceLabel}`}
          subtitle={p.currentMileage != null ? `Odometer ${p.currentMileage.toLocaleString("en-US")} km` : "Odometer —"}
          right={(
            <RowPill className={overdue ? "border-destructive/30 text-destructive" : "border-warning/30 text-warning"}>
              {dueLabel(
                p.nextDueDate,
                overdue,
              )}
            </RowPill>
          )}
        />
      ))}
    </DashboardListCard>
  );
}
