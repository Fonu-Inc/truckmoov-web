import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Truck,
  Gauge,
  Archive,
  RefreshCw,
} from "lucide-react";
import { format, differenceInDays, addDays, addMonths } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMaintenanceProfiles, SERVICE_TYPES, MaintenanceProfile, MaintenanceIntervalType } from "@/hooks/useMaintenanceProfiles";
import { useVehicles } from "@/hooks/useVehicles";

const statusColors: Record<string, string> = {
  upcoming: "bg-primary/20 text-primary border-primary/30",
  due: "bg-warning/20 text-warning border-warning/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
  completed: "bg-success/20 text-success border-success/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  upcoming: <Calendar className="h-4 w-4" />,
  due: <Clock className="h-4 w-4" />,
  overdue: <AlertTriangle className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
};

export function MaintenanceProfilesTab() {
  const { profiles, groupedProfiles, stats, isLoading, addProfile, completeService, archiveProfile, fetchProfiles } = useMaintenanceProfiles();
  const { vehicles } = useVehicles();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<MaintenanceProfile | null>(null);
  const [completionData, setCompletionData] = useState({
    mileage: "",
    cost: "",
    notes: "",
  });
  const [newProfile, setNewProfile] = useState({
    vehicleId: "",
    serviceType: "",
    customLabel: "",
    intervalType: "date" as MaintenanceIntervalType,
    intervalDays: "",
    intervalMonths: "",
    intervalKm: "",
    lastServiceDate: "",
    lastServiceMileage: "",
  });

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.vehicle_registration?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.service_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || profile.lifecycle_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddProfile = async () => {
    if (!newProfile.vehicleId || !newProfile.serviceType) {
      toast.error("Please fill in required fields");
      return;
    }

    // Calculate next due date
    let nextDueDate: string | undefined;
    if (newProfile.intervalType !== 'mileage') {
      const baseDate = newProfile.lastServiceDate ? new Date(newProfile.lastServiceDate) : new Date();
      if (newProfile.intervalDays) {
        nextDueDate = addDays(baseDate, parseInt(newProfile.intervalDays)).toISOString();
      } else if (newProfile.intervalMonths) {
        nextDueDate = addMonths(baseDate, parseInt(newProfile.intervalMonths)).toISOString();
      }
    }

    // Calculate next due mileage
    let nextDueMileage: number | undefined;
    if (newProfile.intervalType !== 'date' && newProfile.intervalKm) {
      const baseMileage = newProfile.lastServiceMileage ? parseInt(newProfile.lastServiceMileage) : 0;
      nextDueMileage = baseMileage + parseInt(newProfile.intervalKm);
    }

    try {
      await addProfile({
        vehicle_id: newProfile.vehicleId,
        service_type: newProfile.serviceType === 'custom' ? newProfile.customLabel : newProfile.serviceType,
        service_label: newProfile.customLabel || null,
        interval_type: newProfile.intervalType,
        interval_days: newProfile.intervalDays ? parseInt(newProfile.intervalDays) : null,
        interval_months: newProfile.intervalMonths ? parseInt(newProfile.intervalMonths) : null,
        interval_km: newProfile.intervalKm ? parseInt(newProfile.intervalKm) : null,
        last_service_date: newProfile.lastServiceDate || null,
        last_service_mileage: newProfile.lastServiceMileage ? parseInt(newProfile.lastServiceMileage) : null,
        next_due_date: nextDueDate,
        next_due_mileage: nextDueMileage,
      });
      setIsAddDialogOpen(false);
      resetNewProfile();
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleComplete = async () => {
    if (!selectedProfile) return;

    try {
      await completeService(
        selectedProfile.id,
        completionData.mileage ? parseInt(completionData.mileage) : undefined,
        completionData.cost ? parseFloat(completionData.cost) : undefined,
        completionData.notes || undefined
      );
      setIsCompleteDialogOpen(false);
      setSelectedProfile(null);
      setCompletionData({ mileage: "", cost: "", notes: "" });
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleArchive = async (profile: MaintenanceProfile) => {
    try {
      await archiveProfile(profile.id);
    } catch (err) {
      // Error handled by hook
    }
  };

  const resetNewProfile = () => {
    setNewProfile({
      vehicleId: "",
      serviceType: "",
      customLabel: "",
      intervalType: "date",
      intervalDays: "",
      intervalMonths: "",
      intervalKm: "",
      lastServiceDate: "",
      lastServiceMileage: "",
    });
  };

  const getDaysUntilDue = (profile: MaintenanceProfile): number | null => {
    if (!profile.next_due_date) return null;
    return differenceInDays(new Date(profile.next_due_date), new Date());
  };

  const getKmUntilDue = (profile: MaintenanceProfile): number | null => {
    if (!profile.next_due_mileage || !profile.current_mileage) return null;
    return profile.next_due_mileage - profile.current_mileage;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn("bg-card/50 border-border/50", stats.overdue > 0 && "border-destructive/50")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("bg-card/50 border-border/50", stats.due > 0 && "border-warning/50")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.due}</p>
                <p className="text-xs text-muted-foreground">Due Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Wrench className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Profiles</p>
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
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="due">Due</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchProfiles()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance Profile
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by vehicle, service type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card/50 border-border/50"
        />
      </div>

      {/* Maintenance Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Maintenance Profiles</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create maintenance profiles to track scheduled services for your vehicles.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile) => {
            const daysUntil = getDaysUntilDue(profile);
            const kmUntil = getKmUntilDue(profile);

            return (
              <Card key={profile.id} className={cn(
                "bg-card/50 border-border/50 transition-all",
                profile.lifecycle_status === 'overdue' && "border-destructive/50",
                profile.lifecycle_status === 'due' && "border-warning/50"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {profile.vehicle_registration || 'Unknown Vehicle'}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {profile.service_label || profile.service_type.replace('_', ' ')}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[profile.lifecycle_status]}>
                      {statusIcons[profile.lifecycle_status]}
                      <span className="ml-1 capitalize">{profile.lifecycle_status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Due Information */}
                  <div className="space-y-2 text-sm">
                    {profile.next_due_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due Date
                        </span>
                        <span className={cn(
                          "font-medium",
                          daysUntil !== null && daysUntil < 0 && "text-destructive",
                          daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && "text-warning"
                        )}>
                          {format(new Date(profile.next_due_date), "MMM dd, yyyy")}
                          {daysUntil !== null && (
                            <span className="ml-1 text-xs">
                              ({daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d`})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {profile.next_due_mileage && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          Due Mileage
                        </span>
                        <span className={cn(
                          "font-medium",
                          kmUntil !== null && kmUntil < 0 && "text-destructive"
                        )}>
                          {profile.next_due_mileage.toLocaleString()} km
                          {kmUntil !== null && (
                            <span className="ml-1 text-xs">
                              ({kmUntil < 0 ? `${Math.abs(kmUntil)} km over` : `${kmUntil} km left`})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {profile.current_mileage && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Current Mileage</span>
                        <span className="font-mono text-xs">
                          {profile.current_mileage.toLocaleString()} km
                          <Badge variant="outline" className="ml-1 text-[10px] px-1">
                            {profile.mileage_source === 'telemetry' ? 'GPS' : 'Manual'}
                          </Badge>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {profile.lifecycle_status !== 'upcoming' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedProfile(profile);
                          setIsCompleteDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(profile)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Profile Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Maintenance Profile</DialogTitle>
            <DialogDescription>
              Create a recurring maintenance schedule for a vehicle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Vehicle Selection */}
            <div className="space-y-2">
              <Label>Vehicle *</Label>
              <Select
                value={newProfile.vehicleId}
                onValueChange={(value) => setNewProfile({ ...newProfile, vehicleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registrationNumber} - {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Select
                value={newProfile.serviceType}
                onValueChange={(value) => setNewProfile({ ...newProfile, serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newProfile.serviceType === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Label</Label>
                <Input
                  placeholder="e.g., Suspension Check"
                  value={newProfile.customLabel}
                  onChange={(e) => setNewProfile({ ...newProfile, customLabel: e.target.value })}
                />
              </div>
            )}

            {/* Interval Type */}
            <div className="space-y-2">
              <Label>Schedule Based On *</Label>
              <Select
                value={newProfile.intervalType}
                onValueChange={(value) => setNewProfile({ ...newProfile, intervalType: value as MaintenanceIntervalType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Time (Days/Months)</SelectItem>
                  <SelectItem value="mileage">Mileage (Kilometers)</SelectItem>
                  <SelectItem value="both">Both (Whichever comes first)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interval Values */}
            {newProfile.intervalType !== 'mileage' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Interval (Days)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 90"
                    value={newProfile.intervalDays}
                    onChange={(e) => setNewProfile({ ...newProfile, intervalDays: e.target.value, intervalMonths: "" })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Or Months</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 3"
                    value={newProfile.intervalMonths}
                    onChange={(e) => setNewProfile({ ...newProfile, intervalMonths: e.target.value, intervalDays: "" })}
                  />
                </div>
              </div>
            )}

            {newProfile.intervalType !== 'date' && (
              <div className="space-y-2">
                <Label>Interval (Kilometers)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5000"
                  value={newProfile.intervalKm}
                  onChange={(e) => setNewProfile({ ...newProfile, intervalKm: e.target.value })}
                />
              </div>
            )}

            {/* Last Service */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Last Service Date</Label>
                <Input
                  type="date"
                  value={newProfile.lastServiceDate}
                  onChange={(e) => setNewProfile({ ...newProfile, lastServiceDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Service Mileage</Label>
                <Input
                  type="number"
                  placeholder="e.g., 45000"
                  value={newProfile.lastServiceMileage}
                  onChange={(e) => setNewProfile({ ...newProfile, lastServiceMileage: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProfile}>Create Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Service Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Maintenance</DialogTitle>
            <DialogDescription>
              Mark this maintenance as completed and schedule the next service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">{selectedProfile?.vehicle_registration}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {selectedProfile?.service_label || selectedProfile?.service_type.replace('_', ' ')}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Current Odometer (km)</Label>
              <Input
                type="number"
                placeholder="e.g., 48500"
                value={completionData.mileage}
                onChange={(e) => setCompletionData({ ...completionData, mileage: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Service Cost (₦)</Label>
              <Input
                type="number"
                placeholder="e.g., 25000"
                value={completionData.cost}
                onChange={(e) => setCompletionData({ ...completionData, cost: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Any notes about the service..."
                value={completionData.notes}
                onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleComplete}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
