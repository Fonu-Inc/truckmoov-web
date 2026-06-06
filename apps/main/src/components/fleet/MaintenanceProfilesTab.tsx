import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shadcn/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Label } from "@/components/shadcn/label";
import { Checkbox } from "@/components/shadcn/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn/radio-group";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Calendar as CalendarPicker } from "@/components/shadcn/calendar";
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
  SlidersHorizontal,
} from "lucide-react";
import { ExportButton } from "@/components/shadcn/export-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { format, differenceInDays, addDays, addMonths } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
type MaintenanceProfile = any;
type MaintenanceIntervalType = "date" | "mileage" | "both" | "months";
const SERVICE_TYPES: { value: string; label: string }[] = [];

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
  const profiles: MaintenanceProfile[] = [];
  const groupedProfiles: any = {};
  const stats = { overdue: 0, due: 0, upcoming: 0, total: 0 };
  const isLoading = false;
  const addProfile = async (..._args: any[]) => {};
  const completeService = async (..._args: any[]) => {};
  const archiveProfile = async (..._args: any[]) => {};
  const fetchProfiles = async () => {};
  const vehicles: any[] = [];

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Applied filters (drive results)
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [customCategoryQuery, setCustomCategoryQuery] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState<Date | undefined>(undefined);
  const [dueDateTo, setDueDateTo] = useState<Date | undefined>(undefined);
  const [mileageMin, setMileageMin] = useState("");
  const [mileageMax, setMileageMax] = useState("");
  const [intervalMin, setIntervalMin] = useState("");
  const [intervalMax, setIntervalMax] = useState("");
  // Draft filters (popover inputs)
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState<string>("all");
  const [draftCustomQuery, setDraftCustomQuery] = useState("");
  const [draftDueFrom, setDraftDueFrom] = useState<Date | undefined>(undefined);
  const [draftDueTo, setDraftDueTo] = useState<Date | undefined>(undefined);
  const [draftMileageMin, setDraftMileageMin] = useState("");
  const [draftMileageMax, setDraftMileageMax] = useState("");
  const [draftIntervalMin, setDraftIntervalMin] = useState("");
  const [draftIntervalMax, setDraftIntervalMax] = useState("");
  // Per-filter enable toggles
  const [draftEnableCategory, setDraftEnableCategory] = useState(false);
  const [draftEnableDueDate, setDraftEnableDueDate] = useState(false);
  const [draftEnableMileage, setDraftEnableMileage] = useState(false);
  const [draftEnableInterval, setDraftEnableInterval] = useState(false);
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
    timeUnit: "days" as "days" | "months",
    intervalDays: "",
    intervalMonths: "",
    intervalKm: "",
    lastServiceDate: "",
    lastServiceMileage: "",
  });

  const matchesAdvancedFilters = (profile: MaintenanceProfile) => {
    // Category filter
    if (categoryFilter !== "all") {
      if (categoryFilter === "custom") {
        const isCustomService = !SERVICE_TYPES.some(
          (t) => t.value !== "custom" && t.value === profile.service_type
        );
        if (!isCustomService) return false;
        if (customCategoryQuery) {
          const haystack = `${profile.service_label ?? ""} ${profile.service_type}`.toLowerCase();
          if (!haystack.includes(customCategoryQuery.toLowerCase())) return false;
        }
      } else if (profile.service_type !== categoryFilter) {
        return false;
      }
    }
    // Next due date range
    if (dueDateFrom || dueDateTo) {
      if (!profile.next_due_date) return false;
      const due = new Date(profile.next_due_date);
      if (dueDateFrom && due < dueDateFrom) return false;
      if (dueDateTo && due > dueDateTo) return false;
    }
    // Next due mileage range
    const minM = mileageMin ? parseInt(mileageMin) : null;
    const maxM = mileageMax ? parseInt(mileageMax) : null;
    if (minM !== null || maxM !== null) {
      const m = profile.next_due_mileage;
      if (m == null) return false;
      if (minM !== null && m < minM) return false;
      if (maxM !== null && m > maxM) return false;
    }
    // Interval range (days OR km, whichever applies)
    const minI = intervalMin ? parseInt(intervalMin) : null;
    const maxI = intervalMax ? parseInt(intervalMax) : null;
    if (minI !== null || maxI !== null) {
      const interval =
        profile.interval_days ??
        (profile.interval_months ? profile.interval_months * 30 : null) ??
        profile.interval_km ??
        null;
      if (interval == null) return false;
      if (minI !== null && interval < minI) return false;
      if (maxI !== null && interval > maxI) return false;
    }
    return true;
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.vehicle_registration?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.service_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || profile.lifecycle_status === statusFilter;
    return matchesSearch && matchesStatus && matchesAdvancedFilters(profile);
  });

  const resetFilters = () => {
    setCategoryFilter("all");
    setCustomCategoryQuery("");
    setDueDateFrom(undefined);
    setDueDateTo(undefined);
    setMileageMin("");
    setMileageMax("");
    setIntervalMin("");
    setIntervalMax("");
    setDraftCategory("all");
    setDraftCustomQuery("");
    setDraftDueFrom(undefined);
    setDraftDueTo(undefined);
    setDraftMileageMin("");
    setDraftMileageMax("");
    setDraftIntervalMin("");
    setDraftIntervalMax("");
    setDraftEnableCategory(false);
    setDraftEnableDueDate(false);
    setDraftEnableMileage(false);
    setDraftEnableInterval(false);
  };

  const applyDraftFilters = () => {
    setCategoryFilter(draftEnableCategory ? draftCategory : "all");
    setCustomCategoryQuery(draftEnableCategory ? draftCustomQuery : "");
    setDueDateFrom(draftEnableDueDate ? draftDueFrom : undefined);
    setDueDateTo(draftEnableDueDate ? draftDueTo : undefined);
    setMileageMin(draftEnableMileage ? draftMileageMin : "");
    setMileageMax(draftEnableMileage ? draftMileageMax : "");
    setIntervalMin(draftEnableInterval ? draftIntervalMin : "");
    setIntervalMax(draftEnableInterval ? draftIntervalMax : "");
    setFilterOpen(false);
  };

  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      // Sync draft from applied
      setDraftCategory(categoryFilter);
      setDraftCustomQuery(customCategoryQuery);
      setDraftDueFrom(dueDateFrom);
      setDraftDueTo(dueDateTo);
      setDraftMileageMin(mileageMin);
      setDraftMileageMax(mileageMax);
      setDraftIntervalMin(intervalMin);
      setDraftIntervalMax(intervalMax);
      setDraftEnableCategory(categoryFilter !== "all");
      setDraftEnableDueDate(Boolean(dueDateFrom || dueDateTo));
      setDraftEnableMileage(Boolean(mileageMin || mileageMax));
      setDraftEnableInterval(Boolean(intervalMin || intervalMax));
    }
    setFilterOpen(open);
  };

  const activeFilterCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (dueDateFrom || dueDateTo ? 1 : 0) +
    (mileageMin || mileageMax ? 1 : 0) +
    (intervalMin || intervalMax ? 1 : 0);

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
      timeUnit: "days",
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

  // Demo fallback profiles for empty state
  const demoProfiles: MaintenanceProfile[] = [
    {
      id: "demo-1",
      vehicle_id: "demo-v1",
      vehicle_registration: "LAG-201-AB",
      service_type: "oil_change",
      service_label: "Engine Oil Change",
      interval_type: "mileage",
      interval_days: null,
      interval_months: null,
      interval_km: 10000,
      last_service_date: new Date(Date.now() - 60 * 86400000).toISOString(),
      last_service_mileage: 45000,
      next_due_date: new Date(Date.now() - 5 * 86400000).toISOString(),
      next_due_mileage: 55000,
      current_mileage: 56200,
      mileage_source: "telemetry",
      lifecycle_status: "overdue",
    } as any,
    {
      id: "demo-2",
      vehicle_id: "demo-v2",
      vehicle_registration: "LAG-318-CD",
      service_type: "brake_inspection",
      service_label: "Brake Inspection",
      interval_type: "date",
      interval_days: 90,
      interval_months: null,
      interval_km: null,
      last_service_date: new Date(Date.now() - 85 * 86400000).toISOString(),
      last_service_mileage: 32000,
      next_due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
      next_due_mileage: null,
      current_mileage: 38500,
      mileage_source: "manual",
      lifecycle_status: "due",
    } as any,
    {
      id: "demo-3",
      vehicle_id: "demo-v3",
      vehicle_registration: "LAG-422-EF",
      service_type: "tire_rotation",
      service_label: "Tire Rotation",
      interval_type: "mileage",
      interval_days: null,
      interval_months: null,
      interval_km: 8000,
      last_service_date: new Date(Date.now() - 30 * 86400000).toISOString(),
      last_service_mileage: 60000,
      next_due_date: new Date(Date.now() + 45 * 86400000).toISOString(),
      next_due_mileage: 68000,
      current_mileage: 62100,
      mileage_source: "telemetry",
      lifecycle_status: "upcoming",
    } as any,
    {
      id: "demo-4",
      vehicle_id: "demo-v4",
      vehicle_registration: "LAG-507-GH",
      service_type: "filter_replacement",
      service_label: "Air Filter Replacement",
      interval_type: "months",
      interval_days: null,
      interval_months: 6,
      interval_km: null,
      last_service_date: new Date(Date.now() - 30 * 86400000).toISOString(),
      last_service_mileage: 21000,
      next_due_date: new Date(Date.now() + 150 * 86400000).toISOString(),
      next_due_mileage: null,
      current_mileage: 23400,
      mileage_source: "manual",
      lifecycle_status: "upcoming",
    } as any,
  ];

  const displayProfiles = filteredProfiles.length === 0 && profiles.length === 0
    ? demoProfiles.filter((p) => statusFilter === "all" || p.lifecycle_status === statusFilter)
        .filter((p) =>
          !searchQuery ||
          p.vehicle_registration?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.service_type.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter((p) => matchesAdvancedFilters(p as MaintenanceProfile))
    : filteredProfiles;

  return (
    <div className="space-y-6">
      {/* Header: Add button aligned top-right, above KPIs */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Maintenance Profile
        </Button>
      </div>

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

      {/* Maintenance Profiles: header + table in one container */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Maintenance Profiles ({displayProfiles.length})
              </CardTitle>
              <CardDescription className="mt-1">Per-vehicle maintenance schedules — service intervals, next-due dates, and SLA targets.</CardDescription>
            </div>
            <ExportButton
              filename="maintenance_profiles"
              rows={displayProfiles}
              columns={[
                { header: "Vehicle", accessor: (p: MaintenanceProfile) => p.vehicle_registration ?? "" },
                { header: "Service Category", accessor: (p: MaintenanceProfile) => p.service_label || p.service_type },
                { header: "Status", accessor: "lifecycle_status" },
                { header: "Next Due Date", accessor: (p: MaintenanceProfile) => p.next_due_date ? format(new Date(p.next_due_date), "yyyy-MM-dd") : "" },
                { header: "Next Due Mileage (km)", accessor: (p: MaintenanceProfile) => p.next_due_mileage ?? "" },
                { header: "Current Mileage (km)", accessor: (p: MaintenanceProfile) => p.current_mileage ?? "" },
                { header: "Interval Type", accessor: "interval_type" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle, service category..."
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
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Popover open={filterOpen} onOpenChange={handleFilterOpenChange}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-card/50 border-border/50 relative">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Show Maintenance Profiles</Label>
                </div>

                {/* Service Category */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="flt-cat"
                      checked={draftEnableCategory}
                      onCheckedChange={(c) => setDraftEnableCategory(c === true)}
                    />
                    <Label htmlFor="flt-cat" className="text-xs cursor-pointer">Service Category</Label>
                  </div>
                  <Select value={draftCategory} onValueChange={setDraftCategory} disabled={!draftEnableCategory}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {SERVICE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {draftEnableCategory && draftCategory === "custom" && (
                    <Input
                      placeholder="Search custom label..."
                      value={draftCustomQuery}
                      onChange={(e) => setDraftCustomQuery(e.target.value)}
                      className="h-9"
                    />
                  )}
                </div>

                {/* Next Due Date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="flt-due"
                      checked={draftEnableDueDate}
                      onCheckedChange={(c) => setDraftEnableDueDate(c === true)}
                    />
                    <Label htmlFor="flt-due" className="text-xs cursor-pointer">Next Due Date</Label>
                  </div>
                  <div className={cn("grid grid-cols-2 gap-2", !draftEnableDueDate && "opacity-50 pointer-events-none")}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!draftEnableDueDate}
                          className={cn(
                            "h-9 justify-start text-left font-normal text-xs",
                            !draftDueFrom && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {draftDueFrom ? format(draftDueFrom, "MMM d, yyyy") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker
                          mode="single"
                          selected={draftDueFrom}
                          onSelect={setDraftDueFrom}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
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
                            !draftDueTo && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {draftDueTo ? format(draftDueTo, "MMM d, yyyy") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker
                          mode="single"
                          selected={draftDueTo}
                          onSelect={setDraftDueTo}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Next Due Mileage */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="flt-mileage"
                      checked={draftEnableMileage}
                      onCheckedChange={(c) => setDraftEnableMileage(c === true)}
                    />
                    <Label htmlFor="flt-mileage" className="text-xs cursor-pointer">Next Due Mileage (km)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={draftMileageMin}
                      onChange={(e) => setDraftMileageMin(e.target.value)}
                      disabled={!draftEnableMileage}
                      className="h-9"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={draftMileageMax}
                      onChange={(e) => setDraftMileageMax(e.target.value)}
                      disabled={!draftEnableMileage}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Interval */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="flt-interval"
                      checked={draftEnableInterval}
                      onCheckedChange={(c) => setDraftEnableInterval(c === true)}
                    />
                    <Label htmlFor="flt-interval" className="text-xs cursor-pointer">Interval (days / km)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="From"
                      value={draftIntervalMin}
                      onChange={(e) => setDraftIntervalMin(e.target.value)}
                      disabled={!draftEnableInterval}
                      className="h-9"
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      value={draftIntervalMax}
                      onChange={(e) => setDraftIntervalMax(e.target.value)}
                      disabled={!draftEnableInterval}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Primary actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button className="flex-1" onClick={applyDraftFilters}>
                    Apply
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={resetFilters}>
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {displayProfiles.length === 0 ? (
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium">Service Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Next Due Date</th>
                    <th className="px-4 py-3 font-medium">Next Due Mileage</th>
                    <th className="px-4 py-3 font-medium">Current Mileage</th>
                    <th className="px-4 py-3 font-medium">Interval</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayProfiles.map((profile) => {
                    const daysUntil = getDaysUntilDue(profile);
                    const kmUntil = getKmUntilDue(profile);
                    const intervalLabel =
                      profile.interval_type === "mileage"
                        ? `${profile.interval_km?.toLocaleString() ?? "-"} km`
                        : profile.interval_months
                        ? `${profile.interval_months} months`
                        : profile.interval_days
                        ? `${profile.interval_days} days`
                        : profile.interval_km
                        ? `${profile.interval_km.toLocaleString()} km`
                        : "—";

                    return (
                      <tr key={profile.id} className="group transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{profile.vehicle_registration || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 capitalize">
                          {profile.service_label || profile.service_type.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={statusColors[profile.lifecycle_status]}>
                            {statusIcons[profile.lifecycle_status]}
                            <span className="ml-1 capitalize">{profile.lifecycle_status}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          {profile.next_due_date ? (
                            <div>
                              <p className={cn(
                                "font-medium",
                                daysUntil !== null && daysUntil < 0 && "text-destructive",
                                daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && "text-warning"
                              )}>
                                {format(new Date(profile.next_due_date), "MMM dd, yyyy")}
                              </p>
                              {daysUntil !== null && (
                                <p className="text-[10px] text-muted-foreground">
                                  {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d left`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {profile.next_due_mileage ? (
                            <div>
                              <p className={cn(
                                "font-medium",
                                kmUntil !== null && kmUntil < 0 && "text-destructive"
                              )}>
                                {profile.next_due_mileage.toLocaleString()} km
                              </p>
                              {kmUntil !== null && (
                                <p className="text-[10px] text-muted-foreground">
                                  {kmUntil < 0 ? `${Math.abs(kmUntil)} km over` : `${kmUntil} km left`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs">
                          {profile.current_mileage ? (
                            <div className="flex items-center gap-1">
                              {profile.current_mileage.toLocaleString()} km
                              <Badge variant="outline" className="text-[10px] px-1">
                                {profile.mileage_source === "telemetry" ? "GPS" : "Manual"}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 capitalize">{intervalLabel}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {profile.lifecycle_status !== "upcoming" && (
                              <Button
                                size="sm"
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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

            {/* Service Category */}
            <div className="space-y-2">
              <Label>Service Category *</Label>
              <Select
                value={newProfile.serviceType}
                onValueChange={(value) => setNewProfile({ ...newProfile, serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service category" />
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
                <Label>Custom Category</Label>
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

            {/* Interval Values - Time-based with radio choice */}
            {newProfile.intervalType !== 'mileage' && (
              <div className="space-y-3 rounded-lg border border-border/50 p-3">
                <Label className="text-xs text-muted-foreground">Choose time unit</Label>
                <RadioGroup
                  value={newProfile.timeUnit}
                  onValueChange={(v) =>
                    setNewProfile({
                      ...newProfile,
                      timeUnit: v as "days" | "months",
                      intervalDays: v === "days" ? newProfile.intervalDays : "",
                      intervalMonths: v === "months" ? newProfile.intervalMonths : "",
                    })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="days" id="unit-days" />
                      <Label htmlFor="unit-days" className="cursor-pointer">By Day</Label>
                    </div>
                    <Input
                      type="number"
                      placeholder="e.g., 90"
                      value={newProfile.intervalDays}
                      disabled={newProfile.timeUnit !== "days"}
                      onChange={(e) => setNewProfile({ ...newProfile, intervalDays: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="months" id="unit-months" />
                      <Label htmlFor="unit-months" className="cursor-pointer">By Month</Label>
                    </div>
                    <Input
                      type="number"
                      placeholder="e.g., 3"
                      value={newProfile.intervalMonths}
                      disabled={newProfile.timeUnit !== "months"}
                      onChange={(e) => setNewProfile({ ...newProfile, intervalMonths: e.target.value })}
                    />
                  </div>
                </RadioGroup>
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
