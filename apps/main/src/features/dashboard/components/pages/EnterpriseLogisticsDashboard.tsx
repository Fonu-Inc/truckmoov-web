import type {
  OverviewActivity, OverviewDriver, OverviewJob, OverviewVehicle,
} from "../ui/OverviewSections";
import {
  useDevicesSummary,
  useDriverBehaviorEvents,
  useDrivers,
  useFleetOverview,
  useMaintenanceProfiles,
  useMaintenanceRecords,
  useVehicles,
} from "@truckmoov/api/fleet";
import {
  CalendarRange, Cpu, Package, Truck, Users,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { MaintenanceListCard } from "../ui/MaintenanceListCard";
import {
  DriversOverviewCard,
  JobsOverviewCard,

  RecentActivityCard,
  VehiclesOverviewCard,
} from "../ui/OverviewSections";
import { QuickActionsCard } from "../ui/QuickActionsCard";
import {
  VehiclesInMaintenanceCard, VehiclesInOperationCard,
} from "../ui/VehicleStatusListCard";
import { ViolationsCard } from "../ui/ViolationsCard";

/**
 * The period filter drives the violations cards — the behaviour-events
 * endpoint is the only one here that takes a period (`period_days`). The
 * overview, maintenance and device endpoints have no period parameter yet.
 * Calendar periods are approximated as day windows ending today.
 */
const PERIODS = [
  {
    value: "overall", label: "Overall", days: undefined,
  },
  {
    value: "today", label: "Today", days: 1,
  },
  {
    value: "yesterday", label: "Yesterday", days: 2,
  },
  {
    value: "this_week", label: "This Week", days: 7,
  },
  {
    value: "last_week", label: "Last Week", days: 14,
  },
  {
    value: "this_month", label: "This Month", days: 30,
  },
  {
    value: "last_six_months", label: "Last Six Months", days: 180,
  },
  {
    value: "this_year", label: "This Year", days: 365,
  },
] as const;

type PeriodValue = (typeof PERIODS)[number]["value"];

/** Recent events shown in the violations lists; stats come from the server totals. */
const VIOLATION_EVENTS_LIMIT = 100;

const ACTIVITY_DESCRIPTIONS: Record<string, string> = {
  job: "A job was created or updated for your fleet.",
  vehicle: "This vehicle's status or location was updated.",
  driver: "This driver's details or availability were updated.",
  maintenance: "Maintenance activity was recorded for this vehicle.",
};

function activityDescription(entityType: string, action: string) {
  const type = entityType.toLowerCase();
  // The generic "…was updated" lines would misdescribe a removal.
  if (/delet|remov/i.test(action))
    return undefined;
  if (type === "job" && /complet|deliver/i.test(action))
    return "A job was completed and marked as delivered.";
  return ACTIVITY_DESCRIPTIONS[type];
}

/** "6 min ago", "1 hr ago", "3 hrs ago", "2 days ago". */
function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (Number.isNaN(minutes))
    return "—";
  if (minutes < 1)
    return "just now";
  if (minutes < 60)
    return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export default function EnterpriseLogisticsDashboard() {
  const [
    period,
    setPeriod,
  ] = useState<PeriodValue>("overall");
  const periodDays = PERIODS.find(p => p.value === period)?.days;

  const {
    data, isLoading, isError, refetch,
  } = useFleetOverview();
  const devicesSummary = useDevicesSummary();
  const violations = useDriverBehaviorEvents({
    params: {
      period_days: periodDays, limit: VIOLATION_EVENTS_LIMIT,
    },
  });
  const maintenanceProfiles = useMaintenanceProfiles();
  const maintenanceRecords = useMaintenanceRecords();
  // Name/plate lookups for the id-only rows (violations, maintenance profiles).
  const vehicles = useVehicles();
  const drivers = useDrivers();

  const overview = data?.data;

  const plateById = useMemo(
    () => new Map((vehicles.data?.data ?? []).map(v => [
      v.id,
      v.plateNumber || v.registrationNumber,
    ])),
    [vehicles.data],
  );
  const nameById = useMemo(
    () => new Map((drivers.data?.data ?? []).map(d => [
      d.id,
      d.name || `${d.firstName} ${d.lastName}`.trim(),
    ])),
    [drivers.data],
  );
  const vehiclePlate = (id: string | null) => (id && plateById.get(id)) || "Unknown vehicle";
  const driverName = (id: string) => nameById.get(id) || "Unknown driver";

  const {
    dueProfiles, overdueProfiles,
  } = useMemo(
    () => {
      const all = maintenanceProfiles.data?.data ?? [];
      const byDueDate = (a: { nextDueDate: string | null }, b: { nextDueDate: string | null }) =>
        (a.nextDueDate ?? "9999").localeCompare(b.nextDueDate ?? "9999");
      return {
        dueProfiles: all.filter(p => p.lifecycleStatus === "due" || p.lifecycleStatus === "upcoming").sort(byDueDate),
        overdueProfiles: all.filter(p => p.lifecycleStatus === "overdue").sort(byDueDate),
      };
    },
    [maintenanceProfiles.data],
  );

  const openMaintenanceRecords = useMemo(
    () => (maintenanceRecords.data?.data ?? []).filter(r => r.status === "in_progress" || r.status === "scheduled"),
    [maintenanceRecords.data],
  );

  const overviewJobs = useMemo<OverviewJob[]>(
    () => {
      if (!overview)
        return [];
      return overview.jobs.items.map(j => ({
        id: j.id,
        reference: j.reference,
        status: j.status,
        pickup_address: j.pickupAddress,
        delivery_address: j.dropoffAddress,
        amount_ngn: j.amountNgn,
        created_at: j.createdAt,
      }));
    },
    [overview],
  );

  const overviewVehicles = useMemo<OverviewVehicle[]>(
    () => {
      if (!overview)
        return [];
      return overview.vehicles.items.map(v => ({
        id: v.id,
        registration_number: v.plateNumber,
        make: v.make,
        model: v.model,
        year: v.year,
        status: v.status,
      }));
    },
    [overview],
  );

  const overviewDrivers = useMemo<OverviewDriver[]>(
    () => {
      if (!overview)
        return [];
      return overview.drivers.items.map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        licenseNumber: d.licenseNumber,
        status: d.status,
        score: d.performanceScore,
      }));
    },
    [overview],
  );

  const recentActivity = useMemo<OverviewActivity[]>(
    () => {
      if (!overview)
        return [];
      return overview.recentActivity.map(a => ({
        id: a.id,
        title: a.summary || a.action,
        description: activityDescription(
          a.entityType,
          a.action,
        ),
        time: timeAgo(a.occurredAt),
      }));
    },
    [overview],
  );

  if (isLoading)
    return <EnterpriseLogisticsDashboardSkeleton />;
  if (isError || !overview) {
    return <EnterpriseLogisticsDashboardError onRetry={() => refetch()} />;
  }

  const violationEvents = violations.data?.data.items ?? [];
  const violationProps = {
    events: violationEvents,
    total: violations.data?.data.total ?? violationEvents.length,
    criticalCount: violations.data?.data.criticalCount ?? 0,
    driverName,
    vehiclePlate,
    isLoading: violations.isLoading,
    isError: violations.isError,
    onRetry: () => violations.refetch(),
  };

  const maintenanceProfilesState = {
    vehiclePlate,
    isLoading: maintenanceProfiles.isLoading,
    isError: maintenanceProfiles.isError,
    onRetry: () => maintenanceProfiles.refetch(),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select
          value={period}
          onValueChange={v => setPeriod(v as PeriodValue)}
        >
          <SelectTrigger className="h-10 px-3.5 w-[180px] rounded-xl">
            <CalendarRange className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map(p => (
              <SelectItem
                key={p.value}
                value={p.value}
              >
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QuickActionsCard />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vehicles"
          value={overview.cards.totalVehicles}
          icon={Truck}
        />
        <StatCard
          title="Total Jobs"
          value={overview.cards.totalJobs}
          icon={Package}
        />
        <StatCard
          title="Total Drivers"
          value={overview.cards.totalDrivers}
          icon={Users}
        />
        <StatCard
          title="Total Devices"
          value={devicesSummary.isLoading ? "…" : devicesSummary.isError ? "—" : (devicesSummary.data?.data.total ?? 0)}
          icon={Cpu}
        />
      </div>

      <div className="space-y-6">
        <ViolationsCard
          mode="driver"
          {...violationProps}
        />
        <ViolationsCard
          mode="vehicle"
          {...violationProps}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <MaintenanceListCard
            variant="due"
            profiles={dueProfiles}
            {...maintenanceProfilesState}
          />
          <MaintenanceListCard
            variant="overdue"
            profiles={overdueProfiles}
            {...maintenanceProfilesState}
          />
          <VehiclesInOperationCard />
          <VehiclesInMaintenanceCard
            records={openMaintenanceRecords}
            vehiclePlate={vehiclePlate}
            isLoading={maintenanceRecords.isLoading}
            isError={maintenanceRecords.isError}
            onRetry={() => maintenanceRecords.refetch()}
          />
        </div>
      </div>

      <JobsOverviewCard
        jobs={overviewJobs}
        jobsHref="/jobs"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <VehiclesOverviewCard
          vehicles={overviewVehicles}
          vehiclesHref="/fleet"
        />
        <DriversOverviewCard
          drivers={overviewDrivers}
          driversHref="/drivers"
        />
      </div>

      <RecentActivityCard items={recentActivity} />
    </div>
  );
}

function StatCardSkeleton() {
  return <Skeleton className="h-[98px] w-full rounded-lg" />;
}

function ListCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="rounded-2xl surface-sleek">
      <CardHeader className="p-6 pb-4 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-10 w-full"
          />
        ))}
      </CardContent>
    </Card>
  );
}

function EnterpriseLogisticsDashboardSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[180px] rounded-xl" />
      </div>

      <ListCardSkeleton rows={1} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <ListCardSkeleton rows={5} />
      <ListCardSkeleton rows={5} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ListCardSkeleton rows={4} />
        <ListCardSkeleton rows={4} />
      </div>
    </div>
  );
}

function EnterpriseLogisticsDashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="bg-card/50 border-border/50 border-l-2 border-l-destructive">
      <CardHeader>
        <CardTitle>Couldn't load the overview</CardTitle>
        <CardDescription>
          The fleet overview didn't respond. Check your connection and try again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onRetry}>Try again</Button>
      </CardContent>
    </Card>
  );
}
