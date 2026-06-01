import { useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
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
import { Textarea } from "@/components/shadcn/textarea";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Wrench,
  Plus,
  Search,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Truck,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Play,
  Mail,
  SlidersHorizontal,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMaintenanceRecords, MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { ExportButton } from "@/components/shadcn/export-button";
import { useFleetReminders } from "@/hooks/useFleetReminders";
import { ShortcutTooltip } from "@/components/shadcn/shortcut-tooltip";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";
import { useKeyboardShortcuts, SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-warning/20 text-warning",
  critical: "bg-destructive/20 text-destructive",
};

export function MaintenanceTab() {
  const tenantId = useAuthStore((s) => s.user?.tenantId) || 'f7f5af88-fd76-4439-aae3-0461be52f63f';
  const { records, isLoading, addRecord, updateRecord, deleteRecord, markComplete, startMaintenance, fetchRecords } = useMaintenanceRecords(tenantId);
  const { sendReminders, isSending } = useFleetReminders();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [costMin, setCostMin] = useState("");
  const [costMax, setCostMax] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftPriority, setDraftPriority] = useState("all");
  const [draftType, setDraftType] = useState("all");
  const [draftCostMin, setDraftCostMin] = useState("");
  const [draftCostMax, setDraftCostMax] = useState("");
  const [draftEnablePriority, setDraftEnablePriority] = useState(false);
  const [draftEnableType, setDraftEnableType] = useState(false);
  const [draftEnableCost, setDraftEnableCost] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSendRemindersDialogOpen, setIsSendRemindersDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState("30");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [newRecord, setNewRecord] = useState({
    vehicleReg: "",
    type: "preventive" as "preventive" | "corrective" | "inspection",
    category: "",
    description: "",
    scheduledDate: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    technician: "",
  });

  const handleRefresh = useCallback(() => {
    fetchRecords?.();
    toast.success("Data refreshed");
  }, [fetchRecords]);

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

  const getRecordStatus = (record: MaintenanceRecord): string => {
    if (record.status === 'completed') return 'completed';
    if (record.status === 'in_progress') return 'in_progress';
    const daysUntil = differenceInDays(new Date(record.scheduled_date), new Date());
    if (daysUntil < 0) return 'overdue';
    return 'scheduled';
  };

  const filteredRecords = records
    .map(r => ({ ...r, displayStatus: getRecordStatus(r) }))
    .filter((record) => {
      const matchesSearch =
        record.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.maintenance_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || record.displayStatus === statusFilter;
      const matchesPriority = priorityFilter === "all" || record.priority === priorityFilter;
      const matchesType = typeFilter === "all" || record.maintenance_type.toLowerCase().startsWith(typeFilter);
      const cost = Number(record.cost_ngn) || 0;
      const minNum = costMin === "" ? null : Number(costMin);
      const maxNum = costMax === "" ? null : Number(costMax);
      const matchesCost =
        (minNum === null || cost >= minNum) && (maxNum === null || cost <= maxNum);
      return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesCost;
    });

  const activeFilterCount =
    (priorityFilter !== "all" ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (costMin !== "" || costMax !== "" ? 1 : 0);

  const stats = {
    scheduled: records.filter((r) => getRecordStatus(r) === "scheduled").length,
    inProgress: records.filter((r) => r.status === "in_progress").length,
    overdue: records.filter((r) => getRecordStatus(r) === "overdue").length,
    completed: records.filter((r) => r.status === "completed").length,
    totalCost: records.reduce((sum, r) => sum + (Number(r.cost_ngn) || 0), 0),
  };

  const handleAddRecord = async () => {
    try {
      await addRecord({
        vehicle_id: `v-${Date.now()}`,
        vehicle_name: newRecord.vehicleReg,
        maintenance_type: `${newRecord.type} - ${newRecord.category}`,
        status: "scheduled",
        scheduled_date: new Date(newRecord.scheduledDate).toISOString(),
        priority: newRecord.priority,
        technician: newRecord.technician || null,
        notes: newRecord.description || null,
      });
      setIsAddDialogOpen(false);
      resetNewRecord();
    } catch (err) {}
  };

  const handleCompleteRecord = async (id: string) => {
    try {
      await markComplete(id);
    } catch (err) {}
  };

  const handleViewDetails = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  const handleEditRecord = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    const [type, category] = (record.maintenance_type || 'preventive - ').split(' - ');
    setNewRecord({
      vehicleReg: record.vehicle_name,
      type: (type as "preventive" | "corrective" | "inspection") || "preventive",
      category: category || "",
      description: record.notes || "",
      scheduledDate: format(new Date(record.scheduled_date), "yyyy-MM-dd"),
      priority: (record.priority as "low" | "medium" | "high" | "critical") || "medium",
      technician: record.technician || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRecord = async () => {
    if (selectedRecord) {
      try {
        await updateRecord(selectedRecord.id, {
          vehicle_name: newRecord.vehicleReg,
          maintenance_type: `${newRecord.type} - ${newRecord.category}`,
          scheduled_date: new Date(newRecord.scheduledDate).toISOString(),
          priority: newRecord.priority,
          technician: newRecord.technician || null,
          notes: newRecord.description || null,
        });
        setIsEditDialogOpen(false);
        setSelectedRecord(null);
        resetNewRecord();
      } catch (err) {}
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteRecord(id);
    } catch (err) {}
  };

  const handleStartMaintenance = async (id: string) => {
    try {
      await startMaintenance(id);
    } catch (err) {}
  };

  const handleSendReminders = async () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }
    try {
      await sendReminders('maintenance', recipientEmail, [Number(reminderDaysBefore)]);
      setIsSendRemindersDialogOpen(false);
      setRecipientEmail("");
    } catch (err) {}
  };

  const resetNewRecord = () => {
    setNewRecord({
      vehicleReg: "",
      type: "preventive",
      category: "",
      description: "",
      scheduledDate: "",
      priority: "medium",
      technician: "",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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
      {/* Primary CTAs - top right above KPIs */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => setIsSendRemindersDialogOpen(true)} disabled={isSending}>
          <Mail className="h-4 w-4 mr-2" />
          Send Reminders
        </Button>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
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
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
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
                <p className="text-2xl font-bold">₦{(stats.totalCost / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Total Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Records Table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Maintenance Records ({filteredRecords.length})
              </CardTitle>
              <CardDescription className="mt-1">Completed and scheduled maintenance jobs — costs, parts, and downtime by vehicle.</CardDescription>
            </div>
            <ExportButton
              filename="maintenance_records"
              rows={filteredRecords}
              columns={[
                { header: "Vehicle", accessor: "vehicle_name" },
                { header: "Type", accessor: "maintenance_type" },
                { header: "Status", accessor: "displayStatus" as any },
                { header: "Priority", accessor: "priority" },
                { header: "Scheduled", accessor: (r: any) => format(new Date(r.scheduled_date), "yyyy-MM-dd") },
                { header: "Cost (NGN)", accessor: (r: any) => Number(r.cost_ngn) || 0 },
                { header: "Technician", accessor: "technician" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search by vehicle, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[170px] bg-card/50 border-border/50">
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
                <Label className="text-sm font-semibold">Show Maintenance Records</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="mr-flt-priority"
                      checked={draftEnablePriority}
                      onCheckedChange={(c) => setDraftEnablePriority(c === true)}
                    />
                    <Label htmlFor="mr-flt-priority" className="text-xs cursor-pointer">Priority</Label>
                  </div>
                  <Select value={draftPriority} onValueChange={setDraftPriority} disabled={!draftEnablePriority}>
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
                      onCheckedChange={(c) => setDraftEnableType(c === true)}
                    />
                    <Label htmlFor="mr-flt-type" className="text-xs cursor-pointer">Maintenance Type</Label>
                  </div>
                  <Select value={draftType} onValueChange={setDraftType} disabled={!draftEnableType}>
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
                      onCheckedChange={(c) => setDraftEnableCost(c === true)}
                    />
                    <Label htmlFor="mr-flt-cost" className="text-xs cursor-pointer">Cost Range (₦)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="From"
                      value={draftCostMin}
                      onChange={(e) => setDraftCostMin(e.target.value)}
                      disabled={!draftEnableCost}
                      className="h-9"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="To"
                      value={draftCostMax}
                      onChange={(e) => setDraftCostMax(e.target.value)}
                      disabled={!draftEnableCost}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setPriorityFilter(draftEnablePriority ? draftPriority : "all");
                      setTypeFilter(draftEnableType ? draftType : "all");
                      setCostMin(draftEnableCost ? draftCostMin : "");
                      setCostMax(draftEnableCost ? draftCostMax : "");
                      setFilterOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setPriorityFilter("all");
                      setTypeFilter("all");
                      setCostMin("");
                      setCostMax("");
                      setDraftPriority("all");
                      setDraftType("all");
                      setDraftCostMin("");
                      setDraftCostMax("");
                      setDraftEnablePriority(false);
                      setDraftEnableType(false);
                      setDraftEnableCost(false);
                    }}
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No maintenance records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} className="border-border/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{record.vehicle_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{record.maintenance_type}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[record.displayStatus] || statusColors.scheduled}>
                        {record.displayStatus.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[record.priority] || priorityColors.medium}>
                        {record.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(record.scheduled_date), "MMM dd, yyyy")}
                        {record.displayStatus === "overdue" && (
                          <p className="text-xs text-destructive">
                            {Math.abs(differenceInDays(new Date(record.scheduled_date), new Date()))} days overdue
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.cost_ngn ? `₦${Number(record.cost_ngn).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {record.status === 'scheduled' && (
                            <DropdownMenuItem onClick={() => handleStartMaintenance(record.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </DropdownMenuItem>
                          )}
                          {record.status === 'in_progress' && (
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
                            onClick={() => handleDeleteRecord(record.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>Schedule a new maintenance task for a vehicle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Registration</Label>
                <Input
                  placeholder="e.g. LAG-234-XY"
                  value={newRecord.vehicleReg}
                  onChange={(e) => setNewRecord({ ...newRecord, vehicleReg: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={newRecord.scheduledDate}
                  onChange={(e) => setNewRecord({ ...newRecord, scheduledDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maintenance Type</Label>
                <Select value={newRecord.type} onValueChange={(v: any) => setNewRecord({ ...newRecord, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newRecord.priority} onValueChange={(v: any) => setNewRecord({ ...newRecord, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                onValueChange={(value) => setNewRecord({ ...newRecord, category: value })}
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
                placeholder="Assigned technician"
                value={newRecord.technician}
                onChange={(e) => setNewRecord({ ...newRecord, technician: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRecord} disabled={!newRecord.vehicleReg || !newRecord.scheduledDate}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Maintenance Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="font-mono">{selectedRecord.vehicle_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={statusColors[getRecordStatus(selectedRecord)]}>
                    {getRecordStatus(selectedRecord).replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p>{selectedRecord.maintenance_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <Badge className={priorityColors[selectedRecord.priority]}>{selectedRecord.priority}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                  <p>{format(new Date(selectedRecord.scheduled_date), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p>{selectedRecord.cost_ngn ? `₦${Number(selectedRecord.cost_ngn).toLocaleString()}` : "—"}</p>
                </div>
              </div>
              {selectedRecord.technician && (
                <div>
                  <p className="text-xs text-muted-foreground">Technician</p>
                  <p>{selectedRecord.technician}</p>
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Maintenance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Registration</Label>
                <Input
                  value={newRecord.vehicleReg}
                  onChange={(e) => setNewRecord({ ...newRecord, vehicleReg: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={newRecord.scheduledDate}
                  onChange={(e) => setNewRecord({ ...newRecord, scheduledDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maintenance Type</Label>
                <Select value={newRecord.type} onValueChange={(v: any) => setNewRecord({ ...newRecord, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newRecord.priority} onValueChange={(v: any) => setNewRecord({ ...newRecord, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                onValueChange={(value) => setNewRecord({ ...newRecord, category: value })}
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
                onChange={(e) => setNewRecord({ ...newRecord, technician: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRecord}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminders Dialog */}
      <Dialog open={isSendRemindersDialogOpen} onOpenChange={setIsSendRemindersDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Send Maintenance Reminders</DialogTitle>
            <DialogDescription>Send email reminders for upcoming and overdue maintenance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                placeholder="manager@company.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remind me before</Label>
              <Select value={reminderDaysBefore} onValueChange={setReminderDaysBefore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendRemindersDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendReminders} disabled={isSending}>
              {isSending ? "Sending..." : "Send Reminders"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
