import type { ColumnDef } from "@tanstack/react-table";
import type {
  DispatchJob, DispatchJobPriority, JobsQuery,
} from "@truckmoov/api/dispatch";
import type { JobFormSubmitData } from "@/components/jobs/JobFormDialog";
import type { AssignResourceKind } from "@/features/jobs/components/ui/AssignResourceDialog";
import type {
  JobsFilterBounds, JobsFilterValue,
} from "@/features/jobs/components/ui/JobsFilterDialog";
import {
  useAssignJob,
  useCancelJob,
  useCreateJob,
  useDeleteJob,
  useJob,
  useJobs,
  useJobsSummary,
  useUpdateJobDetails,
  useUpdateJobScheduling,
} from "@truckmoov/api/dispatch";
import {
  useDrivers, useVehicles,
} from "@truckmoov/api/fleet";
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
  Card, CardContent,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { AssignResourceDialog } from "@/features/jobs/components/ui/AssignResourceDialog";
import { JobDetailsDialog } from "@/features/jobs/components/ui/JobDetailsDialog";
import { JobsFilterDialog } from "@/features/jobs/components/ui/JobsFilterDialog";
import {
  buildDefaultFilterValue,
  countActiveFilters,
  toJobsQueryParams,
} from "@/features/jobs/utils/jobsFilter";
import {
  jobStatusLabel, jobStatusTone, PRIORITY_BADGE, STATUS_BADGE,
} from "@/features/jobs/utils/jobStatus";

type JobStatusFilter = NonNullable<NonNullable<JobsQuery["params"]>["status"]>;

const JOB_STATUS_OPTIONS: Array<{
  value: JobStatusFilter; label: string;
}> = [
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
  {
    value: "completed", label: "Completed",
  },
  {
    value: "cancelled", label: "Cancelled",
  },
];

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

// The create route reads `cargoWeight` as tonnes, but the form's default unit is kg —
// always send `load_weight_kg`. ponytail: cbm/pallets/boxes aren't weights; sent as-is.
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

