import type { ColumnDef } from "@tanstack/react-table";
import type {
  InstallerJobCounters, InstallerJobListItem, InstallerJobsQuery,
} from "@truckmoov/api/auth";
import type {
  ElementType, ReactNode,
} from "react";
import {
  exportInstallerJobs,
  useAcceptInstallerJob,
  useInstallerDisplayPreferences,
  useInstallerJobs,
} from "@truckmoov/api/auth";
import {
  debounce,
  downloadBlob,
} from "@truckmoov/app-core/utils/general-utils";
import {
  formatDateInTimezone,
  formatTime12InTimezone,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  Loader,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { RejectOfferForm } from "@/features/jobs/components/forms/RejectOfferForm";
import { InstallerJobStatusBadge } from "@/features/jobs/components/ui/InstallerJobStatusBadge";

// Display Preferences default (TRU-FE-21) until the installer picks another zone.
const DEFAULT_ZONE = "Africa/Lagos";
const PAGE_SIZE = 20;

type JobsTab = "installations" | "issues" | "history";
const TABS: JobsTab[] = [
  "installations",
  "issues",
  "history",
];

/** appdemo's "All Status" select, mapped onto the jobs query. */
type StatusFilter = "all" | "scheduled" | "in_progress" | "completed" | "cancelled" | "issue_reported";
const STATUS_OPTIONS: {
  id: StatusFilter; label: string;
}[] = [
  {
    id: "all", label: "All Status",
  },
  {
    id: "scheduled", label: "Scheduled",
  },
  {
    id: "in_progress", label: "In Progress",
  },
  {
    id: "completed", label: "Completed",
  },
  {
    id: "cancelled", label: "Cancelled",
  },
  {
    id: "issue_reported", label: "Issues Reported",
  },
];

function statusQuery(s: StatusFilter): InstallerJobsQuery {
  if (s === "all")
    return { scope: "active" };
  if (s === "completed")
    return { scope: "history" };
  return { status: s };
}

type Counter = {
  id: keyof InstallerJobCounters;
  label: string;
  icon: ElementType;
  tab: JobsTab;
  status?: StatusFilter;
};

const COUNTERS: Counter[] = [
  {
    id: "total", label: "Total Installation Jobs", icon: ClipboardList, tab: "installations",
  },
  {
    id: "scheduled", label: "Scheduled", icon: CalendarClock, tab: "installations", status: "scheduled",
  },
  {
    id: "inProgress", label: "In Progress", icon: Loader, tab: "installations", status: "in_progress",
  },
  {
    id: "completed", label: "Completed", icon: CheckCircle2, tab: "history",
  },
  {
    id: "cancelled", label: "Cancelled", icon: Ban, tab: "installations", status: "cancelled",
  },
  {
    id: "issueReported", label: "Issue Reported", icon: AlertTriangle, tab: "issues",
  },
];

const SEARCH_INPUT = "pl-9 h-9 w-full border-border bg-transparent font-semibold placeholder:font-normal hover:bg-secondary";

const companyColumn: ColumnDef<InstallerJobListItem> = {
  header: "Company Name",
  meta: { className: "font-medium" },
  cell: ({ row }) => (
    <>
      {row.original.companyName || "-"}
      <span className="block text-xs text-muted-foreground">{row.original.jobNumber}</span>
    </>
  ),
};

const locationColumn: ColumnDef<InstallerJobListItem> = {
  header: "Installation Location",
  cell: ({ row }) => [
    row.original.city,
    row.original.state,
  ].filter(Boolean).join(", ") || "-",
};

const statusColumn: ColumnDef<InstallerJobListItem> = {
  header: "Status",
  cell: ({ row }) => <InstallerJobStatusBadge status={row.original.status} />,
};

/**
 * GET /auth/installer/jobs — Installations / Issues Reported / Installation
 * History, as on appdemo. The tab lives in `?tab=` and the header search
 * hands its query over in `?search=`.
 */
export default function JobsPage() {
  const [
    params,
    setParams,
  ] = useSearchParams();
  const tab = TABS.find(t => t === params.get("tab")) ?? "installations";
  const [
    status,
    setStatus,
  ] = useState<StatusFilter>("all");

  function openTab(next: JobsTab, nextStatus: StatusFilter = "all") {
    setStatus(nextStatus);
    setParams(
      p => ({
        ...Object.fromEntries(p),
        tab: next,
      }),
      { replace: true },
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onValueChange={v => openTab(v as JobsTab)}
      >
        <div className="flex justify-center">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger
              value="installations"
              className="flex items-center gap-2"
              aria-label="Installations"
            >
              <CalendarClock className="h-4 w-4" />
              <span className="hidden sm:inline">Installations</span>
            </TabsTrigger>
            <TabsTrigger
              value="issues"
              className="flex items-center gap-2"
              aria-label="Issues Reported"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Issues Reported</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2"
              aria-label="Installation History"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Installation History</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="installations"
          className="mt-6 space-y-6"
        >
          <InstallationsTab
            status={status}
            setStatus={setStatus}
            onCounter={c => openTab(
              c.tab,
              c.status,
            )}
          />
        </TabsContent>

        <TabsContent
          value="issues"
          className="mt-6"
        >
          <JobsTable
            title="Issues Reported"
            description="Reported issues, support requests, and resolution progress."
            query={{ status: "issue_reported" }}
            empty={{
              title: "No issues reported",
              hint: "Jobs you report an issue on are listed here until it is resolved.",
            }}
          />
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-6"
        >
          <HistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InstallationsTab({
  status, setStatus, onCounter,
}: {
  status: StatusFilter;
  setStatus: (s: StatusFilter) => void;
  onCounter: (c: Counter) => void;
}) {
  // The counters are the same on every jobs response; the offers query carries them.
  const offers = useInstallerJobs({
    scope: "active",
    status: "assigned",
    limit: 100,
  });
  const counters = offers.data?.data.counters;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {COUNTERS.map(c => (
          <Card
            key={c.id}
            className="rounded-2xl surface-sleek cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => onCounter(c)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs leading-tight text-muted-foreground">{c.label}</p>
                <p className="truncate text-xl font-semibold">{offers.isLoading ? "–" : (counters?.[c.id] ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <OffersTable query={offers} />

      <JobsTable
        title="Installation Jobs"
        description="Transport jobs, their assigned resources, and delivery progress."
        query={statusQuery(status)}
        searchPlaceholder="Search company, job, location or vehicle"
        statusFilter={{
          value: status,
          onChange: setStatus,
        }}
        dateFilter="scheduled"
        empty={{
          title: "No installation jobs",
          hint: "New jobs appear automatically once the system offers them to you.",
        }}
      />
    </>
  );
}

function SectionCard({
  title, description, action, children, toolbar,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  // Fleetflow puts the description inside the title row when the card has an action.
  const heading = (
    <>
      <CardTitle className="font-display">{title}</CardTitle>
      <CardDescription className="mt-1.5">{description}</CardDescription>
    </>
  );
  return (
    <Card className="rounded-2xl surface-sleek">
      <CardHeader className={toolbar ? "p-6 pb-4 space-y-4" : "p-6 pb-4 space-y-1.5"}>
        {action
          ? (
              <div className="flex items-center justify-between gap-3">
                {heading}
                {action}
              </div>
            )
          : heading}
        {toolbar}
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">{children}</CardContent>
    </Card>
  );
}

function OffersTable({ query }: { query: ReturnType<typeof useInstallerJobs> }) {
  const navigate = useNavigate();
  const zone = useZone();
  const accept = useAcceptInstallerJob();
  const [
    rejecting,
    setRejecting,
  ] = useState<InstallerJobListItem | null>(null);

  const columns = useMemo<ColumnDef<InstallerJobListItem>[]>(
    () => [
      {
        header: "Company Name",
        cell: ({ row }) => row.original.companyName || "-",
        meta: { className: "font-medium" },
      },
      {
        header: "Site Contact Name", accessorKey: "siteContactName", enableSorting: false,
      },
      {
        header: "Site Contact Phone No.", accessorKey: "siteContactPhone", enableSorting: false,
      },
      {
        header: "Installation Address",
        cell: ({ row }) => [
          row.original.address,
          row.original.city,
        ].filter(Boolean).join(", "),
      },
      {
        header: "Scheduled",
        cell: ({ row }) => `${row.original.scheduledDate} · ${formatTime12InTimezone(
          row.original.scheduledAt,
          zone,
        )}`,
      },
      {
        header: "Status",
        cell: ({ row }) => <InstallerJobStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        meta: { className: "text-right" },
        cell: ({ row: { original: j } }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/jobs/${j.id}`)}
            >
              View Details
            </Button>
            <Button
              size="sm"
              loading={accept.isPending && accept.variables?.jobId === j.id}
              disabled={accept.isPending}
              onClick={() => accept.mutate(
                { jobId: j.id },
                {
                  onSuccess: () => toast.success(
                    `Job ${j.jobNumber} accepted.`,
                    { description: "It is now scheduled." },
                  ),
                  onError: error => toast.error(error.statusCode === 409
                    ? "This job changed. The list has been refreshed."
                    : error.message),
                },
              )}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={accept.isPending}
              onClick={() => setRejecting(j)}
            >
              Reject
            </Button>
          </div>
        ),
      },
    ],
    [
      zone,
      navigate,
      accept,
    ],
  );

  return (
    <SectionCard
      title="Installation Offers"
      description="Details and current information for installation offers."
    >
      <div className="overflow-x-auto rounded-2xl border">
        <DataTable
          columns={columns}
          data={query.data?.data.items ?? []}
          isLoading={query.isLoading}
          isError={query.isError}
          errorMessage={query.error?.message || "Unable to load your offers."}
          onRetry={() => query.refetch()}
          emptyState={(
            <EmptyText
              title="No offers waiting"
              hint="New installation jobs offered to you appear here."
            />
          )}
        />
      </div>
      <RejectOfferForm
        offer={rejecting && {
          jobId: rejecting.id,
          jobNumber: rejecting.jobNumber,
        }}
        onClose={() => setRejecting(null)}
      />
    </SectionCard>
  );
}

function useZone() {
  return useInstallerDisplayPreferences().data?.data.timezone ?? DEFAULT_ZONE;
}

/** A page number that falls back to 1 whenever `filterKey` changes. */
function usePageFor(filterKey: string) {
  const [
    state,
    setState,
  ] = useState({
    filterKey, page: 1,
  });
  const page = state.filterKey === filterKey ? state.page : 1;
  return [
    page,
    (next: number) => setState({
      filterKey, page: next,
    }),
  ] as const;
}

/** Search box state: debounced into the query, seeded from `?search=`. */
function useSearch() {
  const [params] = useSearchParams();
  const initial = params.get("search") ?? "";
  const [
    input,
    setInput,
  ] = useState(initial);
  const [
    search,
    setSearch,
  ] = useState(initial);
  const [
    seed,
    setSeed,
  ] = useState(initial);

  // The header search can hand over a new query while this page is open —
  // reset during render (React's "adjust state on prop change"), not in an effect.
  if (seed !== initial) {
    setSeed(initial);
    setInput(initial);
    setSearch(initial);
  }

  const apply = useMemo(
    () => debounce(
      (value: string) => setSearch(value.trim()),
      400,
    ),
    [],
  );
  useEffect(
    () => () => apply.cancel(),
    [apply],
  );

  return {
    input,
    search,
    onChange: (value: string) => {
      setInput(value);
      apply(value);
    },
  };
}

function SearchBox({
  value, onChange, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={SEARCH_INPUT}
      />
    </div>
  );
}

type DateRange = {
  from: string; to: string;
};

/** appdemo's "Only show installations by..." popover — one date range. */
function DateFilter({
  label, value, onApply,
}: {
  label: string;
  value: DateRange | null;
  onApply: (range: DateRange | null) => void;
}) {
  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    enabled,
    setEnabled,
  ] = useState(!!value);
  const [
    range,
    setRange,
  ] = useState<DateRange>(value ?? {
    from: "", to: "",
  });

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 font-semibold shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {value && <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">1</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        className="w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto"
      >
        <h4 className="text-xs font-medium text-foreground px-0.5">Only show installations by...</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="flt-dateRange"
              checked={enabled}
              onCheckedChange={c => setEnabled(c === true)}
            />
            <Label
              htmlFor="flt-dateRange"
              className="text-sm cursor-pointer"
            >
              {label}
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              aria-label="From"
              className="h-9"
              disabled={!enabled}
              value={range.from}
              max={range.to || undefined}
              onChange={e => setRange(r => ({
                ...r,
                from: e.target.value,
              }))}
            />
            <Input
              type="date"
              aria-label="To"
              className="h-9"
              disabled={!enabled}
              value={range.to}
              min={range.from || undefined}
              onChange={e => setRange(r => ({
                ...r,
                to: e.target.value,
              }))}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            className="flex-1"
            onClick={() => {
              onApply(enabled && (range.from || range.to) ? range : null);
              setOpen(false);
            }}
          >
            Apply
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setEnabled(false);
              setRange({
                from: "", to: "",
              });
              onApply(null);
              setOpen(false);
            }}
          >
            Show All
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function JobsTable({
  title, description, query, searchPlaceholder, statusFilter, dateFilter, empty,
}: {
  title: string;
  description: string;
  query: InstallerJobsQuery;
  searchPlaceholder?: string;
  statusFilter?: {
    value: StatusFilter; onChange: (s: StatusFilter) => void;
  };
  dateFilter?: "scheduled";
  empty: {
    title: string; hint: string;
  };
}) {
  const navigate = useNavigate();
  const zone = useZone();
  const {
    input, search, onChange,
  } = useSearch();
  const [
    range,
    setRange,
  ] = useState<DateRange | null>(null);
  const [
    page,
    setPage,
  ] = usePageFor(JSON.stringify([
    query,
    search,
  ]));

  const jobs = useInstallerJobs({
    ...query,
    ...(search && { search }),
    page,
    limit: PAGE_SIZE,
  });
  const data = jobs.data?.data;
  // ponytail: the jobs API filters by completion date only, so the scheduled-date
  // range narrows the loaded page here. Move to the server once it takes
  // scheduledFrom/scheduledTo.
  const items = (data?.items ?? []).filter(j => !range
    || ((!range.from || j.scheduledDate >= range.from) && (!range.to || j.scheduledDate <= range.to)));

  const columns = useMemo<ColumnDef<InstallerJobListItem>[]>(
    () => [
      companyColumn,
      {
        header: "Site Contact Name", accessorKey: "siteContactName", enableSorting: false,
      },
      {
        header: "Site Contact Phone No.", accessorKey: "siteContactPhone", enableSorting: false,
      },
      locationColumn,
      {
        header: "Vehicles", accessorKey: "vehicleCount", enableSorting: false,
      },
      {
        header: "Devices", accessorKey: "deviceCount", enableSorting: false,
      },
      {
        header: "Date", accessorKey: "scheduledDate", enableSorting: false,
      },
      {
        header: "Time",
        cell: ({ row }) => formatTime12InTimezone(
          row.original.scheduledAt,
          zone,
        ),
      },
      statusColumn,
      {
        id: "action",
        header: "Action",
        meta: { className: "text-right" },
        // List items carry no allowed actions; Start/Complete live on the job page, driven by `actions`.
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/jobs/${row.original.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        ),
      },
    ],
    [
      zone,
      navigate,
    ],
  );

  return (
    <SectionCard
      title={title}
      description={description}
    >
      {searchPlaceholder && (
        <div className="flex flex-wrap items-center gap-2 w-full px-1">
          <SearchBox
            value={input}
            onChange={onChange}
            placeholder={searchPlaceholder}
          />
          {statusFilter && (
            <Select
              value={statusFilter.value}
              onValueChange={v => statusFilter.onChange(v as StatusFilter)}
            >
              <SelectTrigger className="h-9 w-[150px] shrink-0 border-border bg-transparent font-semibold hover:bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => (
                  <SelectItem
                    key={o.id}
                    value={o.id}
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {dateFilter && (
            <DateFilter
              label="Scheduled date"
              value={range}
              onApply={setRange}
            />
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border">
        <DataTable
          columns={columns}
          data={items}
          isLoading={jobs.isLoading}
          isError={jobs.isError}
          errorMessage={jobs.error?.message || "Unable to load your jobs."}
          onRetry={() => jobs.refetch()}
          hasActiveFilters={!!(search || range || statusFilter?.value !== "all")}
          emptyState={(
            <EmptyText
              title={empty.title}
              hint={empty.hint}
            />
          )}
          filteredEmptyState={(
            <EmptyText
              title={empty.title}
              hint="Nothing matches these filters."
            />
          )}
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            total: data?.total ?? 0,
            onPageChange: setPage,
          }}
        />
      </div>
    </SectionCard>
  );
}

function HistoryTable() {
  const navigate = useNavigate();
  const zone = useZone();
  const {
    input, search, onChange,
  } = useSearch();
  const [
    range,
    setRange,
  ] = useState<DateRange | null>(null);
  const [
    page,
    setPage,
  ] = usePageFor(JSON.stringify([
    search,
    range,
  ]));
  const [
    exporting,
    setExporting,
  ] = useState(false);

  const dates = {
    ...(range?.from && { completedFrom: range.from }),
    ...(range?.to && { completedTo: range.to }),
  };

  const jobs = useInstallerJobs({
    scope: "history",
    ...dates,
    ...(search && { search }),
    page,
    limit: PAGE_SIZE,
  });
  const data = jobs.data?.data;

  const columns = useMemo<ColumnDef<InstallerJobListItem>[]>(
    () => [
      companyColumn,
      {
        header: "Site Contact Name", accessorKey: "siteContactName", enableSorting: false,
      },
      {
        header: "Contact Phone", accessorKey: "siteContactPhone", enableSorting: false,
      },
      locationColumn,
      {
        header: "Devices", accessorKey: "deviceCount", enableSorting: false,
      },
      {
        header: "Vehicles", accessorKey: "vehicleCount", enableSorting: false,
      },
      {
        header: "Completion Date",
        cell: ({ row }) => formatDateInTimezone(
          row.original.completedAt,
          zone,
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: undefined,
            minute: undefined,
          },
        ),
      },
      {
        header: "Completion Time",
        cell: ({ row }) => formatTime12InTimezone(
          row.original.completedAt,
          zone,
        ),
      },
      statusColumn,
      {
        id: "actions",
        header: "Actions",
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/jobs/${row.original.id}`)}
          >
            View Details
          </Button>
        ),
      },
    ],
    [
      zone,
      navigate,
    ],
  );

  async function exportHistory() {
    setExporting(true);
    try {
      // The zone makes the CSV's completion date/time match what this screen shows.
      const blob = await exportInstallerJobs({
        ...(search && { search }),
        ...dates,
        timezone: zone,
      });
      downloadBlob(
        blob,
        "installation-history.csv",
      );
    }
    catch (error) {
      toast.error((error as { message?: string }).message ?? "Export failed.");
    }
    finally {
      setExporting(false);
    }
  }

  return (
    <SectionCard
      title="Installation History"
      description="Recorded activity and changes, listed with their dates and details."
      action={(
        <Button
          size="sm"
          variant="outline"
          className="bg-transparent border-input"
          onClick={exportHistory}
          loading={exporting}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      )}
      toolbar={(
        <div className="flex flex-wrap items-center gap-2 w-full px-1">
          <SearchBox
            value={input}
            onChange={onChange}
            placeholder="Search completed installations"
          />
          <DateFilter
            label="Completion date"
            value={range}
            onApply={setRange}
          />
        </div>
      )}
    >
      <div className="overflow-x-auto rounded-2xl border">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={jobs.isLoading}
          isError={jobs.isError}
          errorMessage={jobs.error?.message || "Unable to load your installation history."}
          onRetry={() => jobs.refetch()}
          hasActiveFilters={!!(search || range)}
          emptyState={(
            <EmptyText
              title="No completed installations yet"
              hint="Jobs appear here once you complete them."
            />
          )}
          filteredEmptyState={(
            <EmptyText
              title="No completed installations"
              hint="Nothing matches these filters."
            />
          )}
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            total: data?.total ?? 0,
            onPageChange: setPage,
          }}
        />
      </div>
    </SectionCard>
  );
}

function EmptyText({
  title, hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="py-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
