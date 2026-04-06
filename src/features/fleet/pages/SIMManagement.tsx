import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  MoreHorizontal,
  Plus,
  Radio,
  RefreshCcw,
  Search,
  Settings2,
  Signal,
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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BulkUploadModal } from "@/shared/components/BulkUploadModal";
import StatusBadge from "@/shared/components/StatusBadge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const SIM_STATUSES = ["active", "suspended", "deactivated"] as const;
const OPERATORS = ["MTN", "Airtel", "Glo", "9mobile"];
const PLAN_OPTIONS = ["1GB", "5GB", "10GB", "20GB", "50GB"];

const DEVICES = [
  { id: "DEV-1004", label: "FMC130 - 359779090099210" },
  { id: "DEV-1005", label: "FMB920 - 359779090034567" },
  { id: "DEV-1006", label: "GT06N - 359779090056789" },
];

type SimStatus = typeof SIM_STATUSES[number];

type SimRecord = {
  id: string;
  iccid: string;
  phoneNumber: string;
  operator: string;
  planName: string;
  dataLimitGb: number;
  dataUsedGb: number;
  status: SimStatus;
  assignedDeviceId?: string;
  lastSync?: string;
};

type SimRequestStatus = "pending" | "approved" | "rejected" | "in_progress" | "fulfilled";

type SimRequest = {
  id: string;
  quantity: number;
  operator: string;
  planName: string;
  requestedAt: string;
  status: SimRequestStatus;
  reason?: string;
};

const INITIAL_SIMS: SimRecord[] = [
  {
    id: "SIM-201",
    iccid: "8914800000000000011",
    phoneNumber: "+2348012345678",
    operator: "MTN",
    planName: "20GB",
    dataLimitGb: 20,
    dataUsedGb: 12.8,
    status: "active",
    assignedDeviceId: "DEV-1004",
    lastSync: "2026-04-02T08:20:00Z",
  },
  {
    id: "SIM-202",
    iccid: "8914800000000000012",
    phoneNumber: "+2348023456789",
    operator: "Airtel",
    planName: "10GB",
    dataLimitGb: 10,
    dataUsedGb: 9.4,
    status: "active",
    assignedDeviceId: "DEV-1005",
    lastSync: "2026-04-02T08:05:00Z",
  },
  {
    id: "SIM-203",
    iccid: "8914800000000000013",
    phoneNumber: "+2348034567890",
    operator: "Glo",
    planName: "5GB",
    dataLimitGb: 5,
    dataUsedGb: 5.6,
    status: "suspended",
    lastSync: "2026-04-01T17:10:00Z",
  },
  {
    id: "SIM-204",
    iccid: "8914800000000000014",
    phoneNumber: "+2348045678901",
    operator: "9mobile",
    planName: "1GB",
    dataLimitGb: 1,
    dataUsedGb: 0.2,
    status: "deactivated",
  },
  {
    id: "SIM-205",
    iccid: "8914800000000000015",
    phoneNumber: "+2348056789012",
    operator: "MTN",
    planName: "50GB",
    dataLimitGb: 50,
    dataUsedGb: 18.1,
    status: "active",
    assignedDeviceId: "DEV-1006",
    lastSync: "2026-04-02T08:32:00Z",
  },
];

const INITIAL_REQUESTS: SimRequest[] = [
  {
    id: "REQ-301",
    quantity: 12,
    operator: "MTN",
    planName: "20GB",
    requestedAt: "2026-04-01T12:00:00Z",
    status: "pending",
    reason: "New devices for Q2 rollout",
  },
  {
    id: "REQ-302",
    quantity: 5,
    operator: "Airtel",
    planName: "10GB",
    requestedAt: "2026-03-28T15:20:00Z",
    status: "approved",
    reason: "Backup SIM pool",
  },
];

