import type {
  MaintenanceRecord, MaintenanceRecordDisplayStatus, MaintenanceRecordPriority,
} from "@truckmoov/api/fleet";
import {
  exportMaintenanceRecords,
  useCompleteMaintenanceRecord,
  useDeleteMaintenanceRecord,
  useMaintenanceRecords,
  useMaintenanceRecordsSummary,
  useStartMaintenanceRecord,
  useUpdateMaintenanceRecord,
  useVehicles,
} from "@truckmoov/api/fleet";
import {
  daysUntil, formatDate, formatWithPattern, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  useCallback, useEffect, useMemo, useState,
} from "react";

import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { Textarea } from "@/components/shadcn/textarea";
import { MaintenanceProfileFormDialog } from "@/features/fleet/components/ui/MaintenanceProfileFormDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/layout/PageHeader";

type MaintenanceFormState = {
  vehicleId: string;
  type: "preventive" | "corrective" | "inspection";
  category: string;
  notes: string;
  scheduledDate: string;
  priority: MaintenanceRecordPriority;
  technician: string;
};

type MaintenanceRecordWithDisplay = MaintenanceRecord & { displayStatus: MaintenanceRecordDisplayStatus };

// Design app's tile / card / badge classes, copied verbatim.
const SURFACE_CARD_CLASS = "rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50";
const PRIORITY_BADGE_CLASS = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow-sm hover:bg-primary/90 capitalize";
const STATUS_BADGE_CLASS = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm hover:bg-primary/90 capitalize whitespace-nowrap";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-warning/20 text-warning",
  critical: "bg-destructive/20 text-destructive",
};

const maintenanceTypes = [
  "preventive",
  "corrective",
  "inspection",
] as const;

function buildDefaultRecord(): MaintenanceFormState {
  return {
    vehicleId: "",
    type: "preventive",
    category: "",
    notes: "",
    scheduledDate: "",
    priority: "medium",
    technician: "",
  };
}

function normalizeMaintenanceType(value: string | null | undefined): MaintenanceFormState["type"] {
  const normalized = String(value ?? "").toLowerCase();
  return maintenanceTypes.includes(normalized as MaintenanceFormState["type"])
    ? (normalized as MaintenanceFormState["type"])
    : "preventive";
}

function formatCurrency(cost: number | null, currency: string | null | undefined) {
  if (cost === null || cost === undefined)
    return "-";
  return `${currency || "NGN"} ${Number(cost).toLocaleString()}`;
}

/** The design app's table date, e.g. "Nov 08, 2026". */
function formatMaintenanceDate(value: string | null | undefined) {
  return formatWithPattern(
    value,
    "MMM dd, yyyy",
  );
}

/** The design app's "Date Created" stamp, e.g. "24 Nov 2026, 01:05". */
function formatMaintenanceCreatedAt(value: string | null | undefined) {
  return formatWithPattern(
    value,
    "d MMM yyyy, HH:mm",
  );
}

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

