import type {
  InstallerJobCounters, InstallerJobListItem, InstallerJobsQuery, InstallerJobStatus,
} from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  exportInstallerJobs,
  useInstallerDisplayPreferences,
  useInstallerJobs,
} from "@truckmoov/api/auth";
import {
  debounce,
  downloadBlob,
} from "@truckmoov/app-core/utils/general-utils";
import {
  formatDateOnlyInTimezone,
  formatTimeInTimezone,
} from "@truckmoov/app-core/utils/time-utils";
import { DeviceTroubleshooting } from "@truckmoov/reusables/components/installation/DeviceTroubleshooting";
import { VerificationMonitor } from "@truckmoov/reusables/components/installation/VerificationMonitor";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Loader,
  Radio,
  Search,
  Wrench,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import {
  useDeviceCatalog,
  useDeviceConfig,
} from "@/features/devices/hooks/useDeviceConfig";
import { InstallerJobStatusBadge } from "@/features/jobs/components/ui/InstallerJobStatusBadge";

// Display Preferences default (TRU-FE-21) until the installer picks another zone.
const DEFAULT_ZONE = "Africa/Lagos";
const PAGE_SIZE = 20;

/** The ticket's three list tabs (TRU-FE-20). */
type JobsView = "installations" | "issues" | "history";

/** Statuses the Installations tab (scope=active) can narrow to. */
const ACTIVE_STATUS_OPTIONS: {
  id: "all" | InstallerJobStatus; label: string;
}[] = [
  {
    id: "all", label: "All open jobs",
  },
  {
    id: "assigned", label: "Offers",
  },
  {
    id: "scheduled", label: "Scheduled",
  },
  {
    id: "in_progress", label: "In progress",
  },
  {
    id: "overdue", label: "Overdue",
  },
];

type Counter = {
  id: keyof InstallerJobCounters;
  label: string;
  icon: ElementType;
  view: JobsView;
  status?: InstallerJobStatus;
};

const COUNTERS: Counter[] = [
  {
    id: "total", label: "All Installation Jobs", icon: ClipboardList, view: "installations",
  },
  {
    id: "scheduled", label: "Scheduled", icon: CalendarClock, view: "installations", status: "scheduled",
  },
  {
    id: "inProgress", label: "In Progress", icon: Loader, view: "installations", status: "in_progress",
  },
  {
    id: "overdue", label: "Overdue", icon: Clock, view: "installations", status: "overdue",
  },
  {
    id: "issueReported", label: "Issue Reported", icon: AlertTriangle, view: "issues",
  },
  {
    id: "completed", label: "Completed", icon: CheckCircle2, view: "history",
  },
];

