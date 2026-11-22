import type { TripWindow } from "@truckmoov/api/tracking";
import type {
  TripDetail, TripStatus,
} from "@/features/fleet/components/ui/TripDetailsDialog";
import { useJobs } from "@truckmoov/api/dispatch";
import {
  useDrivers, useVehicles,
} from "@truckmoov/api/fleet";
import { useTripStats } from "@truckmoov/api/tracking";
import { format } from "date-fns";
import {
  CircleCheckBig, Download, MapPin, Route, Search, SlidersHorizontal, Truck,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { TripDetailsDialog } from "@/features/fleet/components/ui/TripDetailsDialog";
import { PageHeader } from "@/shared/components/layout/PageHeader";

/** Shown when too few positions were recorded to tell. */
const NO_DATA = "-";

// shortcut: stats cover the newest 100 trips (the endpoint's batch limit); page them when the list grows past that.
const MAX_TRIP_STATS = 100;

// A trip is a dispatch job seen from the vehicle's side. Progress follows the
// driver-reported dispatch status (used by the details dialog).
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

type TripRow = TripDetail & {
  vehicleId?: string;
  vehicleName: string;
  plate: string;
  endedAt?: string;
  /** When the vehicle set off: the job's first move to en-route, else its acknowledgement. */
  startedAt?: string;
};

function formatDuration(minutes?: number) {
  if (minutes == null)
    return NO_DATA;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Class strings copied verbatim from the design app's Trips tab.
const CARD_CLASS = "rounded-2xl surface-sleek text-card-foreground surface-sleek border-border/50";
const TR_CLASS = "border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50";
const TH_CLASS = "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-sm";
const TD_CLASS = "p-4 align-middle [&:has([role=checkbox])]:pr-0";
const TD_NUM_CLASS = `${TD_CLASS} whitespace-nowrap text-sm`;

const COLUMNS = [
  "Vehicle",
  "Pickup Address",
  "Delivery Address",
  "Stops",
  "Driver",
  "Distance",
  "Average Speed",
  "Duration",
  "Status",
  "Date Started",
  "Date Ended",
  "Action",
];

/** "18 Oct 2026, 09:00 am" */
function formatTripDate(iso?: string) {
  if (!iso)
    return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(
    d,
    "dd MMM yyyy, hh:mm aaa",
  );
}

function Stat({
  icon: Icon, label, value,
}: {
  icon: React.ElementType; label: string; value: string;
}) {
  return (
    <div className={CARD_CLASS}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold truncate">{value}</p>
          </div>
        </div>
      </div>
    </div>
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
    vehicleFilter,
    setVehicleFilter,
  ] = useState("all");
  const [
    selectedTrip,
    setSelectedTrip,
  ] = useState<TripDetail | null>(null);

  const trips = useMemo<TripRow[]>(
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
          const vehicleName = [
            vehicle?.make ?? j.assigned_vehicle_make,
            vehicle?.model ?? j.assigned_vehicle_model,
          ].filter(Boolean).join(" ");
          const plate = vehicle?.plateNumber || j.assigned_vehicle_reg || "";
          return {
            id: j.id ?? j.reference ?? "",
            reference: j.reference || j.id || "—",
            status,
            progress,
            date: j.created_at ?? new Date().toISOString(),
            vehicle: [
              plate,
              vehicleName,
            ].filter(Boolean).join(" · ") || "Unassigned",
            vehicleId: j.assigned_vehicle_id,
            vehicleName,
            plate,
            driver: driver?.name || j.assigned_driver_name || "",
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
            completedAt: status === "completed" ? j.delivered_at ?? j.updated_at : undefined,
            endedAt: j.delivered_at,
            startedAt: status === "scheduled" || status === "cancelled"
              ? undefined
              : j.timeline?.find(e => e.type === "job_status_updated" && e.metadata?.to_status === "en-route")?.occurred_at
                ?? j.acknowledged_at,
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

  const tripWindows = useMemo<TripWindow[]>(
    () => trips
      .filter(t => t.vehicleId && t.startedAt)
      .slice(
        0,
        MAX_TRIP_STATS,
      )
      .map(t => ({
        id: t.id,
        vehicle_id: t.vehicleId as string,
        from: t.startedAt as string,
        to: t.status === "completed" ? t.endedAt : undefined,
      })),
    [trips],
  );
  const tripStatsQuery = useTripStats(tripWindows);
  const statsById = useMemo(
    () => new Map((tripStatsQuery.data?.trips ?? []).map(s => [
      s.id,
      s,
    ])),
    [tripStatsQuery.data],
  );
  const km = (v?: number) => (v == null ? NO_DATA : `${v} km`);
  const kph = (v?: number) => (v == null ? NO_DATA : `${v} km/h`);

  const vehicleOptions = useMemo(
    () => [
      ...new Map(trips.filter(t => t.vehicleId).map(t => [
        t.vehicleId as string,
        t.vehicle,
      ])),
    ],
    [trips],
  );

  const q = search.trim().toLowerCase();
  const filtered = trips.filter(t => (statusFilter === "all" || t.status === statusFilter)
    && (vehicleFilter === "all" || t.vehicleId === vehicleFilter)
    && (!q || [
      t.id,
      t.reference,
      t.driver,
      t.pickup.address,
      t.delivery.address,
      ...t.stops.map(s => s.address),
    ].some(f => f.toLowerCase().includes(q))));

  const handleExport = () => {
    const rows = filtered.map(t => [
      t.vehicleName || "—",
      t.plate || "—",
      t.pickup.address || "—",
      t.delivery.address || "—",
      t.stops.length,
      t.driver || "—",
      km(statsById.get(t.id)?.distance_km),
      kph(statsById.get(t.id)?.avg_speed_kph),
      formatDuration(statsById.get(t.id)?.duration_minutes),
      t.status,
      formatTripDate(statsById.get(t.id)?.started_at ?? t.startedAt),
      formatTripDate(t.endedAt),
    ]);
    const csv = [
      [
        "Vehicle",
        "Plate",
        ...COLUMNS.slice(
          1,
          -1,
        ),
      ],
      ...rows,
    ].map(r => r.map(c => `"${String(c).replace(
      /"/g,
      "\"\"",
    )}"`).join(",")).join("\n");
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
  const hasFilters = Boolean(q) || statusFilter !== "all" || vehicleFilter !== "all";
  const tableState = jobsQuery.isLoading
    ? "Loading trips..."
    : jobsQuery.isError
      ? null
      : filtered.length === 0
        ? hasFilters ? "No trips found" : "No trips yet. Trips appear once jobs are dispatched."
        : undefined;

  return (
    <>
      <PageHeader
        title="Trips"
        description="Vehicle journeys, pickup and drop-off locations, stops, and travel times."
      />
      <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
              icon={CircleCheckBig}
              label="Completed trips"
              value={`${count("completed")}`}
            />
          </div>

          <div className={`${CARD_CLASS} min-w-0`}>
            <div className="flex flex-col p-6 pb-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight text-foreground font-display text-base">Trip History</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">Jobs each vehicle has been on, with pickup, drop-off, intermediate stops, and travel details.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-secondary hover:text-foreground h-8 rounded-lg px-3 text-xs bg-transparent border-input"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search trip ID, locations, or driver..."
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 text-foreground pl-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="h-10 rounded-xl px-3.5 sm:w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active trips</SelectItem>
                    <SelectItem value="scheduled">Scheduled trips</SelectItem>
                    <SelectItem value="completed">Completed trips</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-border bg-transparent hover:bg-secondary hover:text-foreground h-9 px-4 py-2"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filter
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="max-h-80 overflow-y-auto"
                  >
                    <DropdownMenuLabel>Vehicle</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={vehicleFilter}
                      onValueChange={setVehicleFilter}
                    >
                      <DropdownMenuRadioItem value="all">All vehicles</DropdownMenuRadioItem>
                      {vehicleOptions.map(([
                        id,
                        label,
                      ]) => (
                        <DropdownMenuRadioItem
                          key={id}
                          value={id}
                        >
                          {label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="p-6 pt-0 min-w-0">
              <div className="overflow-x-auto">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm min-w-[1500px] [&_td]:px-4 [&_th]:px-4 [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
                    <thead className="[&_tr]:border-b">
                      <tr className={TR_CLASS}>
                        {COLUMNS.map(c => (
                          <th
                            key={c}
                            className={TH_CLASS}
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {tableState !== undefined && (
                        <tr className="border-b">
                          <td
                            colSpan={COLUMNS.length}
                            className={`${TD_CLASS} h-24 text-center text-sm text-muted-foreground`}
                          >
                            {tableState ?? (
                              <span className="inline-flex items-center gap-2">
                                {jobsQuery.error?.message ?? "Unable to load trips"}
                                <button
                                  type="button"
                                  className="font-medium text-primary hover:underline"
                                  onClick={() => void jobsQuery.refetch()}
                                >
                                  Retry
                                </button>
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                      {tableState === undefined && filtered.map(t => (
                        <tr
                          key={t.id}
                          className={TR_CLASS}
                        >
                          <td className={TD_CLASS}>
                            {/* The design app says "Unassigned" when no vehicle is on the job. */}
                            <span
                              className="block text-sm font-medium"
                              title={t.vehicleName || (t.plate ? "—" : "Unassigned")}
                            >
                              {t.vehicleName || (t.plate ? "—" : "Unassigned")}
                            </span>
                            {t.plate && <span className="block text-xs text-muted-foreground">{t.plate}</span>}
                          </td>
                          <td className={TD_CLASS}>
                            <span className="block">{t.pickup.address || "—"}</span>
                          </td>
                          <td className={TD_CLASS}>
                            <span className="block">{t.delivery.address || "—"}</span>
                          </td>
                          <td className={TD_NUM_CLASS}>
                            {t.stops.length > 0
                              ? t.stops.length
                              : <span className="text-muted-foreground text-xs">None</span>}
                          </td>
                          <td className={TD_CLASS}>
                            <span
                              className="block"
                              title={t.driver || "Unassigned"}
                            >
                              {t.driver || "Unassigned"}
                            </span>
                          </td>
                          <td className={TD_NUM_CLASS}>{km(statsById.get(t.id)?.distance_km)}</td>
                          <td className={TD_NUM_CLASS}>{kph(statsById.get(t.id)?.avg_speed_kph)}</td>
                          <td className={TD_NUM_CLASS}>{formatDuration(statsById.get(t.id)?.duration_minutes)}</td>
                          <td className={TD_CLASS}>
                            <div className="inline-flex items-center rounded-full border py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 capitalize text-[11px] px-1.5">
                              {t.status}
                            </div>
                          </td>
                          <td className={`${TD_CLASS} text-sm`}>
                            <span className="block">{formatTripDate(statsById.get(t.id)?.started_at ?? t.startedAt)}</span>
                          </td>
                          <td className={`${TD_CLASS} text-sm`}>
                            <span className="block">{formatTripDate(t.endedAt)}</span>
                          </td>
                          <td className={TD_CLASS}>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-border bg-transparent hover:bg-secondary hover:text-foreground rounded-lg text-xs h-8 px-3"
                              onClick={() => setSelectedTrip({
                                ...t, driver: t.driver || "Unassigned",
                              })}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TripDetailsDialog
        trip={selectedTrip}
        open={!!selectedTrip}
        onOpenChange={o => !o && setSelectedTrip(null)}
      />
    </>
  );
}
