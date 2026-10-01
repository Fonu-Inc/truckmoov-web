import type { ColumnDef } from "@tanstack/react-table";
import type {
  DispatchJob, JobsQuery,
} from "@truckmoov/api/dispatch";
import type { AssignResourceKind } from "@/components/jobs/AssignResourceDialog";
import type { JobFormSubmitData } from "@/components/jobs/JobFormDialog";
import type {
  JobsFilterBounds, JobsFilterValue,
} from "@/components/jobs/JobsFilterDialog";
import {

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
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Loader2,
  MapPin,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { AssignResourceDialog } from "@/components/jobs/AssignResourceDialog";
import { JobDetailsSheet } from "@/components/jobs/JobDetailsSheet";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import {
  buildDefaultFilterValue,
  countActiveFilters,
} from "@/components/jobs/jobsFilter";
import { JobsFilterDialog } from "@/components/jobs/JobsFilterDialog";
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

type JobData = {
  id: string;
  reference: string;
  status: string;
  priority?: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  cargoType: string;
  cargoWeight: number;
  cargoDescription: string;
  amountNgn: number;
  deadline: string;
  createdAt: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  assignedByRole?: string;
  notes?: string;
  stops?: Array<{
    address: string;
    latitude?: number;
    longitude?: number;
    contact_name?: string;
    contact_phone?: string;
    notes?: string;
  }>;
  loadVolumeM3?: number;
  requiredVehicleType?: string;
  estimatedServiceMinutes?: number;
  acknowledgedAt?: string;
};

type JobStatusFilter = NonNullable<NonNullable<JobsQuery["params"]>["status"]>;

const JOB_STATUS_OPTIONS: Array<{
  value: JobStatusFilter; label: string;
}> = [
  {
    value: "all", label: "All Statuses",
  },
  {
    value: "pending", label: "Pending",
  },
  {
    value: "created", label: "Created",
  },
  {
    value: "assigned", label: "Assigned",
  },
  {
    value: "in_progress", label: "In Progress",
  },
  {
    value: "en-route", label: "En Route",
  },
  {
    value: "arrived", label: "Arrived",
  },
  {
    value: "loaded", label: "Loaded",
  },
  {
    value: "completed", label: "Completed",
  },
  {
    value: "delivered", label: "Delivered",
  },
  {
    value: "cancelled", label: "Cancelled",
  },
];

const EMPTY = "—";

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

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function kgToTonnes(value?: number) {
  if (!value)
    return 0;
  return Number((value / 1000).toFixed(2));
}

function mapDispatchJob(job: DispatchJob): JobData {
  return {
    id: job.id ?? job.reference ?? crypto.randomUUID(),
    reference: job.reference || job.id || "Unreferenced",
    status: job.status || "created",
    priority: job.priority,
    pickupAddress: job.pickup?.address || "No pickup address",
    pickupLat: toNumber(job.pickup?.latitude),
    pickupLng: toNumber(job.pickup?.longitude),
    deliveryAddress: job.dropoff?.address || "No delivery address",
    deliveryLat: toNumber(job.dropoff?.latitude),
    deliveryLng: toNumber(job.dropoff?.longitude),
    cargoType: job.cargo_type || "Unspecified",
    cargoWeight: kgToTonnes(job.load_weight_kg),
    cargoDescription: job.cargo_description || "",
    amountNgn: toNumber(job.amount_ngn),
    deadline: job.deadline || job.time_window?.dropoff_end || job.updated_at || new Date().toISOString(),
    createdAt: job.created_at || new Date().toISOString(),
    driverId: job.assigned_driver_id || undefined,
    driverName: job.assigned_driver_name || undefined,
    driverPhone: job.assigned_driver_phone || undefined,
    vehicleId: job.assigned_vehicle_id || undefined,
    vehiclePlate: undefined,
    assignedByRole: job.assigned_driver_id ? "Dispatch" : undefined,
    notes: job.notes?.map(note => note.text).filter(Boolean).join("\n"),
    stops: job.stops,
    loadVolumeM3: job.load_volume_m3,
    requiredVehicleType: job.required_vehicle_type,
    estimatedServiceMinutes: job.estimated_service_minutes,
    acknowledgedAt: job.acknowledged_at,
  };
}

const STATUS_BADGE: Record<string, string> = {
  "pending": "text-warning border-warning/30",
  "created": "text-warning border-warning/30",
  "unassigned": "text-warning border-warning/30",
  "assigned": "text-primary border-primary/30",
  "in_progress": "text-primary border-primary/30",
  "en-route": "text-primary border-primary/30",
  "arrived": "text-primary border-primary/30",
  "loaded": "text-primary border-primary/30",
  "completed": "text-success border-success/30",
  "delivered": "text-success border-success/30",
  "cancelled": "text-destructive border-destructive/30",
};

const PRIORITY_BADGE: Record<string, string> = {
  low: "text-muted-foreground border-border",
  normal: "text-muted-foreground border-border",
  high: "text-warning border-warning/30",
  urgent: "text-destructive border-destructive/30",
};

export default function JobDispatch() {
  const { format: formatCurrency } = useCurrency();
  const isAggregatorAdmin = useAuthStore(s => s.user?.role) === "AGGREGATOR_ADMIN";
  const isEnterprise = false;
  const isAggregator = false;
  const isOperationsManager = false;
  const recommendOnly = isEnterprise || isAggregator || isOperationsManager;

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
  ] = useState<JobData | null>(null);
  const [
    jobPendingDelete,
    setJobPendingDelete,
  ] = useState<JobData | null>(null);
  const [
    isFilterOpen,
    setIsFilterOpen,
  ] = useState(false);
  const [
    filterValue,
    setFilterValue,
  ] = useState<JobsFilterValue>(() =>
    buildDefaultFilterValue({
      weightMin: 0, weightMax: 0, amountMin: 0, amountMax: 0,
    }));
  const createJobMutation = useCreateJob();
  const updateJobDetailsMutation = useUpdateJobDetails();
  const updateJobSchedulingMutation = useUpdateJobScheduling();
  const deleteJobMutation = useDeleteJob();
  const assignJobMutation = useAssignJob();

  const filterBounds: JobsFilterBounds = useMemo(
    () => ({
      weightMin: 0, weightMax: 0, amountMin: 0, amountMax: 0,
    }),
    [],
  );

  const activeFilterCount = countActiveFilters(filterValue);

  const jobsQueryPayload = useMemo<JobsQuery | undefined>(
    () => {
      const params: NonNullable<JobsQuery["params"]> = {};
      const query = debouncedSearchQuery.trim();
      const driverId = filterValue.driverId.trim();
      const vehicleId = filterValue.vehicleId.trim();

      if (statusFilter !== "all")
        params.status = statusFilter;
      if (query)
        params.query = query;
      if (driverId)
        params.driver_id = driverId;
      if (vehicleId)
        params.vehicle_id = vehicleId;

      return Object.keys(params).length > 0 ? { params } : undefined;
    },
    [
      debouncedSearchQuery,
      filterValue.driverId,
      filterValue.vehicleId,
      statusFilter,
    ],
  );

  const jobsQuery = useJobs(jobsQueryPayload);
  const jobsSummaryQuery = useJobsSummary();
  const selectedJobDetailsQuery = useJob(selectedJob?.id ?? "");
  const jobs = jobsQuery.data?.data ?? [];
  const selectedJobDetails = selectedJobDetailsQuery.data?.data
    ? mapDispatchJob(selectedJobDetailsQuery.data.data)
    : selectedJob;

  const summary = jobsSummaryQuery.data?.data;
  const byStatus = summary?.by_status ?? {};
  const stats = {
    total: summary?.total ?? 0,
    unassigned: (byStatus.pending ?? 0) + (byStatus.created ?? 0),
    inProgress:
      (byStatus.in_progress ?? 0)
      + (byStatus["en-route"] ?? 0)
      + (byStatus.arrived ?? 0)
      + (byStatus.loaded ?? 0),
    completed: (byStatus.completed ?? 0) + (byStatus.delivered ?? 0),
    totalValue: summary?.total_value_ngn ?? 0,
  };

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
          cargoWeight: data.cargoWeight,
          amount: data.amount,
          deadline: new Date(data.deadline).toISOString(),
          priority: data.priority,
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
    if (!selectedJob)
      return;
    if (!selectedJobDetailsQuery.data?.data) {
      toast.info("Job details are still loading. Try again in a moment.");
      return;
    }
    updateJobDetailsMutation.mutate(
      {
        jobId: selectedJob.id,
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
          load_weight_kg: data.cargoWeight,
          amount: data.amount,
          deadline: new Date(data.deadline).toISOString(),
        },
      },
      {
        onSuccess: () => {
          updateJobSchedulingMutation.mutate({
            jobId: selectedJob.id,
            data: { priority: data.priority },
          });
          toast.success("Job updated");
          setIsFormOpen(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleDeleteJob = () => {
    if (!jobPendingDelete)
      return;

    deleteJobMutation.mutate(
      { jobId: jobPendingDelete.id },
      {
        onSuccess: () => {
          toast.success("Job deleted");
          if (selectedJob?.id === jobPendingDelete.id) {
            setSelectedJob(null);
            setIsDetailsOpen(false);
            setIsFormOpen(false);
          }
          setJobPendingDelete(null);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleAssignResource = async (kind: AssignResourceKind, resourceId: string) => {
    if (!selectedJob)
      return;
    await assignJobMutation.mutateAsync(
      {
        jobId: selectedJob.id,
        data: kind === "driver"
          ? { driver_id: resourceId }
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

  const openDetails = (job: JobData) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  const openMatching = (job: JobData, kind: AssignResourceKind) => {
    setSelectedJob(job);
    setMatchingKind(kind);
  };

  const isUnassignedRaw = (j: DispatchJob) => {
    const s = (j.status ?? "").toLowerCase();
    return !j.assigned_driver_id || s === "pending" || s === "created" || s === "unassigned";
  };
  const openDetailsRaw = (j: DispatchJob) => openDetails(mapDispatchJob(j));
  const openMatchingRaw = (j: DispatchJob, kind: AssignResourceKind) => openMatching(
    mapDispatchJob(j),
    kind,
  );

  const columns = useMemo<ColumnDef<DispatchJob>[]>(
    () => [
      {
        id: "reference",
        header: "Job Reference ID",
        meta: { className: "font-mono text-xs" },
        cell: ({ row }) => row.original.reference || row.original.id || "Unreferenced",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status || "created";
          return (
            <Badge
              variant="outline"
              className={STATUS_BADGE[status] ?? "text-muted-foreground border-border"}
            >
              {status.replace(
                "_",
                " ",
              )}
            </Badge>
          );
        },
      },
      {
        id: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const p = row.original.priority;
          return p
            ? (
                <Badge
                  variant="outline"
                  className={PRIORITY_BADGE[p.toLowerCase()] ?? "text-muted-foreground border-border"}
                >
                  {p.toUpperCase()}
                </Badge>
              )
            : <span className="text-muted-foreground">{EMPTY}</span>;
        },
      },
      {
        id: "locations",
        header: "Locations",
        meta: { className: "max-w-[280px]" },
        cell: ({ row }) => {
          const job = row.original;
          return (
            <>
              <p className="text-sm flex items-center gap-1.5 truncate">
                <MapPin className="h-3 w-3 text-primary shrink-0" />
                <span className="truncate">{job.pickup?.address || "No pickup address"}</span>
              </p>
              {job.stops && job.stops.length > 0 && (
                <p className="text-xs text-muted-foreground ml-4.5 mt-0.5">
                  +
                  {job.stops.length}
                  {" "}
                  intermediate
                  {job.stops.length === 1 ? " stop" : " stops"}
                </p>
              )}
              <p className="text-sm flex items-center gap-1.5 truncate mt-0.5">
                <span className="text-success shrink-0">→</span>
                <span className="truncate">{job.dropoff?.address || "No delivery address"}</span>
              </p>
            </>
          );
        },
      },
      {
        id: "driver",
        header: "Driver",
        cell: ({ row }) => {
          const job = row.original;
          if (isUnassignedRaw(job) && !isAggregatorAdmin) {
            return (
              <Button
                variant="outline"
                size="sm"
                className="border-border/60"
                onClick={() => openMatchingRaw(
                  job,
                  "driver",
                )}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Recommend Driver
              </Button>
            );
          }
          return job.assigned_driver_name
            ? <p className="text-sm">{job.assigned_driver_name}</p>
            : <span className="text-muted-foreground">{EMPTY}</span>;
        },
      },
      {
        id: "vehicle",
        header: "Vehicle",
        cell: ({ row }) => {
          const job = row.original;
          if (isUnassignedRaw(job) && !isAggregatorAdmin) {
            return (
              <Button
                variant="outline"
                size="sm"
                className="border-border/60"
                onClick={() => openMatchingRaw(
                  job,
                  "vehicle",
                )}
              >
                <Truck className="h-3.5 w-3.5 mr-1.5" />
                Recommend Vehicle
              </Button>
            );
          }
          const makeModel = [
            job.assigned_vehicle_make,
            job.assigned_vehicle_model,
          ].filter(Boolean).join(" ");
          return job.assigned_vehicle_reg || makeModel
            ? (
                <div>
                  {job.assigned_vehicle_reg && <p className="text-sm font-mono">{job.assigned_vehicle_reg}</p>}
                  {makeModel && <p className="text-xs text-muted-foreground">{makeModel}</p>}
                </div>
              )
            : <span className="text-muted-foreground">{EMPTY}</span>;
        },
      },
      {
        id: "amount",
        header: "Amount",
        meta: { className: "text-right font-medium" },
        cell: ({ row }) => row.original.amount_ngn
          ? formatCurrency(row.original.amount_ngn)
          : <span className="text-muted-foreground">{EMPTY}</span>,
      },
      {
        id: "actions",
        header: "",
        meta: { className: "w-[60px] text-right" },
        cell: ({ row }) => {
          const job = row.original;
          return (
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
                <DropdownMenuItem onClick={() => openDetailsRaw(job)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {!isAggregatorAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setJobPendingDelete(mapDispatchJob(job))}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      isAggregatorAdmin,
      formatCurrency,
    ],
  );

  const mapToLegacyJob = (job: JobData) => ({
    id: job.id,
    reference: job.reference,
    status: job.status,
    pickup: {
      address: job.pickupAddress, lat: job.pickupLat, lng: job.pickupLng,
    },
    delivery: {
      address: job.deliveryAddress, lat: job.deliveryLat, lng: job.deliveryLng,
    },
    cargo: {
      type: job.cargoType, weight: job.cargoWeight, description: job.cargoDescription,
    },
    amount: job.amountNgn || 0,
    deadline: job.deadline ? new Date(job.deadline) : new Date(),
    createdAt: new Date(job.createdAt),
    driverId: job.driverId,
    driverName: job.driverName,
    driverPhone: job.driverPhone,
    vehicleId: job.vehicleId,
    stops: job.stops,
    loadVolumeM3: job.loadVolumeM3,
    requiredVehicleType: job.requiredVehicleType,
    estimatedServiceMinutes: job.estimatedServiceMinutes,
    acknowledgedAt: job.acknowledgedAt,
  });

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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><Package className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Jobs</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2"><Clock className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Unassigned Jobs</p>
                <p className="text-xl font-bold">{stats.unassigned}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><Truck className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Jobs In Progress</p>
                <p className="text-xl font-bold">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2"><CheckCircle className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Completed Jobs</p>
                <p className="text-xl font-bold">{stats.completed}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2"><DollarSign className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Job Value</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
            </CardContent>
          </Card>
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
            bounds={filterBounds}
            value={filterValue}
            onApply={value => setFilterValue(value)}
            onReset={() => setFilterValue(buildDefaultFilterValue(filterBounds))}
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

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-0 overflow-x-auto">
            <DataTable
              columns={columns}
              data={jobs}
              isLoading={jobsQuery.isLoading}
              isError={jobsQuery.isError}
              errorMessage={jobsQuery.error?.message ?? "Unable to load jobs"}
              onRetry={() => void jobsQuery.refetch()}
              hasActiveFilters={Boolean(debouncedSearchQuery) || statusFilter !== "all" || activeFilterCount > 0}
              emptyState="No jobs yet. Create your first job to get started."
              filteredEmptyState="No jobs match your filters."
            />
          </CardContent>
        </Card>
      </div>

      <JobFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        job={selectedJobDetails ? mapToLegacyJob(selectedJobDetails) : null}
        onSubmit={selectedJob ? handleEditJob : handleAddJob}
        isSubmitting={
          createJobMutation.isPending
          || updateJobDetailsMutation.isPending
          || (!!selectedJob && selectedJobDetailsQuery.isFetching)
        }
      />

      <JobDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        job={selectedJob ? mapToLegacyJob(selectedJob) : null}
      />

      <AssignResourceDialog
        open={matchingKind !== null}
        onOpenChange={open => !open && setMatchingKind(null)}
        kind={matchingKind ?? "driver"}
        jobReference={selectedJob?.reference}
        onAssign={id => handleAssignResource(
          matchingKind ?? "driver",
          id,
        )}
        recommendOnly={recommendOnly}
      />

      <AlertDialog
        open={Boolean(jobPendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteJobMutation.isPending)
            setJobPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete job
              {" "}
              {jobPendingDelete?.reference}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteJobMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteJobMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDeleteJob();
              }}
            >
              {deleteJobMutation.isPending
                ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  )
                : (
                    "Delete Job"
                  )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