const REGISTER_SCHEMA = z.object({
  iccid: z.string().min(19, "ICCID must be at least 19 digits").max(20, "ICCID must be 20 digits").regex(/^\d+$/, "ICCID must contain only digits"),
  phoneNumber: z.string().min(8, "Phone number is required"),
  operator: z.string().min(1, "Select an operator"),
  planName: z.string().min(1, "Select a plan"),
  dataLimitGb: z.number().min(0.1, "Data limit must be greater than 0"),
  dataUsedGb: z.number().min(0, "Usage cannot be negative"),
  status: z.enum(SIM_STATUSES),
});

type RegisterFormValues = z.infer<typeof REGISTER_SCHEMA>;

const REQUEST_SCHEMA = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1").max(500, "Max 500 SIMs per request"),
  operator: z.string().min(1, "Select an operator"),
  planName: z.string().min(1, "Select a plan"),
  reason: z.string().min(5, "Provide a short reason"),
});

type RequestFormValues = z.infer<typeof REQUEST_SCHEMA>;

function createId(prefix: string) {
  return `${prefix}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function formatDateTime(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
}

function usagePercent(sim: SimRecord) {
  if (!sim.dataLimitGb) return 0;
  return Math.min(100, Math.round((sim.dataUsedGb / sim.dataLimitGb) * 100));
}

function getAssignedDeviceLabel(deviceId?: string) {
  if (!deviceId) return "Unassigned";
  return DEVICES.find((device) => device.id === deviceId)?.label ?? "Assigned";
}

function RegisterSimDialog({
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
      iccid: "",
      phoneNumber: "",
      operator: "",
      planName: "",
      dataLimitGb: 10,
      dataUsedGb: 0,
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        iccid: "",
        phoneNumber: "",
        operator: "",
        planName: "",
        dataLimitGb: 10,
        dataUsedGb: 0,
        status: "active",
      });
    }
  }, [open, form]);

  const handleSubmit = (values: RegisterFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register SIM Card</DialogTitle>
          <DialogDescription>Capture SIM details for inventory tracking.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="iccid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ICCID</FormLabel>
                    <FormControl>
                      <Input placeholder="8914800000000000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+2348012345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map((operator) => (
                            <SelectItem key={operator} value={operator}>
                              {operator}
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
                name="planName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAN_OPTIONS.map((plan) => (
                            <SelectItem key={plan} value={plan}>
                              {plan}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIM_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dataLimitGb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Limit (GB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        {...field}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataUsedGb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Used (GB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        {...field}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Save SIM
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AssignSimDialog({
  open,
  onOpenChange,
  sim,
  onAssign,
  onUnassign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sim: SimRecord | null;
  onAssign: (deviceId: string) => void;
  onUnassign: () => void;
}) {
  const [selectedDevice, setSelectedDevice] = useState("");

  useEffect(() => {
    if (open) setSelectedDevice(sim?.assignedDeviceId ?? "");
  }, [open, sim]);

  if (!sim) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign SIM to Device</DialogTitle>
          <DialogDescription>
            {sim.operator} {sim.planName} - {sim.iccid}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger>
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent>
              {DEVICES.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-between">
            <Button variant="outline" onClick={onUnassign} disabled={!sim.assignedDeviceId}>
              Unassign
            </Button>
            <Button onClick={() => onAssign(selectedDevice)} disabled={!selectedDevice}>
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SimDetailsDialog({
  open,
  onOpenChange,
  sim,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sim: SimRecord | null;
}) {
  if (!sim) return null;

  const percent = usagePercent(sim);
  const overLimit = sim.dataUsedGb > sim.dataLimitGb;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>SIM Details</DialogTitle>
          <DialogDescription>Usage, assignment, and connectivity context.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">ICCID</p>
            <p className="font-medium">{sim.iccid}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone Number</p>
            <p className="font-medium">{sim.phoneNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Operator</p>
            <p className="font-medium">{sim.operator}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="font-medium">{sim.planName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={sim.status} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Assigned Device</p>
            <p className="font-medium">{getAssignedDeviceLabel(sim.assignedDeviceId)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Sync</p>
            <p className="font-medium">{formatDateTime(sim.lastSync)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Usage</p>
            <p className="font-medium">{sim.dataUsedGb}GB / {sim.dataLimitGb}GB</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Usage</span>
            <span>{percent}%</span>
          </div>
          <Progress value={percent} variant={overLimit ? "destructive" : percent > 85 ? "warning" : "success"} />
          {overLimit ? (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" />
              Data usage exceeded plan limit.
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RequestSimDialog({
  open,
  onOpenChange,
  onSubmit,
  kycVerified,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RequestFormValues) => void;
  kycVerified: boolean;
}) {
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(REQUEST_SCHEMA),
    defaultValues: {
      quantity: 5,
      operator: "",
      planName: "",
      reason: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ quantity: 5, operator: "", planName: "", reason: "" });
    }
  }, [open, form]);

  const handleSubmit = (values: RequestFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request New SIMs</DialogTitle>
          <DialogDescription>Submit a procurement request to the platform.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      {...field}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map((operator) => (
                            <SelectItem key={operator} value={operator}>
                              {operator}
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
                name="planName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAN_OPTIONS.map((plan) => (
                            <SelectItem key={plan} value={plan}>
                              {plan}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Why do you need new SIMs?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" isLoading={form.formState.isSubmitting} disabled={!kycVerified}>
                Submit request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function SIMManagement() {
  const { user } = useAuthStore();
  const role = user?.role;

  const isFleetManager = role === "FLEET_ADMIN";
  const isOpsAnalyst = role === "OPERATIONS_MANAGER";

  const [sims, setSims] = useState<SimRecord[]>(INITIAL_SIMS);
  const [requests, setRequests] = useState<SimRequest[]>(INITIAL_REQUESTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SimStatus | "all">("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedSimId, setSelectedSimId] = useState<string | null>(null);
  const [kycVerified, setKycVerified] = useState(false);

  const availableTabs = useMemo(() => {
    const tabs: Array<{ value: string; label: string }> = [];
    if (isFleetManager) tabs.push({ value: "inventory", label: "Inventory" });
    if (isOpsAnalyst) tabs.push({ value: "usage", label: "Usage" });
    if (isFleetManager) tabs.push({ value: "requests", label: "Requests" });
    return tabs.length ? tabs : [{ value: "inventory", label: "Inventory" }];
  }, [isFleetManager, isOpsAnalyst]);

  const [activeTab, setActiveTab] = useState(availableTabs[0].value);

  useEffect(() => {
    if (!availableTabs.find((tab) => tab.value === activeTab)) {
      setActiveTab(availableTabs[0].value);
    }
  }, [availableTabs, activeTab]);

  const selectedSim = useMemo(
    () => sims.find((sim) => sim.id === selectedSimId) ?? null,
    [sims, selectedSimId],
  );

  const filteredSims = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sims.filter((sim) => {
      const matchesStatus = statusFilter === "all" || sim.status === statusFilter;
      const matchesOperator = operatorFilter === "all" || sim.operator === operatorFilter;
      const matchesSearch = !query
        || sim.iccid.toLowerCase().includes(query)
        || sim.phoneNumber.toLowerCase().includes(query)
        || sim.operator.toLowerCase().includes(query)
        || sim.planName.toLowerCase().includes(query);
      return matchesStatus && matchesOperator && matchesSearch;
    });
  }, [sims, search, statusFilter, operatorFilter]);

  const usageRows = useMemo(() => {
    return sims.map((sim) => ({
      ...sim,
      percent: usagePercent(sim),
      overLimit: sim.dataUsedGb > sim.dataLimitGb,
    }));
  }, [sims]);

  const usageTotals = useMemo(() => {
    const totalUsed = sims.reduce((sum, sim) => sum + sim.dataUsedGb, 0);
    const totalLimit = sims.reduce((sum, sim) => sum + sim.dataLimitGb, 0);
    const avgPercent = sims.length ? Math.round((totalUsed / totalLimit) * 100) : 0;
    const overLimitCount = sims.filter((sim) => sim.dataUsedGb > sim.dataLimitGb).length;
    return { totalUsed, totalLimit, avgPercent, overLimitCount };
  }, [sims]);

  const handleRegister = (values: RegisterFormValues) => {
    const newSim: SimRecord = {
      id: createId("SIM"),
      iccid: values.iccid,
      phoneNumber: values.phoneNumber,
      operator: values.operator,
      planName: values.planName,
      dataLimitGb: values.dataLimitGb,
      dataUsedGb: values.dataUsedGb,
      status: values.status,
    };
    setSims((prev) => [newSim, ...prev]);
    setRegisterOpen(false);
  };

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    const imported = rows
      .filter((row) => row["ICCID"] || row["iccid"])
      .map((row) => ({
        id: createId("SIM"),
        iccid: row["ICCID"] || row["iccid"],
        phoneNumber: row["Phone Number"] || row["phoneNumber"] || "",
        operator: row["Operator"] || row["operator"] || "MTN",
        planName: row["Plan"] || row["planName"] || "10GB",
        dataLimitGb: Number(row["Limit GB"] || row["dataLimitGb"] || 10),
        dataUsedGb: Number(row["Used GB"] || row["dataUsedGb"] || 0),
        status: (row["Status"] || row["status"] || "active") as SimStatus,
      }));
    if (imported.length) {
      setSims((prev) => [...imported, ...prev]);
    }
  };

  const updateSim = (simId: string, updater: (sim: SimRecord) => SimRecord) => {
    setSims((prev) => prev.map((sim) => (sim.id === simId ? updater(sim) : sim)));
  };

  const handleAssign = (deviceId: string) => {
    if (!selectedSim) return;
    updateSim(selectedSim.id, (sim) => ({ ...sim, assignedDeviceId: deviceId }));
    setAssignOpen(false);
  };

  const handleUnassign = () => {
    if (!selectedSim) return;
    updateSim(selectedSim.id, (sim) => ({ ...sim, assignedDeviceId: undefined }));
    setAssignOpen(false);
  };

  const handleRequest = (values: RequestFormValues) => {
    const newRequest: SimRequest = {
      id: createId("REQ"),
      quantity: values.quantity,
      operator: values.operator,
      planName: values.planName,
      requestedAt: new Date().toISOString(),
      status: "pending",
      reason: values.reason,
    };
    setRequests((prev) => [newRequest, ...prev]);
    setRequestOpen(false);
  };

  const simColumns: ColumnDef<SimRecord>[] = [
    {
      accessorKey: "iccid",
      header: "ICCID",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.iccid}</p>
          <p className="text-xs text-muted-foreground">{row.original.phoneNumber}</p>
        </div>
      ),
    },
    {
      accessorKey: "operator",
      header: "Operator",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.operator}</p>
          <p className="text-xs text-muted-foreground">{row.original.planName}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "assignment",
      header: "Assigned Device",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{getAssignedDeviceLabel(row.original.assignedDeviceId)}</span>
      ),
    },
    {
      accessorKey: "usage",
      header: "Usage",
      cell: ({ row }) => {
        const percent = usagePercent(row.original);
        const overLimit = row.original.dataUsedGb > row.original.dataLimitGb;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{row.original.dataUsedGb}GB / {row.original.dataLimitGb}GB</span>
              <span>{percent}%</span>
            </div>
            <Progress value={percent} variant={overLimit ? "destructive" : percent > 85 ? "warning" : "success"} />
          </div>
        );
      },
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
                setSelectedSimId(row.original.id);
                setDetailsOpen(true);
              }}
            >
              <Settings2 className="h-4 w-4" />
              View details
            </DropdownMenuItem>
            {isFleetManager ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSimId(row.original.id);
                    setAssignOpen(true);
                  }}
                >
                  <Radio className="h-4 w-4" />
                  Assign or unassign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateSim(row.original.id, (sim) => ({ ...sim, status: "active" }))}>
                  Mark active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateSim(row.original.id, (sim) => ({ ...sim, status: "suspended" }))}>
                  Suspend SIM
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateSim(row.original.id, (sim) => ({ ...sim, status: "deactivated" }))}>
                  Deactivate SIM
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const usageColumns: ColumnDef<(SimRecord & { percent: number; overLimit: boolean })>[] = [
    {
      accessorKey: "sim",
      header: "SIM",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.iccid}</p>
          <p className="text-xs text-muted-foreground">{row.original.operator} - {row.original.planName}</p>
        </div>
      ),
    },
    {
      accessorKey: "usage",
      header: "Usage",
      cell: ({ row }) => (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{row.original.dataUsedGb}GB / {row.original.dataLimitGb}GB</span>
            <span>{row.original.percent}%</span>
          </div>
          <Progress
            value={row.original.percent}
            variant={row.original.overLimit ? "destructive" : row.original.percent > 85 ? "warning" : "success"}
          />
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn(
          row.original.overLimit ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
        )}>
          {row.original.overLimit ? "Over limit" : "Within limit"}
        </Badge>
      ),
    },
    {
      accessorKey: "lastSync",
      header: "Last Sync",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(row.original.lastSync)}</span>
      ),
    },
  ];

  const requestColumns: ColumnDef<SimRequest>[] = [
    {
      accessorKey: "request",
      header: "Request",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.quantity} SIMs</p>
          <p className="text-xs text-muted-foreground">{row.original.operator} - {row.original.planName}</p>
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
      accessorKey: "requestedAt",
      header: "Requested",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(row.original.requestedAt)}</span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.reason ?? ""}</span>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active SIMs</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{sims.filter((sim) => sim.status === "active").length}</div>
            <Signal className="h-5 w-5 text-success" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{sims.filter((sim) => sim.status === "suspended").length}</div>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Over Limit</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{usageTotals.overLimitCount}</div>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Usage</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{usageTotals.avgPercent}%</div>
            <CheckCircle2 className="h-5 w-5 text-success" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList className="bg-muted/40">
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex flex-wrap gap-2">
            {isFleetManager ? (
              <>
                <BulkUploadModal
                  title="Bulk Import SIMs"
                  description="Upload a CSV file to register multiple SIM cards at once."
                  templateUrl="/templates/sim_import_template.csv"
                  onUpload={handleBulkImport}
                />
                <Button onClick={() => setRegisterOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Register SIM
                </Button>
                <Button variant="outline" onClick={() => setRequestOpen(true)}>
                  <Download className="h-4 w-4" />
                  Request SIMs
                </Button>
              </>
            ) : null}
            <Button variant="outline" onClick={() => setSims([...sims])}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {isFleetManager ? (
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SIM Inventory</CardTitle>
                <CardDescription>Manage SIM status, assignment, and usage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search ICCID, phone, operator..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SimStatus | "all")}>
                    <SelectTrigger className="w-full md:w-44">
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      {SIM_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                    <SelectTrigger className="w-full md:w-44">
                      <SelectValue placeholder="All operators" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All operators</SelectItem>
                      {OPERATORS.map((operator) => (
                        <SelectItem key={operator} value={operator}>
                          {operator}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DataTable
                  columns={simColumns}
                  data={filteredSims}
                  noResultStatement="No SIM cards found."
                />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {isOpsAnalyst ? (
          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SIM Usage</CardTitle>
                <CardDescription>Monitor usage against plan limits.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={usageColumns}
                  data={usageRows}
                  noResultStatement="No usage data available."
                />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {isFleetManager ? (
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SIM Requests</CardTitle>
                <CardDescription>Track procurement requests sent to the platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium">Tenant KYC status</p>
                    <p className="text-xs text-muted-foreground">
                      SIM requests are blocked until KYC is verified.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(kycVerified ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                      {kycVerified ? "KYC verified" : "KYC pending"}
                    </Badge>
                    <Switch checked={kycVerified} onCheckedChange={setKycVerified} />
                  </div>
                </div>
                <DataTable
                  columns={requestColumns}
                  data={requests}
                  noResultStatement="No SIM requests yet."
                />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>

      <RegisterSimDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSubmit={handleRegister}
      />

      <AssignSimDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        sim={selectedSim}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
      />

      <SimDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        sim={selectedSim}
      />

      <RequestSimDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        onSubmit={handleRequest}
        kycVerified={kycVerified}
      />
    </section>
  );
}
