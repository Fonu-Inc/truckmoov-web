import type { MaintenanceRecord } from "@truckmoov/api/fleet";
import { differenceInCalendarDays } from "date-fns";
import {
  Construction, Truck,
} from "lucide-react";
import {
  DashboardListCard, DashboardListRow, RowPill,
} from "./DashboardListCard";

const ROW_LIMIT = 5;

// ponytail: mock data from fleetflow parity port — wire to packages/api
// (/fleet/tracking/live carries vehicle + job, but 404s on dev-api; see types.ts).
const vehiclesInOperation = [
  {
    id: "op-1", plate: "LAG-114-XA", driver: "Emeka Okafor", route: "VI → Ibadan",
  },
  {
    id: "op-2", plate: "ABJ-405-KL", driver: "Aisha Bello", route: "Tin Can → Abuja",
  },
  {
    id: "op-3", plate: "KAN-771-BQ", driver: "Chinedu Obi", route: "Lekki FZ → Kaduna",
  },
  {
    id: "op-4", plate: "PHC-233-ZR", driver: "Fatima Musa", route: "Lekki → PH",
  },
];

export function VehiclesInOperationCard() {
  return (
    <DashboardListCard
      icon={Truck}
      tint="bg-success/10 text-success"
      title="Vehicles in Operation"
      count={vehiclesInOperation.length}
      description="On route or currently on a job"
      actionLabel="View All Vehicles"
      actionHref="/fleet"
      status={{
        isEmpty: vehiclesInOperation.length === 0, emptyText: "No vehicles on a job right now.",
      }}
    >
      {vehiclesInOperation.map(v => (
        <DashboardListRow
          key={v.id}
          title={`${v.plate} · ${v.driver}`}
          subtitle={v.route}
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
