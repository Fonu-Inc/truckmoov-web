import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import {
  useCreateJob,
  useDeleteJob,
  useAssignJob,
  useJob,
  useJobs,
  useJobsSummary,
  useUpdateJobDetails,
  type DispatchJob,
  type JobsQuery,
} from "@truckmoov/api/dispatch";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Card, CardContent } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFormDialog, type JobFormSubmitData } from "@/components/jobs/JobFormDialog";
import { JobDetailsSheet } from "@/components/jobs/JobDetailsSheet";
import { JobMatchingDialog } from "@/components/jobs/JobMatchingDialog";
import { JobCompletionDialog } from "@/components/jobs/JobCompletionDialog";
import {
  JobsFilterDialog,
  buildDefaultFilterValue,
  countActiveFilters,
  type JobsFilterBounds,
  type JobsFilterValue,
} from "@/components/jobs/JobsFilterDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useCurrency } from "@/contexts/CurrencyContext";

type JobData = {
  id: string;
  reference: string;
  status: string;
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

const JOB_STATUS_OPTIONS: Array<{ value: JobStatusFilter; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "created", label: "Created" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "en-route", label: "En Route" },
  { value: "arrived", label: "Arrived" },
  { value: "loaded", label: "Loaded" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function useDebouncedValue<T>(value: T, delayMs = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function kgToTonnes(value?: number) {
  if (!value) return 0;
  return Number((value / 1000).toFixed(2));
}

function mapDispatchJob(job: DispatchJob): JobData {
  return {
    id: job.id ?? job.reference ?? crypto.randomUUID(),
    reference: job.reference || job.id || "Unreferenced",
    status: job.status || "created",
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
    assignedByRole: job.assigned_driver_id ? "Dispatch" : undefined,
    notes: job.notes?.map((note) => note.text).filter(Boolean).join("\n"),
    stops: job.stops,
    loadVolumeM3: job.load_volume_m3,
    requiredVehicleType: job.required_vehicle_type,
    estimatedServiceMinutes: job.estimated_service_minutes,
    acknowledgedAt: job.acknowledged_at,
  };
}

export default function JobDispatch() {
  const { format: formatCurrency } = useCurrency();
  const isEnterprise = false;
  const isAggregator = false;
  const isOperationsManager = false;
  const recommendOnly = isEnterprise || isAggregator || isOperationsManager;
  const recommendedByLabel = isEnterprise
    ? "Enterprise Admin"
    : isAggregator
      ? "Aggregator"
      : isOperationsManager
        ? "Operations Manager"
        : undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMatchingOpen, setIsMatchingOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [jobPendingDelete, setJobPendingDelete] = useState<JobData | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState<JobsFilterValue>(() =>
    buildDefaultFilterValue({
      weightMin: 0,
      weightMax: 0,
      amountMin: 0,
      amountMax: 0,
    }),
  );
  const createJobMutation = useCreateJob();
  const updateJobDetailsMutation = useUpdateJobDetails();
  const deleteJobMutation = useDeleteJob();
  const assignJobMutation = useAssignJob();

  const filterBounds: JobsFilterBounds = useMemo(() => ({
    weightMin: 0,
    weightMax: 0,
    amountMin: 0,
    amountMax: 0,
  }), []);

  const activeFilterCount = countActiveFilters(filterValue);

  const jobsQueryPayload = useMemo<JobsQuery | undefined>(() => {
    const params: NonNullable<JobsQuery["params"]> = {};
    const query = debouncedSearchQuery.trim();
    const driverId = filterValue.driverId.trim();
    const vehicleId = filterValue.vehicleId.trim();

    if (statusFilter !== "all") params.status = statusFilter;
    if (query) params.query = query;
    if (driverId) params.driver_id = driverId;
    if (vehicleId) params.vehicle_id = vehicleId;

    return Object.keys(params).length > 0 ? { params } : undefined;
  }, [debouncedSearchQuery, filterValue.driverId, filterValue.vehicleId, statusFilter]);

  const jobsQuery = useJobs(jobsQueryPayload);
  const jobsSummaryQuery = useJobsSummary();
  const selectedJobDetailsQuery = useJob(selectedJob?.id ?? "");
  const jobs = useMemo(
    () => (jobsQuery.data?.data ?? []).map(mapDispatchJob),
    [jobsQuery.data?.data],
  );
  const selectedJobDetails = selectedJobDetailsQuery.data?.data
    ? mapDispatchJob(selectedJobDetailsQuery.data.data)
    : selectedJob;

  const summary = jobsSummaryQuery.data?.data;
  const byStatus = summary?.by_status ?? {};
  const stats = {
    total: summary?.total ?? 0,
    pending: (byStatus.pending ?? 0) + (byStatus.created ?? 0),
    inProgress:
      (byStatus.in_progress ?? 0) +
      (byStatus["en-route"] ?? 0) +
      (byStatus.arrived ?? 0) +
      (byStatus.loaded ?? 0),
    completed: (byStatus.completed ?? 0) + (byStatus.delivered ?? 0),
    totalValue: summary?.total_value_ngn ?? 0,
  };

  const handleAddJob = async (data: JobFormSubmitData) => {
    createJobMutation.mutate({
      data: {
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
    }, {
      onSuccess: () => {
        toast.success("Job created");
        setIsFormOpen(false);
        setSelectedJob(null);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleEditJob = async (data: JobFormSubmitData) => {
    if (!selectedJob) return;
    if (!selectedJobDetailsQuery.data?.data) {
      toast.info("Job details are still loading. Try again in a moment.");
      return;
    }
    updateJobDetailsMutation.mutate({
      jobId: selectedJob.id,
      data: {
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
    }, {
      onSuccess: () => {
        toast.success("Job updated");
        setIsFormOpen(false);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleDeleteJob = () => {
    if (!jobPendingDelete) return;

    deleteJobMutation.mutate({ jobId: jobPendingDelete.id }, {
      onSuccess: () => {
        toast.success("Job deleted");
        if (selectedJob?.id === jobPendingDelete.id) {
          setSelectedJob(null);
          setIsDetailsOpen(false);
          setIsFormOpen(false);
        }
        setJobPendingDelete(null);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleAssign = async (vehicleId: string, driverId: string) => {
    if (!selectedJob) return;
    assignJobMutation.mutate({
      jobId: selectedJob.id,
      data: {
        driver_id: driverId,
        vehicle_id: vehicleId,
        driver_phone: selectedJob.driverPhone,
      },
    }, {
      onSuccess: () => {
        toast.success("Driver assigned to job");
        setIsMatchingOpen(false);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleRecommend = async () => {
    toast.info("Driver recommendations are not available on the dispatch jobs endpoint.");
    setIsMatchingOpen(false);
  };

  const openDetails = (job: JobData) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  const openEdit = (job: JobData) => {
    setSelectedJob(job);
    setIsFormOpen(true);
  };

  const openMatching = (job: JobData) => {
    setSelectedJob(job);
    setIsMatchingOpen(true);
  };

  const openCompletion = (job: JobData) => {
    setSelectedJob(job);
    setIsCompletionOpen(true);
  };

  const handleCompleteJob = async () => {
    setIsCompleting(true);
    toast.info("Completion requires the dispatch status update endpoint.");
    setIsCompleting(false);
  };

  const mapToLegacyJob = (job: JobData) => ({
    id: job.id,
    reference: job.reference,
    status: job.status,
    pickup: { address: job.pickupAddress, lat: job.pickupLat, lng: job.pickupLng },
    delivery: { address: job.deliveryAddress, lat: job.deliveryLat, lng: job.deliveryLng },
    cargo: { type: job.cargoType, weight: job.cargoWeight, description: job.cargoDescription },
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

  if (jobsQuery.isLoading) {
    return (
      <DashboardLayout title="Shipments">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Shipments">
      <div className="space-y-6">
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
                <p className="text-xs text-muted-foreground">Pending Jobs</p>
                <p className="text-xl font-bold">{stats.pending}</p>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50"
            />
            {jobsQuery.isFetching && !jobsQuery.isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as JobStatusFilter)}>
            <SelectTrigger className="w-full sm:w-[170px] bg-card/50 border-border/50">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {JOB_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
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
            onApply={(value) => setFilterValue(value)}
            onReset={() => setFilterValue(buildDefaultFilterValue(filterBounds))}
            trigger={
              <Button variant="outline" className="bg-card/50 border-border/50 relative">
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
            }
          />
        </div>

        {jobsQuery.isError ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium">Unable to load jobs</p>
              <p className="text-sm text-muted-foreground mb-4">
                {jobsQuery.error.message}
              </p>
              <Button variant="outline" onClick={() => jobsQuery.refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No jobs found"
            description="Create your first job or adjust the search and filters"
            actionLabel="Create Job"
            onAction={() => { setSelectedJob(null); setIsFormOpen(true); }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {jobs.map((job) => {
              const legacyJob = mapToLegacyJob(job);
              return (
                <JobCard
                  key={job.id}
                  job={legacyJob}
                  onView={() => openDetails(job)}
                  onEdit={() => openEdit(job)}
                  onDelete={() => setJobPendingDelete(job)}
                  onMatch={() => openMatching(job)}
                  onComplete={() => openCompletion(job)}
                  dispatcherMode
                  assignedByRole={job.assignedByRole}
                  recommendOnly={recommendOnly}
                  recommendedBy={recommendedByLabel}
                />
              );
            })}
          </div>
        )}
      </div>

      <JobFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        job={selectedJobDetails ? mapToLegacyJob(selectedJobDetails) : null}
        onSubmit={selectedJob ? handleEditJob : handleAddJob}
        isSubmitting={
          createJobMutation.isPending ||
          updateJobDetailsMutation.isPending ||
          (!!selectedJob && selectedJobDetailsQuery.isFetching)
        }
      />

      <JobDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        job={selectedJob ? mapToLegacyJob(selectedJob) : null}
      />

      <JobMatchingDialog
        open={isMatchingOpen}
        onOpenChange={setIsMatchingOpen}
        job={selectedJob ? mapToLegacyJob(selectedJob) : null}
        onAssign={handleAssign}
        onRecommend={handleRecommend}
        recommendOnly={recommendOnly}
      />

      <JobCompletionDialog
        open={isCompletionOpen}
        onOpenChange={setIsCompletionOpen}
        job={selectedJob ? {
          id: selectedJob.id,
          reference: selectedJob.reference,
          amountNgn: selectedJob.amountNgn,
          pickupAddress: selectedJob.pickupAddress,
          deliveryAddress: selectedJob.deliveryAddress,
        } : null}
        onComplete={handleCompleteJob}
        isSubmitting={isCompleting}
      />

      <AlertDialog
        open={Boolean(jobPendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteJobMutation.isPending) setJobPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete job {jobPendingDelete?.reference}? This action cannot be undone.
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
              {deleteJobMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Job"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
