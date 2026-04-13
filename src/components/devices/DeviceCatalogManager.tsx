import { useMemo, useState } from "react";
import type {
  CreateSystemDeviceModelPayload,
  DeviceCatalogFeature,
  DeviceCatalogStatus,
  DeviceCatalogProtocolType,
  SystemDeviceCatalogModel,
  SystemDeviceCatalogQuery,
  SystemDeviceCatalogReferenceData,
  UpdateSystemDeviceModelPayload,
} from "@/features/auth/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Archive,
  BookOpen,
  Check,
  Edit,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

interface DeviceCatalogManagerProps {
  catalog: SystemDeviceCatalogModel[];
  total: number;
  loading: boolean;
  isRefreshing?: boolean;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
  filters: SystemDeviceCatalogQuery;
  referenceData?: SystemDeviceCatalogReferenceData;
  onRefresh: () => void | Promise<void>;
  onFilterChange: (key: keyof SystemDeviceCatalogQuery, value: string | undefined) => void;
  onCreate: (data: CreateSystemDeviceModelPayload["data"]) => Promise<unknown>;
  onUpdate: (
    deviceModelId: string,
    data: UpdateSystemDeviceModelPayload["data"]
  ) => Promise<unknown>;
  onDelete: (deviceModelId: string) => Promise<unknown>;
}

type DeviceModelFormData = CreateSystemDeviceModelPayload["data"];

const DEFAULT_FORM_DATA: DeviceModelFormData = {
  manufacturer: "",
  model: "",
  protocolType: "TCP",
  defaultPort: null,
  supportedFeatures: [],
  status: "supported",
  configurationInstructions: "",
};

function getStatusBadge(status: DeviceCatalogStatus) {
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
}

function getProtocolBadge(protocol: DeviceCatalogProtocolType) {
  const colors: Record<DeviceCatalogProtocolType, string> = {
    TCP: "bg-blue-100 text-blue-700",
    HTTP: "bg-green-100 text-green-700",
    MQTT: "bg-amber-100 text-amber-700",
    UDP: "bg-slate-100 text-slate-700",
  };

  return (
    <Badge variant="outline" className={colors[protocol]}>
      {protocol}
    </Badge>
  );
}

