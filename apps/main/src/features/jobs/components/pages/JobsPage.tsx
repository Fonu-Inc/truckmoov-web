import type {
  DispatchJob, DispatchJobPriority, JobsQuery,
} from "@truckmoov/api/dispatch";
import type { JobFormSubmitData } from "@/components/jobs/JobFormDialog";
import type { AssignResourceKind } from "@/features/jobs/components/ui/AssignResourceDialog";
import type {
  JobsFilterBounds, JobsFilterValue,
} from "@/features/jobs/components/ui/JobsFilterDialog";
import type { JobStatusTone } from "@/features/jobs/utils/jobStatus";
import {
  useAddJobAttachment,
  useAssignJob,
  useCreateJob,
  useDeleteJob,
  useJob,
  useJobs,
  useJobsSummary,
  useUpdateJobDetails,
  useUpdateJobScheduling,
} from "@truckmoov/api/dispatch";
import {
  useDrivers, useFleetGroups, useVehicles,
} from "@truckmoov/api/fleet";
import { format } from "date-fns";
import {
  ArrowRight,
  Ban,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  MapPin,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
  User,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  matchNavEntry, resolveLabel,
} from "@/features/dashboard/utils/sidebarNav";
import { AssignResourceDialog } from "@/features/jobs/components/ui/AssignResourceDialog";
import { CancelJobDialog } from "@/features/jobs/components/ui/CancelJobDialog";
import { JobDetailsDialog } from "@/features/jobs/components/ui/JobDetailsDialog";
import { JobsFilterDialog } from "@/features/jobs/components/ui/JobsFilterDialog";
import {
  buildCargoPayload, buildStopsPayload, readFileAsBase64, readJobPrefill, requiredVehicleType,
} from "@/features/jobs/utils/jobPayload";
import {
  pendingReports, stepLabel,
} from "@/features/jobs/utils/jobProgress";
import {
  buildDefaultFilterValue,
  countActiveFilters,
  toJobsQueryParams,
} from "@/features/jobs/utils/jobsFilter";
import {
  jobStatusLabel, jobStatusTone, PRIORITY_BADGE, STATUS_BADGE,
} from "@/features/jobs/utils/jobStatus";
import { PageHeader } from "@/shared/components/layout/PageHeader";

type JobStatusFilter = NonNullable<NonNullable<JobsQuery["params"]>["status"]>;

/** The design app splits the list: open work under "Jobs", finished work under "Job History". */
type JobsTab = "jobs" | "history";

const TAB_TONES: Record<JobsTab, JobStatusTone[]> = {
  jobs: [
    "created",
    "assigned",
    "in_progress",
  ],
  history: [
    "completed",
    "cancelled",
  ],
};

const TAB_CARD: Record<JobsTab, {
  title: string; description: string;
}> = {
  jobs: {
    title: "All Jobs", description: "Unassigned, assigned and in-progress jobs on your account.",
  },
  history: {
    title: "Job History", description: "Completed and cancelled jobs on your account.",
  },
};

const JOB_STATUS_OPTIONS: Record<JobsTab, Array<{
  value: JobStatusFilter; label: string;
}>> = {
  jobs: [
    {
      value: "all", label: "All Statuses",
    },
    {
      value: "created", label: "Unassigned",
    },
    {
      value: "assigned", label: "Assigned",
    },
    {
      value: "in_progress", label: "In Progress",
    },
  ],
  history: [
    {
      value: "all", label: "All Statuses",
    },
    {
      value: "completed", label: "Completed",
    },
    {
      value: "cancelled", label: "Cancelled",
    },
  ],
};

/** "Dec 11, 2024 8:30 AM" — the design app's start date and deadline cells. */
function formatScheduleDate(iso?: string | null) {
  if (!iso)
    return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : format(
    date,
    "MMM d, yyyy h:mm a",
  );
}

/** "11 Dec 2024, 08:30" — the design app's Date Created cell. */
function formatCreatedDate(iso?: string | null) {
  if (!iso)
    return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : format(
    date,
    "dd MMM yyyy, HH:mm",
  );
}

function stopsLabel(job: DispatchJob) {
  const n = job.stops?.length ?? 0;
  return n > 0 ? `${n} stop${n === 1 ? "" : "s"}` : null;
}

