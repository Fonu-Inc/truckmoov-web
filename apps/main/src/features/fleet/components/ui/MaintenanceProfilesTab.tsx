import type { ColumnDef } from "@tanstack/react-table";
import type {
  MaintenanceProfile, MaintenanceProfileLifecycleStatus, MaintenanceProfilesQuery,
} from "@truckmoov/api/fleet";
import type { ReactNode } from "react";
import {
  exportMaintenanceProfiles,

  useCompleteMaintenanceProfile,
  useDeleteMaintenanceProfile,
  useMaintenanceProfiles,
  useMaintenanceProfilesSummary,
  useVehicles,
} from "@truckmoov/api/fleet";
import {
  daysUntil, formatDate, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  Truck,
  Wrench,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";

import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Calendar as CalendarPicker } from "@/components/shadcn/calendar";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { MaintenanceProfileFormDialog } from "@/features/fleet/components/ui/MaintenanceProfileFormDialog";
import { formatMaintenanceServiceLabel } from "@/features/fleet/utils/maintenanceProfile";
import { cn } from "@/lib/utils";

const statusColors: Record<MaintenanceProfileLifecycleStatus, string> = {
  upcoming: "bg-primary/20 text-primary border-primary/30",
  due: "bg-warning/20 text-warning border-warning/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
  completed: "bg-success/20 text-success border-success/30",
};

const statusIcons: Record<MaintenanceProfileLifecycleStatus, ReactNode> = {
  upcoming: <Calendar className="h-4 w-4" />,
  due: <Clock className="h-4 w-4" />,
  overdue: <AlertTriangle className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
};

