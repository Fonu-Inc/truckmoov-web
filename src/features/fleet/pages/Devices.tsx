import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Cpu,
  FileText,
  Inbox,
  Link,
  ListChecks,
  MoreHorizontal,
  Plus,
  Radio,
  RefreshCcw,
  Search,
  Shield,
  Signal,
  Unlink,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BulkUploadModal } from "@/shared/components/BulkUploadModal";
import StatusBadge from "@/shared/components/StatusBadge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { timeAgo } from "@/shared/utils/time-functions";
import { DEVICE_CATALOG, findCatalogEntry } from "../lib/deviceCatalog";
import type { UserRole } from "@/features/auth/api/types";

const LIFECYCLE_LABELS: Record<DeviceLifecycleStatus, string> = {
  registered: "Registered",
  config_pending: "Config pending",
  configured: "Configured",
  verified_online: "Verified online",
  assignable: "Assignable",
  assigned: "Assigned",
  active: "Active",
  faulty: "Faulty",
  decommissioned: "Decommissioned",
};

const DEVICE_STATUS_OPTIONS: Array<DeviceLifecycleStatus | "all"> = [
  "all",
  "registered",
  "config_pending",
  "configured",
  "verified_online",
  "assignable",
  "assigned",
  "active",
  "faulty",
  "decommissioned",
];

const VEHICLES = [
  { id: "VEH-101", label: "TMV-201 - Toyota Hilux" },
  { id: "VEH-102", label: "TMV-318 - MAN TGS" },
  { id: "VEH-103", label: "TMV-402 - Iveco Stralis" },
  { id: "VEH-104", label: "TMV-512 - Mercedes Actros" },
];

type DeviceLifecycleStatus =
  | "registered"
  | "config_pending"
  | "configured"
  | "verified_online"
  | "assignable"
  | "assigned"
  | "active"
  | "faulty"
  | "decommissioned";

type DeviceRecord = {
  id: string;
  imei: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  lifecycleStatus: DeviceLifecycleStatus;
  assignedVehicleId?: string;
  lastSeen?: string;
  signalStrength?: number;
  batteryLevel?: number;
  notes?: string;
};

type SetupRequestStatus = "pending" | "approved" | "rejected" | "in_progress";

type DeviceSetupRequest = {
  id: string;
  imei: string;
  manufacturer: string;
  model: string;
  requestedBy: string;
  requestedAt: string;
  status: SetupRequestStatus;
  note?: string;
};

type PermissionEntry = {
  role: UserRole;
  view: boolean;
  manage: boolean;
  edit: boolean;
  delete: boolean;
};

const INITIAL_DEVICES: DeviceRecord[] = [
  {
    id: "DEV-1001",
    imei: "359779090012345",
    manufacturer: "Teltonika",
    model: "FMC130",
    firmwareVersion: "3.28.07",
    lifecycleStatus: "config_pending",
    signalStrength: 0,
    batteryLevel: 96,
  },
  {
    id: "DEV-1002",
    imei: "359779090045612",
    manufacturer: "Teltonika",
    model: "FMB920",
    firmwareVersion: "3.27.10",
    lifecycleStatus: "configured",
    signalStrength: 48,
    batteryLevel: 88,
    lastSeen: "2026-04-02T08:15:00Z",
  },
  {
    id: "DEV-1003",
    imei: "359779090078901",
    manufacturer: "Concox",
    model: "GT06N",
    firmwareVersion: "2.5.4",
    lifecycleStatus: "verified_online",
    signalStrength: 62,
    batteryLevel: 74,
    lastSeen: "2026-04-02T07:42:00Z",
  },
  {
    id: "DEV-1004",
    imei: "359779090099210",
    manufacturer: "Teltonika",
    model: "FMC130",
    firmwareVersion: "3.28.07",
    lifecycleStatus: "assignable",
    signalStrength: 70,
    batteryLevel: 92,
    lastSeen: "2026-04-02T08:30:00Z",
  },
  {
    id: "DEV-1005",
    imei: "359779090034567",
    manufacturer: "Teltonika",
    model: "FMB920",
    firmwareVersion: "3.27.10",
    lifecycleStatus: "assigned",
    assignedVehicleId: "VEH-101",
    signalStrength: 65,
    batteryLevel: 83,
    lastSeen: "2026-04-02T08:22:00Z",
  },
  {
    id: "DEV-1006",
    imei: "359779090056789",
    manufacturer: "Concox",
    model: "GT06N",
    firmwareVersion: "2.5.4",
    lifecycleStatus: "active",
    assignedVehicleId: "VEH-102",
    signalStrength: 78,
    batteryLevel: 69,
    lastSeen: "2026-04-02T08:35:00Z",
  },
  {
    id: "DEV-1007",
    imei: "359779090067890",
    manufacturer: "Teltonika",
    model: "FMC130",
    firmwareVersion: "3.28.07",
    lifecycleStatus: "faulty",
    signalStrength: 12,
    batteryLevel: 18,
    lastSeen: "2026-04-01T12:20:00Z",
  },
  {
    id: "DEV-1008",
    imei: "359779090089012",
    manufacturer: "Teltonika",
    model: "FMB920",
    firmwareVersion: "3.27.10",
    lifecycleStatus: "decommissioned",
  },
  {
    id: "DEV-1009",
    imei: "359779090045999",
    manufacturer: "Concox",
    model: "GT06N",
    firmwareVersion: "2.5.4",
    lifecycleStatus: "registered",
  },
];

