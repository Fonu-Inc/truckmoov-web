import type {
  FleetUtilization, Vehicle,
} from "@truckmoov/api/fleet";
import type { UtilizationPeriod } from "@/features/analytics/utils/fleetUtilizationPeriod";
import { useQuery } from "@tanstack/react-query";
import {
  getFleetFuelReportQueryOptions, getFleetUtilizationReportQueryOptions, useVehicles,
} from "@truckmoov/api/fleet";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Search,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { AnalyticsGate } from "@/features/analytics/components/ui/AnalyticsGate";
import {
  formatChartDay, formatPeriodDay, UTILIZATION_PERIOD_OPTIONS, utilizationWindow,
} from "@/features/analytics/utils/fleetUtilizationPeriod";
import { FleetTablePager } from "@/features/fleet/components/ui/FleetTablePager";
import { useClientPage } from "@/features/fleet/utils/useClientPage";
import { exportToCSV } from "@/lib/exportTable";
import { PageHeader } from "@/shared/components/layout/PageHeader";

type Band = "high" | "moderate" | "low" | "none";

const BANDS: {
  value: Band; label: string; bar: string; badge: string;
}[] = [
  {
    value: "high", label: "High Utilization", bar: "bg-success", badge: "bg-success/10 text-success border-success/20",
  },
  {
    value: "moderate", label: "Moderate Utilization", bar: "bg-primary", badge: "bg-primary/10 text-foreground border-primary/30",
  },
  {
    value: "low", label: "Low Utilization", bar: "bg-warning", badge: "bg-warning/10 text-warning border-warning/20",
  },
  {
    value: "none", label: "Not Utilized", bar: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border-border",
  },
];

const BAND_BY_VALUE = Object.fromEntries(BANDS.map(b => [
  b.value,
  b,
])) as Record<Band, (typeof BANDS)[number]>;

function bandFor(utilization: number): Band {
  if (utilization > 70)
    return "high";
  if (utilization >= 30)
    return "moderate";
  if (utilization > 0)
    return "low";
  return "none";
}

const BADGE_BASE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
const TH = "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0";
const TD = "p-4 align-middle [&:has([role=checkbox])]:pr-0";
const TR = "border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50";
const CARD = "rounded-2xl surface-sleek text-card-foreground";
const CARD_TITLE = "text-base font-semibold leading-none tracking-tight text-foreground font-display";
const SORT_BUTTON = "inline-flex items-center tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-secondary hover:text-foreground rounded-lg h-auto justify-start gap-1 px-0 text-xs font-medium whitespace-normal";
const ROWS_PER_PAGE = [
  5,
  10,
  25,
  50,
];

type UtilizationRow = {
  vehicleId: string;
  name: string;
  plate: string;
  registration: string;
  /** Null until the vehicle list has loaded (or the vehicle isn't in it). */
  driver: string | null;
  /** Null when the fuel report has no distance for this vehicle. */
  distanceKm: number | null;
  utilization: number;
  previousUtilization: number;
  band: Band;
};

type SortKey = "distance" | "active" | "idle" | "utilization";

function formatPercent(value: number): string {
  return `${Number(value.toFixed(1))}%`;
}

