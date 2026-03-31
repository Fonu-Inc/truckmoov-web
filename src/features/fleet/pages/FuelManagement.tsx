import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  Download,
  Droplets,
  Eye,
  Gauge,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import DeleteDialog from "@/shared/components/DeleteDialog";
import { useAuthStore } from "@/stores/authStore";

const VEHICLE_TYPES = ["tractor", "rigid", "van", "pickup"] as const;
type VehicleType = (typeof VEHICLE_TYPES)[number];

const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  tractor: "Tractor",
  rigid: "Rigid Truck",
  van: "Van",
  pickup: "Pickup",
};

type AuditEntry = {
  id: string;
  action: "created" | "edited" | "deleted";
  actor: string;
  at: string;
  note?: string;
};

type FuelTransaction = {
  id: string;
  vehicle: string;
  vehicleType: VehicleType;
  driver: string;
  liters: number;
  pricePerLiter: number;
  station: string;
  odometer: number;
  recordedAt: string;
  status: "active" | "deleted";
  auditTrail: AuditEntry[];
};

type EfficiencyRow = {
  vehicle: string;
  vehicleType: VehicleType;
  totalLiters: number;
  distanceKm: number;
  kmPerLiter: number;
  threshold: number;
  belowThreshold: boolean;
};

type ExportRecord = {
  id: string;
  type: "transactions" | "efficiency";
  status: "queued" | "ready";
  requestedAt: string;
};

type FuelThreshold = {
  vehicleType: VehicleType;
  minKmPerLiter: number;
  updatedAt: string;
};