const INITIAL_REQUESTS: DeviceSetupRequest[] = [
  {
    id: "REQ-601",
    imei: "359779090000111",
    manufacturer: "Teltonika",
    model: "FMC130",
    requestedBy: "Lagos Express Logistics",
    requestedAt: "2026-04-01T10:00:00Z",
    status: "pending",
  },
  {
    id: "REQ-602",
    imei: "359779090000222",
    manufacturer: "Concox",
    model: "GT06N",
    requestedBy: "Atlas Haulage",
    requestedAt: "2026-04-01T12:30:00Z",
    status: "in_progress",
    note: "Awaiting SIM activation",
  },
  {
    id: "REQ-603",
    imei: "359779090000333",
    manufacturer: "Teltonika",
    model: "FMB920",
    requestedBy: "Northway Freight",
    requestedAt: "2026-03-30T16:40:00Z",
    status: "approved",
  },
];

const INITIAL_PERMISSIONS: PermissionEntry[] = [
  { role: "ENTERPRISE_ADMIN", view: true, manage: true, edit: true, delete: true },
  { role: "FLEET_ADMIN", view: true, manage: true, edit: true, delete: false },
  { role: "DISPATCHER", view: true, manage: false, edit: false, delete: false },
  { role: "OPERATIONS_MANAGER", view: true, manage: false, edit: false, delete: false },
  { role: "FINANCE_VIEWER", view: true, manage: false, edit: false, delete: false },
  { role: "AGGREGATOR_ADMIN", view: true, manage: true, edit: true, delete: false },
  { role: "PLATFORM_ADMIN", view: true, manage: true, edit: true, delete: true },
  { role: "OWNER_OPERATOR", view: true, manage: false, edit: false, delete: false },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ENTERPRISE_ADMIN: "Enterprise Admin",
  FLEET_ADMIN: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  OPERATIONS_MANAGER: "Ops Analyst",
  FINANCE_VIEWER: "Finance Viewer",
  AGGREGATOR_ADMIN: "Aggregator Admin",
  PLATFORM_ADMIN: "Platform Admin",
  OWNER_OPERATOR: "Owner Operator",
};

const PERMISSION_ACTIONS = ["view", "manage", "edit", "delete"] as const;