const KPI_TONE = {
  primary: [
    "rounded-lg bg-primary/10 p-2",
    "h-5 w-5 text-primary",
  ],
  warning: [
    "rounded-lg bg-warning/10 p-2",
    "h-5 w-5 text-warning",
  ],
  success: [
    "rounded-lg bg-success/10 p-2",
    "h-5 w-5 text-success",
  ],
  destructive: [
    "rounded-lg bg-destructive/10 p-2",
    "h-5 w-5 text-destructive",
  ],
} as const;

// Driver replies arrive on their own, so the list checks for them.
const JOBS_REFRESH_MS = 30_000;

const NO_BOUNDS: JobsFilterBounds = {
  weightMin: 0, weightMax: 0, amountMin: 0, amountMax: 0,
};

function useDebouncedValue<T>(value: T, delayMs = 400) {
  const [
    debouncedValue,
    setDebouncedValue,
  ] = useState(value);

  useEffect(
    () => {
      const timeout = window.setTimeout(
        setDebouncedValue,
        delayMs,
        value,
      );
      return () => window.clearTimeout(timeout);
    },
    [
      value,
      delayMs,
    ],
  );

  return debouncedValue;
}

// The form offers fleetflow's "medium"; the dispatch API calls it "normal".
function toApiPriority(priority: JobFormSubmitData["priority"]): DispatchJobPriority {
  return priority === "medium" ? "normal" : priority;
}