function downloadBlob(data: unknown, filename: string) {
  const blob = data instanceof Blob
    ? data
    : new Blob(
        [data as BlobPart],
        { type: "text/csv;charset=utf-8;" },
      );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function MaintenanceProfilesTab() {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    dueDateFrom,
    setDueDateFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    dueDateTo,
    setDueDateTo,
  ] = useState<Date | undefined>(undefined);
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);
  const [
    draftDueFrom,
    setDraftDueFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    draftDueTo,
    setDraftDueTo,
  ] = useState<Date | undefined>(undefined);
  const [
    draftEnableDueDate,
    setDraftEnableDueDate,
  ] = useState(false);
  const [
    isAddDialogOpen,
    setIsAddDialogOpen,
  ] = useState(false);
  const [
    isCompleteDialogOpen,
    setIsCompleteDialogOpen,
  ] = useState(false);
  const [
    selectedProfile,
    setSelectedProfile,
  ] = useState<MaintenanceProfile | null>(null);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  useEffect(
    () => {
      const timer = window.setTimeout(
        () => setDebouncedSearch(searchQuery.trim()),
        300,
      );
      return () => window.clearTimeout(timer);
    },
    [searchQuery],
  );

  const profileQueryParams = useMemo<MaintenanceProfilesQuery>(
    () => ({
      params: {
        search: debouncedSearch || undefined,
        lifecycleStatus:
          statusFilter !== "all" ? (statusFilter as MaintenanceProfileLifecycleStatus) : undefined,
        nextDueDateFrom: dueDateFrom ? toDateParam(dueDateFrom) : undefined,
        nextDueDateTo: dueDateTo ? toDateParam(dueDateTo) : undefined,
      },
    }),
    [
      debouncedSearch,
      dueDateFrom,
      dueDateTo,
      statusFilter,
    ],
  );

  const profilesQuery = useMaintenanceProfiles(profileQueryParams);
  const summaryQuery = useMaintenanceProfilesSummary();
  const vehiclesQuery = useVehicles();
  const completeProfileMutation = useCompleteMaintenanceProfile();
  const deleteProfileMutation = useDeleteMaintenanceProfile();

  const profiles = useMemo(
    () => profilesQuery.data?.data ?? [],
    [profilesQuery.data?.data],
  );
  const vehicles = useMemo(
    () => vehiclesQuery.data?.data ?? [],
    [vehiclesQuery.data?.data],
  );
  const stats = summaryQuery.data?.data ?? {
    overdue: 0,
    due: 0,
    upcoming: 0,
    completed: 0,
    total: 0,
  };

  const vehicleLabelById = useMemo(
    () => {
      return new Map(
        vehicles.map(vehicle => [
          vehicle.id,
          vehicle.registrationNumber
          || vehicle.plateNumber
          || `${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim()
          || vehicle.id,
        ]),
      );
    },
    [vehicles],
  );

  const getVehicleLabel = (vehicleId: string) => vehicleLabelById.get(vehicleId) ?? vehicleId;

  const resetFilters = () => {
    setDueDateFrom(undefined);
    setDueDateTo(undefined);
    setDraftDueFrom(undefined);
    setDraftDueTo(undefined);
    setDraftEnableDueDate(false);
    setFilterOpen(false);
  };

  const applyDraftFilters = () => {
    setDueDateFrom(draftEnableDueDate ? draftDueFrom : undefined);
    setDueDateTo(draftEnableDueDate ? draftDueTo : undefined);
    setFilterOpen(false);
  };

  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      setDraftDueFrom(dueDateFrom);
      setDraftDueTo(dueDateTo);
      setDraftEnableDueDate(Boolean(dueDateFrom || dueDateTo));
    }
    setFilterOpen(open);
  };

  const activeFilterCount = dueDateFrom || dueDateTo ? 1 : 0;

  const handleComplete = async () => {
    if (!selectedProfile)
      return;

    try {
      await completeProfileMutation.mutateAsync({ id: selectedProfile.id });
      toast.success("Maintenance profile completed");
      setIsCompleteDialogOpen(false);
      setSelectedProfile(null);
    }
    catch (error) {
      toast.error(error.message || "Failed to complete maintenance profile");
    }
  };

  const handleArchive = async (profile: MaintenanceProfile) => {
    try {
      await deleteProfileMutation.mutateAsync({ id: profile.id });
      toast.success("Maintenance profile deleted");
    }
    catch (error) {
      toast.error(error.message || "Failed to delete maintenance profile");
    }
  };

  const handleExportProfiles = async () => {
    setIsExporting(true);
    try {
      const data = await exportMaintenanceProfiles(profileQueryParams);
      downloadBlob(
        data,
        "maintenance_profiles.csv",
      );
      toast.success("Maintenance profiles export downloaded");
    }
    catch (error) {
      toast.error(error.message || "Maintenance profiles export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  const getKmUntilDue = (profile: MaintenanceProfile): number | null => {
    if (!profile.nextDueMileage || !profile.currentMileage)
      return null;
    return profile.nextDueMileage - profile.currentMileage;
  };

  const isInitialLoading = profilesQuery.isPending;

  const profileColumns: ColumnDef<MaintenanceProfile>[] = [
    {
      id: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{getVehicleLabel(row.original.vehicleId)}</span>
        </div>
      ),
    },
    {
      id: "category",
      header: "Service Category",
      meta: { className: "capitalize" },
      cell: ({ row }) => row.original.serviceLabel || formatMaintenanceServiceLabel(row.original.serviceType),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.lifecycleStatus]}>
          {statusIcons[row.original.lifecycleStatus]}
          <span className="ml-1 capitalize">{row.original.lifecycleStatus}</span>
        </Badge>
      ),
    },
    {
      id: "nextDueDate",
      header: "Next Due Date",
      cell: ({ row }) => {
        const p = row.original;
        const d = daysUntil(p.nextDueDate);
        if (!p.nextDueDate)
          return <span className="text-muted-foreground">-</span>;
        return (
          <div>
            <p className={cn(
              "font-medium",
              d !== null && d < 0 && "text-destructive",
              d !== null && d >= 0 && d <= 7 && "text-warning",
            )}
            >
              {formatDate(p.nextDueDate)}
            </p>
            {d !== null && (
              <p className="text-[10px] text-muted-foreground">
                {d < 0 ? `${Math.abs(d)}d overdue` : `${d}d left`}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "nextDueMileage",
      header: "Next Due Mileage",
      cell: ({ row }) => {
        const p = row.original;
        const km = getKmUntilDue(p);
        if (!p.nextDueMileage)
          return <span className="text-muted-foreground">-</span>;
        return (
          <div>
            <p className={cn(
              "font-medium",
              km !== null && km < 0 && "text-destructive",
            )}
            >
              {p.nextDueMileage.toLocaleString()}
              {" "}
              km
            </p>
            {km !== null && (
              <p className="text-[10px] text-muted-foreground">
                {km < 0 ? `${Math.abs(km)} km over` : `${km} km left`}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "currentMileage",
      header: "Current Mileage",
      meta: { className: "font-mono text-xs" },
      cell: ({ row }) => {
        const p = row.original;
        if (!p.currentMileage)
          return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-1">
            {p.currentMileage.toLocaleString()}
            {" "}
            km
            <Badge
              variant="outline"
              className="text-[10px] px-1"
            >
              {p.mileageSource === "telemetry" ? "GPS" : "Manual"}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "interval",
      header: "Interval",
      meta: { className: "capitalize" },
      cell: ({ row }) => {
        const p = row.original;
        if (p.intervalType === "mileage")
          return `${p.intervalKm?.toLocaleString() ?? "-"} km`;
        if (p.intervalMonths)
          return `${p.intervalMonths} months`;
        if (p.intervalDays)
          return `${p.intervalDays} days`;
        if (p.intervalKm)
          return `${p.intervalKm.toLocaleString()} km`;
        return "-";
      },
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[180px] text-right" },
      cell: ({ row }) => {
        const profile = row.original;
        return (
          <div className="flex justify-end gap-2">
            {profile.lifecycleStatus !== "upcoming" && profile.lifecycleStatus !== "completed" && (
              <Button
                size="sm"
                loading={completeProfileMutation.isPending && selectedProfile?.id === profile.id}
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
              loading={deleteProfileMutation.isPending}
              onClick={() => handleArchive(profile)}
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array.from({ length: 4 })].map((_, i) => (
            <Card
              key={i}
              className="bg-card/50 border-border/50"
            >
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
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Maintenance Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className={cn(
          "bg-card/50 border-border/50",
          stats.overdue > 0 && "border-destructive/50",
        )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "bg-card/50 border-border/50",
          stats.due > 0 && "border-warning/50",
        )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20 shrink-0">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{stats.due}</p>
                <p className="text-xs text-muted-foreground">Due Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted shrink-0">
                <Wrench className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Maintenance Profiles (
                {profiles.length}
                )
              </CardTitle>
              <CardDescription className="mt-1">
                Per-vehicle maintenance schedules, service intervals, next-due dates, and SLA targets.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={isExporting}
              onClick={handleExportProfiles}
              className="bg-transparent border-input"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle, service category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-card/50 border-border/50"
              />
              {profilesQuery.isFetching && !profilesQuery.isPending && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[170px] bg-card/50 border-border/50">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Popover
              open={filterOpen}
              onOpenChange={handleFilterOpenChange}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-card/50 border-border/50 relative"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-1.5 text-[10px]"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Show Maintenance Profiles</Label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="flt-due"
                      checked={draftEnableDueDate}
                      onCheckedChange={checked => setDraftEnableDueDate(checked === true)}
                    />
                    <Label
                      htmlFor="flt-due"
                      className="text-xs cursor-pointer"
                    >
                      Next Due Date
                    </Label>
                  </div>
                  <div className={cn(
                    "grid grid-cols-2 gap-2",
                    !draftEnableDueDate && "opacity-50 pointer-events-none",
                  )}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!draftEnableDueDate}
                          className={cn(
                            "h-9 justify-start text-left font-normal text-xs",
                            !draftDueFrom && "text-muted-foreground",
                          )}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {draftDueFrom ? formatDate(draftDueFrom) : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <CalendarPicker
                          mode="single"
                          selected={draftDueFrom}
                          onSelect={setDraftDueFrom}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!draftEnableDueDate}
                          className={cn(
                            "h-9 justify-start text-left font-normal text-xs",
                            !draftDueTo && "text-muted-foreground",
                          )}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {draftDueTo ? formatDate(draftDueTo) : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <CalendarPicker
                          mode="single"
                          selected={draftDueTo}
                          onSelect={setDraftDueTo}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    className="flex-1"
                    onClick={applyDraftFilters}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={resetFilters}
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <DataTable
            columns={profileColumns}
            data={profiles}
            isError={profilesQuery.isError}
            errorMessage={profilesQuery.error?.message || "Try refreshing the page."}
            onRetry={() => profilesQuery.refetch()}
            emptyState={(
              <div className="p-12 text-center">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Maintenance Profiles</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create maintenance profiles to track scheduled services for your vehicles.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Profile
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <MaintenanceProfileFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      <Dialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Maintenance</DialogTitle>
            <DialogDescription>Mark this maintenance profile as completed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">{selectedProfile ? getVehicleLabel(selectedProfile.vehicleId) : ""}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {selectedProfile
                  ? selectedProfile.serviceLabel || formatMaintenanceServiceLabel(selectedProfile.serviceType)
                  : ""}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCompleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              loading={completeProfileMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
