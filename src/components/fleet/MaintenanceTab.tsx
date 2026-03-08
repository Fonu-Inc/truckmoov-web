import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useMaintenanceRecords, MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { useFleetReminders } from "@/hooks/useFleetReminders";
import { ShortcutTooltip } from "@/components/ui/shortcut-tooltip";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
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
  const { records, isLoading, addRecord, updateRecord, deleteRecord, markComplete, startMaintenance, fetchRecords } = useMaintenanceRecords();
  const { sendReminders, isSending } = useFleetReminders();
  
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
      await sendReminders('maintenance', recipientEmail);
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
          <TooltipWrapper content="Refresh data">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipWrapper>
          <TooltipWrapper content="Send maintenance reminders">
            <Button variant="outline" onClick={() => setIsSendRemindersDialogOpen(true)} disabled={isSending}>
              <Mail className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
          </TooltipWrapper>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Search by vehicle, category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card/50 border-border/50"
        />
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
              <Label>Category</Label>
              <Input
                placeholder="e.g. Oil Change, Tire Rotation"
                value={newRecord.category}
                onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
              />
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
              <Label>Category</Label>
              <Input
                value={newRecord.category}
                onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
              />
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
