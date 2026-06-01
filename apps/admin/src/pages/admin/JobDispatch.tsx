import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Card, CardContent } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Plus, Search, Package, Clock, CheckCircle, Truck,
  DollarSign, Loader2, SlidersHorizontal,
} from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
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
import { DriverCommunicationActions } from "@/components/communications/DriverCommunicationActions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useJobs, JobData } from "@/hooks/useJobs";
import { useDrivers } from "@/hooks/useDrivers";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { WritableAction } from "@/components/auth/WritableAction";
import { useOrgContext } from "@/hooks/useOrgContext";

export default function JobDispatch() {
  const { jobs, isLoading, addJob, updateJob, deleteJob } = useJobs();
  const { drivers } = useDrivers();
  const { format: formatCurrency } = useCurrency();
  const orgCtx = useOrgContext();
  const isEnterprise = orgCtx.hasOrgType('ENTERPRISE');
  const isAggregator = orgCtx.hasOrgType('AGGREGATOR');
  const isOperationsManager = orgCtx.hasOrgRole('OPERATIONS_MANAGER') && !orgCtx.hasOrgRole('ADMIN');
  // Enterprise admins, aggregators, and operations managers can only RECOMMEND drivers —
  // final assignment belongs to fleet provider admins and dispatchers.
  const recommendOnly = isEnterprise || isAggregator || isOperationsManager;
  const recommendedByLabel = isEnterprise
    ? "Enterprise Admin"
    : isAggregator
      ? "Aggregator"
      : isOperationsManager
        ? "Operations Manager"
        : undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMatchingOpen, setIsMatchingOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // ── Advanced filter state ──
  const filterBounds: JobsFilterBounds = useMemo(() => {
    const weights = jobs.map((j) => Number(j.cargoWeight) || 0);
    const amounts = jobs.map((j) => Number(j.amountNgn) || 0);
    return {
      weightMin: weights.length ? Math.min(...weights) : 0,
      weightMax: weights.length ? Math.max(...weights, 1) : 50,
      amountMin: amounts.length ? Math.min(...amounts) : 0,
      amountMax: amounts.length ? Math.max(...amounts, 1) : 1_000_000,
    };
  }, [jobs]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState<JobsFilterValue>(() =>
    buildDefaultFilterValue({
      weightMin: 0,
      weightMax: 50,
      amountMin: 0,
      amountMax: 1_000_000,
    }),
  );
  const activeFilterCount = countActiveFilters(filterValue);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;

    const weight = Number(job.cargoWeight) || 0;
    const [wMin, wMax] = filterValue.weightRange;
    const matchesWeight =
      !filterValue.weightEnabled ||
      (weight >= wMin && (wMax <= 0 || weight <= wMax));

    const amount = Number(job.amountNgn) || 0;
    const [aMin, aMax] = filterValue.amountRange;
    const matchesAmount =
      !filterValue.amountEnabled ||
      (amount >= aMin && (aMax <= 0 || amount <= aMax));

    let matchesDeadline = true;
    if (filterValue.deadlineEnabled && job.deadline) {
      const d = new Date(job.deadline).getTime();
      if (filterValue.deadlineFrom && d < filterValue.deadlineFrom.getTime()) matchesDeadline = false;
      if (filterValue.deadlineTo) {
        const end = new Date(filterValue.deadlineTo);
        end.setHours(23, 59, 59, 999);
        if (d > end.getTime()) matchesDeadline = false;
      }
    } else if (filterValue.deadlineEnabled && !job.deadline) {
      matchesDeadline = false;
    }

    return matchesSearch && matchesStatus && matchesWeight && matchesAmount && matchesDeadline;
  });

  const stats = {
    total: jobs.length,
    created: jobs.filter((j) => j.status === "created").length,
    inProgress: jobs.filter((j) => j.status === "in_progress").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    totalValue: jobs.reduce((sum, j) => sum + (j.amountNgn || 0), 0),
  };

  const handleAddJob = async (data: any) => {
    const success = await addJob({
      reference: data.reference,
      pickupAddress: data.pickupAddress,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      deliveryAddress: data.deliveryAddress,
      deliveryLat: data.deliveryLat,
      deliveryLng: data.deliveryLng,
      cargoType: data.cargoType,
      cargoWeight: data.cargoWeight,
      cargoDescription: data.cargoDescription,
      amountNgn: data.amount,
      deadline: data.deadline,
    });
    if (success) {
      setIsFormOpen(false);
    }
  };

  const handleEditJob = async (data: any) => {
    if (!selectedJob) return;
    const success = await updateJob(selectedJob.id, {
      pickupAddress: data.pickupAddress,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      deliveryAddress: data.deliveryAddress,
      deliveryLat: data.deliveryLat,
      deliveryLng: data.deliveryLng,
      cargoType: data.cargoType,
      cargoWeight: data.cargoWeight,
      cargoDescription: data.cargoDescription,
      amountNgn: data.amount,
      deadline: data.deadline,
    });
    if (success) {
      setIsFormOpen(false);
    }
  };

  const handleDeleteJob = async (job: JobData) => {
    await deleteJob(job.id);
  };

  const handleAssign = async (vehicleId: string, driverId: string) => {
    if (!selectedJob) return;
    await updateJob(selectedJob.id, {
      status: "assigned",
      vehicleId,
      driverId,
      assignedByRole: "Fleet Provider",
    });
    setIsMatchingOpen(false);
  };

  // Enterprise admins can only RECOMMEND drivers — they cannot assign.
  // Only fleet providers and dispatchers can assign drivers to jobs.
  const handleRecommend = async (vehicleId: string, driverId: string) => {
    if (!selectedJob) return;
    await updateJob(selectedJob.id, {
      // Keep status as "created" — driver is only recommended, not assigned.
      vehicleId,
      driverId,
    });
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

  const handleCompleteJob = async (data: {
    revenueNgn: number;
    billableKm?: number;
    billableHours?: number;
    customerChargeNgn?: number;
    completionNotes?: string;
  }) => {
    if (!selectedJob) return;
    
    setIsCompleting(true);
    try {
      const success = await updateJob(selectedJob.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        revenueNgn: data.revenueNgn,
        billableKm: data.billableKm || null,
        billableHours: data.billableHours || null,
        customerChargeNgn: data.customerChargeNgn || null,
        notes: data.completionNotes || selectedJob.notes,
        assignedVehicleId: selectedJob.vehicleId, // Ensure vehicle is linked for P&L
      });
      
      if (success) {
        toast.success("Job completed with financial details recorded");
        setIsCompletionOpen(false);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  // Map JobData to legacy Job format for components that expect it
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
    vehicleId: job.vehicleId,
  });

  if (isLoading) {
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
        {/* Page header — primary CTA top-right, above KPIs */}
        <WritableAction permission="canCreateJobs">
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
        </WritableAction>

        {/* KPIs */}
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
                <p className="text-xl font-bold">{stats.created}</p>
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

        {/* Toolbar: search + status + filter aligned horizontally */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference, pickup, or delivery..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[170px] bg-card/50 border-border/50">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="created">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
            }
          />
        </div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No jobs yet"
            description="Create your first job to start dispatching deliveries"
            actionLabel="Create Job"
            onAction={() => { setSelectedJob(null); setIsFormOpen(true); }}
          />
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {filteredJobs.map((job) => {
              const legacyJob = mapToLegacyJob(job);

              return (
                <JobCard
                  key={job.id}
                  job={legacyJob}
                  onView={() => openDetails(job)}
                  onEdit={() => openEdit(job)}
                  onDelete={() => handleDeleteJob(job)}
                  onMatch={() => openMatching(job)}
                  onComplete={() => openCompletion(job)}
                  dispatcherMode
                  assignedByRole={job.assignedByRole ?? undefined}
                  recommendOnly={recommendOnly}
                  recommendedBy={recommendedByLabel}
                />
              );
            })}
          </div>
        ) : (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium">No jobs found</p>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search or filter
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <JobFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        job={selectedJob ? mapToLegacyJob(selectedJob) : null}
        onSubmit={selectedJob ? handleEditJob : handleAddJob}
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
    </DashboardLayout>
  );
}



