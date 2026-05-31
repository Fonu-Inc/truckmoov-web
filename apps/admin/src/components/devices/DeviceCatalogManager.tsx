import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Search,
  Plus,
  MoreHorizontal,
  Wifi,
  Server,
  Gauge,
  Fuel,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  Edit,
  Trash2,
  Archive,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/ui/export-button";
import { useDeviceCatalog, DeviceCatalogEntry, CreateCatalogEntry, CatalogStatus, ProtocolType } from "@/hooks/useDeviceCatalog";

export function DeviceCatalogManager() {
  const { 
    catalog, 
    loading, 
    refetch, 
    createEntry, 
    updateEntry, 
    deleteEntry 
  } = useDeviceCatalog();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DeviceCatalogEntry | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DeviceCatalogEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCatalogEntry>({
    manufacturer: "",
    model: "",
    protocol_type: "tcp",
    default_port: undefined,
    supports_obd: false,
    supports_fuel: false,
    supports_sos: false,
    config_instructions: "",
    status: "supported",
  });

  const filteredCatalog = catalog.filter((entry) => {
    const matchesSearch =
      entry.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CatalogStatus) => {
    switch (status) {
      case "supported":
        return <Badge className="bg-success/10 text-success border-success/30">Supported</Badge>;
      case "deprecated":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Deprecated</Badge>;
      case "blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProtocolBadge = (protocol: ProtocolType) => {
    const colors: Record<ProtocolType, string> = {
      tcp: "bg-blue-100 text-blue-700",
      http: "bg-green-100 text-green-700",
      mqtt: "bg-purple-100 text-purple-700",
      udp: "bg-amber-100 text-amber-700",
    };
    return (
      <Badge variant="outline" className={colors[protocol]}>
        {protocol.toUpperCase()}
      </Badge>
    );
  };

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setFormData({
      manufacturer: "",
      model: "",
      protocol_type: "tcp",
      default_port: undefined,
      supports_obd: false,
      supports_fuel: false,
      supports_sos: false,
      config_instructions: "",
      status: "supported",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (entry: DeviceCatalogEntry) => {
    setEditingEntry(entry);
    setFormData({
      manufacturer: entry.manufacturer,
      model: entry.model,
      protocol_type: entry.protocol_type,
      default_port: entry.default_port || undefined,
      supports_obd: entry.supports_obd,
      supports_fuel: entry.supports_fuel,
      supports_sos: entry.supports_sos,
      config_instructions: entry.config_instructions || "",
      status: entry.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, formData);
      } else {
        await createEntry(formData);
      }
      setDialogOpen(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDelete = async () => {
    if (entryToDelete) {
      await deleteEntry(entryToDelete.id);
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleStatusChange = async (entry: DeviceCatalogEntry, newStatus: CatalogStatus) => {
    await updateEntry(entry.id, { status: newStatus });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Add Device Model button placed above the catalog container, right-aligned */}
      <div className="flex items-center justify-end mb-4">
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device Model
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Device Catalog
              </CardTitle>
              <CardDescription>
                Manage supported device manufacturers and models
              </CardDescription>
            </div>
            <ExportButton
              filename="device-catalog"
              label="Export Data"
              rows={filteredCatalog}
              columns={[
                { header: 'Manufacturer', accessor: (e) => e.manufacturer },
                { header: 'Model', accessor: (e) => e.model },
                { header: 'Protocol', accessor: (e) => e.protocol_type },
                { header: 'Port', accessor: (e) => e.default_port ?? '' },
                { header: 'OBD', accessor: (e) => (e.supports_obd ? 'Yes' : 'No') },
                { header: 'Fuel', accessor: (e) => (e.supports_fuel ? 'Yes' : 'No') },
                { header: 'SOS', accessor: (e) => (e.supports_sos ? 'Yes' : 'No') },
                { header: 'Status', accessor: (e) => e.status },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search manufacturer or model..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="supported">Supported</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCatalog.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {catalog.length === 0
                        ? "No device models in catalog. Add your first model."
                        : "No models match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCatalog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.manufacturer}</TableCell>
                      <TableCell>{entry.model}</TableCell>
                      <TableCell>{getProtocolBadge(entry.protocol_type)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.default_port || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {entry.supports_obd && (
                            <span title="OBD Support">
                              <Gauge className="h-4 w-4 text-blue-500" />
                            </span>
                          )}
                          {entry.supports_fuel && (
                            <span title="Fuel Monitoring">
                              <Fuel className="h-4 w-4 text-amber-500" />
                            </span>
                          )}
                          {entry.supports_sos && (
                            <span title="SOS Button">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            </span>
                          )}
                          {!entry.supports_obd && !entry.supports_fuel && !entry.supports_sos && (
                            <span className="text-muted-foreground text-sm">Basic</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(entry)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {entry.status !== "supported" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(entry, "supported")}>
                                <Check className="h-4 w-4 mr-2" />
                                Mark Supported
                              </DropdownMenuItem>
                            )}
                            {entry.status !== "deprecated" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(entry, "deprecated")}>
                                <Archive className="h-4 w-4 mr-2" />
                                Mark Deprecated
                              </DropdownMenuItem>
                            )}
                            {entry.status !== "blocked" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(entry, "blocked")}>
                                <X className="h-4 w-4 mr-2" />
                                Block Model
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setEntryToDelete(entry);
                                setDeleteConfirmOpen(true);
                              }}
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
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Device Model" : "Add Device Model"}
            </DialogTitle>
            <DialogDescription>
              {editingEntry
                ? "Update the device model configuration."
                : "Add a new device model to the catalog."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g., Teltonika"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., FMC130"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protocol">Protocol Type</Label>
                <Select
                  value={formData.protocol_type}
                  onValueChange={(v) => setFormData({ ...formData, protocol_type: v as ProtocolType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="mqtt">MQTT</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Default Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.default_port || ""}
                  onChange={(e) => setFormData({ ...formData, default_port: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="e.g., 5001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supported Features</Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="obd"
                    checked={formData.supports_obd}
                    onCheckedChange={(checked) => setFormData({ ...formData, supports_obd: checked as boolean })}
                  />
                  <label htmlFor="obd" className="text-sm flex items-center gap-1">
                    <Gauge className="h-4 w-4" />
                    OBD-II
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fuel"
                    checked={formData.supports_fuel}
                    onCheckedChange={(checked) => setFormData({ ...formData, supports_fuel: checked as boolean })}
                  />
                  <label htmlFor="fuel" className="text-sm flex items-center gap-1">
                    <Fuel className="h-4 w-4" />
                    Fuel
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sos"
                    checked={formData.supports_sos}
                    onCheckedChange={(checked) => setFormData({ ...formData, supports_sos: checked as boolean })}
                  />
                  <label htmlFor="sos" className="text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    SOS
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as CatalogStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supported">Supported</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Configuration Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.config_instructions}
                onChange={(e) => setFormData({ ...formData, config_instructions: e.target.value })}
                placeholder="Markdown-formatted configuration instructions..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.manufacturer || !formData.model}>
              {editingEntry ? "Save Changes" : "Add Model"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Device Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {entryToDelete?.manufacturer} {entryToDelete?.model}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



