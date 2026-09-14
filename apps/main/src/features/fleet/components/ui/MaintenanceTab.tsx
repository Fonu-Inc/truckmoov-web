import type { ColumnDef } from "@tanstack/react-table";
import type {
  MaintenanceRecord, MaintenanceRecordDisplayStatus, MaintenanceRecordPriority,
  MaintenanceReminderLeadDays,
} from "@truckmoov/api/fleet";
import {
  exportMaintenanceRecords,

  useCompleteMaintenanceRecord,
  useCreateMaintenanceRecord,
  useDeleteMaintenanceRecord,
  useDeleteMaintenanceReminderSchedule,
  useMaintenanceRecords,
  useMaintenanceRecordsSummary,
  useMaintenanceReminderSchedule,
  useSendMaintenanceReminders,
  useStartMaintenanceRecord,
  useUpdateMaintenanceRecord,
  useUpsertMaintenanceReminderSchedule,
  useVehicles,
  useVehiclesByTab,
} from "@truckmoov/api/fleet";
import {
  daysUntil, formatDate, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
  Wrench,
} from "lucide-react";
import {
  useCallback, useEffect, useMemo, useRef, useState,
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

import { Textarea } from "@/components/shadcn/textarea";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";
import { TabSummaryStrip } from "@/features/fleet/components/ui/TabSummaryStrip";

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
    isAddDialogOpen,
    setIsAddDialogOpen,
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
    isSendRemindersDialogOpen,
    setIsSendRemindersDialogOpen,
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
    recipientEmail,
    setRecipientEmail,
  ] = useState("");
  const [
    reminderDaysBefore,
    setReminderDaysBefore,
  ] = useState("30");
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const [
    newRecord,
    setNewRecord,
  ] = useState<MaintenanceFormState>(() => buildDefaultRecord());
  const searchInputRef = useRef<HTMLInputElement>(null);

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
  // ponytail: page-shell tabbed summary — rendered via TabSummaryStrip; filtering
  // stays on useMaintenanceRecords above.
  const tabSummaryQuery = useVehiclesByTab('maintenance');
  const createRecordMutation = useCreateMaintenanceRecord();
  const updateRecordMutation = useUpdateMaintenanceRecord();
  const deleteRecordMutation = useDeleteMaintenanceRecord();
  const startRecordMutation = useStartMaintenanceRecord();
  const completeRecordMutation = useCompleteMaintenanceRecord();
  const sendRemindersMutation = useSendMaintenanceReminders();
  const scheduleQuery = useMaintenanceReminderSchedule();
  const upsertScheduleMutation = useUpsertMaintenanceReminderSchedule();
  const deleteScheduleMutation = useDeleteMaintenanceReminderSchedule();
  const schedule = scheduleQuery.data?.data?.schedule ?? null;
  const leadDayOptions = scheduleQuery.data?.data?.leadDayOptions ?? [
    7,
    14,
    30,
    60,
    90,
  ] as MaintenanceReminderLeadDays[];

  const vehicles = useMemo(
    () => vehiclesQuery.data?.data ?? [],
    [vehiclesQuery.data?.data],
  );
  const getVehicleOptionValue = useCallback(
    (vehicle: (typeof vehicles)[number]) => {
      return vehicle.id;
    },
    [],
  );

  const getVehicleLabel = useCallback(
    (vehicleReference: string) => {
      const vehicle = vehicles.find(
        item =>
          item.id === vehicleReference
          || item.registrationNumber === vehicleReference
          || item.plateNumber === vehicleReference,
      );
      if (!vehicle)
        return vehicleReference;
      return vehicle.registrationNumber || vehicle.plateNumber || `${vehicle.make ?? ""} ${vehicle.model}`.trim() || vehicle.id;
    },
    [vehicles],
  );

  const getVehicleMake = useCallback(
    (vehicleReference: string) => {
      const v = vehicles.find(
        item =>
          item.id === vehicleReference
          || item.registrationNumber === vehicleReference
          || item.plateNumber === vehicleReference,
      );
      return v?.make || "-";
    },
    [vehicles],
  );

  const getVehicleModel = useCallback(
    (vehicleReference: string) => {
      const v = vehicles.find(
        item =>
          item.id === vehicleReference
          || item.registrationNumber === vehicleReference
          || item.plateNumber === vehicleReference,
      );
      return v?.model || "-";
    },
    [vehicles],
  );

  const getVehicleRegistrationForRecord = useCallback(
    (vehicleReference: string) => {
      const vehicle = vehicles.find(
        item =>
          item.id === vehicleReference
          || item.registrationNumber === vehicleReference
          || item.plateNumber === vehicleReference,
      );
      return vehicle ? getVehicleOptionValue(vehicle) : vehicleReference;
    },
    [
      getVehicleOptionValue,
      vehicles,
    ],
  );

  const selectedVehicleExists = Boolean(
    newRecord.vehicleId
    && vehicles.some(vehicle => getVehicleOptionValue(vehicle) === newRecord.vehicleId),
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
      totalCost: records.reduce(
        (sum, record) => sum + (Number(record.cost) || 0),
        0,
      ),
    }),
    [
      getRecordStatus,
      records,
    ],
  );

  const summary = summaryQuery.data?.data;
  const stats = {
    total: records.length,
    scheduled: summary?.scheduled ?? localStats.scheduled,
    inProgress: summary?.inProgress ?? localStats.inProgress,
    overdue: summary?.overdue ?? localStats.overdue,
    completed: summary?.completed ?? localStats.completed,
    totalCost: summary?.totalCost ?? localStats.totalCost,
  };

  const isLoading = recordsQuery.isPending;
  const isSending = sendRemindersMutation.isPending;
  const hasActiveMaintenanceFilters
    = !!debouncedSearch
      || statusFilter !== "all"
      || priorityFilter !== "all"
      || typeFilter !== "all"
      || !!costMin
      || !!costMax;

  const maintenanceColumns: ColumnDef<MaintenanceRecordWithDisplay>[] = [
    {
      id: "registration",
      header: "Registration No.",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{getVehicleLabel(row.original.vehicleId)}</span>
        </div>
      ),
    },
    {
      id: "make",
      header: "Make",
      cell: ({ row }) => getVehicleMake(row.original.vehicleId),
    },
    {
      id: "model",
      header: "Model",
      cell: ({ row }) => getVehicleModel(row.original.vehicleId),
    },
    {
      id: "category",
      header: "Service Category",
      meta: { className: "text-muted-foreground" },
      cell: ({ row }) => row.original.description || "-",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.displayStatus] || statusColors.scheduled}>
          {row.original.displayStatus.replace(
            "_",
            " ",
          )}
        </Badge>
      ),
    },
    {
      id: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge className={priorityColors[row.original.priority] || priorityColors.medium}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      id: "scheduled",
      header: "Scheduled Time",
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="text-sm">
            {formatDate(
              record.scheduledDate,
              "Not scheduled",
            )}
            {record.displayStatus === "overdue" && record.scheduledDate
              ? (
                  <p className="text-xs text-destructive">
                    {Math.abs(daysUntil(record.scheduledDate) ?? 0)}
                    {" "}
                    days overdue
                  </p>
                )
              : null}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[60px]" },
      cell: ({ row }) => {
        const record = row.original;
        return (
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
        );
      },
    },
  ];

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
      action: () => setIsAddDialogOpen(true),
      description: "New maintenance record",
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

  const handleAddRecord = async () => {
    try {
      await createRecordMutation.mutateAsync({ data: buildRecordPayload() });
      toast.success("Maintenance record scheduled");
      setIsAddDialogOpen(false);
      resetNewRecord();
    }
    catch (error) {
      toast.error(error.message || "Failed to schedule maintenance");
    }
  };

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
      vehicleId: getVehicleRegistrationForRecord(record.vehicleId),
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
      const data = await exportMaintenanceRecords();
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

  useEffect(
    () => {
      if (isSendRemindersDialogOpen && schedule) {
        setRecipientEmail(schedule.recipientEmail);
        setReminderDaysBefore(String(schedule.leadDays));
      }
    },
    [
      isSendRemindersDialogOpen,
      schedule,
    ],
  );

  const handleSaveSchedule = async () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }
    const leadDays = Number(reminderDaysBefore) as MaintenanceReminderLeadDays;
    try {
      await upsertScheduleMutation.mutateAsync({
        data: {
          recipientEmail, leadDays, enabled: true,
        },
      });
      toast.success("Reminder schedule saved");
    }
    catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message ?? "Failed to save schedule");
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      await deleteScheduleMutation.mutateAsync();
      toast.success("Reminder schedule removed");
      setRecipientEmail("");
    }
    catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message ?? "Failed to remove schedule");
    }
  };

  const handleSendReminders = async () => {
    try {
      const res = await sendRemindersMutation.mutateAsync();
      const due = res.data?.dueInWindow;
      toast.success(due !== undefined ? `Sent — ${due} vehicles due in the next ${schedule?.leadDays ?? reminderDaysBefore} days` : "Maintenance reminders queued");
    }
    catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message ?? "Failed to send reminders");
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
          value={getVehicleOptionValue(vehicle)}
        >
          {getVehicleLabel(vehicle.id)}
        </SelectItem>
      ))}
    </>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
          {[...Array.from({ length: 5 })].map((_, i) => (
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
      <TabSummaryStrip query={tabSummaryQuery} />
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setIsSendRemindersDialogOpen(true)}
          loading={isSending}
        >
          <Mail className="h-4 w-4 mr-2" />
          Send Reminders
        </Button>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Maintenance Records</p>
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
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20 shrink-0">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
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
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20 shrink-0">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
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
                Maintenance Records (
                {filteredRecords.length}
                )
              </CardTitle>
              <CardDescription className="mt-1">
                Completed and scheduled maintenance jobs - costs, parts, and downtime by vehicle.
              </CardDescription>
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
                ref={searchInputRef}
                placeholder="Search by vehicle, category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-card/50 border-border/50"
              />
              {recordsQuery.isFetching && !recordsQuery.isPending && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[160px] bg-card/50 border-border/50">
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
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <DataTable
            columns={maintenanceColumns}
            data={filteredRecords}
            isLoading={isLoading}
            hasActiveFilters={hasActiveMaintenanceFilters}
            emptyState="No maintenance records yet."
            filteredEmptyState="No maintenance records match your filters."
          />
        </CardContent>
      </Card>

      <Dialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>Schedule a new maintenance task for a vehicle.</DialogDescription>
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
                    <SelectValue placeholder={vehiclesQuery.isPending ? "Loading vehicles..." : "Select vehicle"} />
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
                placeholder="Additional notes..."
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
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRecord}
              loading={createRecordMutation.isPending}
              disabled={!newRecord.vehicleId || !newRecord.scheduledDate}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog
        open={isSendRemindersDialogOpen}
        onOpenChange={setIsSendRemindersDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Maintenance Reminders</DialogTitle>
            <DialogDescription>
              {schedule
                ? "Update the recurring schedule, or send it now."
                : "Save a schedule to have reminders sent automatically."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                placeholder="manager@company.com"
                value={recipientEmail}
                onChange={event => setRecipientEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Lead days</Label>
              <Select
                value={reminderDaysBefore}
                onValueChange={setReminderDaysBefore}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leadDayOptions.map(d => (
                    <SelectItem
                      key={d}
                      value={String(d)}
                    >
                      {d}
                      {" "}
                      days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {schedule && (
              <div className="rounded-md border border-border bg-secondary/30 p-3 text-xs text-muted-foreground space-y-0.5">
                <p>
                  Last run:
                  {" "}
                  {schedule.lastRunAt ? formatDate(schedule.lastRunAt) : "never"}
                </p>
                <p>
                  {schedule.lastRunAt && schedule.lastSentCount === 0
                    ? "0 reminders sent — no vehicles were due at last run"
                    : `${schedule.lastSentCount ?? 0} reminder${(schedule.lastSentCount ?? 0) !== 1 ? "s" : ""} sent`}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div>
              {schedule && (
                <Button
                  variant="ghost"
                  onClick={handleDeleteSchedule}
                  loading={deleteScheduleMutation.isPending}
                >
                  Delete schedule
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveSchedule}
                loading={upsertScheduleMutation.isPending}
              >
                Save schedule
              </Button>
              <Button
                onClick={handleSendReminders}
                loading={isSending}
                disabled={!schedule}
              >
                Send now
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