export function DeviceCatalogManager({
  catalog,
  total,
  loading,
  isRefreshing = false,
  isCreating = false,
  isUpdating = false,
  isDeleting = false,
  filters,
  referenceData,
  onRefresh,
  onFilterChange,
  onCreate,
  onUpdate,
  onDelete,
}: DeviceCatalogManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SystemDeviceCatalogModel | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<SystemDeviceCatalogModel | null>(null);
  const [formData, setFormData] = useState<DeviceModelFormData>(DEFAULT_FORM_DATA);

  const protocolTypes = referenceData?.protocolTypes ?? ["TCP", "HTTP", "MQTT", "UDP"];
  const statuses = referenceData?.statuses ?? ["supported", "deprecated", "blocked"];
  const featureOptions = referenceData?.featureOptions ?? [];

  const catalogSummary = useMemo(
    () => ({
      total,
      supported: catalog.filter((entry) => entry.status === "supported").length,
      deprecated: catalog.filter((entry) => entry.status === "deprecated").length,
      blocked: catalog.filter((entry) => entry.status === "blocked").length,
    }),
    [catalog, total]
  );

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingEntry(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (entry: SystemDeviceCatalogModel) => {
    setEditingEntry(entry);
    setFormData({
      manufacturer: entry.manufacturer,
      model: entry.model,
      protocolType: entry.protocolType,
      defaultPort: entry.defaultPort,
      supportedFeatures: entry.supportedFeatures,
      status: entry.status,
      configurationInstructions: entry.configurationInstructions ?? "",
    });
    setDialogOpen(true);
  };

  const handleFeatureToggle = (feature: DeviceCatalogFeature, checked: boolean) => {
    setFormData((current) => ({
      ...current,
      supportedFeatures: checked
        ? Array.from(new Set([...current.supportedFeatures, feature]))
        : current.supportedFeatures.filter((item) => item !== feature),
    }));
  };

  const handleSubmit = async () => {
    const payload: CreateSystemDeviceModelPayload["data"] = {
      manufacturer: formData.manufacturer.trim(),
      model: formData.model.trim(),
      protocolType: formData.protocolType,
      defaultPort: formData.defaultPort ?? null,
      supportedFeatures: formData.supportedFeatures,
      status: formData.status,
      configurationInstructions: formData.configurationInstructions?.trim() || null,
    };

    if (editingEntry) {
      await onUpdate(editingEntry.id, payload);
    } else {
      await onCreate(payload);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    await onDelete(entryToDelete.id);
    setDeleteConfirmOpen(false);
    setEntryToDelete(null);
  };

  const handleStatusChange = async (entry: SystemDeviceCatalogModel, newStatus: DeviceCatalogStatus) => {
    await onUpdate(entry.id, { status: newStatus });
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
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Device Catalog
              </CardTitle>
              <CardDescription>
                System-managed manufacturers, models, protocols, and supported features
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Device Model
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold">{catalogSummary.total}</p>
              <p className="text-xs text-muted-foreground">Models in result set</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold text-success">{catalogSummary.supported}</p>
              <p className="text-xs text-muted-foreground">Supported</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold text-warning">{catalogSummary.deprecated}</p>
              <p className="text-xs text-muted-foreground">Deprecated</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold text-destructive">{catalogSummary.blocked}</p>
              <p className="text-xs text-muted-foreground">Blocked</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search manufacturer or model..."
                className="pl-10"
                value={filters.search ?? ""}
                onChange={(event) => onFilterChange("search", event.target.value)}
              />
            </div>
            <Select
              value={filters.status ?? "all"}
              onValueChange={(value) => onFilterChange("status", value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onRefresh()}
              isLoading={isRefreshing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No device models match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  catalog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.manufacturer}</TableCell>
                      <TableCell>{entry.model}</TableCell>
                      <TableCell>{getProtocolBadge(entry.protocolType)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {entry.supportedFeatures.length > 0 ? (
                            entry.supportedFeatures.map((feature) => (
                              <Badge key={feature} variant="outline">
                                {feature}
                              </Badge>
                            ))
                          ) : (
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Device Model" : "Add Device Model"}</DialogTitle>
            <DialogDescription>
              {editingEntry
                ? "Update the system device catalog entry."
                : "Create a new system device catalog entry."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, manufacturer: event.target.value }))
                  }
                  placeholder="e.g., Teltonika"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, model: event.target.value }))
                  }
                  placeholder="e.g., FMC130"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protocol">Protocol Type</Label>
                <Select
                  value={formData.protocolType}
                  onValueChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      protocolType: value as DeviceCatalogProtocolType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    {protocolTypes.map((protocolType) => (
                      <SelectItem key={protocolType} value={protocolType}>
                        {protocolType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Default Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.defaultPort ?? ""}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      defaultPort: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                  placeholder="e.g., 5001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supported Features</Label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {featureOptions.map((feature) => (
                  <label key={feature.key} className="flex items-start space-x-3 rounded-lg border p-3">
                    <Checkbox
                      checked={formData.supportedFeatures.includes(feature.key)}
                      onCheckedChange={(checked) => handleFeatureToggle(feature.key, checked === true)}
                    />
                    <div>
                      <p className="text-sm font-medium">{feature.label}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </label>
                ))}
                {featureOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No feature metadata returned by the API.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    status: value as DeviceCatalogStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Configuration Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.configurationInstructions ?? ""}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    configurationInstructions: event.target.value,
                  }))
                }
                placeholder="Provide installer or protocol notes..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={!formData.manufacturer.trim() || !formData.model.trim()}
              isLoading={isCreating || isUpdating}
            >
              {editingEntry ? "Save Changes" : "Add Model"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button variant="destructive" onClick={() => void handleDelete()} isLoading={isDeleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*
        Preserved Supabase-era catalog behavior for later reference.

        Legacy pieces intentionally commented instead of deleted:
        - useDeviceCatalog hook integration
        - Supabase field mapping such as protocol_type/default_port/config_instructions
        - Boolean feature flags (supports_obd/supports_fuel/supports_sos) prior to supportedFeatures[]
      */}
    </>
  );
}