// JobFormDialog still takes the legacy `Job` shape.
function mapToLegacyJob(job: DispatchJob, driverName?: string) {
  return {
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
  const { format: formatCurrency } = useCurrency();
  const isAggregatorAdmin = useAuthStore(s => s.user?.role) === "AGGREGATOR_ADMIN";
  // ponytail: fleetflow switches to "Recommend" for enterprise/aggregator org types; this
  // tenant app has no org-type context yet, so every role assigns directly.
  const recommendOnly = false;

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
    jobAction,
    setJobAction,
  ] = useState<{
    job: DispatchJob; action: "cancel" | "delete";
  } | null>(null);
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
  const cancelJobMutation = useCancelJob();
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

  const jobsQuery = useJobs(jobsQueryPayload);
  const jobsSummaryQuery = useJobsSummary();
  const driversQuery = useDrivers();
  const vehiclesQuery = useVehicles();
  const selectedJobDetailsQuery = useJob(isFormOpen ? selectedJob?.id ?? "" : "");
  const jobs = jobsQuery.data?.data ?? [];

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

  // ponytail: `data.metadata` (cargo category, dimensions, special handling,
  // per-stop contact details, attachments, etc.) is collected by the wizard but
  // dropped here — the /jobs endpoint doesn't accept it yet. Forward it when
  // the API grows a metadata field.
  const handleAddJob = async (data: JobFormSubmitData) => {
    createJobMutation.mutate(
      {
        data: {
          pickupLocation: data.pickupAddress,
          deliveryLocation: data.deliveryAddress,
          reference: data.reference,
          pickup: {
            address: data.pickupAddress,
            latitude: data.pickupLat,
            longitude: data.pickupLng,
          },
          dropoff: {
            address: data.deliveryAddress,
            latitude: data.deliveryLat,
            longitude: data.deliveryLng,
          },
          stops: data.stops,
          cargoType: data.cargoType,
          cargoDescription: data.cargoDescription,
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
        onSuccess: () => {
          toast.success("Job created");
          setIsFormOpen(false);
          setSelectedJob(null);
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
    updateJobDetailsMutation.mutate(
      {
        jobId,
        data: {
          pickup: {
            address: data.pickupAddress,
            latitude: data.pickupLat,
            longitude: data.pickupLng,
          },
          dropoff: {
            address: data.deliveryAddress,
            latitude: data.deliveryLat,
            longitude: data.deliveryLng,
          },
          stops: data.stops,
          cargo_type: data.cargoType,
          cargo_description: data.cargoDescription,
          load_weight_kg: toKg(
            data.cargoWeight,
            data.cargoUnit,
          ),
          amount: data.amount,
          deadline: new Date(data.deadline).toISOString(),
        },
      },
      {
        onSuccess: () => {
          updateJobSchedulingMutation.mutate({
            jobId,
            data: { priority: toApiPriority(data.priority) },
          });
          toast.success("Job updated");
          setIsFormOpen(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleJobAction = () => {
    const jobId = jobAction?.job.id;
    if (!jobId)
      return;
    const callbacks = {
      onSuccess: () => {
        toast.success(jobAction.action === "cancel" ? "Job cancelled" : "Job record deleted");
        setJobAction(null);
      },
      onError: (error: { message: string }) => toast.error(error.message),
    };
    if (jobAction.action === "cancel") {
      cancelJobMutation.mutate(
        {
          jobId,
          data: { reason: "Cancelled by dispatcher" },
        },
        callbacks,
      );
    }
    else {
      deleteJobMutation.mutate(
        { jobId },
        callbacks,
      );
    }
  };
  const isJobActionPending = cancelJobMutation.isPending || deleteJobMutation.isPending;

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
          toast.success(kind === "driver" ? "Driver assigned to job" : "Vehicle assigned to job");
          setMatchingKind(null);
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

  const columns = useMemo<ColumnDef<DispatchJob>[]>(
    () => [
      {
        id: "reference",
        header: "Job ID",
        meta: { className: "min-w-[130px]" },
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.reference || row.original.id}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status || "created";
          return <Badge className={STATUS_BADGE[jobStatusTone(status)]}>{jobStatusLabel(status)}</Badge>;
        },
      },
      {
        id: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const p = row.original.priority;
          return p
            ? <Badge className={PRIORITY_BADGE[p] ?? PRIORITY_BADGE.normal}>{p.toUpperCase()}</Badge>
            : <span className="text-xs text-muted-foreground">—</span>;
        },
      },
      {
        id: "locations",
        header: "Locations",
        meta: { className: "min-w-[260px]" },
        cell: ({ row }) => {
          const job = row.original;
          const stops = job.stops?.length ?? 0;
          return (
            <div className="space-y-1 text-xs max-w-[320px]">
              <p className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                <span className="truncate">{job.pickup?.address || "—"}</span>
              </p>
              {stops > 0 && (
                <p className="text-[11px] text-muted-foreground pl-5">
                  +
                  {stops}
                  {" "}
                  intermediate stop
                  {stops > 1 ? "s" : ""}
                </p>
              )}
              <p className="flex items-start gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                <span className="truncate">{job.dropoff?.address || "—"}</span>
              </p>
            </div>
          );
        },
      },
      {
        id: "driver",
        header: "Driver",
        meta: { className: "min-w-[180px]" },
        cell: ({ row }) => {
          const job = row.original;
          const driver = job.assigned_driver_id ? driverById.get(job.assigned_driver_id) : undefined;
          const name = driver?.name ?? job.assigned_driver_name;
          if (job.assigned_driver_id && name) {
            return (
              <div className="space-y-0.5">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  {name}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {job.assigned_driver_id.slice(
                    0,
                    8,
                  )}
                </p>
              </div>
            );
          }
          if (job.assigned_driver_id || isAggregatorAdmin)
            return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => openMatching(
                job,
                "driver",
              )}
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              {assignLabel}
              {" "}
              Driver
            </Button>
          );
        },
      },
      {
        id: "vehicle",
        header: "Vehicle",
        meta: { className: "min-w-[180px]" },
        cell: ({ row }) => {
          const job = row.original;
          const vehicle = job.assigned_vehicle_id ? vehicleById.get(job.assigned_vehicle_id) : undefined;
          const plate = vehicle?.plateNumber ?? job.assigned_vehicle_reg;
          if (job.assigned_vehicle_id && plate) {
            return (
              <div className="space-y-0.5">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                  {plate}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {job.assigned_vehicle_id.slice(
                    0,
                    8,
                  )}
                </p>
              </div>
            );
          }
          if (job.assigned_vehicle_id || isAggregatorAdmin)
            return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => openMatching(
                job,
                "vehicle",
              )}
            >
              <Truck className="h-3.5 w-3.5 mr-1.5" />
              {assignLabel}
              {" "}
              Vehicle
            </Button>
          );
        },
      },
      {
        id: "amount",
        header: () => <span className="block text-right">Amount</span>,
        cell: ({ row }) => (
          <span className="block text-right text-sm font-medium">{formatCurrency(row.original.amount_ngn || 0)}</span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="block text-right">Actions</span>,
        meta: { className: "w-[60px]" },
        cell: ({ row }) => {
          const job = row.original;
          const tone = jobStatusTone(job.status || "created");
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openDetails(job)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {!isAggregatorAdmin && tone !== "cancelled" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setJobAction({
                          job, action: tone === "completed" ? "delete" : "cancel",
                        })}
                      >
                        {tone === "completed"
                          ? <Trash2 className="h-4 w-4 mr-2" />
                          : <Ban className="h-4 w-4 mr-2" />}
                        {tone === "completed" ? "Delete Job Record" : "Cancel Job"}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      isAggregatorAdmin,
      formatCurrency,
      driverById,
      vehicleById,
      assignLabel,
    ],
  );

  const selectedDriverName = selectedJob?.assigned_driver_id ? driverById.get(selectedJob.assigned_driver_id)?.name : undefined;
  const formJob = selectedJobDetailsQuery.data?.data ?? selectedJob;

  return (
    <>
      <div className="space-y-6">
        {!isAggregatorAdmin && (
          <div className="flex justify-end">
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
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map(({
            label, value, icon: Icon, tone,
          }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={KPI_TONE[tone][0]}>
                  <Icon className={KPI_TONE[tone][1]} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{label}</p>
                  <p className="font-bold truncate text-xl">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
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
            <SelectTrigger className="w-full sm:w-[170px] bg-card/50 border-border/50">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {JOB_STATUS_OPTIONS.map(option => (
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

        <div className="rounded-2xl border border-border/50 bg-card/50 overflow-x-auto">
          <DataTable
            columns={columns}
            data={jobs}
            rowClassName={() => "align-top"}
            isLoading={jobsQuery.isLoading}
            isError={jobsQuery.isError}
            errorMessage={jobsQuery.error?.message ?? "Unable to load jobs"}
            onRetry={() => void jobsQuery.refetch()}
            hasActiveFilters={Boolean(debouncedSearchQuery) || statusFilter !== "all" || activeFilterCount > 0}
            emptyState="No jobs yet. Create your first job to start dispatching deliveries."
            filteredEmptyState="No jobs found. Try adjusting your search or filter."
          />
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

      <AlertDialog
        open={Boolean(jobAction)}
        onOpenChange={(open) => {
          if (!open && !isJobActionPending)
            setJobAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {jobAction?.action === "delete" ? "Delete this job record?" : "Cancel this job?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {jobAction?.action === "delete"
                ? `Job ${jobAction.job.reference} will be permanently removed. This cannot be undone.`
                : `Job ${jobAction?.job.reference} will be cancelled and any assigned driver or vehicle released.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isJobActionPending}>
              {jobAction?.action === "delete" ? "Cancel" : "Keep Job"}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isJobActionPending}
              onClick={(event) => {
                event.preventDefault();
                handleJobAction();
              }}
            >
              {isJobActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {jobAction?.action === "delete" ? "Delete Job Record" : "Cancel Job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
