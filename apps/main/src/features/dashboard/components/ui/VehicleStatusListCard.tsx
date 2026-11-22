import type {
  FleetOverviewOperationalVehicle, MaintenanceRecord,
} from "@truckmoov/api/fleet";
import { differenceInCalendarDays } from "date-fns";
import {
  Construction, Truck,
} from "lucide-react";
import {
  DashboardListCard, DashboardListRow, RowPill,
} from "./DashboardListCard";

const ROW_LIMIT = 5;

/** First place name in an address: "VI, Lagos" → "VI". */
function place(address: string | null): string | null {
  return address?.split(",")[0]?.trim() || null;
}

function routeLabel(vehicle: FleetOverviewOperationalVehicle): string {
  const from = place(vehicle.pickupAddress);
  const to = place(vehicle.dropoffAddress);
  if (from && to)
    return `${from} → ${to}`;
  return vehicle.jobReference ? `Job ${vehicle.jobReference}` : "No active job";
}

/** Active vehicles with the driver and route they are currently running. */
export function VehiclesInOperationCard({
  vehicles,
  isLoading,
  isError,
  onRetry,
}: {
  vehicles: FleetOverviewOperationalVehicle[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <DashboardListCard
      icon={Truck}
      tint="bg-success/10 text-success"
      title="Vehicles in Operation"
      count={isLoading || isError ? undefined : vehicles.length}
      description="On route or currently on a job"
      actionLabel="View All Vehicles"
      actionHref="/fleet"
      status={{
        isLoading,
        isError,
        onRetry,
        isEmpty: vehicles.length === 0,
        emptyText: "No vehicles in operation.",
      }}
    >
      {vehicles.slice(
        0,
        ROW_LIMIT,
      ).map(vehicle => (
        <DashboardListRow
          key={vehicle.vehicleId}
          title={`${vehicle.plateNumber} · ${vehicle.driverName ?? "Unassigned"}`}
          subtitle={routeLabel(vehicle)}
          right={<RowPill className="border-success/30 text-success">Active</RowPill>}
        />
      ))}
    </DashboardListCard>
  );
}

type WorkshopStatus = "in_progress" | "scheduled" | "overdue";

const workshopPill: Record<WorkshopStatus, {
  label: string; className: string;
}> = {
  in_progress: {
    label: "In Progress", className: "border-warning/30 text-warning",
  },
  scheduled: {
    label: "Scheduled", className: "border-primary/30 text-primary",
  },
  overdue: {
    label: "Overdue", className: "border-destructive/30 text-destructive",
  },
};

function workshopStatus(r: MaintenanceRecord): WorkshopStatus {
  if (r.status === "in_progress")
    return "in_progress";
  if (r.scheduledDate && differenceInCalendarDays(
    new Date(r.scheduledDate),
    new Date(),
  ) < 0) {
    return "overdue";
  }
  return "scheduled";
}

function daysLabel(r: MaintenanceRecord) {
  if (!r.scheduledDate)
    return null;
  const days = Math.abs(differenceInCalendarDays(
    new Date(),
    new Date(r.scheduledDate),
  ));
  if (days === 0)
    return "today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Open maintenance records (scheduled or in progress) — vehicles at a workshop. */
export function VehiclesInMaintenanceCard({
  records,
  vehiclePlate,
  isLoading,
  isError,
  onRetry,
}: {
  records: MaintenanceRecord[];
  vehiclePlate: (id: string | null) => string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <DashboardListCard
      icon={Construction}
      tint="bg-warning/10 text-warning"
      title="Vehicles in Maintenance"
      count={isLoading || isError ? undefined : records.length}
      description="Vehicles currently at a workshop"
      actionLabel="View All Vehicles"
      actionHref="/fleet/maintenance"
      status={{
        isLoading, isError, onRetry, isEmpty: records.length === 0, emptyText: "No vehicles in maintenance.",
      }}
    >
      {records.slice(
        0,
        ROW_LIMIT,
      ).map((r) => {
        const pill = workshopPill[workshopStatus(r)];
        return (
          <DashboardListRow
            key={r.id}
            title={`${r.vehicleRegistrationNumber || vehiclePlate(r.vehicleId)} · ${r.description || r.maintenanceType}`}
            subtitle={[
              r.technician,
              daysLabel(r),
            ].filter(Boolean).join(" · ") || "—"}
            right={<RowPill className={pill.className}>{pill.label}</RowPill>}
          />
        );
      })}
    </DashboardListCard>
  );
}
