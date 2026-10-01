import type { ColumnDef } from "@tanstack/react-table";
import type {
  TripDetail, TripStatus,
} from "@/features/fleet/components/ui/TripDetailsDialog";
import { useJobs } from "@truckmoov/api/dispatch";
import {
  useDrivers, useVehicles,
} from "@truckmoov/api/fleet";
import { format } from "date-fns";
import {
  CheckCircle, Download, Eye, MapPin, Route, Search, Truck,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { TripDetailsDialog } from "@/features/fleet/components/ui/TripDetailsDialog";

// A trip is a dispatch job seen from the vehicle's side. Progress follows the
// driver-reported dispatch status rather than fleetflow's pseudo-random seed.
const TRIP_STATUS: Record<string, {
  status: TripStatus; progress: number;
}> = {
  "created": {
    status: "scheduled", progress: 0,
  },
  "pending": {
    status: "scheduled", progress: 0,
  },
  "assigned": {
    status: "scheduled", progress: 0,
  },
  "en-route": {
    status: "active", progress: 25,
  },
  "arrived": {
    status: "active", progress: 50,
  },
  "loaded": {
    status: "active", progress: 75,
  },
  "delivered": {
    status: "completed", progress: 100,
  },
  "completed": {
    status: "completed", progress: 100,
  },
  "cancelled": {
    status: "cancelled", progress: 0,
  },
};

function Stat({
  icon: Icon, label, value,
}: {
  icon: React.ElementType; label: string; value: string;
}) {
  return (
    <Card className="surface-sleek border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TripsTab() {
  const jobsQuery = useJobs();
  const vehiclesQuery = useVehicles();
  const driversQuery = useDrivers();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    selectedTrip,
    setSelectedTrip,
  ] = useState<TripDetail | null>(null);

  const trips = useMemo<TripDetail[]>(
    () => {
      const vehicles = new Map((vehiclesQuery.data?.data ?? []).map(v => [
        v.id,
        v,
      ]));
      const drivers = new Map((driversQuery.data?.data ?? []).map(d => [
        d.id,
        d,
      ]));
      return (jobsQuery.data?.data ?? [])
        .slice()
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .map((j) => {
          const vehicle = j.assigned_vehicle_id ? vehicles.get(j.assigned_vehicle_id) : undefined;
          const driver = j.assigned_driver_id ? drivers.get(j.assigned_driver_id) : undefined;
          const {
            status, progress,
          } = TRIP_STATUS[j.status ?? "created"] ?? TRIP_STATUS.created;
          const vehicleName = vehicle
            ? `${vehicle.plateNumber} · ${[
              vehicle.make,
              vehicle.model,
            ].filter(Boolean).join(" ")}`
            : j.assigned_vehicle_reg;
          return {
            id: j.id ?? j.reference ?? "",
            reference: j.reference || j.id || "—",
            status,
            progress,
            date: j.created_at ?? new Date().toISOString(),
            vehicle: vehicleName || "Unassigned",
            driver: driver?.name || j.assigned_driver_name || "Unassigned",
            pickup: {
              address: j.pickup?.address ?? "", lat: j.pickup?.latitude, lng: j.pickup?.longitude,
            },
            delivery: {
              address: j.dropoff?.address ?? "", lat: j.dropoff?.latitude, lng: j.dropoff?.longitude,
            },
            stops: (j.stops ?? []).map(s => ({
              address: s.address, lat: s.latitude, lng: s.longitude,
            })),
            deadline: j.deadline,
            completedAt: status === "completed" ? j.updated_at : undefined,
            notes: j.notes?.map(n => n.text).filter(Boolean).join("\n") || undefined,
          };
        });
    },
    [
      jobsQuery.data?.data,
      vehiclesQuery.data?.data,
      driversQuery.data?.data,
    ],
  );

  const q = search.toLowerCase();
  const filtered = trips.filter(t => (statusFilter === "all" || t.status === statusFilter)
    && (!q || [
      t.reference,
      t.vehicle,
      t.driver,
      t.pickup.address,
      t.delivery.address,
    ].some(f => f.toLowerCase().includes(q))));

  const handleExport = () => {
    const rows = filtered.map(t => [
      t.reference,
      format(
        new Date(t.date),
        "yyyy-MM-dd",
      ),
      t.vehicle,
      t.driver,
      t.pickup.address,
      t.delivery.address,
      t.stops.length,
      t.status,
    ]);
    const csv = [
      [
        "Reference",
        "Date",
        "Vehicle",
        "Driver",
        "Pickup",
        "Delivery",
        "Stops",
        "Status",
      ].join(","),
      ...rows.map(r => r.map(c => `"${String(c).replace(
        /"/g,
        "\"\"",
      )}"`).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob(
      [csv],
      { type: "text/csv;charset=utf-8;" },
    ));
    const a = document.createElement("a");
    a.href = url;
    a.download = `trips_${format(
      new Date(),
      "yyyy-MM-dd",
    )}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const count = (s: TripStatus) => trips.filter(t => t.status === s).length;

  const columns = useMemo<ColumnDef<TripDetail>[]>(
    () => [
      {
        id: "reference",
        header: "Job Reference ID",
        cell: ({ row }) => <span className="font-medium">{row.original.reference}</span>,
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(
              new Date(row.original.date),
              "dd MMM yyyy",
            )}
          </span>
        ),
      },
      {
        id: "vehicle",
        header: "Vehicle",
        cell: ({ row }) => <span className="text-sm">{row.original.vehicle}</span>,
      },
      {
        id: "driver",
        header: "Driver",
        cell: ({ row }) => <span className="text-sm">{row.original.driver}</span>,
      },
      {
        id: "route",
        header: "Route",
        meta: { className: "max-w-[260px] truncate text-sm" },
        cell: ({ row }) => `${row.original.pickup.address || "—"} → ${row.original.delivery.address || "—"}`,
      },
      {
        id: "stops",
        header: () => <span className="block text-right">Stops</span>,
        cell: ({ row }) => <span className="block text-right">{row.original.stops.length}</span>,
      },
      {
        id: "progress",
        header: "Progress",
        meta: { className: "w-[160px]" },
        cell: ({ row }) => (row.original.status === "cancelled"
          ? <span className="text-xs text-muted-foreground">—</span>
          : (
              <div className="flex items-center gap-2">
                <Progress
                  value={row.original.progress}
                  className="h-1.5 flex-1"
                />
                <span className="text-xs text-muted-foreground w-9 text-right">
                  {row.original.progress}
                  %
                </span>
              </div>
            )),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "active" ? "default" : "secondary"}
            className="rounded-full capitalize"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "action",
        header: () => <span className="block text-right">Action</span>,
        cell: ({ row }) => (row.original.status === "active" || row.original.status === "completed") && (
          <div className="text-right">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTrip(row.original)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              {" "}
              View Trip
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          icon={Route}
          label="Total trips"
          value={`${trips.length}`}
        />
        <Stat
          icon={Truck}
          label="Active trips"
          value={`${count("active")}`}
        />
        <Stat
          icon={MapPin}
          label="Scheduled trips"
          value={`${count("scheduled")}`}
        />
        <Stat
          icon={CheckCircle}
          label="Completed trips"
          value={`${count("completed")}`}
        />
      </div>

      <Card className="surface-sleek border-border/50">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Trip History</CardTitle>
            <CardDescription>Jobs each vehicle has been on, with routes and locations</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            {" "}
            Export
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search trips, vehicles, routes..."
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active trips</SelectItem>
                <SelectItem value="scheduled">Scheduled trips</SelectItem>
                <SelectItem value="completed">Completed trips</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={filtered}
              isLoading={jobsQuery.isLoading}
              isError={jobsQuery.isError}
              errorMessage={jobsQuery.error?.message ?? "Unable to load trips"}
              onRetry={() => void jobsQuery.refetch()}
              hasActiveFilters={Boolean(q) || statusFilter !== "all"}
              emptyState="No trips yet. Trips appear once jobs are dispatched."
              filteredEmptyState="No trips found"
            />
          </div>
        </CardContent>
      </Card>

      <TripDetailsDialog
        trip={selectedTrip}
        open={!!selectedTrip}
        onOpenChange={o => !o && setSelectedTrip(null)}
      />
    </div>
  );
}
