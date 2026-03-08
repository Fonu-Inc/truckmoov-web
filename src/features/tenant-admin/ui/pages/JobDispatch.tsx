import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Search, Package, Clock, CheckCircle, Truck,
  DollarSign, Route, Loader2
} from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import { JobDetailsSheet } from "@/components/jobs/JobDetailsSheet";
import { JobMatchingDialog } from "@/components/jobs/JobMatchingDialog";
import { JobCompletionDialog } from "@/components/jobs/JobCompletionDialog";
import { RouteOptimizationDialog } from "@/components/jobs/RouteOptimizationDialog";
import { DriverCommunicationActions } from "@/components/communications/DriverCommunicationActions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useJobs, JobData } from "@/hooks/useJobs";
import { useDrivers } from "@/hooks/useDrivers";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export default function JobDispatch() {
  const { jobs, isLoading, addJob, updateJob, deleteJob } = useJobs();
  const { drivers } = useDrivers();
  const { format: formatCurrency } = useCurrency();
  const { user } = useAuthStore();
  const { enabled: isAIRouteOptEnabled } = useFeatureFlag('enable_ai_route_optimization', user?.tenantId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMatchingOpen, setIsMatchingOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [isRouteOptimizationOpen, setIsRouteOptimizationOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const filteredJobs = jobs
    .filter((job) => {
      const matchesSearch =
        job.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "deadline" && a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === "amount") {
        return (b.amountNgn || 0) - (a.amountNgn || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
      driverId 
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
      <DashboardLayout title="Job Dispatch">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Job Dispatch">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.created}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="created">Pending</TabsTrigger>
              <TabsTrigger value="assigned">Assigned</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            {isAIRouteOptEnabled && (
              <Button variant="outline" onClick={() => setIsRouteOptimizationOpen(true)}>
                <Route className="h-4 w-4 mr-2" />
                Optimize Routes
              </Button>
            )}
            <Button variant="gradient" onClick={() => { setSelectedJob(null); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Button>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference, pickup, or delivery..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-card/50 border-border/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="created">Created Date</SelectItem>
            </SelectContent>
          </Select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => {
              const assignedDriver = job.driverId ? drivers.find(d => d.id === job.driverId) : null;
              const legacyJob = mapToLegacyJob(job);
              
              return (
                <div key={job.id} className="space-y-2">
                  <JobCard
                    job={legacyJob}
                    onView={() => openDetails(job)}
                    onEdit={() => openEdit(job)}
                    onDelete={() => handleDeleteJob(job)}
                    onMatch={() => openMatching(job)}
                    onComplete={() => openCompletion(job)}
                  />
                  {/* Communication Actions for Assigned Driver */}
                  {assignedDriver && (
                    <Card className="bg-muted/30 border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                              {assignedDriver.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{assignedDriver.name}</p>
                              <p className="text-xs text-muted-foreground">{assignedDriver.phone}</p>
                            </div>
                          </div>
                          <DriverCommunicationActions
                            driverId={assignedDriver.id}
                            driverName={assignedDriver.name}
                            driverPhone={assignedDriver.phone}
                            variant="inline"
                            size="sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
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
      />

      <RouteOptimizationDialog
        open={isRouteOptimizationOpen}
        onOpenChange={setIsRouteOptimizationOpen}
        onOptimize={(waypoints) => {
          console.log("Optimized route:", waypoints);
          toast.success(`Route optimized with ${waypoints.length} waypoints`);
        }}
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