const REGISTER_SCHEMA = z.object({
  imei: z.string().min(15, "IMEI must be 15 digits").max(15, "IMEI must be 15 digits").regex(/^\d+$/, "IMEI must contain only digits"),
  model: z.string().min(1, "Select a device model."),
  manufacturer: z.string().min(1, "Manufacturer is required."),
  firmwareVersion: z.string().min(1, "Firmware version is required."),
  sendToQueue: z.boolean(),
  notes: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof REGISTER_SCHEMA>;

const REQUEST_NOTE_SCHEMA = z.object({
  note: z.string().min(1, "Add a note for the request."),
});

type RequestNoteValues = z.infer<typeof REQUEST_NOTE_SCHEMA>;

function createId(prefix: string) {
  return `${prefix}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function formatLifecycle(status: DeviceLifecycleStatus) {
  return LIFECYCLE_LABELS[status] ?? status.replace(/_/g, " ");
}

function getVehicleLabel(vehicleId?: string) {
  if (!vehicleId) return "Unassigned";
  return VEHICLES.find((vehicle) => vehicle.id === vehicleId)?.label ?? "Assigned";
}

function isOnline(lastSeen?: string) {
  if (!lastSeen) return false;
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  return diffMs <= 60 * 60 * 1000;
}

function formatDateTime(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
}

function RegisterDeviceDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RegisterFormValues) => void;
}) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(REGISTER_SCHEMA),
    defaultValues: {
      imei: "",
      model: "",
      manufacturer: "",
      firmwareVersion: "",
      sendToQueue: true,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        imei: "",
        model: "",
        manufacturer: "",
        firmwareVersion: "",
        sendToQueue: true,
        notes: "",
      });
    }
  }, [open, form]);

  const selectedModel = form.watch("model");
  useEffect(() => {
    if (!selectedModel) return;
    const entry = findCatalogEntry(selectedModel);
    if (!entry) return;
    form.setValue("manufacturer", entry.manufacturer, { shouldValidate: true });
    form.setValue("firmwareVersion", entry.firmwareVersion, { shouldValidate: true });
  }, [selectedModel, form]);

  const handleSubmit = (values: RegisterFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register IoT Device</DialogTitle>
          <DialogDescription>Capture IMEI and catalog details before installation.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="imei"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMEI</FormLabel>
                  <FormControl>
                    <Input placeholder="359779090012345" maxLength={15} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Model</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEVICE_CATALOG.map((entry) => (
                            <SelectItem key={entry.model} value={entry.model}>
                              {entry.manufacturer} {entry.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input placeholder="Teltonika" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="firmwareVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firmware Version</FormLabel>
                  <FormControl>
                    <Input placeholder="3.28.07" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Optional notes for the installer" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sendToQueue"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <FormLabel>Send to configuration queue</FormLabel>
                    <p className="text-xs text-muted-foreground">Queues the device for installer setup.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Register device
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AssignmentDialog({
  open,
  onOpenChange,
  device,
  onAssign,
  onUnassign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceRecord | null;
  onAssign: (vehicleId: string) => void;
  onUnassign: () => void;
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  useEffect(() => {
    if (open) setSelectedVehicleId(device?.assignedVehicleId ?? "");
  }, [open, device]);

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Device to Vehicle</DialogTitle>
          <DialogDescription>
            {device.manufacturer} {device.model} · {device.imei}
          </DialogDescription>
        </DialogHeader>

        {device.assignedVehicleId ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium">Current Assignment</p>
            <p className="text-xs text-muted-foreground">{getVehicleLabel(device.assignedVehicleId)}</p>
          </div>
        ) : null}

        <div className="space-y-4">
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLES.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onUnassign} disabled={!device.assignedVehicleId}>
              <Unlink className="h-4 w-4" />
              Unassign
            </Button>
            <Button
              onClick={() => onAssign(selectedVehicleId)}
              disabled={!selectedVehicleId}
            >
              <Link className="h-4 w-4" />
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeviceDetailsDialog({
  open,
  onOpenChange,
  device,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceRecord | null;
}) {
  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Device Details</DialogTitle>
          <DialogDescription>Health, telemetry, and lifecycle context.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Device</p>
            <p className="font-medium">{device.manufacturer} {device.model}</p>
            <p className="text-xs text-muted-foreground">IMEI {device.imei}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lifecycle</p>
            <StatusBadge status={device.lifecycleStatus} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Assigned Vehicle</p>
            <p className="font-medium">{getVehicleLabel(device.assignedVehicleId)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Firmware</p>
            <p className="font-medium">{device.firmwareVersion}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Seen</p>
            <p className="font-medium">{formatDateTime(device.lastSeen)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Signal Strength</p>
            <p className="font-medium">{device.signalStrength ?? 0}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Battery Level</p>
            <p className="font-medium">{device.batteryLevel ?? 0}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm text-muted-foreground">{device.notes ?? "No notes"}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RequestNoteDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  buttonLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RequestNoteValues) => void;
  title: string;
  description: string;
  buttonLabel: string;
}) {
  const form = useForm<RequestNoteValues>({
    resolver: zodResolver(REQUEST_NOTE_SCHEMA),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    if (open) form.reset({ note: "" });
  }, [open, form]);

  const handleSubmit = (values: RequestNoteValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Add a short note" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                {buttonLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Devices() {
  const { user } = useAuthStore();
  const role = user?.role;

  const isFleetManager = role === "FLEET_ADMIN";
  const isInstaller = role === "AGGREGATOR_ADMIN" || role === "PLATFORM_ADMIN";
  const isEnterpriseAdmin = role === "ENTERPRISE_ADMIN";

  const [devices, setDevices] = useState<DeviceRecord[]>(INITIAL_DEVICES);
  const [setupRequests, setSetupRequests] = useState<DeviceSetupRequest[]>(INITIAL_REQUESTS);
  const [permissions, setPermissions] = useState<PermissionEntry[]>(INITIAL_PERMISSIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeviceLifecycleStatus | "all">("all");

  const [registerOpen, setRegisterOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [requestInProgressOpen, setRequestInProgressOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const availableTabs = useMemo(() => {
    const tabs: Array<{ value: string; label: string; icon: JSX.Element }> = [];
    tabs.push({ value: "inventory", label: "Inventory", icon: <Cpu className="h-4 w-4" /> });
    if (isInstaller) {
      tabs.push({ value: "setup-requests", label: "Setup Requests", icon: <Inbox className="h-4 w-4" /> });
      tabs.push({ value: "config-queue", label: "Config Queue", icon: <ListChecks className="h-4 w-4" /> });
      tabs.push({ value: "installer-guide", label: "Installer Guide", icon: <BookOpen className="h-4 w-4" /> });
      tabs.push({ value: "verification", label: "Verification", icon: <Radio className="h-4 w-4" /> });
      tabs.push({ value: "troubleshooting", label: "Troubleshooting", icon: <Wrench className="h-4 w-4" /> });
    }
    if (isEnterpriseAdmin) {
      tabs.push({ value: "permissions", label: "Permissions", icon: <Shield className="h-4 w-4" /> });
    }
    return tabs;
  }, [isInstaller, isEnterpriseAdmin]);

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.value ?? "inventory");

  useEffect(() => {
    if (!availableTabs.find((tab) => tab.value === activeTab)) {
      setActiveTab(availableTabs[0]?.value ?? "inventory");
    }
  }, [availableTabs, activeTab]);

  const activeDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  );

  const metrics = useMemo(() => {
    const totals = DEVICE_STATUS_OPTIONS.reduce((acc, status) => {
      if (status === "all") return acc;
      acc[status] = devices.filter((device) => device.lifecycleStatus === status).length;
      return acc;
    }, {} as Record<DeviceLifecycleStatus, number>);
    return {
      total: devices.length,
      registered: totals.registered ?? 0,
      configPending: totals.config_pending ?? 0,
      configured: totals.configured ?? 0,
      verified: totals.verified_online ?? 0,
      assignable: totals.assignable ?? 0,
      assigned: totals.assigned ?? 0,
      active: totals.active ?? 0,
      faulty: totals.faulty ?? 0,
      decommissioned: totals.decommissioned ?? 0,
    };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return devices.filter((device) => {
      const matchesStatus = statusFilter === "all" || device.lifecycleStatus === statusFilter;
      const matchesSearch = !query
        || device.imei.toLowerCase().includes(query)
        || device.manufacturer.toLowerCase().includes(query)
        || device.model.toLowerCase().includes(query)
        || getVehicleLabel(device.assignedVehicleId).toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [devices, search, statusFilter]);

  const configQueueDevices = useMemo(
    () => devices.filter((device) => device.lifecycleStatus === "config_pending" || device.lifecycleStatus === "registered"),
    [devices],
  );

  const verificationDevices = useMemo(
    () => devices.filter((device) => device.lifecycleStatus === "configured" || device.lifecycleStatus === "verified_online"),
    [devices],
  );

  const faultyDevices = useMemo(
    () => devices.filter((device) => device.lifecycleStatus === "faulty"),
    [devices],
  );

  const handleRegisterDevice = (values: RegisterFormValues) => {
    const newDevice: DeviceRecord = {
      id: createId("DEV"),
      imei: values.imei,
      manufacturer: values.manufacturer,
      model: values.model,
      firmwareVersion: values.firmwareVersion,
      lifecycleStatus: values.sendToQueue ? "config_pending" : "registered",
      notes: values.notes,
    };
    setDevices((prev) => [newDevice, ...prev]);
    setRegisterOpen(false);
  };

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    const imported = rows
      .filter((row) => row["IMEI"] || row["imei"])
      .map((row) => {
        const imei = row["IMEI"] || row["imei"] || createId("IMEI");
        const model = row["Model"] || row["model"] || "FMC130";
        const catalog = findCatalogEntry(model);
        return {
          id: createId("DEV"),
          imei,
          manufacturer: row["Manufacturer"] || row["manufacturer"] || catalog?.manufacturer || "Unknown",
          model,
          firmwareVersion: row["Firmware Version"] || row["firmwareVersion"] || catalog?.firmwareVersion || "1.0.0",
          lifecycleStatus: "config_pending" as DeviceLifecycleStatus,
        } satisfies DeviceRecord;
      });
    if (imported.length) {
      setDevices((prev) => [...imported, ...prev]);
    }
  };

  const updateDevice = (deviceId: string, updater: (device: DeviceRecord) => DeviceRecord) => {
    setDevices((prev) => prev.map((device) => (device.id === deviceId ? updater(device) : device)));
  };

  const handleAssignDevice = (vehicleId: string) => {
    if (!activeDevice) return;
    updateDevice(activeDevice.id, (device) => ({
      ...device,
      assignedVehicleId: vehicleId,
      lifecycleStatus: "assigned",
    }));
    setAssignOpen(false);
  };

  const handleUnassignDevice = () => {
    if (!activeDevice) return;
    updateDevice(activeDevice.id, (device) => ({
      ...device,
      assignedVehicleId: undefined,
      lifecycleStatus: "assignable",
    }));
    setAssignOpen(false);
  };

  const handleLifecycleUpdate = (deviceId: string, status: DeviceLifecycleStatus) => {
    updateDevice(deviceId, (device) => ({
      ...device,
      lifecycleStatus: status,
      lastSeen: status === "verified_online" ? new Date().toISOString() : device.lastSeen,
    }));
  };

  const handleSetupRequest = (requestId: string, status: SetupRequestStatus, note?: string) => {
    const request = setupRequests.find((item) => item.id === requestId);
    if (!request) return;

    setSetupRequests((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? { ...item, status, note: note ?? item.note }
          : item,
      ),
    );

    if (status === "approved") {
      setDevices((prev) => [
        {
          id: createId("DEV"),
          imei: request.imei,
          manufacturer: request.manufacturer,
          model: request.model,
          firmwareVersion: findCatalogEntry(request.model)?.firmwareVersion ?? "1.0.0",
          lifecycleStatus: "config_pending",
        },
        ...prev,
      ]);
    }
  };

  const inventoryColumns: ColumnDef<DeviceRecord>[] = [
    {
      accessorKey: "device",
      header: "Device",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Cpu className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{row.original.manufacturer} {row.original.model}</p>
            <p className="text-xs text-muted-foreground">Firmware {row.original.firmwareVersion}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "imei",
      header: "IMEI",
      cell: ({ row }) => (
        <span className="rounded bg-secondary px-2 py-1 font-mono text-sm">
          {row.original.imei}
        </span>
      ),
    },
    {
      accessorKey: "lifecycleStatus",
      header: "Lifecycle",
      cell: ({ row }) => <StatusBadge status={row.original.lifecycleStatus} />,
    },
    {
      accessorKey: "assignedVehicle",
      header: "Vehicle",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{getVehicleLabel(row.original.assignedVehicleId)}</span>
      ),
    },
    {
      accessorKey: "signalStrength",
      header: "Signal",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Signal
            className={cn(
              "h-4 w-4",
              (row.original.signalStrength ?? 0) > 70
                ? "text-success"
                : (row.original.signalStrength ?? 0) > 40
                  ? "text-warning"
                  : "text-destructive",
            )}
          />
          <span className="text-sm">{row.original.signalStrength ?? 0}%</span>
        </div>
      ),
    },
    {
      accessorKey: "lastSeen",
      header: "Last Seen",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastSeen ? timeAgo(row.original.lastSeen) : "Never"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedDeviceId(row.original.id);
                setDetailsOpen(true);
              }}
            >
              <Activity className="h-4 w-4" />
              View details
            </DropdownMenuItem>
            {isFleetManager ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedDeviceId(row.original.id);
                    setAssignOpen(true);
                  }}
                >
                  <Link className="h-4 w-4" />
                  Assign or unassign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLifecycleUpdate(row.original.id, "active")}>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLifecycleUpdate(row.original.id, "decommissioned")}>
                  <AlertTriangle className="h-4 w-4" />
                  Decommission
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const queueColumns: ColumnDef<DeviceRecord>[] = [
    {
      accessorKey: "device",
      header: "Device",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.manufacturer} {row.original.model}</p>
          <p className="text-xs text-muted-foreground">IMEI {row.original.imei}</p>
        </div>
      ),
    },
    {
      accessorKey: "lifecycleStatus",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.lifecycleStatus} />,
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.notes ?? "No notes"}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => handleLifecycleUpdate(row.original.id, "configured")}>
            Mark configured
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleLifecycleUpdate(row.original.id, "faulty")}
          >
            Mark faulty
          </Button>
        </div>
      ),
    },
  ];

  const verificationColumns: ColumnDef<DeviceRecord>[] = [
    {
      accessorKey: "device",
      header: "Device",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.manufacturer} {row.original.model}</p>
          <p className="text-xs text-muted-foreground">IMEI {row.original.imei}</p>
        </div>
      ),
    },
    {
      accessorKey: "online",
      header: "Online",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn(
          "capitalize",
          isOnline(row.original.lastSeen) ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
        )}>
          {isOnline(row.original.lastSeen) ? "Online" : "Offline"}
        </Badge>
      ),
    },
    {
      accessorKey: "signal",
      header: "Signal",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.signalStrength ?? 0}%</span>
      ),
    },
    {
      accessorKey: "lastSeen",
      header: "Last Seen",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(row.original.lastSeen)}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => handleLifecycleUpdate(row.original.id, "verified_online")}>
            Verify online
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleLifecycleUpdate(row.original.id, "assignable")}
          >
            Make assignable
          </Button>
        </div>
      ),
    },
  ];

  const troubleshootingColumns: ColumnDef<DeviceRecord>[] = [
    {
      accessorKey: "device",
      header: "Device",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.manufacturer} {row.original.model}</p>
          <p className="text-xs text-muted-foreground">IMEI {row.original.imei}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.lifecycleStatus} />,
    },
    {
      accessorKey: "lastSeen",
      header: "Last Seen",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(row.original.lastSeen)}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => handleLifecycleUpdate(row.original.id, "config_pending")}>
            Reset to config pending
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleLifecycleUpdate(row.original.id, "decommissioned")}
          >
            Decommission
          </Button>
        </div>
      ),
    },
  ];

  const requestColumns: ColumnDef<DeviceSetupRequest>[] = [
    {
      accessorKey: "request",
      header: "Request",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.manufacturer} {row.original.model}</p>
          <p className="text-xs text-muted-foreground">IMEI {row.original.imei}</p>
        </div>
      ),
    },
    {
      accessorKey: "requestedBy",
      header: "Requested By",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.requestedBy}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(row.original.requestedAt)}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} />
      ),
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.note ?? "No note"}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const isLocked = row.original.status === "approved" || row.original.status === "rejected";
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={isLocked}
              onClick={() => {
                setSelectedRequestId(row.original.id);
                setApproveOpen(true);
              }}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isLocked}
              onClick={() => {
                setSelectedRequestId(row.original.id);
                setRequestInProgressOpen(true);
              }}
            >
              In progress
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isLocked}
              onClick={() => {
                setSelectedRequestId(row.original.id);
                setRejectOpen(true);
              }}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registered</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{metrics.registered}</div>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Config Pending</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{metrics.configPending}</div>
            <ListChecks className="h-5 w-5 text-warning" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assignable</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{metrics.assignable}</div>
            <CheckCircle2 className="h-5 w-5 text-success" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faulty</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{metrics.faulty}</div>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList className="bg-muted/40">
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex flex-wrap gap-2">
            {isFleetManager ? (
              <>
                <BulkUploadModal
                  title="Bulk Import Devices"
                  description="Upload a CSV file to register multiple devices at once."
                  templateUrl="/templates/device_import_template.csv"
                  onUpload={handleBulkImport}
                />
                <Button onClick={() => setRegisterOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Register device
                </Button>
              </>
            ) : null}
            <Button variant="outline" onClick={() => setDevices([...devices])}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Inventory</CardTitle>
              <CardDescription>Track lifecycle status, assignment, and health.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search IMEI, model, vehicle..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DeviceLifecycleStatus | "all")}>
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "all" ? "All statuses" : formatLifecycle(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DataTable
                columns={inventoryColumns}
                data={filteredDevices}
                noResultStatement={
                  <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                    <Cpu className="h-10 w-10 opacity-40" />
                    <p className="text-sm">No devices match your filters.</p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {isInstaller ? (
          <TabsContent value="setup-requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Setup Requests</CardTitle>
                <CardDescription>Approve, reject, or flag setup work as in progress.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={requestColumns}
                  data={setupRequests}
                  noResultStatement="No setup requests available."
                />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {isInstaller ? (
          <TabsContent value="config-queue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Queue</CardTitle>
                <CardDescription>Devices awaiting setup and configuration.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={queueColumns}
                  data={configQueueDevices}
                  noResultStatement="No devices waiting for configuration."
                />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {isInstaller ? (
          <TabsContent value="installer-guide" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {DEVICE_CATALOG.map((entry) => (
                <Card key={entry.model}>
                  <CardHeader>
                    <CardTitle>{entry.manufacturer} {entry.model}</CardTitle>
                    <CardDescription>Firmware {entry.firmwareVersion}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Install Steps</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {entry.installSteps.map((step) => (
                          <li key={step}>- {step}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Configuration Checklist</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {entry.configChecklist.map((step) => (
                          <li key={step}>- {step}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Verification Checklist</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {entry.verificationChecklist.map((step) => (
                          <li key={step}>- {step}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ) : null}

        {isInstaller ? (
          <TabsContent value="verification" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verification Monitor</CardTitle>
                <CardDescription>Confirm online checks and signal health.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={verificationColumns}
                  data={verificationDevices}
                  noResultStatement="No devices pending verification."
                />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {isInstaller ? (
          <TabsContent value="troubleshooting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting</CardTitle>
                <CardDescription>Reset or decommission faulty installs.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={troubleshootingColumns}
                  data={faultyDevices}
                  noResultStatement="No faulty devices right now."
                />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {isEnterpriseAdmin ? (
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Permissions</CardTitle>
                <CardDescription>Control who can view, manage, edit, or delete devices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {permissions.map((entry) => (
                    <div key={entry.role} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium">{ROLE_LABELS[entry.role]}</p>
                          <p className="text-xs text-muted-foreground">{entry.role}</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {PERMISSION_ACTIONS.map((action) => (
                            <div key={action} className="flex items-center gap-2">
                              <Switch
                                checked={entry[action]}
                                onCheckedChange={(value) => {
                                  setPermissions((prev) =>
                                    prev.map((item) =>
                                      item.role === entry.role
                                        ? { ...item, [action]: value }
                                        : item,
                                    ),
                                  );
                                }}
                              />
                              <span className="text-xs capitalize">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>

      <RegisterDeviceDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSubmit={handleRegisterDevice}
      />

      <AssignmentDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        device={activeDevice}
        onAssign={handleAssignDevice}
        onUnassign={handleUnassignDevice}
      />

      <DeviceDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        device={activeDevice}
      />

      <RequestNoteDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve setup request"
        description="Add an approval note for the installer team."
        buttonLabel="Approve request"
        onSubmit={(values) => {
          if (!selectedRequestId) return;
          handleSetupRequest(selectedRequestId, "approved", values.note);
          setApproveOpen(false);
        }}
      />

      <RequestNoteDialog
        open={requestInProgressOpen}
        onOpenChange={setRequestInProgressOpen}
        title="Mark in progress"
        description="Add a status note for the device setup request."
        buttonLabel="Update request"
        onSubmit={(values) => {
          if (!selectedRequestId) return;
          handleSetupRequest(selectedRequestId, "in_progress", values.note);
          setRequestInProgressOpen(false);
        }}
      />

      <RequestNoteDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject setup request"
        description="Provide the reason for rejecting this request."
        buttonLabel="Reject request"
        onSubmit={(values) => {
          if (!selectedRequestId) return;
          handleSetupRequest(selectedRequestId, "rejected", values.note);
          setRejectOpen(false);
        }}
      />
    </section>
  );
}