/** `/fleet/maintenance` — the design app's Maintenance tab. */
export function MaintenanceTab() {
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
  ] = useState("all");
  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState("all");
  const [
    typeFilter,
    setTypeFilter,
  ] = useState("all");
  const [
    costMin,
    setCostMin,
  ] = useState("");
  const [
    costMax,
    setCostMax,
  ] = useState("");
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);
  const [
    draftPriority,
    setDraftPriority,
  ] = useState("all");
  const [
    draftType,
    setDraftType,
  ] = useState("all");
  const [
    draftCostMin,
    setDraftCostMin,
  ] = useState("");
  const [
    draftCostMax,
    setDraftCostMax,
  ] = useState("");
  const [
    draftEnablePriority,
    setDraftEnablePriority,
  ] = useState(false);
  const [
    draftEnableType,
    setDraftEnableType,
  ] = useState(false);
  const [
    draftEnableCost,
    setDraftEnableCost,
  ] = useState(false);
  const [
    draftStatus,
    setDraftStatus,
  ] = useState("all");
  const [
    draftEnableStatus,
    setDraftEnableStatus,
  ] = useState(false);
  const [
    isProfileDialogOpen,
    setIsProfileDialogOpen,
  ] = useState(false);
  const [
    isViewDialogOpen,
    setIsViewDialogOpen,
  ] = useState(false);
  const [
    isEditDialogOpen,
    setIsEditDialogOpen,
  ] = useState(false);
  const [
    selectedRecord,
    setSelectedRecord,
  ] = useState<MaintenanceRecordWithDisplay | null>(null);
  const [
    recordPendingDelete,
    setRecordPendingDelete,
  ] = useState<MaintenanceRecordWithDisplay | null>(null);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const [
    newRecord,
    setNewRecord,
  ] = useState<MaintenanceFormState>(() => buildDefaultRecord());

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

  const recordsQueryParams = useMemo(
    () => ({
      params: {
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? (statusFilter as MaintenanceRecordDisplayStatus) : undefined,
        priority: priorityFilter !== "all" ? (priorityFilter as MaintenanceRecordPriority) : undefined,
        maintenanceType: typeFilter !== "all" ? typeFilter : undefined,
      },
    }),
    [
      debouncedSearch,
      priorityFilter,
      statusFilter,
      typeFilter,
    ],
  );

  const recordsQuery = useMaintenanceRecords(recordsQueryParams);
  const summaryQuery = useMaintenanceRecordsSummary();
  const vehiclesQuery = useVehicles();
  const updateRecordMutation = useUpdateMaintenanceRecord();
  const deleteRecordMutation = useDeleteMaintenanceRecord();
  const startRecordMutation = useStartMaintenanceRecord();
  const completeRecordMutation = useCompleteMaintenanceRecord();

  const vehicles = useMemo(
    () => vehiclesQuery.data?.data ?? [],
    [vehiclesQuery.data?.data],
  );

  const findVehicle = useCallback(
    (vehicleReference: string) => vehicles.find(
      item =>
        item.id === vehicleReference
        || item.registrationNumber === vehicleReference
        || item.plateNumber === vehicleReference,
    ),
    [vehicles],
  );

  const getVehicleLabel = useCallback(
    (vehicleReference: string) => {
      const vehicle = findVehicle(vehicleReference);
      if (!vehicle)
        return vehicleReference;
      return vehicle.registrationNumber || vehicle.plateNumber || `${vehicle.make ?? ""} ${vehicle.model}`.trim() || vehicle.id;
    },
    [findVehicle],
  );

  const getVehicleName = useCallback(
    (vehicleReference: string) => {
      const vehicle = findVehicle(vehicleReference);
      return [
        vehicle?.make,
        vehicle?.model,
      ].filter(Boolean).join(" ") || "-";
    },
    [findVehicle],
  );

  const getVehicleRegistration = useCallback(
    (record: MaintenanceRecord) => {
      const vehicle = findVehicle(record.vehicleId);
      return record.vehicleRegistrationNumber || vehicle?.registrationNumber || vehicle?.plateNumber || "-";
    },
    [findVehicle],
  );

  const selectedVehicleExists = Boolean(
    newRecord.vehicleId
    && vehicles.some(vehicle => vehicle.id === newRecord.vehicleId),
  );
  const records = useMemo(
    () => recordsQuery.data?.data ?? [],
    [recordsQuery.data?.data],
  );

  const getRecordStatus = useCallback(
    (record: MaintenanceRecord): MaintenanceRecordDisplayStatus => {
      if (record.status === "completed" || record.status === "in_progress" || record.status === "cancelled") {
        return record.status;
      }

      const daysLeft = daysUntil(record.scheduledDate);
      if (daysLeft !== null && daysLeft < 0) {
        return "overdue";
      }

      return "scheduled";
    },
    [],
  );

  const filteredRecords = useMemo<MaintenanceRecordWithDisplay[]>(
    () => {
      return records
        .map(record => ({
          ...record, displayStatus: getRecordStatus(record),
        }))
        .filter((record) => {
          const cost = Number(record.cost) || 0;
          const minNum = costMin === "" ? null : Number(costMin);
          const maxNum = costMax === "" ? null : Number(costMax);
          return (minNum === null || cost >= minNum) && (maxNum === null || cost <= maxNum);
        });
    },
    [
      costMax,
      costMin,
      getRecordStatus,
      records,
    ],
  );

  const activeFilterCount
    = (statusFilter !== "all" ? 1 : 0)
      + (priorityFilter !== "all" ? 1 : 0)
      + (typeFilter !== "all" ? 1 : 0)
      + (costMin !== "" || costMax !== "" ? 1 : 0);

  const localStats = useMemo(
    () => ({
      scheduled: records.filter(record => getRecordStatus(record) === "scheduled").length,
      inProgress: records.filter(record => record.status === "in_progress").length,
      overdue: records.filter(record => getRecordStatus(record) === "overdue").length,
      completed: records.filter(record => record.status === "completed").length,
    }),
    [
      getRecordStatus,
      records,
    ],
  );

  const summary = summaryQuery.data?.data;
  const stats = {
    total: summary?.total ?? records.length,
    scheduled: summary?.scheduled ?? localStats.scheduled,
    inProgress: summary?.inProgress ?? localStats.inProgress,
    overdue: summary?.overdue ?? localStats.overdue,
    completed: summary?.completed ?? localStats.completed,
  };

  const isLoading = recordsQuery.isPending;
  const hasActiveMaintenanceFilters
    = !!debouncedSearch
      || statusFilter !== "all"
      || priorityFilter !== "all"
      || typeFilter !== "all"
      || !!costMin
      || !!costMax;

  const resetNewRecord = () => {
    setNewRecord(buildDefaultRecord());
  };

  const handleRefresh = useCallback(
    () => {
      recordsQuery.refetch();
      summaryQuery.refetch();
      vehiclesQuery.refetch();
      toast.success("Data refreshed");
    },
    [
      recordsQuery,
      summaryQuery,
      vehiclesQuery,
    ],
  );

  useKeyboardShortcuts([
    {
      key: "r",
      ctrl: true,
      shift: true,
      action: handleRefresh,
      description: "Refresh data",
    },
    {
      key: "n",
      ctrl: true,
      action: () => setIsProfileDialogOpen(true),
      description: "New maintenance profile",
    },
  ]);

  const buildRecordPayload = () => ({
    vehicleId: newRecord.vehicleId,
    maintenanceType: newRecord.type,
    description: newRecord.category || null,
    status: "scheduled" as const,
    priority: newRecord.priority,
    scheduledDate: newRecord.scheduledDate || null,
    completedDate: null,
    cost: null,
    currency: "NGN",
    technician: newRecord.technician || null,
    notes: newRecord.notes || null,
  });

  const handleCompleteRecord = async (id: string) => {
    try {
      await completeRecordMutation.mutateAsync({ id });
      toast.success("Maintenance record completed");
    }
    catch (error) {
      toast.error(error.message || "Failed to complete maintenance");
    }
  };

  const handleViewDetails = (record: MaintenanceRecordWithDisplay) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  const handleEditRecord = (record: MaintenanceRecordWithDisplay) => {
    setSelectedRecord(record);
    setNewRecord({
      vehicleId: findVehicle(record.vehicleId)?.id ?? record.vehicleId,
      type: normalizeMaintenanceType(record.maintenanceType),
      category: record.description || "",
      notes: record.notes || "",
      scheduledDate: toDateParam(record.scheduledDate),
      priority: record.priority || "medium",
      technician: record.technician || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRecord = async () => {
    if (!selectedRecord)
      return;

    try {
      await updateRecordMutation.mutateAsync({
        id: selectedRecord.id,
        data: buildRecordPayload(),
      });
      toast.success("Maintenance record updated");
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      resetNewRecord();
    }
    catch (error) {
      toast.error(error.message || "Failed to update maintenance");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteRecordMutation.mutateAsync({ id });
      toast.success("Maintenance record deleted");
      setRecordPendingDelete(null);
    }
    catch (error) {
      toast.error(error.message || "Failed to delete maintenance");
    }
  };

  const handleStartMaintenance = async (id: string) => {
    try {
      await startRecordMutation.mutateAsync({ id });
      toast.success("Maintenance record started");
    }
    catch (error) {
      toast.error(error.message || "Failed to start maintenance");
    }
  };

  const handleExportRecords = async () => {
    setIsExporting(true);
    try {
      const data = await exportMaintenanceRecords(recordsQueryParams);
      downloadBlob(
        data,
        "maintenance_records.csv",
      );
      toast.success("Maintenance export downloaded");
    }
    catch (error) {
      toast.error(error.message || "Maintenance export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  const vehicleSelectItems = (
    <>
      {!selectedVehicleExists && newRecord.vehicleId
        ? (
            <SelectItem value={newRecord.vehicleId}>{newRecord.vehicleId}</SelectItem>
          )
        : null}
      {vehicles.map(vehicle => (
        <SelectItem
          key={vehicle.id}
          value={vehicle.id}
        >
          {getVehicleLabel(vehicle.id)}
        </SelectItem>
      ))}
    </>
  );

  const kpiTiles = [
    {
      label: "Total Maintenance Records",
      value: stats.total,
      icon: Wrench,
      chip: "bg-muted",
      tint: "text-muted-foreground",
    },
    {
      label: "Scheduled",
      value: stats.scheduled,
      icon: Calendar,
      chip: "bg-primary/20",
      tint: "text-primary",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      chip: "bg-warning/20",
      tint: "text-warning",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      chip: "bg-destructive/20",
      tint: "text-destructive",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      chip: "bg-success/20",
      tint: "text-success",
    },
  ];

  const tableHeaders = [
    "Vehicle",
    "Service Category",
    "Maintenance Type",
    "Priority",
    "Status",
    "Notes",
    "Scheduled Date",
    "Date Completed",
  ];

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Vehicle servicing, scheduled work, and maintenance progress."
        actions={(
          <Button onClick={() => setIsProfileDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance Profile
          </Button>
        )}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {kpiTiles.map(tile => (
            <div
              key={tile.label}
              className={SURFACE_CARD_CLASS}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    tile.chip,
                  )}
                  >
                    <tile.icon className={cn(
                      "h-5 w-5",
                      tile.tint,
                    )}
                    />
                  </div>
                  <div>
                    {summaryQuery.isPending && isLoading
                      ? <Skeleton className="h-8 w-12" />
                      : <p className="text-2xl font-bold">{tile.value}</p>}
                    <p className="text-xs text-muted-foreground">{tile.label}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={SURFACE_CARD_CLASS}>
          <div className="flex flex-col p-6 pb-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  {`Maintenance Records (${filteredRecords.length})`}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">An overview of which vehicles need maintenance, when it is scheduled and how urgent it is.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                loading={isExporting}
                onClick={handleExportRecords}
                className="bg-transparent border-input"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle, category..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="h-10 rounded-xl px-3.5 w-full sm:w-[170px] bg-card/50 border-border/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Popover
                open={filterOpen}
                onOpenChange={(open) => {
                  if (open) {
                    setDraftStatus(statusFilter);
                    setDraftEnableStatus(statusFilter !== "all");
                    setDraftPriority(priorityFilter);
                    setDraftType(typeFilter);
                    setDraftCostMin(costMin);
                    setDraftCostMax(costMax);
                    setDraftEnablePriority(priorityFilter !== "all");
                    setDraftEnableType(typeFilter !== "all");
                    setDraftEnableCost(Boolean(costMin || costMax));
                  }
                  setFilterOpen(open);
                }}
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
                  className="w-80 space-y-4 max-h-[70vh] overflow-y-auto"
                >
                  <Label className="text-sm font-semibold">Show Maintenance Records</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="mr-flt-status"
                        checked={draftEnableStatus}
                        onCheckedChange={checked => setDraftEnableStatus(checked === true)}
                      />
                      <Label
                        htmlFor="mr-flt-status"
                        className="text-xs cursor-pointer"
                      >
                        Status
                      </Label>
                    </div>
                    <Select
                      value={draftStatus}
                      onValueChange={setDraftStatus}
                      disabled={!draftEnableStatus}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="mr-flt-priority"
                        checked={draftEnablePriority}
                        onCheckedChange={checked => setDraftEnablePriority(checked === true)}
                      />
                      <Label
                        htmlFor="mr-flt-priority"
                        className="text-xs cursor-pointer"
                      >
                        Priority
                      </Label>
                    </div>
                    <Select
                      value={draftPriority}
                      onValueChange={setDraftPriority}
                      disabled={!draftEnablePriority}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="mr-flt-type"
                        checked={draftEnableType}
                        onCheckedChange={checked => setDraftEnableType(checked === true)}
                      />
                      <Label
                        htmlFor="mr-flt-type"
                        className="text-xs cursor-pointer"
                      >
                        Maintenance Type
                      </Label>
                    </div>
                    <Select
                      value={draftType}
                      onValueChange={setDraftType}
                      disabled={!draftEnableType}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="preventive">Preventive</SelectItem>
                        <SelectItem value="corrective">Corrective</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="mr-flt-cost"
                        checked={draftEnableCost}
                        onCheckedChange={checked => setDraftEnableCost(checked === true)}
                      />
                      <Label
                        htmlFor="mr-flt-cost"
                        className="text-xs cursor-pointer"
                      >
                        Cost Range
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="From"
                        value={draftCostMin}
                        onChange={event => setDraftCostMin(event.target.value)}
                        disabled={!draftEnableCost}
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="To"
                        value={draftCostMax}
                        onChange={event => setDraftCostMax(event.target.value)}
                        disabled={!draftEnableCost}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStatusFilter("all");
                        setPriorityFilter("all");
                        setTypeFilter("all");
                        setCostMin("");
                        setCostMax("");
                        setDraftStatus("all");
                        setDraftEnableStatus(false);
                        setDraftPriority("all");
                        setDraftType("all");
                        setDraftCostMin("");
                        setDraftCostMax("");
                        setDraftEnablePriority(false);
                        setDraftEnableType(false);
                        setDraftEnableCost(false);
                        setFilterOpen(false);
                      }}
                    >
                      Show All
                    </Button>
                    <Button
                      onClick={() => {
                        setStatusFilter(draftEnableStatus ? draftStatus : "all");
                        setPriorityFilter(draftEnablePriority ? draftPriority : "all");
                        setTypeFilter(draftEnableType ? draftType : "all");
                        setCostMin(draftEnableCost ? draftCostMin : "");
                        setCostMax(draftEnableCost ? draftCostMax : "");
                        setFilterOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="p-6 pt-0">
            <Table className="min-w-[1250px]">
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  {tableHeaders.map(header => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                  <TableHead className="whitespace-nowrap">Date Created</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow
                        key={`skeleton-${i}`}
                        className="border-border/50"
                      >
                        {Array.from({ length: 10 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : filteredRecords.length === 0
                    ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={10}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {hasActiveMaintenanceFilters ? "No maintenance records match your filters." : "No maintenance records yet."}
                          </TableCell>
                        </TableRow>
                      )
                    : filteredRecords.map(record => (
                        <TableRow
                          key={record.id}
                          className="hover:bg-muted/50 border-border/50"
                        >
                          <TableCell className="min-w-[180px]">
                            <p className="font-medium whitespace-nowrap">{getVehicleName(record.vehicleId)}</p>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">{getVehicleRegistration(record)}</p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{record.description || "-"}</TableCell>
                          <TableCell className="capitalize">{record.maintenanceType || "-"}</TableCell>
                          <TableCell>
                            <div className={cn(
                              PRIORITY_BADGE_CLASS,
                              priorityColors[record.priority] || priorityColors.medium,
                            )}
                            >
                              {record.priority}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={cn(
                              STATUS_BADGE_CLASS,
                              statusColors[record.displayStatus] || statusColors.scheduled,
                            )}
                            >
                              {record.displayStatus.replace(
                                "_",
                                " ",
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[200px] max-w-[280px] whitespace-normal break-words">{record.notes || "-"}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatMaintenanceDate(record.scheduledDate)}
                              {record.displayStatus === "overdue" && record.scheduledDate
                                ? (
                                    <p className="text-xs text-destructive">
                                      {`${Math.abs(daysUntil(record.scheduledDate) ?? 0)} days overdue`}
                                    </p>
                                  )
                                : null}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{formatMaintenanceDate(record.completedDate)}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{formatMaintenanceCreatedAt(record.createdAt)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-popover border-border"
                              >
                                <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {record.status === "scheduled" && (
                                  <DropdownMenuItem onClick={() => handleStartMaintenance(record.id)}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Start
                                  </DropdownMenuItem>
                                )}
                                {record.status === "in_progress" && (
                                  <DropdownMenuItem onClick={() => handleCompleteRecord(record.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Complete
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setRecordPendingDelete(record)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <MaintenanceProfileFormDialog
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
        />

        <Dialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        >
          <DialogContent className="bg-card border-border max-w-xl p-7">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-xl">Maintenance Details</DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="grid grid-cols-1 gap-x-12 gap-y-6 pt-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="text-base font-semibold leading-tight">{getVehicleLabel(selectedRecord.vehicleId)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={cn(
                    "capitalize",
                    statusColors[selectedRecord.displayStatus] || statusColors.scheduled,
                  )}
                  >
                    {selectedRecord.displayStatus.replace(
                      "_",
                      " ",
                    )}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-base font-semibold leading-tight capitalize">{selectedRecord.maintenanceType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge className={cn(
                    "capitalize",
                    priorityColors[selectedRecord.priority] || priorityColors.medium,
                  )}
                  >
                    {selectedRecord.priority}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-base font-semibold leading-tight">
                    {formatDate(
                      selectedRecord.scheduledDate,
                      "Not scheduled",
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cost</p>
                  <p className="text-base font-semibold leading-tight">
                    {formatCurrency(
                      selectedRecord.cost,
                      selectedRecord.currency,
                    )}
                  </p>
                </div>
                {selectedRecord.technician
                  ? (
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-sm text-muted-foreground">Technician</p>
                        <p className="text-base font-semibold leading-tight">{selectedRecord.technician}</p>
                      </div>
                    )
                  : null}
                {selectedRecord.notes || selectedRecord.description
                  ? (
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-base font-semibold leading-tight">
                          {selectedRecord.notes || selectedRecord.description}
                        </p>
                      </div>
                    )
                  : null}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!recordPendingDelete}
          onOpenChange={(open) => {
            if (!open && !deleteRecordMutation.isPending) {
              setRecordPendingDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete maintenance record?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove the maintenance record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteRecordMutation.isPending}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                loading={deleteRecordMutation.isPending}
                disabled={deleteRecordMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (recordPendingDelete) {
                    void handleDeleteRecord(recordPendingDelete.id);
                  }
                }}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        >
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Maintenance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Registration</Label>
                  <Select
                    value={newRecord.vehicleId}
                    onValueChange={value => setNewRecord({
                      ...newRecord, vehicleId: value,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>{vehicleSelectItems}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scheduled Date</Label>
                  <Input
                    type="date"
                    value={newRecord.scheduledDate}
                    onChange={event => setNewRecord({
                      ...newRecord, scheduledDate: event.target.value,
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Maintenance Type</Label>
                  <Select
                    value={newRecord.type}
                    onValueChange={(value: MaintenanceFormState["type"]) => setNewRecord({
                      ...newRecord, type: value,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="corrective">Corrective</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newRecord.priority}
                    onValueChange={(value: MaintenanceRecordPriority) => setNewRecord({
                      ...newRecord, priority: value,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Service Category</Label>
                <Select
                  value={newRecord.category}
                  onValueChange={value => setNewRecord({
                    ...newRecord, category: value,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oil Change">Oil Change</SelectItem>
                    <SelectItem value="Tire Rotation">Tire Rotation</SelectItem>
                    <SelectItem value="Brake Service">Brake Service</SelectItem>
                    <SelectItem value="Engine Tune-Up">Engine Tune-Up</SelectItem>
                    <SelectItem value="Transmission Service">Transmission Service</SelectItem>
                    <SelectItem value="Battery Replacement">Battery Replacement</SelectItem>
                    <SelectItem value="Air Filter Replacement">Air Filter Replacement</SelectItem>
                    <SelectItem value="Coolant Flush">Coolant Flush</SelectItem>
                    <SelectItem value="Suspension Repair">Suspension Repair</SelectItem>
                    <SelectItem value="Electrical Diagnostics">Electrical Diagnostics</SelectItem>
                    <SelectItem value="General Inspection">General Inspection</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Technician</Label>
                <Input
                  value={newRecord.technician}
                  onChange={event => setNewRecord({
                    ...newRecord, technician: event.target.value,
                  })}
                  placeholder="Enter technician's name"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newRecord.notes}
                  onChange={event => setNewRecord({
                    ...newRecord, notes: event.target.value,
                  })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRecord}
                loading={updateRecordMutation.isPending}
                disabled={!newRecord.vehicleId || !newRecord.scheduledDate}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