function percentChange(current: number, previous: number): number {
  if (previous === 0)
    return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function fleetStats(report: FleetUtilization | undefined) {
  if (!report)
    return null;
  const total = report.vehicles.length;
  const active = report.vehicles.filter(v => v.utilizationPercent > 0).length;
  return {
    total,
    active,
    idle: total - active,
    rate: total > 0 ? (active / total) * 100 : 0,
  };
}

export default function FleetUtilizationPage() {
  const [
    period,
    setPeriod,
  ] = useState<UtilizationPeriod>("this-week");
  const span = useMemo(
    () => utilizationWindow(period),
    [period],
  );
  const query = useQuery(getFleetUtilizationReportQueryOptions({ params: span.range }));
  const previousQuery = useQuery(getFleetUtilizationReportQueryOptions({ params: span.previousRange }));
  const fuelQuery = useQuery(getFleetFuelReportQueryOptions({ params: span.range }));
  const vehiclesQuery = useVehicles();
  const report = query.data?.data;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Fleet Utilization"
        description="Monitor vehicle usage, identify idle assets, and gain insights into overall fleet efficiency."
        align="start"
        actions={(
          <Select
            value={period}
            onValueChange={v => setPeriod(v as UtilizationPeriod)}
          >
            <SelectTrigger
              className="h-10 w-[180px] rounded-xl px-3.5"
              aria-label="Fleet utilization period"
            >
              <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UTILIZATION_PERIOD_OPTIONS.map(o => (
                <SelectItem
                  key={o.value}
                  value={o.value}
                >
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">{`${formatPeriodDay(span.from)} – ${formatPeriodDay(span.to)}`}</span>
          <span className="ml-2">{`Compared with ${formatPeriodDay(span.previousFrom)} – ${formatPeriodDay(span.previousTo)}`}</span>
        </div>
      </div>
      <AnalyticsGate
        isPending={query.isPending}
        isError={query.isError}
        onRetry={() => query.refetch()}
        hasData={(report?.summary.fleetSize ?? 1) > 0}
      >
        {report && (
          <FleetUtilizationReport
            report={report}
            previous={previousQuery.data?.data}
            distanceByVehicle={fuelQuery.data?.data.vehicles}
            vehicles={vehiclesQuery.data?.data}
            days={span.days}
          />
        )}
      </AnalyticsGate>
    </div>
  );
}

function KpiTile({
  label, value, icon: Icon, delta,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  /** Percent change vs the previous period; null renders `-`. */
  delta: number | null;
}) {
  return (
    <div className={CARD}>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-xl font-bold tabular-nums">{value}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
          {delta === null
            ? <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">-</span>
            : (
                <span className={`inline-flex items-center gap-1 font-medium ${delta >= 0 ? "text-success" : "text-warning"}`}>
                  {delta >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {`${Math.abs(delta).toFixed(1)}%`}
                </span>
              )}
          <span className="text-muted-foreground">vs previous period</span>
        </div>
      </div>
    </div>
  );
}

function FleetUtilizationReport({
  report, previous, distanceByVehicle, vehicles, days,
}: {
  report: FleetUtilization;
  previous: FleetUtilization | undefined;
  distanceByVehicle: {
    vehicleId: string; distanceKm: number;
  }[] | undefined;
  vehicles: Vehicle[] | undefined;
  days: Date[];
}) {
  const [
    detail,
    setDetail,
  ] = useState<UtilizationRow | null>(null);

  const rows = useMemo<UtilizationRow[]>(
    () => {
      const previousById = new Map((previous?.vehicles ?? []).map(v => [
        v.vehicleId,
        v.utilizationPercent,
      ]));
      const distanceById = new Map((distanceByVehicle ?? []).map(v => [
        v.vehicleId,
        v.distanceKm,
      ]));
      const vehicleById = new Map((vehicles ?? []).map(v => [
        v.id,
        v,
      ]));
      return report.vehicles.map((v) => {
        const vehicle = vehicleById.get(v.vehicleId);
        return {
          vehicleId: v.vehicleId,
          name: v.name,
          plate: v.plateNumber,
          registration: vehicle?.registrationNumber || v.plateNumber,
          driver: vehicle ? (vehicle.assignedDriverName || "Unassigned") : null,
          distanceKm: distanceById.get(v.vehicleId) ?? null,
          utilization: v.utilizationPercent,
          previousUtilization: previousById.get(v.vehicleId) ?? 0,
          band: bandFor(v.utilizationPercent),
        };
      });
    },
    [
      report,
      previous,
      distanceByVehicle,
      vehicles,
    ],
  );

  const current = fleetStats(report);
  const prior = fleetStats(previous);
  const total = rows.length;
  const bandCounts = BANDS.map(b => ({
    ...b,
    count: rows.filter(r => r.band === b.value).length,
  }));
  const trend = days.map(day => ({
    day: formatChartDay(day),
    // ponytail: no endpoint returns a per-day utilization series yet — the chart keeps its axes and legend with no data.
    current: null,
    previous: null,
  }));
  const underutilized = rows.filter(r => r.utilization < 30 && r.previousUtilization < 30);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Fleet Utilization Rate"
          value={current ? formatPercent(current.rate) : "-"}
          icon={Activity}
          delta={current && prior ? percentChange(
            current.rate,
            prior.rate,
          ) : null}
        />
        <KpiTile
          label="Active Vehicles"
          value={current ? String(current.active) : "-"}
          icon={Truck}
          delta={current && prior ? percentChange(
            current.active,
            prior.active,
          ) : null}
        />
        <KpiTile
          label="Idle Vehicles"
          value={current ? String(current.idle) : "-"}
          icon={Clock}
          delta={current && prior ? percentChange(
            current.idle,
            prior.idle,
          ) : null}
        />
        <KpiTile
          label="Average Daily Usage"
          value="-"
          icon={CalendarRange}
          delta={null}
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${CARD} min-w-0 xl:col-span-2`}>
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <h3 className={CARD_TITLE}>Fleet Utilization Trend</h3>
            <p className="text-sm text-muted-foreground">Share of the fleet recording activity each day, compared with the preceding equivalent period.</p>
          </div>
          <div className="p-6 pt-0">
            <div
              className="h-[300px] w-full min-w-0"
              aria-label="Fleet utilization trend chart"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <ComposedChart
                  data={trend}
                  margin={{
                    top: 12, right: 12, left: -20, bottom: 0,
                  }}
                >
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    domain={[
                      0,
                      100,
                    ]}
                    ticks={[
                      0,
                      25,
                      50,
                      75,
                      100,
                    ]}
                    tickFormatter={v => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip contentStyle={{
                    backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))",
                  }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="current"
                    name="Current period"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.12}
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    name="Previous period"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={`${CARD} min-w-0`}>
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <h3 className={CARD_TITLE}>Vehicle Usage Distribution</h3>
            <p className="text-sm text-muted-foreground">Active hours as a share of 24 hours per vehicle per day.</p>
          </div>
          <div className="p-6 pt-0 space-y-5">
            {bandCounts.map((b) => {
              const share = total > 0 ? Math.round((b.count / total) * 100) : 0;
              return (
                <div key={b.value}>
                  <div className="mb-2 flex justify-between gap-3 text-sm">
                    <span>{b.label}</span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {`${b.count} `}
                      <span className="text-xs text-muted-foreground">{`(${share}%)`}</span>
                    </span>
                  </div>
                  <div
                    role="meter"
                    aria-label={b.label}
                    aria-valuenow={share}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={`h-full rounded-full ${b.bar}`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="border-t pt-3 text-xs text-muted-foreground">High &gt;70% · Moderate 30–70% · Low &lt;30%</p>
          </div>
        </div>
      </div>

      <UtilizationBreakdownCard
        rows={rows}
        onView={setDetail}
      />
      <UnderutilizedCard
        rows={underutilized}
        onView={setDetail}
      />
      <UtilizationDetailDialog
        row={detail}
        onClose={() => setDetail(null)}
      />
    </>
  );
}

function matchesSearch(row: UtilizationRow, search: string): boolean {
  const term = search.trim().toLowerCase();
  if (!term)
    return true;
  return [
    row.registration,
    row.plate,
    row.driver ?? "",
  ].some(v => v.toLowerCase().includes(term));
}

function formatDistance(km: number | null): string {
  return km === null ? "—" : `${Math.round(km).toLocaleString("en-GB")} km`;
}

/** Filter popover listing the utilization bands — Apply / Show All, like the other fleet filters. */
function BandFilter({
  bands, value, onChange,
}: {
  bands: Band[]; value: Band[]; onChange: (next: Band[]) => void;
}) {
  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    draft,
    setDraft,
  ] = useState<Band[]>(value);
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o)
          setDraft(value);
        setOpen(o);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72"
        align="end"
      >
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-foreground px-0.5">Show vehicles by...</h4>
          {bands.map(b => (
            <div
              key={b}
              className="flex items-center gap-2"
            >
              <Checkbox
                id={`band-${b}`}
                checked={draft.includes(b)}
                onCheckedChange={checked => setDraft(checked ? [
                  ...draft,
                  b,
                ] : draft.filter(d => d !== b))}
              />
              <Label
                htmlFor={`band-${b}`}
                className="text-sm"
              >
                {BAND_BY_VALUE[b].label}
              </Label>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
            >
              Show All
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SearchBox({
  value, onChange, label,
}: {
  value: string; onChange: (v: string) => void; label: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-10"
        aria-label={label}
        placeholder="Search registration number or driver name..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function ExportDataButton({
  rows, filename,
}: {
  rows: UtilizationRow[]; filename: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="bg-transparent border-input"
      disabled={rows.length === 0}
      onClick={() => exportToCSV(
        rows,
        [
          {
            header: "Vehicle", accessor: "name",
          },
          {
            header: "Registration Number", accessor: "registration",
          },
          {
            header: "Assigned Driver", accessor: r => r.driver ?? "",
          },
          {
            header: "Total Distance (km)", accessor: r => r.distanceKm ?? "",
          },
          {
            header: "Utilization Rate (%)", accessor: "utilization",
          },
          {
            header: "Status", accessor: r => BAND_BY_VALUE[r.band].label,
          },
        ],
        filename,
      )}
    >
      <Download className="h-4 w-4 mr-2" />
      Export Data
    </Button>
  );
}

function UtilizationBreakdownCard({
  rows, onView,
}: {
  rows: UtilizationRow[]; onView: (row: UtilizationRow) => void;
}) {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    bands,
    setBands,
  ] = useState<Band[]>([]);
  const [
    sort,
    setSort,
  ] = useState<{
    key: SortKey; dir: "asc" | "desc";
  }>({
    key: "utilization", dir: "desc",
  });
  const [
    pageSize,
    setPageSize,
  ] = useState(5);

  const filtered = useMemo(
    () => {
      const list = rows.filter(r => matchesSearch(
        r,
        search,
      ) && (bands.length === 0 || bands.includes(r.band)));
      const sign = sort.dir === "asc" ? 1 : -1;
      // Active and idle hours have no endpoint, so those sorts keep the list order.
      if (sort.key === "utilization")
        list.sort((a, b) => sign * (a.utilization - b.utilization));
      if (sort.key === "distance")
        list.sort((a, b) => sign * ((a.distanceKm ?? -1) - (b.distanceKm ?? -1)));
      return list;
    },
    [
      rows,
      search,
      bands,
      sort,
    ],
  );
  const {
    pageRows, page, setPage, total,
  } = useClientPage(
    filtered,
    pageSize,
  );
  const pages = Math.max(
    1,
    Math.ceil(total / pageSize),
  );
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(
    page * pageSize,
    total,
  );

  const sortHeader = (key: SortKey, label: string) => {
    const active = sort.key === key;
    const SortIcon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        className={SORT_BUTTON}
        aria-label={`Sort by ${label}`}
        onClick={() => setSort(active
          ? {
              key, dir: sort.dir === "asc" ? "desc" : "asc",
            }
          : {
              key, dir: "desc",
            })}
      >
        {label}
        <SortIcon className="h-3 w-3 shrink-0" />
      </button>
    );
  };

  return (
    <div className={`${CARD} min-w-0`}>
      <div className="flex flex-col p-6 pb-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className={CARD_TITLE}>Vehicle Utilization Breakdown</h3>
            <p className="text-sm text-muted-foreground">Distance, active time and idle time for each vehicle in the selected period.</p>
          </div>
          <ExportDataButton
            rows={filtered}
            filename="vehicle-utilization"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchBox
            value={search}
            onChange={setSearch}
            label="Search vehicle utilization"
          />
          <BandFilter
            bands={BANDS.map(b => b.value)}
            value={bands}
            onChange={setBands}
          />
        </div>
      </div>
      <div className="p-6 pt-0">
        <div
          className="max-w-full overflow-x-auto rounded-xl border [&>div]:overflow-visible"
          role="region"
          aria-label="Vehicle utilization table"
        >
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm min-w-[1220px] table-fixed">
              <thead className="[&_tr]:border-b">
                <tr className={TR}>
                  <th className={`${TH} w-[185px]`}>Vehicle</th>
                  <th className={`${TH} w-[145px]`}>Registration Number</th>
                  <th className={`${TH} w-[170px]`}>Assigned Driver</th>
                  <th className={`${TH} w-[130px]`}>
                    {sortHeader(
                      "distance",
                      "Total Distance",
                    )}
                  </th>
                  <th className={`${TH} w-[120px]`}>
                    {sortHeader(
                      "active",
                      "Active Hours",
                    )}
                  </th>
                  <th className={`${TH} w-[110px]`}>
                    {sortHeader(
                      "idle",
                      "Idle Hours",
                    )}
                  </th>
                  <th className={`${TH} w-[140px]`}>
                    {sortHeader(
                      "utilization",
                      "Utilization Rate",
                    )}
                  </th>
                  <th className={`${TH} w-[165px]`}>Status</th>
                  <th className={`${TH} w-[55px]`}><span className="sr-only">View details</span></th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {pageRows.length === 0 && (
                  <tr className={TR}>
                    <td
                      colSpan={9}
                      className={`${TD} h-24 text-center text-muted-foreground`}
                    >
                      No vehicles match your filters
                    </td>
                  </tr>
                )}
                {pageRows.map((row) => {
                  const band = BAND_BY_VALUE[row.band];
                  return (
                    <tr
                      key={row.vehicleId}
                      className={`${TR} cursor-pointer`}
                      onClick={() => onView(row)}
                    >
                      <td className={`${TD} break-words py-4`}>
                        <p className="font-medium">{row.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{row.plate}</p>
                      </td>
                      <td className={`${TD} break-words`}>{row.registration}</td>
                      <td className={`${TD} break-words`}>{row.driver ?? "—"}</td>
                      <td className={`${TD} tabular-nums`}>{formatDistance(row.distanceKm)}</td>
                      <td className={`${TD} tabular-nums`}>-</td>
                      <td className={`${TD} tabular-nums`}>-</td>
                      <td className={TD}>
                        <span className="font-medium tabular-nums">{formatPercent(row.utilization)}</span>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${band.bar}`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  row.utilization,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className={TD}>
                        <div className={`${BADGE_BASE} max-w-full whitespace-normal text-center leading-4 ${band.badge}`}>{band.label}</div>
                      </td>
                      <td className={TD}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`View utilization for ${row.plate}`}
                          title="View utilization details"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(row);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {`${first}–${last} of ${total} vehicles`}
            <span className="ml-2 xl:hidden">↔</span>
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={v => setPageSize(Number(v))}
            >
              <SelectTrigger
                className="rounded-xl px-3.5 h-8 w-24"
                aria-label="Vehicles per page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROWS_PER_PAGE.map(n => (
                  <SelectItem
                    key={n}
                    value={String(n)}
                  >
                    {`${n} rows`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Previous vehicles page"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{`${page} / ${pages}`}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Next vehicles page"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnderutilizedCard({
  rows, onView,
}: {
  rows: UtilizationRow[]; onView: (row: UtilizationRow) => void;
}) {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    bands,
    setBands,
  ] = useState<Band[]>([]);
  const filtered = useMemo(
    () => rows
      .filter(r => matchesSearch(
        r,
        search,
      ) && (bands.length === 0 || bands.includes(r.band)))
      .sort((a, b) => a.utilization - b.utilization),
    [
      rows,
      search,
      bands,
    ],
  );
  const {
    pageRows, page, setPage, total, pageSize,
  } = useClientPage(filtered);

  return (
    <div className={`${CARD} min-w-0`}>
      <div className="flex flex-col p-6 pb-4 space-y-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h3 className={CARD_TITLE}>Underutilized Vehicles</h3>
            <p className="text-sm text-muted-foreground">Low or no usage in both the selected and previous period.</p>
          </div>
          <ExportDataButton
            rows={filtered}
            filename="underutilized-vehicles"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchBox
            value={search}
            onChange={setSearch}
            label="Search underutilized vehicles"
          />
          <BandFilter
            bands={[
              "low",
              "none",
            ]}
            value={bands}
            onChange={setBands}
          />
        </div>
      </div>
      <div className="p-6 pt-0">
        <div
          className="max-w-full overflow-x-auto rounded-xl border [&>div]:overflow-visible"
          role="region"
          aria-label="Underutilized vehicles table"
        >
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm min-w-[850px]">
              <thead className="[&_tr]:border-b">
                <tr className={TR}>
                  <th className={TH}>Registration Number</th>
                  <th className={TH}>Assigned Driver</th>
                  <th className={TH}>Utilization Rate</th>
                  <th className={TH}>Active Hours</th>
                  <th className={TH}>Last Recorded Activity</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {pageRows.length === 0 && (
                  <tr className={TR}>
                    <td
                      colSpan={6}
                      className={`${TD} h-24 text-center text-muted-foreground`}
                    >
                      No underutilized vehicles
                    </td>
                  </tr>
                )}
                {pageRows.map(row => (
                  <tr
                    key={row.vehicleId}
                    className={TR}
                  >
                    <td className={`${TD} py-4 font-medium`}>{row.registration}</td>
                    <td className={TD}>{row.driver ?? "—"}</td>
                    <td className={TD}>{formatPercent(row.utilization)}</td>
                    <td className={TD}>-</td>
                    <td className={TD}>-</td>
                    <td className={`${TD} text-right`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(row)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <FleetTablePager
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

function UtilizationDetailDialog({
  row, onClose,
}: {
  row: UtilizationRow | null; onClose: () => void;
}) {
  const fields: [string, string][] = row
    ? [
        [
          "Registration Number",
          row.registration,
        ],
        [
          "Assigned Driver",
          row.driver ?? "—",
        ],
        [
          "Total Distance",
          formatDistance(row.distanceKm),
        ],
        [
          "Active Hours",
          "-",
        ],
        [
          "Idle Hours",
          "-",
        ],
        [
          "Utilization Rate",
          formatPercent(row.utilization),
        ],
        [
          "Previous Period",
          formatPercent(row.previousUtilization),
        ],
        [
          "Status",
          BAND_BY_VALUE[row.band].label,
        ],
      ]
    : [];
  return (
    <Dialog
      open={row !== null}
      onOpenChange={o => !o && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row?.name}</DialogTitle>
          <DialogDescription>{row?.plate}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {fields.map(([
            label,
            value,
          ]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
