import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DispatchPanel } from "@/components/supervisor/DispatchPanel";
import { JobMatchingDialog } from "@/components/jobs/JobMatchingDialog";
import { JobDetailsSheet } from "@/components/jobs/JobDetailsSheet";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useJobs, JobData } from "@/hooks/useJobs";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  Truck as TruckIcon,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DriverCommunicationActions } from "@/components/communications/DriverCommunicationActions";

export default function SupervisorDispatch() {
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [matchingDialogOpen, setMatchingDialogOpen] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { unreadCount } = useRealtimeMessages();

  // Use tenant-scoped data hooks
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { drivers, isLoading: driversLoading } = useDrivers();
  const { jobs, isLoading: jobsLoading } = useJobs();

  const isLoading = vehiclesLoading || driversLoading || jobsLoading;

  // Convert to expected formats for child components
  const vehiclesForPanel = vehicles.map((v) => ({
    id: v.id,
    vin: v.vin,
    registrationNumber: v.registrationNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    type: v.type as 'truck' | 'van' | 'trailer',
    status: v.status,
    capacity: v.capacity || 0,
    currentDriver: v.currentDriverId || undefined,
    deviceId: v.deviceId || undefined,
    fuelLevel: v.fuelLevel || undefined,
  }));

  const driversForPanel = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email || undefined,
    licenseNumber: d.licenseNumber,
    licenseExpiry: new Date(d.licenseExpiry),
    status: d.status as 'active' | 'available' | 'offline' | 'suspended',
    rating: d.rating,
    totalTrips: d.totalTrips,
    currentVehicle: d.currentVehicleId || undefined,
    communicationPreference: d.communicationPreference as 'whatsapp' | 'sms' | 'email' | 'voice',
  }));

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesSearch =
      job.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-primary" />;
      case "created":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success border-success/30">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/10 text-primary border-primary/30">In Progress</Badge>;
      case "created":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Map JobData to legacy Job format for TruckMatchingDialog
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

  const stats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "created").length,
    inProgress: jobs.filter((j) => j.status === "in_progress").length,
    completed: jobs.filter((j) => j.status === "completed").length,
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Dispatch Center"
        subtitle="Manage and track all dispatches"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dispatch Center"
      subtitle="Manage and track all dispatches"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-primary">{stats.inProgress}</p>
                </div>
                <TruckIcon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-success">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>All Dispatches</CardTitle>
              <Button onClick={() => setDispatchDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Dispatch
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="created">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Jobs List */}
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const assignedDriver = job.driverId 
                  ? drivers.find(d => d.id === job.driverId) 
                  : null;
                
                return (
                  <div
                    key={job.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{job.reference}</p>
                            {getStatusBadge(job.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.pickupAddress}
                            </span>
                            <span>→</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.deliveryAddress}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">{job.cargoType || 'General'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!job.driverId && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              setSelectedJob(job);
                              setMatchingDialogOpen(true);
                            }}
                          >
                            <TruckIcon className="h-4 w-4 mr-1" />
                            Match
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setDetailsSheetOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                    
                    {/* Driver Communication Section */}
                    {assignedDriver && (
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
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
                    )}
                  </div>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No dispatches found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <DispatchPanel
        vehicles={vehiclesForPanel}
        drivers={driversForPanel}
        open={dispatchDialogOpen}
        onOpenChange={setDispatchDialogOpen}
      />

      <JobMatchingDialog
        open={matchingDialogOpen}
        onOpenChange={setMatchingDialogOpen}
        job={selectedJob ? mapToLegacyJob(selectedJob) : null}
        onAssign={(vehicleId, driverId) => {
          // Assignment is handled inside the dialog; just close it here
          setMatchingDialogOpen(false);
          setSelectedJob(null);
        }}
      />

      <JobDetailsSheet
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        job={selectedJob ? mapToLegacyJob(selectedJob) : null}
      />
    </DashboardLayout>
  );
}
