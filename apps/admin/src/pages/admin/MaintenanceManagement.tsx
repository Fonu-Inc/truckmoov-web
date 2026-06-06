import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
  RefreshCw,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  vehicle_name: string;
  maintenance_type: string;
  status: string;
  scheduled_date: string;
  completed_date?: string | null;
  priority: string;
  technician?: string | null;
  notes?: string | null;
  cost_ngn?: number | null;
};
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

export default function MaintenanceManagement() {
  const records: MaintenanceRecord[] = [];
  const isLoading = false;
  const addRecord = async (_data: Omit<MaintenanceRecord, "id">) => {};
  const updateRecord = async (_id: string, _data: Partial<MaintenanceRecord>) => {};
  const deleteRecord = async (_id: string) => {};
  const markComplete = async (_id: string) => {};
  const startMaintenance = async (_id: string) => {};
  const fetchRecords = async () => {};
  const sendReminders = async (_type: string, _email: string) => {};
  const isSending = false;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSendRemindersDialogOpen, setIsSendRemindersDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
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

  // Keyboard shortcuts
  const handleRefresh = useCallback(() => {
    fetchRecords?.();
    toast.success("Data refreshed");
  }, [fetchRecords]);

  useKeyboardShortcuts([
    {
      key: "k",
      ctrl: true,
      action: () => searchInputRef.current?.focus(),
      description: "Focus search",
    },
    {
      key: "/",
      action: () => searchInputRef.current?.focus(),
      description: "Focus search",
    },
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
    {
      key: "Escape",
      action: () => {
        setIsAddDialogOpen(false);
        setIsViewDialogOpen(false);
        setIsEditDialogOpen(false);
        setIsSendRemindersDialogOpen(false);
      },
      description: "Close dialogs",
    },
  ]);


  // Calculate dynamic status based on date
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
      return matchesSearch && matchesStatus;
    });

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
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleCompleteRecord = async (id: string) => {
    try {
      await markComplete(id);
    } catch (err) {
      // Error handled by hook
    }
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
      } catch (err) {
        // Error handled by hook
      }
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteRecord(id);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleStartMaintenance = async (id: string) => {
    try {
      await startMaintenance(id);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleSendReminders = async () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }
    try {
      await sendReminders('maintenance', recipientEmail);
      setIsSendRemindersDialogOpen(false);
      setRecipientEmail("");
    } catch (err) {
      // Error handled by hook
    }
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
      <DashboardLayout title="Maintenance Management" subtitle="Schedule and track vehicle maintenance">
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Maintenance Management" subtitle="Schedule and track vehicle maintenance">
      <div className="space-y-6">
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

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <ShortcutTooltip content="Refresh data" shortcut={SHORTCUTS.refresh.display()}>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </ShortcutTooltip>
            <TooltipWrapper content="Send maintenance reminders">
              <Button variant="outline" onClick={() => setIsSendRemindersDialogOpen(true)} disabled={isSending}>
                <Mail className="h-4 w-4 mr-2" />
                Send Reminders
              </Button>
            </TooltipWrapper>
            <ShortcutTooltip content="Schedule new maintenance" shortcut={SHORTCUTS.newItem.display()}>
              <Button variant="gradient" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
            </ShortcutTooltip>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search by vehicle, category, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-14 bg-card/50 border-border/50"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            /
          </kbd>
        </div>

        {/* Maintenance Records Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Maintenance Records ({filteredRecords.length})
            </CardTitle>
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
                      No maintenance records found. Schedule your first maintenance.
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
                          <TooltipWrapper content="Actions">
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipWrapper>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {record.displayStatus === "scheduled" && (
                              <DropdownMenuItem onClick={() => handleStartMaintenance(record.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                Start Maintenance
                              </DropdownMenuItem>
                            )}
                            {record.displayStatus !== "completed" && (
                              <DropdownMenuItem onClick={() => handleCompleteRecord(record.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
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
      </div>

      {/* Add Maintenance Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>Create a new maintenance schedule for a vehicle</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle Registration</Label>
              <Input
                placeholder="e.g., LAG-123-XY"
                value={newRecord.vehicleReg}
                onChange={(e) => setNewRecord({ ...newRecord, vehicleReg: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newRecord.type}
                  onValueChange={(v) => setNewRecord({ ...newRecord, type: v as any })}
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
                  onValueChange={(v) => setNewRecord({ ...newRecord, priority: v as any })}
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
              <Label>Category</Label>
              <Input
                placeholder="e.g., Oil Change, Brake System"
                value={newRecord.category}
                onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the maintenance required"
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
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
            <div className="space-y-2">
              <Label>Technician (Optional)</Label>
              <Input
                placeholder="Technician name"
                value={newRecord.technician}
                onChange={(e) => setNewRecord({ ...newRecord, technician: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleAddRecord}
              disabled={!newRecord.vehicleReg || !newRecord.category || !newRecord.scheduledDate}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Maintenance Details</DialogTitle>
            <DialogDescription>
              {selectedRecord?.maintenance_type} for {selectedRecord?.vehicle_name}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Vehicle</Label>
                  <p className="font-medium font-mono">{selectedRecord.vehicle_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Type</Label>
                  <p className="font-medium capitalize">{selectedRecord.maintenance_type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="mt-1">
                    <Badge className={statusColors[getRecordStatus(selectedRecord)]}>
                      {getRecordStatus(selectedRecord).replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Priority</Label>
                  <div className="mt-1">
                    <Badge className={priorityColors[selectedRecord.priority]}>
                      {selectedRecord.priority}
                    </Badge>
                  </div>
                </div>
              </div>
              {selectedRecord.notes && (
                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="font-medium">{selectedRecord.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Scheduled Date</Label>
                  <p className="font-medium">{format(new Date(selectedRecord.scheduled_date), "MMM dd, yyyy")}</p>
                </div>
                {selectedRecord.completed_date && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Completed Date</Label>
                    <p className="font-medium">{format(new Date(selectedRecord.completed_date), "MMM dd, yyyy")}</p>
                  </div>
                )}
              </div>
              {selectedRecord.technician && (
                <div>
                  <Label className="text-muted-foreground text-xs">Technician</Label>
                  <p className="font-medium">{selectedRecord.technician}</p>
                </div>
              )}
              {selectedRecord.cost_ngn && (
                <div>
                  <Label className="text-muted-foreground text-xs">Cost</Label>
                  <p className="font-medium">₦{Number(selectedRecord.cost_ngn).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedRecord && getRecordStatus(selectedRecord) !== "completed" && (
              <Button
                variant="gradient"
                onClick={() => {
                  handleCompleteRecord(selectedRecord.id);
                  setIsViewDialogOpen(false);
                }}
              >
                Mark Complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Maintenance</DialogTitle>
            <DialogDescription>Update maintenance schedule details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle Registration</Label>
              <Input
                placeholder="e.g., LAG-123-XY"
                value={newRecord.vehicleReg}
                onChange={(e) => setNewRecord({ ...newRecord, vehicleReg: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newRecord.type}
                  onValueChange={(v) => setNewRecord({ ...newRecord, type: v as any })}
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
                  onValueChange={(v) => setNewRecord({ ...newRecord, priority: v as any })}
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
              <Label>Category</Label>
              <Input
                placeholder="e.g., Oil Change, Brake System"
                value={newRecord.category}
                onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the maintenance required"
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
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
            <div className="space-y-2">
              <Label>Technician (Optional)</Label>
              <Input
                placeholder="Technician name"
                value={newRecord.technician}
                onChange={(e) => setNewRecord({ ...newRecord, technician: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleUpdateRecord}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminders Dialog */}
      <Dialog open={isSendRemindersDialogOpen} onOpenChange={setIsSendRemindersDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Email Reminders</DialogTitle>
            <DialogDescription>
              Send reminder emails for upcoming and overdue maintenance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                This will send reminders for scheduled maintenance in the next 30 days and all overdue maintenance.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendRemindersDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSendReminders} disabled={isSending || !recipientEmail}>
              {isSending ? "Sending..." : "Send Reminders"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}