// The API takes kg (`cargoWeight` / `load_weight_kg`); the form lets the user pick a unit.
// ponytail: cbm/pallets/boxes aren't weights; sent as-is.
const KG_PER_UNIT: Record<string, number> = {
  kg: 1, tons: 1000, lbs: 0.453592,
};
function toKg(weight: number, unit?: string) {
  return Math.round(weight * (KG_PER_UNIT[unit ?? "kg"] ?? 1));
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// The wizard shows "medium" where the dispatch API says "normal".
function toFormPriority(priority?: DispatchJobPriority): JobFormSubmitData["priority"] | undefined {
  return priority === "normal" ? "medium" : priority;
}

// JobFormDialog still takes the legacy `Job` shape, plus what that shape cannot hold.
function mapToLegacyJob(job: DispatchJob, driverName?: string) {
  return {
    priority: toFormPriority(job.priority),
    prefill: readJobPrefill(job),
    id: job.id ?? "",
    reference: job.reference || job.id || "Unreferenced",
    status: jobStatusTone(job.status || "created"),
    pickup: {
      address: job.pickup?.address || "", lat: toNumber(job.pickup?.latitude), lng: toNumber(job.pickup?.longitude),
    },
    delivery: {
      address: job.dropoff?.address || "", lat: toNumber(job.dropoff?.latitude), lng: toNumber(job.dropoff?.longitude),
    },
    cargo: {
      type: job.cargo_type || "", weight: job.load_weight_kg ?? 0, description: job.cargo_description || "",
    },
    amount: job.amount_ngn || 0,
    deadline: new Date(job.deadline || job.time_window?.dropoff_end || Date.now()),
    createdAt: new Date(job.created_at || Date.now()),
    driverId: job.assigned_driver_id,
    driverName,
    driverPhone: job.assigned_driver_phone,
    vehicleId: job.assigned_vehicle_id,
    stops: job.stops,
    loadVolumeM3: job.load_volume_m3,
    requiredVehicleType: job.required_vehicle_type,
    estimatedServiceMinutes: job.estimated_service_minutes,
    acknowledgedAt: job.acknowledged_at,
  };
}

export default function JobsPage() {
  const role = useAuthStore(s => s.user?.role);
  const isAggregatorAdmin = role === "AGGREGATOR_ADMIN";
  // The design app labels the enterprise admin's assign actions "Recommend …".
  // Wording only: AssignResourceDialog still assigns the driver/vehicle directly.
  const recommendOnly = role === "ENTERPRISE_ADMIN";
  const navEntry = matchNavEntry("/jobs");
  const pageTitle = navEntry ? resolveLabel(
    navEntry,
    role,
  ) : "Jobs";

  const [
    tab,
    setTab,
  ] = useState<JobsTab>("jobs");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery);
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<JobStatusFilter>("all");
  const [
    isFormOpen,
    setIsFormOpen,
  ] = useState(false);
  const [
    isDetailsOpen,
    setIsDetailsOpen,
  ] = useState(false);
  const [
    matchingKind,
    setMatchingKind,
  ] = useState<AssignResourceKind | null>(null);
  const [
    selectedJob,
    setSelectedJob,
  ] = useState<DispatchJob | null>(null);
  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<DispatchJob | null>(null);
  const [
    cancelTarget,
    setCancelTarget,
  ] = useState<DispatchJob | null>(null);
  const [
    isFilterOpen,
    setIsFilterOpen,
  ] = useState(false);
  const [
    filterValue,
    setFilterValue,
  ] = useState<JobsFilterValue>(() => buildDefaultFilterValue(NO_BOUNDS));
  const createJobMutation = useCreateJob();
  const updateJobDetailsMutation = useUpdateJobDetails();
  const updateJobSchedulingMutation = useUpdateJobScheduling();
  const addAttachmentMutation = useAddJobAttachment();
  const deleteJobMutation = useDeleteJob();
  const assignJobMutation = useAssignJob();

  const activeFilterCount = countActiveFilters(filterValue);

  const jobsQueryPayload = useMemo<JobsQuery | undefined>(
    () => {
      const params: NonNullable<JobsQuery["params"]> = toJobsQueryParams(filterValue);
      const query = debouncedSearchQuery.trim();
      if (statusFilter !== "all")
        params.status = statusFilter;
      if (query)
        params.query = query;
      return Object.keys(params).length > 0 ? { params } : undefined;
    },
    [
      debouncedSearchQuery,
      filterValue,
      statusFilter,
    ],
  );

  const jobsQuery = useJobs(
    jobsQueryPayload,
    { refetchInterval: JOBS_REFRESH_MS },
  );
  const jobsSummaryQuery = useJobsSummary();
  const driversQuery = useDrivers();
  const vehiclesQuery = useVehicles();
  // Enterprise accounts see each vehicle's fleet under its plate, as the design app does; owner operators don't.
  const showFleet = role === "ENTERPRISE_ADMIN";
  const fleetGroupsQuery = useFleetGroups();
  const fleetNameByVehicle = useMemo(
    () => new Map((showFleet ? fleetGroupsQuery.data?.data ?? [] : []).flatMap(f => f.vehicleIds.map(id => [
      id,
      f.name,
    ] as const))),
    [
      showFleet,
      fleetGroupsQuery.data,
    ],
  );
  const selectedJobDetailsQuery = useJob(isFormOpen ? selectedJob?.id ?? "" : "");
  const allJobs = jobsQuery.data?.data;
  // The API takes one status at a time, so "All Statuses" fetches everything
  // and each tab keeps only its own stages.
  const jobs = useMemo(
    () => (allJobs ?? []).filter(j => TAB_TONES[tab].includes(jobStatusTone(j.status || "created"))),
    [
      allJobs,
      tab,
    ],
  );

  // The job only carries assigned_* ids — names and plates come from the fleet lists.
  const driverById = useMemo(
    () => new Map((driversQuery.data?.data ?? []).map(d => [
      d.id,
      d,
    ])),
    [driversQuery.data?.data],
  );
  const vehicleById = useMemo(
    () => new Map((vehiclesQuery.data?.data ?? []).map(v => [
      v.id,
      v,
    ])),
    [vehiclesQuery.data?.data],
  );

  const byStatus = jobsSummaryQuery.data?.data?.by_status ?? {};
  const count = (...keys: string[]) => keys.reduce(
    (sum, k) => sum + (byStatus[k] ?? 0),
    0,
  );
  const kpis = [
    {
      label: "Total Jobs", value: jobsSummaryQuery.data?.data?.total ?? 0, icon: Package, tone: "primary",
    },
    {
      label: "Assigned Jobs", value: count("assigned"), icon: UserCheck, tone: "primary",
    },
    {
      label: "Unassigned Jobs", value: count(
        "pending",
        "created",
      ), icon: Clock, tone: "warning",
    },
    {
      label: "Jobs In Progress", value: count(
        "in_progress",
        "en-route",
        "arrived",
        "loaded",
      ), icon: Truck, tone: "primary",
    },
    {
      label: "Completed Jobs", value: count(
        "completed",
        "delivered",
      ), icon: CheckCircle, tone: "success",
    },
    {
      label: "Cancelled Jobs", value: count("cancelled"), icon: XCircle, tone: "destructive",
    },
  ] as const;

  // Files are uploaded one by one after the job is saved, because the job has
  // to exist first. A file that fails is named so it can be added again.
  const uploadAttachments = async (jobId: string, files: File[]) => {
    const failed: string[] = [];
    for (const file of files) {
      try {
        await addAttachmentMutation.mutateAsync({
          jobId,
          data: {
            name: file.name,
            content_type: file.type || undefined,
            content_base64: await readFileAsBase64(file),
          },
        });
      }
      catch {
        failed.push(file.name);
      }
    }
    if (failed.length > 0)
      toast.error(`These files were not attached: ${failed.join(", ")}. Open the job and add them again.`);
  };

  const handleAddJob = async (data: JobFormSubmitData) => {
    const {
      pickup, dropoff, stops,
    } = buildStopsPayload(data);
    createJobMutation.mutate(
      {
        data: {
          pickupLocation: data.pickupAddress,
          deliveryLocation: data.deliveryAddress,
          reference: data.reference,
          pickup,
          dropoff,
          stops,
          cargoType: data.cargoType,
          cargoDescription: data.cargoDescription,
          cargo: buildCargoPayload(data),
          required_vehicle_type: requiredVehicleType(data),
          load_weight_kg: toKg(
            data.cargoWeight,
            data.cargoUnit,
          ),
          amount: data.amount,
          deadline: new Date(data.deadline).toISOString(),
          priority: toApiPriority(data.priority),
        },
      },
      {
        onSuccess: async (created) => {
          toast.success("Job created");
          setIsFormOpen(false);
          setSelectedJob(null);
          if (created.data.id && data.attachmentFiles.length > 0) {
            await uploadAttachments(
              created.data.id,
              data.attachmentFiles,
            );
          }
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleEditJob = async (data: JobFormSubmitData) => {
    if (!selectedJob?.id)
      return;
    if (!selectedJobDetailsQuery.data?.data) {
      toast.info("Job details are still loading. Try again in a moment.");
      return;
    }
    const jobId = selectedJob.id;
    const {
      pickup, dropoff, stops,
    } = buildStopsPayload(data);
    updateJobDetailsMutation.mutate(
      {
        jobId,
        data: {
          pickup,
          dropoff,
          stops,
          cargo_type: data.cargoType,
          cargo_description: data.cargoDescription,
          cargo: buildCargoPayload(data),
          required_vehicle_type: requiredVehicleType(data) ?? "",
          load_weight_kg: toKg(
            data.cargoWeight,
            data.cargoUnit,
          ),
          amount: data.amount,
          deadline: new Date(data.deadline).toISOString(),
        },
      },
      {
        onSuccess: async () => {
          updateJobSchedulingMutation.mutate({
            jobId,
            data: { priority: toApiPriority(data.priority) },
          });
          toast.success("Job updated");
          setIsFormOpen(false);
          if (data.attachmentFiles.length > 0) {
            await uploadAttachments(
              jobId,
              data.attachmentFiles,
            );
          }
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleDeleteJob = () => {
    const jobId = deleteTarget?.id;
    if (!jobId)
      return;
    deleteJobMutation.mutate(
      { jobId },
      {
        onSuccess: () => {
          toast.success("Job record deleted");
          setDeleteTarget(null);
        },
        onError: error => toast.error(error.message),
      },
    );
  };
  const isJobActionPending = deleteJobMutation.isPending;

  // POST /dispatch/jobs/{id}/assign takes either side alone; the server keeps the other.
  const handleAssignResource = (kind: AssignResourceKind, resourceId: string) => {
    if (!selectedJob?.id)
      return;
    assignJobMutation.mutate(
      {
        jobId: selectedJob.id,
        data: kind === "driver"
          ? {
              driver_id: resourceId, driver_phone: driverById.get(resourceId)?.phone,
            }
          : { vehicle_id: resourceId },
      },
      {
        onSuccess: () => {
          const what = kind === "driver" ? "Driver" : "Vehicle";
          toast.success(recommendOnly ? `${what} recommended for job` : `${what} assigned to job`);
          setMatchingKind(null);
          // Names/plates in the table come from the fleet lists, so refresh those with the jobs.
          jobsQuery.refetch();
          jobsSummaryQuery.refetch();
          driversQuery.refetch();
          vehiclesQuery.refetch();
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const openDetails = (job: DispatchJob) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  const openMatching = (job: DispatchJob, kind: AssignResourceKind) => {
    setSelectedJob(job);
    setMatchingKind(kind);
  };

  const assignLabel = recommendOnly ? "Recommend" : "Assign";

  // Ref menu: View Details always; Cancel Job only while unassigned/assigned;
  // Delete Job Record once completed. In-progress and cancelled jobs are view-only.
  const renderActions = (job: DispatchJob) => {
    const tone = jobStatusTone(job.status || "created");
    const canCancel = !isAggregatorAdmin && (tone === "created" || tone === "assigned");
    const canDelete = !isAggregatorAdmin && tone === "completed";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Job actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openDetails(job)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          {(canCancel || canDelete) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => (canDelete ? setDeleteTarget(job) : setCancelTarget(job))}
              >
                {canDelete
                  ? <Trash2 className="h-4 w-4 mr-2" />
                  : <Ban className="h-4 w-4 mr-2" />}
                {canDelete ? "Delete Job Record" : "Cancel Job"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // An unassigned side shows the assign/recommend button, as in the design app
  // (aggregators only watch jobs, so they get a dash).
  const renderAssignButton = (job: DispatchJob, kind: AssignResourceKind) => {
    if (isAggregatorAdmin)
      return <span className="text-xs text-muted-foreground">—</span>;
    const Icon = kind === "driver" ? Users : Truck;
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs"
        onClick={() => openMatching(
          job,
          kind,
        )}
      >
        <Icon className="h-3.5 w-3.5 mr-1.5" />
        {`${assignLabel} ${kind === "driver" ? "Driver" : "Vehicle"}`}
      </Button>
    );
  };

  const driverNameFor = (job: DispatchJob) => {
    const driver = job.assigned_driver_id ? driverById.get(job.assigned_driver_id) : undefined;
    return driver?.name ?? job.assigned_driver_name ?? null;
  };
  const vehiclePlateFor = (job: DispatchJob) => {
    const vehicle = job.assigned_vehicle_id ? vehicleById.get(job.assigned_vehicle_id) : undefined;
    return vehicle?.plateNumber ?? job.assigned_vehicle_reg ?? null;
  };

  const exportColumns = [
    {
      header: "Pickup Address", accessor: (j: DispatchJob) => j.pickup?.address || "—",
    },
    {
      header: "Delivery Address", accessor: (j: DispatchJob) => j.dropoff?.address || "—",
    },
    {
      header: "Stops", accessor: (j: DispatchJob) => stopsLabel(j) ?? "—",
    },
    {
      header: "Assigned Driver", accessor: (j: DispatchJob) => driverNameFor(j) ?? "—",
    },
    {
      header: "Assigned Vehicle", accessor: (j: DispatchJob) => vehiclePlateFor(j) ?? "—",
    },
    {
      header: "Priority", accessor: (j: DispatchJob) => j.priority?.toUpperCase() ?? "—",
    },
    {
      header: "Status", accessor: (j: DispatchJob) => jobStatusLabel(j.status || "created"),
    },
    {
      header: "Start Date", accessor: (j: DispatchJob) => formatScheduleDate(j.time_window?.pickup_start),
    },
    {
      header: "Deadline", accessor: (j: DispatchJob) => formatScheduleDate(j.deadline || j.time_window?.dropoff_end),
    },
    {
      header: "Date Created", accessor: (j: DispatchJob) => formatCreatedDate(j.created_at),
    },
  ];

  const hasActiveFilters = Boolean(debouncedSearchQuery) || statusFilter !== "all" || activeFilterCount > 0;

  const selectedDriverName = selectedJob?.assigned_driver_id ? driverById.get(selectedJob.assigned_driver_id)?.name : undefined;
  const formJob = selectedJobDetailsQuery.data?.data ?? selectedJob;

  return (
    <>
      <PageHeader
        title={pageTitle}
        description="Create and dispatch your own jobs"
        actions={isAggregatorAdmin
          ? undefined
          : (
              <Button
                variant="gradient"
                onClick={() => {
                  setSelectedJob(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            )}
      />
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map(({
            label, value, icon: Icon, tone,
          }) => (
            <div
              key={label}
              className="rounded-2xl surface-sleek text-card-foreground"
            >
              <div className="p-4 flex items-center gap-3">
                <div className={KPI_TONE[tone][0]}>
                  <Icon className={KPI_TONE[tone][1]} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{label}</p>
                  <p className="font-bold truncate text-xl">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as JobsTab);
            setStatusFilter("all");
          }}
        >
          <TabsList className="inline-flex h-10 rounded-xl">
            <TabsTrigger
              value="jobs"
              className="rounded-lg px-3.5"
            >
              Jobs
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg px-3.5"
            >
              Job History
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-2xl surface-sleek text-card-foreground min-w-0">
          <div className="flex flex-col p-6 pb-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display">{TAB_CARD[tab].title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5">{TAB_CARD[tab].description}</p>
              </div>
              <ExportButton
                rows={jobs}
                columns={exportColumns}
                filename={tab === "jobs" ? "jobs" : "job-history"}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference, pickup, or delivery..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50"
                />
                {jobsQuery.isFetching && !jobsQuery.isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Select
                value={statusFilter}
                onValueChange={value => setStatusFilter(value as JobStatusFilter)}
              >
                <SelectTrigger className="h-10 px-3.5 rounded-xl w-full sm:w-[170px] bg-card/50 border-border/50">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUS_OPTIONS[tab].map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <JobsFilterDialog
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                bounds={NO_BOUNDS}
                value={filterValue}
                onApply={value => setFilterValue(value)}
                onReset={() => setFilterValue(buildDefaultFilterValue(NO_BOUNDS))}
                trigger={(
                  <Button
                    variant="outline"
                    className="bg-card/50 border-border/50 relative"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 min-w-5 px-1.5 text-[10px] bg-primary/20 text-primary border border-primary/30"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                )}
              />
            </div>
          </div>
          <div className="p-6 pt-0 min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Pickup Address</TableHead>
                  <TableHead className="min-w-[200px]">Delivery Address</TableHead>
                  <TableHead>Stops</TableHead>
                  <TableHead className="min-w-[180px]">Assigned Driver</TableHead>
                  <TableHead className="min-w-[180px]">Assigned Vehicle</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="whitespace-nowrap">Date Created</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsQuery.isLoading
                  ? Array.from(
                      { length: 5 },
                      (_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={11}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  : jobsQuery.isError
                    ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={11}
                            className="py-10 text-center text-sm"
                          >
                            <p className="text-destructive">{jobsQuery.error?.message ?? "Unable to load jobs"}</p>
                            <Button
                              variant="link"
                              onClick={() => void jobsQuery.refetch()}
                            >
                              Try again
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    : jobs.length === 0
                      ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell
                              colSpan={11}
                              className="py-10 text-center text-sm text-muted-foreground"
                            >
                              {hasActiveFilters
                                ? "No jobs found. Try adjusting your search or filter."
                                : tab === "jobs"
                                  ? "No jobs yet. Create your first job to start dispatching deliveries."
                                  : "No completed or cancelled jobs yet."}
                            </TableCell>
                          </TableRow>
                        )
                      : jobs.map((job) => {
                          const status = job.status || "created";
                          const reports = pendingReports(job);
                          const stops = stopsLabel(job);
                          const driverName = driverNameFor(job);
                          const plate = vehiclePlateFor(job);
                          return (
                            <TableRow
                              key={job.id}
                              className="align-top"
                            >
                              <TableCell>
                                <p className="flex items-start gap-1.5 text-xs max-w-[240px]">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                                  <span className="truncate">{job.pickup?.address || "—"}</span>
                                </p>
                              </TableCell>
                              <TableCell>
                                <p className="flex items-start gap-1.5 text-xs max-w-[240px]">
                                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                                  <span className="truncate">{job.dropoff?.address || "—"}</span>
                                </p>
                              </TableCell>
                              <TableCell className="text-xs">
                                {stops ? <span>{stops}</span> : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                {job.assigned_driver_id && driverName
                                  ? (
                                      <p className="text-sm font-medium flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-primary" />
                                        {driverName}
                                      </p>
                                    )
                                  : job.assigned_driver_id
                                    ? <span className="text-xs text-muted-foreground">—</span>
                                    : renderAssignButton(
                                        job,
                                        "driver",
                                      )}
                              </TableCell>
                              <TableCell>
                                {job.assigned_vehicle_id && plate
                                  ? (
                                      <div className="space-y-0.5">
                                        <p className="text-sm font-medium flex items-center gap-1.5">
                                          <Truck className="h-3.5 w-3.5 text-primary" />
                                          {plate}
                                        </p>
                                        {showFleet && fleetNameByVehicle.has(job.assigned_vehicle_id) && (
                                          <p className="text-xs text-muted-foreground break-words">{`Fleet: ${fleetNameByVehicle.get(job.assigned_vehicle_id)}`}</p>
                                        )}
                                      </div>
                                    )
                                  : job.assigned_vehicle_id
                                    ? <span className="text-xs text-muted-foreground">—</span>
                                    : renderAssignButton(
                                        job,
                                        "vehicle",
                                      )}
                              </TableCell>
                              <TableCell>
                                {job.priority
                                  ? <Badge className={`rounded-full px-2.5 ${PRIORITY_BADGE[job.priority] ?? PRIORITY_BADGE.normal}`}>{job.priority.toUpperCase()}</Badge>
                                  : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                {reports.length > 0
                                  ? (
                                      // A pending driver report stacks a second badge under the status.
                                      <div className="space-y-1">
                                        <Badge className={`rounded-full px-2.5 ${STATUS_BADGE[jobStatusTone(status)]}`}>{jobStatusLabel(status)}</Badge>
                                        <button
                                          type="button"
                                          className="block text-left"
                                          onClick={() => openDetails(job)}
                                        >
                                          <Badge className="bg-warning/20 text-warning border-warning/30 cursor-pointer">
                                            {`Driver says: ${stepLabel(reports[0].request.requested_status).toLowerCase()}`}
                                          </Badge>
                                        </button>
                                      </div>
                                    )
                                  : <Badge className={`rounded-full px-2.5 ${STATUS_BADGE[jobStatusTone(status)]}`}>{jobStatusLabel(status)}</Badge>}
                              </TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{formatScheduleDate(job.time_window?.pickup_start)}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{formatScheduleDate(job.deadline || job.time_window?.dropoff_end)}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{formatCreatedDate(job.created_at)}</TableCell>
                              <TableCell className="text-right">{renderActions(job)}</TableCell>
                            </TableRow>
                          );
                        })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <JobFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        job={formJob
          ? mapToLegacyJob(
              formJob,
              selectedDriverName,
            )
          : null}
        onSubmit={selectedJob ? handleEditJob : handleAddJob}
        isSubmitting={
          createJobMutation.isPending
          || updateJobDetailsMutation.isPending
          || (!!selectedJob && selectedJobDetailsQuery.isFetching)
        }
      />

      <JobDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        job={selectedJob}
        recommendOnly={recommendOnly}
        onReassignDriver={isAggregatorAdmin
          ? undefined
          : () => {
              setIsDetailsOpen(false);
              setMatchingKind("driver");
            }}
        onReassignVehicle={isAggregatorAdmin
          ? undefined
          : () => {
              setIsDetailsOpen(false);
              setMatchingKind("vehicle");
            }}
      />

      <AssignResourceDialog
        open={matchingKind !== null}
        onOpenChange={(open) => {
          if (!open)
            setMatchingKind(null);
        }}
        kind={matchingKind ?? "driver"}
        job={selectedJob}
        onAssign={id => handleAssignResource(
          matchingKind ?? "driver",
          id,
        )}
        recommendOnly={recommendOnly}
      />

      <CancelJobDialog
        job={cancelTarget}
        onOpenChange={open => !open && setCancelTarget(null)}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isJobActionPending)
            setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job record?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Job ${deleteTarget?.reference ?? ""} will be permanently removed. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isJobActionPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isJobActionPending}
              onClick={(event) => {
                event.preventDefault();
                handleDeleteJob();
              }}
            >
              {isJobActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Job Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
