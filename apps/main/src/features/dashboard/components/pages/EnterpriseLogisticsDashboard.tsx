import { useFleetOverview } from "@truckmoov/api/fleet";
import {
  Package, Truck, Users, Wallet,
} from "lucide-react";
import { useMemo } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ActiveDeliveriesMap, type DeliveryPoint } from "../ui/ActiveDeliveriesMap";
import {
  DriversOverviewCard,
  FleetUtilizationCard,
  JobsOverviewCard,
  RecentActivityCard,
  RecentAlertsCard,
  RecentChatsCard,
  VehiclesOverviewCard,
  type OverviewActivity,
  type OverviewAlert,
  type OverviewChat,
  type OverviewDriver,
  type OverviewJob,
  type OverviewVehicle,
} from "../ui/OverviewSections";

// ponytail: `time` fields on RecentActivity/Alerts/Chats display the raw ISO
// string. Swap for a relative formatter when there is one — good enough for now.

const shortAddress = (address: string) => address.split(",")[0]?.trim() ?? address;

const severityFromAlert = (raw: string): OverviewAlert["severity"] => {
  const s = raw.toLowerCase();
  if (s === "critical" || s === "high") return "critical";
  if (s === "warning" || s === "medium") return "warning";
  return "info";
};

export default function EnterpriseLogisticsDashboard() {
  const { format: formatCurrency } = useCurrency();
  const { data, isLoading, isError, refetch } = useFleetOverview();

  const overview = data?.data;

  const deliveryPoints = useMemo<DeliveryPoint[]>(() => {
    if (!overview) return [];
    return overview.map.jobs.flatMap((job) => {
      const pickup = job.waypoints.find((w) => w.type === "pickup");
      const dropoff = job.waypoints.find((w) => w.type === "dropoff");
      if (!pickup || !dropoff) return [];
      return [{
        id: job.jobId,
        ref: job.reference,
        pickup: [pickup.latitude, pickup.longitude],
        delivery: [dropoff.latitude, dropoff.longitude],
        label: `${shortAddress(pickup.address)} → ${shortAddress(dropoff.address)}`,
      }];
    });
  }, [overview]);

  const overviewJobs = useMemo<OverviewJob[]>(() => {
    if (!overview) return [];
    return overview.jobs.items.map((j) => ({
      id: j.id,
      reference: j.reference,
      status: j.status,
      pickup_address: j.pickupAddress,
      delivery_address: j.dropoffAddress,
      amount_ngn: j.amountNgn,
      created_at: j.createdAt,
    }));
  }, [overview]);

  const overviewVehicles = useMemo<OverviewVehicle[]>(() => {
    if (!overview) return [];
    return overview.vehicles.items.map((v) => ({
      id: v.id,
      registration_number: v.plateNumber,
      make: v.make,
      model: v.model,
      year: v.year,
      status: v.status,
    }));
  }, [overview]);

  const overviewDrivers = useMemo<OverviewDriver[]>(() => {
    if (!overview) return [];
    return overview.drivers.items.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      licenseNumber: d.licenseNumber,
      status: d.status,
      score: d.performanceScore,
    }));
  }, [overview]);

  const utilizationByRegion = useMemo(() => {
    if (!overview) return [];
    return overview.fleetUtilization.map((r) => ({
      region: r.region,
      utilization: r.utilizationPercent,
    }));
  }, [overview]);

  const overviewAlerts = useMemo<OverviewAlert[]>(() => {
    if (!overview) return [];
    return overview.alerts.items.map((a) => ({
      id: a.id,
      title: a.type,
      description: a.details,
      severity: severityFromAlert(a.severity),
      time: a.triggeredAt,
    }));
  }, [overview]);

  const recentActivity = useMemo<OverviewActivity[]>(() => {
    if (!overview) return [];
    return overview.recentActivity.map((a) => ({
      id: a.id,
      title: a.summary || a.action,
      time: a.occurredAt,
    }));
  }, [overview]);

  const recentChats = useMemo<OverviewChat[]>(() => {
    if (!overview) return [];
    return overview.recentChats.map((c) => ({
      id: c.id,
      name: c.contactName,
      channel: c.channel,
      preview: c.lastMessage,
      time: c.lastMessageAt,
      unread: c.unreadCount,
    }));
  }, [overview]);

  if (isLoading) return <EnterpriseLogisticsDashboardSkeleton />;
  if (isError || !overview) {
    return <EnterpriseLogisticsDashboardError onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
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
          title="Revenue This Month"
          value={formatCurrency(overview.cards.revenueThisMonthNgn)}
          icon={Wallet}
          variant="success"
        />
      </div>

      <ActiveDeliveriesMap
        points={deliveryPoints}
        height="520px"
        description="Live view of pickups and drop-offs across the network"
      />

      <JobsOverviewCard
        jobs={overviewJobs}
        jobsHref="/jobs"
        formatCurrency={formatCurrency}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <FleetUtilizationCard
          data={utilizationByRegion}
          vehiclesHref="/fleet"
        />
        <RecentAlertsCard
          alerts={overviewAlerts}
          alertsHref="/map"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivityCard items={recentActivity} />
        <RecentChatsCard
          chats={recentChats}
          inboxHref="/inbox"
        />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  );
}

function ListCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function EnterpriseLogisticsDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <Skeleton className="h-[520px] w-full rounded-xl" />

      <ListCardSkeleton rows={5} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ListCardSkeleton rows={4} />
        <ListCardSkeleton rows={4} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ListCardSkeleton rows={4} />
        <ListCardSkeleton rows={4} />
      </div>

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