const TRANSACTION_SCHEMA = z.object({
  vehicle: z.string().min(1, "Vehicle is required"),
  vehicleType: z.enum(VEHICLE_TYPES),
  driver: z.string().min(1, "Driver is required"),
  liters: z.coerce.number().positive("Liters must be greater than 0"),
  pricePerLiter: z.coerce.number().positive("Price per liter must be greater than 0"),
  station: z.string().min(1, "Station is required"),
  odometer: z.coerce.number().positive("Odometer is required"),
  note: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof TRANSACTION_SCHEMA>;

const THRESHOLD_SCHEMA = z.object({
  vehicleType: z.enum(VEHICLE_TYPES),
  minKmPerLiter: z.coerce.number().positive("Threshold must be greater than 0"),
});

type ThresholdFormValues = z.infer<typeof THRESHOLD_SCHEMA>;

const WEEKLY_CONSUMPTION = [
  { label: "Mon", liters: 520, cost: 338000 },
  { label: "Tue", liters: 610, cost: 402000 },
  { label: "Wed", liters: 575, cost: 382000 },
  { label: "Thu", liters: 690, cost: 451000 },
  { label: "Fri", liters: 640, cost: 418000 },
  { label: "Sat", liters: 480, cost: 312000 },
  { label: "Sun", liters: 430, cost: 279000 },
];

const MONTHLY_CONSUMPTION = [
  { label: "Jan", liters: 6200, cost: 4060000 },
  { label: "Feb", liters: 5880, cost: 3820000 },
  { label: "Mar", liters: 6540, cost: 4260000 },
  { label: "Apr", liters: 6120, cost: 3980000 },
  { label: "May", liters: 7050, cost: 4620000 },
  { label: "Jun", liters: 6810, cost: 4440000 },
];

const INITIAL_TRANSACTIONS: FuelTransaction[] = [
  {
    id: "FUEL-1001",
    vehicle: "TMV-401",
    vehicleType: "tractor",
    driver: "Kemi Ojo",
    liters: 180,
    pricePerLiter: 655,
    station: "TotalEnergies Lekki",
    odometer: 48230,
    recordedAt: "2026-03-31T07:30:00Z",
    status: "active",
    auditTrail: [
      {
        id: "AUD-9001",
        action: "created",
        actor: "Fleet Admin",
        at: "2026-03-31T07:30:00Z",
      },
    ],
  },
  {
    id: "FUEL-1002",
    vehicle: "TMV-118",
    vehicleType: "rigid",
    driver: "Tunde Balogun",
    liters: 140,
    pricePerLiter: 648,
    station: "Oando Apapa",
    odometer: 37610,
    recordedAt: "2026-03-30T16:18:00Z",
    status: "active",
    auditTrail: [
      {
        id: "AUD-9002",
        action: "created",
        actor: "Fleet Admin",
        at: "2026-03-30T16:18:00Z",
      },
    ],
  },
  {
    id: "FUEL-1003",
    vehicle: "TMV-233",
    vehicleType: "van",
    driver: "Amina Yusuf",
    liters: 65,
    pricePerLiter: 670,
    station: "Mobil Ikeja",
    odometer: 19240,
    recordedAt: "2026-03-30T11:02:00Z",
    status: "active",
    auditTrail: [
      {
        id: "AUD-9003",
        action: "created",
        actor: "Fleet Admin",
        at: "2026-03-30T11:02:00Z",
      },
    ],
  },
  {
    id: "FUEL-1004",
    vehicle: "TMV-512",
    vehicleType: "pickup",
    driver: "Rita Nwosu",
    liters: 48,
    pricePerLiter: 662,
    station: "NNPC Ojota",
    odometer: 14590,
    recordedAt: "2026-03-29T09:40:00Z",
    status: "active",
    auditTrail: [
      {
        id: "AUD-9004",
        action: "created",
        actor: "Fleet Admin",
        at: "2026-03-29T09:40:00Z",
      },
    ],
  },
  {
    id: "FUEL-1005",
    vehicle: "TMV-090",
    vehicleType: "rigid",
    driver: "Bode Adebayo",
    liters: 130,
    pricePerLiter: 650,
    station: "Enyo Ikorodu",
    odometer: 33010,
    recordedAt: "2026-03-28T14:15:00Z",
    status: "deleted",
    auditTrail: [
      {
        id: "AUD-9005",
        action: "created",
        actor: "Fleet Admin",
        at: "2026-03-28T14:15:00Z",
      },
      {
        id: "AUD-9006",
        action: "deleted",
        actor: "Fleet Admin",
        at: "2026-03-29T10:04:00Z",
        note: "Duplicate entry removed",
      },
    ],
  },
];

const INITIAL_THRESHOLDS: FuelThreshold[] = [
  { vehicleType: "tractor", minKmPerLiter: 3.8, updatedAt: "2026-03-01T08:00:00Z" },
  { vehicleType: "rigid", minKmPerLiter: 4.6, updatedAt: "2026-03-01T08:00:00Z" },
  { vehicleType: "van", minKmPerLiter: 8.2, updatedAt: "2026-03-01T08:00:00Z" },
  { vehicleType: "pickup", minKmPerLiter: 9.1, updatedAt: "2026-03-01T08:00:00Z" },
];

const INITIAL_EXPORTS: ExportRecord[] = [
  { id: "EXP-701", type: "transactions", status: "ready", requestedAt: "2026-03-30T12:10:00Z" },
  { id: "EXP-702", type: "efficiency", status: "queued", requestedAt: "2026-03-31T06:30:00Z" },
];

function formatCurrency(value: number) {
  return `NGN ${Math.round(value).toLocaleString()}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
}

function FuelTransactionDialog({
  open,
  onOpenChange,
  mode,
  initialValues,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialValues?: FuelTransaction | null;
  onSubmit: (values: TransactionFormValues) => void;
}) {
  const defaultValues: TransactionFormValues = {
    vehicle: initialValues?.vehicle ?? "",
    vehicleType: initialValues?.vehicleType ?? "tractor",
    driver: initialValues?.driver ?? "",
    liters: initialValues?.liters ?? 0,
    pricePerLiter: initialValues?.pricePerLiter ?? 0,
    station: initialValues?.station ?? "",
    odometer: initialValues?.odometer ?? 0,
    note: "",
  };

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(TRANSACTION_SCHEMA),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [initialValues, open]);

  const handleSubmit = (values: TransactionFormValues) => {
    onSubmit(values);
    form.reset(defaultValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Record Fuel Transaction" : "Edit Fuel Transaction"}</DialogTitle>
          <DialogDescription>
            Capture vehicle, driver, liters, price per liter, station, and odometer details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vehicle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. TMV-401" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {VEHICLE_TYPE_LABELS[type]}
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
                name="driver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver</FormLabel>
                    <FormControl>
                      <Input placeholder="Driver name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="station"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station</FormLabel>
                    <FormControl>
                      <Input placeholder="Fuel station" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="liters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liters</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pricePerLiter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Liter (NGN)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer (km)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audit Note</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Add context for this change (optional)." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                {mode === "create" ? "Save Transaction" : "Update Transaction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TransactionDetailsDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: FuelTransaction | null;
}) {
  if (!transaction) return null;

  const totalCost = transaction.liters * transaction.pricePerLiter;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fuel Transaction Details</DialogTitle>
          <DialogDescription>Audit trail and full transaction context.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Vehicle</p>
              <p className="font-medium">{transaction.vehicle}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Driver</p>
              <p className="font-medium">{transaction.driver}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Station</p>
              <p className="font-medium">{transaction.station}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recorded</p>
              <p className="font-medium">{formatDate(transaction.recordedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Liters</p>
              <p className="font-medium">{transaction.liters.toFixed(1)} L</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="font-medium">{formatCurrency(totalCost)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Audit Trail</p>
            <div className="mt-2 space-y-2">
              {transaction.auditTrail.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border/50 p-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {entry.action}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{entry.actor}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.at)}</span>
                  </div>
                  {entry.note ? <p className="mt-2 text-sm text-muted-foreground">{entry.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FuelManagement() {
  const { user } = useAuthStore();
  const role = user?.role;
  const actorName = user?.profile?.fullName ?? user?.email ?? "Current User";

  const isFleetAdmin = role === "FLEET_ADMIN";
  const isOpsAnalyst = role === "OPERATIONS_MANAGER";
  const isEnterpriseAdmin = role === "ENTERPRISE_ADMIN";

  const [transactions, setTransactions] = useState<FuelTransaction[]>(INITIAL_TRANSACTIONS);
  const [thresholds, setThresholds] = useState<FuelThreshold[]>(INITIAL_THRESHOLDS);
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>(INITIAL_EXPORTS);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deleted">("all");

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FuelTransaction | null>(null);

  const thresholdForm = useForm<ThresholdFormValues>({
    resolver: zodResolver(THRESHOLD_SCHEMA),
    defaultValues: {
      vehicleType: "tractor",
      minKmPerLiter: 4,
    },
  });

  const availableTabs = useMemo(() => {
    const tabs: Array<{ value: string; label: string }> = [];
    if (isFleetAdmin) {
      tabs.push({ value: "transactions", label: "Transactions" });
      tabs.push({ value: "alerts", label: "Alerts" });
    }
    if (isOpsAnalyst) {
      tabs.push({ value: "analytics", label: "Consumption" });
      tabs.push({ value: "efficiency", label: "Efficiency" });
    }
    tabs.push({ value: "exports", label: "Exports" });
    if (isEnterpriseAdmin) {
      tabs.push({ value: "thresholds", label: "Thresholds" });
    }
    return tabs;
  }, [isFleetAdmin, isOpsAnalyst, isEnterpriseAdmin]);

  const defaultTab = availableTabs[0]?.value ?? "exports";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (!availableTabs.find((tab) => tab.value === activeTab)) {
      setActiveTab(defaultTab);
    }
  }, [availableTabs, activeTab, defaultTab]);

  const activeTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === "active"),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
      const matchesSearch = !query
        || transaction.vehicle.toLowerCase().includes(query)
        || transaction.driver.toLowerCase().includes(query)
        || transaction.station.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [transactions, searchQuery, statusFilter]);

  const totals = useMemo(() => {
    const totalLiters = activeTransactions.reduce((sum, transaction) => sum + transaction.liters, 0);
    const totalCost = activeTransactions.reduce(
      (sum, transaction) => sum + transaction.liters * transaction.pricePerLiter,
      0,
    );
    const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;
    return { totalLiters, totalCost, avgPrice };
  }, [activeTransactions]);

  const efficiencyRows = useMemo(() => {
    const thresholdMap = new Map(thresholds.map((item) => [item.vehicleType, item.minKmPerLiter]));
    const byVehicle = new Map<string, FuelTransaction[]>();

    activeTransactions.forEach((transaction) => {
      const list = byVehicle.get(transaction.vehicle) ?? [];
      list.push(transaction);
      byVehicle.set(transaction.vehicle, list);
    });

    return Array.from(byVehicle.entries()).map(([vehicle, entries]) => {
      const sorted = [...entries].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
      const distanceKm = sorted.length > 1 ? sorted[sorted.length - 1].odometer - sorted[0].odometer : 0;
      const totalLiters = sorted.reduce((sum, txn) => sum + txn.liters, 0);
      const kmPerLiter = totalLiters > 0 && distanceKm > 0 ? distanceKm / totalLiters : 0;
      const vehicleType = sorted[0]?.vehicleType ?? "tractor";
      const threshold = thresholdMap.get(vehicleType) ?? 0;
      const belowThreshold = threshold > 0 && kmPerLiter > 0 && kmPerLiter < threshold;
      return {
        vehicle,
        vehicleType,
        totalLiters,
        distanceKm,
        kmPerLiter,
        threshold,
        belowThreshold,
      } satisfies EfficiencyRow;
    });
  }, [activeTransactions, thresholds]);

  const lowEfficiencyVehicles = efficiencyRows.filter((row) => row.belowThreshold);

  const handleCreateTransaction = (values: TransactionFormValues) => {
    const created: FuelTransaction = {
      id: `FUEL-${Date.now().toString().slice(-4)}`,
      vehicle: values.vehicle,
      vehicleType: values.vehicleType,
      driver: values.driver,
      liters: values.liters,
      pricePerLiter: values.pricePerLiter,
      station: values.station,
      odometer: values.odometer,
      recordedAt: new Date().toISOString(),
      status: "active",
      auditTrail: [
        {
          id: `AUD-${Date.now().toString().slice(-5)}`,
          action: "created",
          actor: actorName,
          at: new Date().toISOString(),
          note: values.note,
        },
      ],
    };
    setTransactions((prev) => [created, ...prev]);
    setTransactionDialogOpen(false);
  };

  const handleEditTransaction = (values: TransactionFormValues) => {
    if (!selectedTransaction) return;
    setTransactions((prev) =>
      prev.map((txn) => {
        if (txn.id !== selectedTransaction.id) return txn;
        return {
          ...txn,
          vehicle: values.vehicle,
          vehicleType: values.vehicleType,
          driver: values.driver,
          liters: values.liters,
          pricePerLiter: values.pricePerLiter,
          station: values.station,
          odometer: values.odometer,
          auditTrail: [
            {
              id: `AUD-${Date.now().toString().slice(-5)}`,
              action: "edited",
              actor: actorName,
              at: new Date().toISOString(),
              note: values.note,
            },
            ...txn.auditTrail,
          ],
        };
      }),
    );
    setEditDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    setTransactions((prev) =>
      prev.map((txn) => {
        if (txn.id !== selectedTransaction.id) return txn;
        return {
          ...txn,
          status: "deleted",
          auditTrail: [
            {
              id: `AUD-${Date.now().toString().slice(-5)}`,
              action: "deleted",
              actor: actorName,
              at: new Date().toISOString(),
              note: "Marked as deleted from UI",
            },
            ...txn.auditTrail,
          ],
        };
      }),
    );
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleExport = (type: ExportRecord["type"]) => {
    const created: ExportRecord = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      type,
      status: "queued",
      requestedAt: new Date().toISOString(),
    };
    setExportHistory((prev) => [created, ...prev]);
  };

  const handleThresholdSubmit = (values: ThresholdFormValues) => {
    setThresholds((prev) => {
      const existing = prev.find((item) => item.vehicleType === values.vehicleType);
      if (existing) {
        return prev.map((item) =>
          item.vehicleType === values.vehicleType
            ? { ...item, minKmPerLiter: values.minKmPerLiter, updatedAt: new Date().toISOString() }
            : item,
        );
      }
      return [
        {
          vehicleType: values.vehicleType,
          minKmPerLiter: values.minKmPerLiter,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
    thresholdForm.reset({ vehicleType: values.vehicleType, minKmPerLiter: values.minKmPerLiter });
  };

  const transactionColumns: ColumnDef<FuelTransaction>[] = [
    {
      accessorKey: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.vehicle}</p>
          <p className="text-xs text-muted-foreground">{VEHICLE_TYPE_LABELS[row.original.vehicleType]}</p>
        </div>
      ),
    },
    {
      accessorKey: "driver",
      header: "Driver",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.driver}</span>,
    },
    {
      accessorKey: "liters",
      header: "Liters",
      cell: ({ row }) => <span className="text-sm">{row.original.liters.toFixed(1)} L</span>,
    },
    {
      accessorKey: "pricePerLiter",
      header: "Price/L",
      cell: ({ row }) => <span className="text-sm">{formatCurrency(row.original.pricePerLiter)}</span>,
    },
    {
      accessorKey: "totalCost",
      header: "Total",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{formatCurrency(row.original.liters * row.original.pricePerLiter)}</span>
      ),
    },
    {
      accessorKey: "station",
      header: "Station",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.station}</span>,
    },
    {
      accessorKey: "odometer",
      header: "Odometer",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.odometer} km</span>,
    },
    {
      accessorKey: "recordedAt",
      header: "Recorded",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.recordedAt)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn("capitalize", row.original.status === "deleted" && "bg-muted text-muted-foreground")}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedTransaction(row.original);
                setDetailsOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            {isFleetAdmin && row.original.status !== "deleted" ? (
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTransaction(row.original);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            ) : null}
            {isFleetAdmin && row.original.status !== "deleted" ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedTransaction(row.original);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const efficiencyColumns: ColumnDef<EfficiencyRow>[] = [
    {
      accessorKey: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.vehicle}</p>
          <p className="text-xs text-muted-foreground">{VEHICLE_TYPE_LABELS[row.original.vehicleType]}</p>
        </div>
      ),
    },
    {
      accessorKey: "distanceKm",
      header: "Distance",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.distanceKm.toFixed(0)} km</span>,
    },
    {
      accessorKey: "totalLiters",
      header: "Liters",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.totalLiters.toFixed(1)} L</span>,
    },
    {
      accessorKey: "kmPerLiter",
      header: "Km/L",
      cell: ({ row }) => (
        <div className="space-y-2">
          <Progress
            value={
              row.original.threshold > 0
                ? Math.min(100, (row.original.kmPerLiter / row.original.threshold) * 100)
                : 0
            }
            className={cn("h-2", row.original.belowThreshold && "[&>div]:bg-destructive")}
          />
          <span className="text-sm font-medium">{row.original.kmPerLiter.toFixed(1)} km/L</span>
        </div>
      ),
    },
    {
      accessorKey: "threshold",
      header: "Threshold",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.threshold.toFixed(1)} km/L</span>,
    },
    {
      accessorKey: "belowThreshold",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "capitalize",
            row.original.belowThreshold ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
          )}
        >
          {row.original.belowThreshold ? "Below" : "Healthy"}
        </Badge>
      ),
    },
  ];

  const exportColumns: ColumnDef<ExportRecord>[] = [
    {
      accessorKey: "type",
      header: "Export",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "requestedAt",
      header: "Requested",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.requestedAt)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn("capitalize", row.original.status === "queued" && "bg-warning/10 text-warning")}
        >
          {row.original.status}
        </Badge>
      ),
    },
  ];

  const thresholdColumns: ColumnDef<FuelThreshold>[] = [
    {
      accessorKey: "vehicleType",
      header: "Vehicle Type",
      cell: ({ row }) => <span className="text-sm font-medium">{VEHICLE_TYPE_LABELS[row.original.vehicleType]}</span>,
    },
    {
      accessorKey: "minKmPerLiter",
      header: "Min Km/L",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.minKmPerLiter.toFixed(1)} km/L</span>,
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.updatedAt)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                thresholdForm.reset({
                  vehicleType: row.original.vehicleType,
                  minKmPerLiter: row.original.minKmPerLiter,
                })
              }
            >
              Edit threshold
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() =>
                setThresholds((prev) => prev.filter((item) => item.vehicleType !== row.original.vehicleType))
              }
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Liters</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{totals.totalLiters.toFixed(0)} L</div>
            <Droplets className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spend</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{formatCurrency(totals.totalCost)}</div>
            <DollarSign className="h-5 w-5 text-success" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Price/L</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">
              {totals.avgPrice > 0 ? `${formatCurrency(totals.avgPrice)}/L` : "-"}
            </div>
            <Gauge className="h-5 w-5 text-warning" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{lowEfficiencyVehicles.length}</div>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList className="bg-muted/50">
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleExport("transactions")}>
              <Download className="mr-2 h-4 w-4" />
              Export transactions
            </Button>
            <Button variant="outline" onClick={() => handleExport("efficiency")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Export efficiency
            </Button>
            {isFleetAdmin ? (
              <Button onClick={() => setTransactionDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record fueling
              </Button>
            ) : null}
          </div>
        </div>

        {isFleetAdmin ? (
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search vehicle, driver, station..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "deleted")}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={transactionColumns}
              data={filteredTransactions}
              noResultStatement="No fuel transactions found."
            />
          </TabsContent>
        ) : null}

        {isOpsAnalyst ? (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Weekly Consumption</CardTitle>
                  <CardDescription>Fuel usage and spend by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={WEEKLY_CONSUMPTION}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="liters" name="Liters" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cost" name="Cost (NGN)" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Consumption</CardTitle>
                  <CardDescription>Trendline for total liters per month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={MONTHLY_CONSUMPTION}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="liters"
                        name="Liters"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ) : null}

        {isOpsAnalyst ? (
          <TabsContent value="efficiency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Fuel Efficiency</CardTitle>
                <CardDescription>Computed from odometer deltas and fueling volume.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={efficiencyColumns}
                  data={efficiencyRows}
                  noResultStatement="Record more transactions with odometer readings to compute efficiency."
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Low Efficiency Alerts</CardTitle>
                <CardDescription>Vehicles falling below configured thresholds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowEfficiencyVehicles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No vehicles are below threshold.</p>
                ) : (
                  lowEfficiencyVehicles.map((vehicle) => (
                    <div key={vehicle.vehicle} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                      <div>
                        <p className="font-medium">{vehicle.vehicle}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.kmPerLiter.toFixed(1)} km/L vs {vehicle.threshold.toFixed(1)} km/L threshold
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive">Investigate</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {isFleetAdmin ? (
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fuel Efficiency Alerts</CardTitle>
                <CardDescription>Low efficiency vehicles flagged for review.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowEfficiencyVehicles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No alerts right now.</p>
                ) : (
                  lowEfficiencyVehicles.map((vehicle) => (
                    <div key={vehicle.vehicle} className="flex flex-col gap-2 rounded-lg border border-border/50 p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{vehicle.vehicle}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.kmPerLiter.toFixed(1)} km/L (threshold {vehicle.threshold.toFixed(1)} km/L)
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>Exports generated for fuel transactions and efficiency reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={exportColumns} data={exportHistory} noResultStatement="No exports requested yet." />
            </CardContent>
          </Card>
        </TabsContent>

        {isEnterpriseAdmin ? (
          <TabsContent value="thresholds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Thresholds</CardTitle>
                <CardDescription>Configure minimum km/L by vehicle type.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...thresholdForm}>
                  <form className="grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={thresholdForm.handleSubmit(handleThresholdSubmit)}>
                    <FormField
                      control={thresholdForm.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Type</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {VEHICLE_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {VEHICLE_TYPE_LABELS[type]}
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
                      control={thresholdForm.control}
                      name="minKmPerLiter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Km/L</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end">
                      <Button type="submit" isLoading={thresholdForm.formState.isSubmitting}>
                        Save threshold
                      </Button>
                    </div>
                  </form>
                </Form>

                <DataTable
                  columns={thresholdColumns}
                  data={thresholds}
                  noResultStatement="No thresholds configured yet."
                />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>

      <FuelTransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        mode="create"
        onSubmit={handleCreateTransaction}
      />

      <FuelTransactionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        mode="edit"
        initialValues={selectedTransaction}
        onSubmit={handleEditTransaction}
      />

      <TransactionDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        transaction={selectedTransaction}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        handleDeleteFn={handleDeleteTransaction}
        isLoading={false}
        title="Delete fuel transaction?"
        description="This will keep an audit trail and mark the record as deleted."
      />
    </section>
  );
}