export default function JobsPage() {
  const [
    section,
    setSection,
  ] = useState("jobs");
  const [
    selectedDeviceId,
    setSelectedDeviceId,
  ] = useState<string | null>(null);

  const {
    configQueueDevices,
    loading,
    refetch,
    resetToConfigPending,
    canResetDevices,
  } = useDeviceConfig();
  useDeviceCatalog();

  const handleOpenTroubleshooting = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setSection("troubleshooting");
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={section}
        onValueChange={setSection}
      >
        <div className="flex justify-center">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger
              value="jobs"
              className="flex items-center gap-2"
            >
              <CalendarClock className="h-4 w-4" />
              <span className="hidden sm:inline">Installations</span>
            </TabsTrigger>
            <TabsTrigger
              value="verification"
              className="flex items-center gap-2"
            >
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
            <TabsTrigger
              value="troubleshooting"
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Troubleshooting</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="jobs"
          className="mt-6 space-y-6"
        >
          <InstallationJobs />
        </TabsContent>

        <TabsContent
          value="verification"
          className="mt-6"
        >
          <VerificationMonitor
            devices={configQueueDevices}
            loading={loading}
            onRefresh={refetch}
            onTroubleshoot={handleOpenTroubleshooting}
          />
        </TabsContent>

        <TabsContent
          value="troubleshooting"
          className="mt-6"
        >
          <DeviceTroubleshooting
            devices={configQueueDevices}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={setSelectedDeviceId}
            onReset={canResetDevices() ? resetToConfigPending : undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const EMPTY: Record<JobsView, {
  title: string; hint: string;
}> = {
  installations: {
    title: "No open installation jobs",
    hint: "New jobs appear automatically once the system offers them to you.",
  },
  issues: {
    title: "No issues reported",
    hint: "Jobs you report an issue on are listed here until it is resolved.",
  },
  history: {
    title: "No completed installations yet",
    hint: "Jobs appear here once you complete them.",
  },
};

/**
 * GET /auth/installer/jobs — the page counters and one page of jobs. Every
 * filter goes to the server; nothing is filtered here.
 */
function InstallationJobs() {
  const navigate = useNavigate();
  const zone = useInstallerDisplayPreferences().data?.data.timezone ?? DEFAULT_ZONE;

  const [
    view,
    setView,
  ] = useState<JobsView>("installations");
  const [
    status,
    setStatus,
  ] = useState<"all" | InstallerJobStatus>("all");
  const [
    searchInput,
    setSearchInput,
  ] = useState("");
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    completedFrom,
    setCompletedFrom,
  ] = useState("");
  const [
    completedTo,
    setCompletedTo,
  ] = useState("");
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    exporting,
    setExporting,
  ] = useState(false);

  // Typing refetches once the installer pauses, and always from page 1.
  const applySearch = useMemo(
    () => debounce(
      (value: string) => {
        setSearch(value.trim());
        setPage(1);
      },
      400,
    ),
    [],
  );
  useEffect(
    () => () => applySearch.cancel(),
    [applySearch],
  );

  const query: InstallerJobsQuery = {
    ...(view === "installations" && {
      scope: "active",
      ...(status !== "all" && { status }),
    }),
    ...(view === "issues" && { status: "issue_reported" }),
    ...(view === "history" && {
      scope: "history",
      ...(completedFrom && { completedFrom }),
      ...(completedTo && { completedTo }),
    }),
    ...(search && { search }),
    page,
    limit: PAGE_SIZE,
  };
  const jobs = useInstallerJobs(query);
  const data = jobs.data?.data;
  const pageCount = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / PAGE_SIZE),
  );

  function openView(next: JobsView, nextStatus: "all" | InstallerJobStatus = "all") {
    setView(next);
    setStatus(nextStatus);
    setPage(1);
  }

  async function exportHistory() {
    setExporting(true);
    try {
      // The zone makes the CSV's completion date/time match what this screen shows.
      const blob = await exportInstallerJobs({
        ...(search && { search }),
        ...(completedFrom && { completedFrom }),
        ...(completedTo && { completedTo }),
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
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {COUNTERS.map(c => (
          <Card
            key={c.id}
            className="cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => openView(
              c.view,
              c.status,
            )}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{c.label}</p>
                <p className="truncate text-xl font-semibold">{jobs.isLoading ? "–" : (data?.counters[c.id] ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Installation Jobs</CardTitle>
          <Tabs
            value={view}
            onValueChange={v => openView(v as JobsView)}
          >
            <TabsList>
              <TabsTrigger value="installations">Installations</TabsTrigger>
              <TabsTrigger value="issues">Issues Reported</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  applySearch(e.target.value);
                }}
                placeholder="Search job number, company, address or vehicle registration"
                className="pl-9"
              />
            </div>

            {view === "installations" && (
              <Select
                value={status}
                onValueChange={v => openView(
                  "installations",
                  v as "all" | InstallerJobStatus,
                )}
              >
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_STATUS_OPTIONS.map(o => (
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

            {view === "history" && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  aria-label="Completed from"
                  value={completedFrom}
                  max={completedTo || undefined}
                  onChange={(e) => {
                    setCompletedFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-auto"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="date"
                  aria-label="Completed to"
                  value={completedTo}
                  min={completedFrom || undefined}
                  onChange={(e) => {
                    setCompletedTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-auto"
                />
                <Button
                  variant="outline"
                  onClick={exportHistory}
                  loading={exporting}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Installation Location</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>{view === "history" ? "Completed" : "Scheduled Date"}</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map(j => (
                  <JobRow
                    key={j.id}
                    job={j}
                    zone={zone}
                    history={view === "history"}
                    onOpen={() => navigate(`/jobs/${j.id}`)}
                  />
                ))}
                {!data?.items.length && (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="py-12 text-center"
                    >
                      {jobs.isLoading
                        ? <p className="text-sm text-muted-foreground">Loading jobs…</p>
                        : jobs.isError
                          ? (
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Unable to load your jobs.</p>
                                <Button
                                  variant="link"
                                  onClick={() => jobs.refetch()}
                                >
                                  Try again
                                </Button>
                              </div>
                            )
                          : (
                              <>
                                <p className="text-sm font-medium">{EMPTY[view].title}</p>
                                <p className="text-xs text-muted-foreground">{search || completedFrom || completedTo ? "Nothing matches these filters." : EMPTY[view].hint}</p>
                              </>
                            )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {(data?.total ?? 0) > PAGE_SIZE && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page
                {" "}
                {page}
                {" "}
                of
                {" "}
                {pageCount}
                {" · "}
                {data?.total}
                {" "}
                jobs
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || jobs.isFetching}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pageCount || jobs.isFetching}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function JobRow({
  job, zone, history, onOpen,
}: {
  job: InstallerJobListItem;
  zone: string;
  history: boolean;
  onOpen: () => void;
}) {
  const when = history ? job.completedAt : job.scheduledAt;

  return (
    <TableRow>
      <TableCell className="font-medium">{job.jobNumber}</TableCell>
      <TableCell>
        {job.companyName || "—"}
        <span className="block text-xs text-muted-foreground">{job.siteContactName}</span>
      </TableCell>
      <TableCell>
        {job.firstVehicle?.registrationNumber ?? "—"}
        {job.firstVehicle && (
          <span className="block text-xs text-muted-foreground">
            {job.firstVehicle.make}
            {" "}
            {job.firstVehicle.model}
          </span>
        )}
      </TableCell>
      <TableCell>
        {job.firstDevice?.manufacturer ?? "—"}
        {job.firstDevice && <span className="block text-xs text-muted-foreground">{job.firstDevice.model}</span>}
      </TableCell>
      <TableCell>
        {[
          job.city,
          job.state,
        ].filter(Boolean).join(", ") || "—"}
      </TableCell>
      <TableCell>{job.vehicleCount}</TableCell>
      <TableCell>{job.deviceCount}</TableCell>
      <TableCell>
        {formatDateOnlyInTimezone(
          when,
          zone,
        )}
      </TableCell>
      <TableCell>
        {history
          ? formatTimeInTimezone(
              job.completedAt,
              zone,
            )
          : `${formatTimeInTimezone(
            job.scheduledAt,
            zone,
          )} – ${formatTimeInTimezone(
            job.scheduledUntil,
            zone,
          )}`}
      </TableCell>
      <TableCell>
        <InstallerJobStatusBadge status={job.status} />
      </TableCell>
      <TableCell className="text-right">
        {/* List items carry no allowed actions; Start/Complete/Accept live on the job page, driven by `actions`. */}
        <Button
          size="sm"
          variant="outline"
          onClick={onOpen}
        >
          {job.status === "assigned" ? "Review offer" : "View Job"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
