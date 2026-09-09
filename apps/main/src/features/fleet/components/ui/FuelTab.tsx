import type { ColumnDef } from "@tanstack/react-table";
import type {
  FleetDriver, FuelConsumptionBucket, FuelRecord, Vehicle, VehicleEfficiency,
} from "@truckmoov/api/fleet";
import type { PeriodValue } from "./PeriodFilter";
import {
  exportFuelTransactions, useDeleteFuelTransaction, useDrivers, useFuelBudgetVsActual, useFuelEfficiency, useFuelMetrics, useFuelSummary, useFuelTransactionsList, useFuelWeeklyAnalytics, useRecordFuelTransaction, useUpdateFuelTransaction, useVehicles, useVehiclesByTab,
} from "@truckmoov/api/fleet";
import {
  formatDate, formatDayMonth, formatDayMonthTime, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, CalendarIcon, DollarSign, Download, Droplets, Edit, Eye, Fuel, Gauge, Loader2, MoreHorizontal, Plus, Search, SlidersHorizontal, Trash2, Truck,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { Calendar } from "@/components/shadcn/calendar";
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
import { Progress } from "@/components/shadcn/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";

import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { cn } from "@/lib/utils";
import { PeriodFilter } from "./PeriodFilter";

type FuelTransaction = FuelRecord;

type BudgetChartPoint = {
  label: string;
  budgetedNgn: number;
  actualNgn: number;
  variance: number;
  utilizationPct: number;
  periodType: string;
};

type FuelConsumptionChartPoint = {
  label: string;
  // dynamic fuel-type keys populated at runtime; also keep diesel/petrol for legacy monthly bucket path
  [fuelType: string]: number | string;
};

type FuelMetricsPeriod = "weekly" | "monthly";

const FUEL_METRIC_PERIOD_LABEL: Record<FuelMetricsPeriod, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
};

function getFuelTypeLiters(bucket: FuelConsumptionBucket, fuelType: "diesel" | "petrol") {
  const byFuelType = bucket.byFuelType ?? {};
  const fuelTypeMetrics
    = byFuelType[fuelType]
      ?? byFuelType[fuelType.toUpperCase()]
      ?? byFuelType[fuelType.charAt(0).toUpperCase() + fuelType.slice(1)];

  return fuelTypeMetrics?.liters ?? 0;
}

function getEfficiencyProgressValue(vehicle: VehicleEfficiency) {
  if (vehicle.kmPerLiter === null)
    return 0;
  const target = vehicle.threshold && vehicle.threshold > 0 ? vehicle.threshold * 2 : 15;
  return Math.min(
    (vehicle.kmPerLiter / target) * 100,
    100,
  );
}

function getPeriodRange(period: PeriodValue) {
  const today = new Date();
  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const start = new Date(end);

  if (period === "1") {
    start.setDate(end.getDate() - 1);
    end.setDate(end.getDate() - 1);
  }
  else if (period !== "0") {
    start.setDate(end.getDate() - Number(period) + 1);
  }

  return {
    from: toDateParam(start),
    to: toDateParam(end),
  };
}

function formatNgn(value: number) {
  return `NGN ${value.toLocaleString()}`;
}

function formatBudgetWindow(start?: string, end?: string) {
  if (!start || !end)
    return "Selected period";
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function getVehicleRegistration(vehicle: Vehicle) {
  return vehicle.registrationNumber || vehicle.plateNumber || "";
}

function getVehicleOptionLabel(vehicle: Vehicle) {
  const registration = getVehicleRegistration(vehicle);
  const descriptor = [
    vehicle.make,
    vehicle.model,
  ].filter(Boolean).join(" ");
  return descriptor ? `${registration} - ${descriptor}` : registration;
}

function getDriverDisplayName(driver: FleetDriver) {
  return driver.name || [
    driver.firstName,
    driver.lastName,
  ].filter(Boolean).join(" ").trim();
}

export function FuelTab() {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    activeTab,
    setActiveTab,
  ] = useState("transactions");
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
    selectedTransaction,
    setSelectedTransaction,
  ] = useState<FuelTransaction | null>(null);
  const [
    transactionPendingDelete,
    setTransactionPendingDelete,
  ] = useState<FuelTransaction | null>(null);

  // Per-chart period filters
  const [
    metricsPeriod,
    setMetricsPeriod,
  ] = useState<FuelMetricsPeriod>("weekly");
  const [
    budgetPeriod,
    setBudgetPeriod,
  ] = useState<PeriodValue>("7");

  // Filter state
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);
  const [
    fuelTypeFilter,
    setFuelTypeFilter,
  ] = useState<"all" | "diesel" | "petrol">("all");
  const [
    qtyMin,
    setQtyMin,
  ] = useState("");
  const [
    qtyMax,
    setQtyMax,
  ] = useState("");
  const [
    costMin,
    setCostMin,
  ] = useState("");
  const [
    costMax,
    setCostMax,
  ] = useState("");
  const [
    dateFrom,
    setDateFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    dateTo,
    setDateTo,
  ] = useState<Date | undefined>(undefined);

  const [
    draftEnableFuelType,
    setDraftEnableFuelType,
  ] = useState(false);
  const [
    draftFuelType,
    setDraftFuelType,
  ] = useState<"all" | "diesel" | "petrol">("all");
  const [
    draftEnableQty,
    setDraftEnableQty,
  ] = useState(false);
  const [
    draftQtyMin,
    setDraftQtyMin,
  ] = useState("");
  const [
    draftQtyMax,
    setDraftQtyMax,
  ] = useState("");
  const [
    draftEnableCost,
    setDraftEnableCost,
  ] = useState(false);
  const [
    draftCostMin,
    setDraftCostMin,
  ] = useState("");
  const [
    draftCostMax,
    setDraftCostMax,
  ] = useState("");
  const [
    draftEnableDate,
    setDraftEnableDate,
  ] = useState(false);
  const [
    draftDateFrom,
    setDraftDateFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    draftDateTo,
    setDraftDateTo,
  ] = useState<Date | undefined>(undefined);

  useEffect(
    () => {
      const t = setTimeout(
        setDebouncedSearch,
        300,
        searchQuery,
      );
      return () => clearTimeout(t);
    },
    [searchQuery],
  );

  const queryParams = useMemo(
    () => ({
      params: {
        query: debouncedSearch.trim() || undefined,
        fuelType: fuelTypeFilter !== "all" ? fuelTypeFilter : undefined,
        litresFrom: qtyMin ? Number(qtyMin) : undefined,
        litresTo: qtyMax ? Number(qtyMax) : undefined,
        totalFrom: costMin ? Number(costMin) : undefined,
        totalTo: costMax ? Number(costMax) : undefined,
        from: dateFrom ? dateFrom.toISOString() : undefined,
        to: dateTo ? dateTo.toISOString() : undefined,
      },
    }),
    [
      debouncedSearch,
      fuelTypeFilter,
      qtyMin,
      qtyMax,
      costMin,
      costMax,
      dateFrom,
      dateTo,
    ],
  );

  const fuelQuery = useFuelTransactionsList(queryParams);
  const summaryQuery = useFuelSummary();
  const efficiencyQuery = useFuelEfficiency();
  const vehiclesQuery = useVehicles();
  // ponytail: page-shell tabbed summary — payload untyped until server response is in.
  useVehiclesByTab('fuel');
  const driversQuery = useDrivers();
  const fuelMetricsQuery = useFuelMetrics({ params: { period: metricsPeriod } });
  const budgetRange = useMemo(
    () => getPeriodRange(budgetPeriod),
    [budgetPeriod],
  );
  const budgetVsActualQuery = useFuelBudgetVsActual({ params: budgetRange });
  const transactions = fuelQuery.data?.data ?? [];
  const isLoading = fuelQuery.isLoading && !fuelQuery.data;
  const vehicleOptions = useMemo(
    () => {
      const seen = new Set<string>();

      return (vehiclesQuery.data?.data ?? []).flatMap((vehicle) => {
        // ponytail: value is the registration string, not id — server accepts vehicleRegistration
        const value = vehicle.registrationNumber || vehicle.plateNumber || vehicle.id;
        if (!value || seen.has(value))
          return [];
        seen.add(value);
        return [
          {
            value, label: getVehicleOptionLabel(vehicle), type: vehicle.type,
          },
        ];
      });
    },
    [vehiclesQuery.data],
  );
  const driverOptions = useMemo(
    () => {
      const seen = new Set<string>();

      return (driversQuery.data?.data ?? []).flatMap((driver) => {
        // ponytail: value is the driver name, not id — server accepts driverName
        const value = getDriverDisplayName(driver);
        if (!value || seen.has(value))
          return [];
        seen.add(value);
        return [
          {
            value, label: value,
          },
        ];
      });
    },
    [driversQuery.data],
  );

  const recordMutation = useRecordFuelTransaction();
  const updateMutation = useUpdateFuelTransaction();
  const deleteMutation = useDeleteFuelTransaction();

  const [
    newTransaction,
    setNewTransaction,
  ] = useState({
    vehicleReg: "",
    driverName: "",
    fuelType: "diesel" as "diesel" | "petrol",
    quantity: "",
    pricePerLitre: "",
    odometer: "",
    station: "",
  });

  // ponytail: server-side filtering via useFuelTransactionsList — no local pass
  const filteredTransactions = transactions;

  const uniqueVehicleCount = new Set(filteredTransactions.map(t => t.vehicleId)).size;
  const activeFilterCount
    = (qtyMin || qtyMax ? 1 : 0)
      + (costMin || costMax ? 1 : 0)
      + (dateFrom || dateTo ? 1 : 0);

  const hasActiveFuelFilters
    = !!debouncedSearch
      || fuelTypeFilter !== "all"
      || activeFilterCount > 0;

  const fuelColumns: ColumnDef<FuelTransaction>[] = [
    {
      id: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{row.original.vehiclePlateNumber || row.original.vehicleId}</span>
        </div>
      ),
    },
    {
      id: "driver",
      header: "Driver",
      cell: ({ row }) => row.original.driverName || row.original.driverId || "-",
    },
    {
      id: "fuelType",
      header: "Fuel Type",
      meta: { className: "capitalize" },
      cell: ({ row }) => row.original.fuelType || "-",
    },
    {
      id: "quantity",
      header: "Quantity",
      cell: ({ row }) => `${row.original.liters.toFixed(1)}L`,
    },
    {
      id: "total",
      header: "Total",
      meta: { className: "font-medium" },
      cell: ({ row }) => `₦${row.original.totalCost.toLocaleString()}`,
    },
    {
      id: "station",
      header: "Station",
      meta: { className: "max-w-[150px] truncate" },
      cell: ({ row }) => row.original.station || "-",
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => formatDayMonthTime(row.original.recordedAt),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[60px]" },
      cell: ({ row }) => {
        const transaction = row.original;
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
              <DropdownMenuItem onClick={() => handleViewTransaction(transaction)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTransactionPendingDelete(transaction)}
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

  const summary = summaryQuery.data?.data;
  const weeklyAnalyticsQuery = useFuelWeeklyAnalytics();
  const weeklyAnalytics = weeklyAnalyticsQuery.data?.data;

  const useWeeklyFromApi = metricsPeriod === "weekly" && !!weeklyAnalytics;

  const fuelConsumptionChartData = useMemo<FuelConsumptionChartPoint[]>(
    () => {
      if (useWeeklyFromApi) {
        return weeklyAnalytics!.days.map(d => ({
          label: d.day,
          ...d.litres,
        }));
      }
      return (fuelMetricsQuery.data?.data ?? []).map(bucket => ({
        label: bucket.label,
        diesel: getFuelTypeLiters(
          bucket,
          "diesel",
        ),
        petrol: getFuelTypeLiters(
          bucket,
          "petrol",
        ),
      }));
    },
    [
      useWeeklyFromApi,
      weeklyAnalytics,
      fuelMetricsQuery.data,
    ],
  );

  const chartFuelTypes = useWeeklyFromApi
    ? weeklyAnalytics!.fuelTypes
    : [
        "diesel",
        "petrol",
      ];
  // ponytail: 4-color palette; extend when a tenant genuinely stocks a 5th fuel type
  const FUEL_TYPE_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--warning))",
    "hsl(var(--success))",
    "hsl(var(--destructive))",
  ];
  const budgetVsActual = budgetVsActualQuery.data?.data;
  const budgetChartData = useMemo<BudgetChartPoint[]>(
    () => {
      const vehicles = budgetVsActual?.vehicles ?? [];

      if (vehicles.length > 0) {
        return vehicles.map(vehicle => ({
          label: vehicle.vehicleId,
          budgetedNgn: vehicle.budgetedNgn,
          actualNgn: vehicle.actualNgn,
          variance: vehicle.variance,
          utilizationPct: vehicle.utilizationPct,
          periodType: vehicle.periodType,
        }));
      }

      if (budgetVsActual?.fleet) {
        return [
          {
            label: "Fleet",
            budgetedNgn: budgetVsActual.fleet.budgetedNgn,
            actualNgn: budgetVsActual.fleet.actualNgn,
            variance: budgetVsActual.fleet.variance,
            utilizationPct: budgetVsActual.fleet.utilizationPct,
            periodType: budgetVsActual.fleet.periodType,
          },
        ];
      }

      return [];
    },
    [budgetVsActual],
  );
  const budgetWindowLabel = formatBudgetWindow(
    budgetVsActual?.windowStart,
    budgetVsActual?.windowEnd,
  );
  const fleetBudget = budgetVsActual?.fleet;
  const stats = {
    totalLitres: summary?.totalLitres ?? 0,
    totalCost: summary?.totalCostNgn ?? 0,
    avgPricePerLitre: summary?.avgPricePerLitre ?? 0,
  };
  const vehicleEfficiency = efficiencyQuery.data?.data ?? [];
  const lowEfficiencyVehicles = vehicleEfficiency.filter(vehicle => vehicle.belowThreshold).length;
  const efficiencyThresholds = [
    ...new Set(
      vehicleEfficiency
        .map(vehicle => vehicle.threshold)
        .filter((threshold): threshold is number => threshold !== null),
    ),
  ];
  const efficiencyThresholdLabel
    = efficiencyThresholds.length === 0
      ? "not set"
      : efficiencyThresholds.length === 1
        ? `${efficiencyThresholds[0]} km/L`
        : "configured per vehicle";

  const resetNewTransaction = () => {
    setNewTransaction({
      vehicleReg: "",
      driverName: "",
      fuelType: "diesel",
      quantity: "",
      pricePerLitre: "",
      odometer: "",
      station: "",
    });
  };

  const handleAddTransaction = async () => {
    const liters = Number.parseFloat(newTransaction.quantity);
    const pricePerLiter = Number.parseFloat(newTransaction.pricePerLitre);
    const selectedVehicle = vehicleOptions.find(vehicle => vehicle.value === newTransaction.vehicleReg);

    if (!Number.isFinite(liters) || liters <= 0 || !Number.isFinite(pricePerLiter) || pricePerLiter <= 0) {
      toast.error("Enter a valid quantity and price per litre");
      return;
    }

    try {
      await recordMutation.mutateAsync({
        data: {
          vehicleRegistration: newTransaction.vehicleReg,
          driverName: newTransaction.driverName || undefined,
          vehicleType: selectedVehicle?.type,
          fuelType: newTransaction.fuelType,
          liters,
          pricePerLiter,
          station: newTransaction.station || undefined,
          odometer: newTransaction.odometer ? parseInt(newTransaction.odometer) : undefined,
        },
      });
      toast.success("Fuel transaction recorded");
      setIsAddDialogOpen(false);
      resetNewTransaction();
    }
    catch (error) {
      const err = error as {
        field?: string; message?: string;
      };
      if (err?.field === "vehicleRegistration") {
        toast.error(
          err.message ?? "Unknown vehicle registration",
          { description: "Check the Vehicle Registration field" },
        );
      }
      else {
        toast.error(err?.message ?? "Failed to record transaction");
      }
    }
  };

  const handleViewTransaction = (transaction: FuelTransaction) => {
    setSelectedTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  const handleEditTransaction = (transaction: FuelTransaction) => {
    setSelectedTransaction(transaction);
    setNewTransaction({
      vehicleReg: transaction.vehiclePlateNumber ?? transaction.vehicleId,
      driverName: transaction.driverName ?? "",
      fuelType: transaction.fuelType.toLocaleLowerCase() === "petrol" ? "petrol" : "diesel",
      quantity: transaction.liters.toString(),
      pricePerLitre: transaction.pricePerLiter.toFixed(0),
      odometer: transaction.odometer?.toString() || "",
      station: transaction.station || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction)
      return;
    const liters = Number.parseFloat(newTransaction.quantity);
    const pricePerLiter = Number.parseFloat(newTransaction.pricePerLitre);
    try {
      await updateMutation.mutateAsync({
        id: selectedTransaction.id,
        data: {
          vehicleRegistration: newTransaction.vehicleReg,
          driverName: newTransaction.driverName || undefined,
          liters,
          pricePerLiter,
          station: newTransaction.station || undefined,
          odometer: newTransaction.odometer ? parseInt(newTransaction.odometer) : undefined,
        },
      });
      toast.success("Transaction updated");
      setIsEditDialogOpen(false);
      setSelectedTransaction(null);
      resetNewTransaction();
    }
    catch {
      toast.error("Failed to update transaction");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Transaction deleted");
      setTransactionPendingDelete(null);
    }
    catch {
      toast.error("Failed to delete transaction");
    }
  };

  const handleExport = async () => {
    try {
      const csv = await exportFuelTransactions();
      const blob = new Blob(
        [csv],
        { type: "text/csv" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fuel-transactions.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
    catch {
      toast.error("Failed to export data");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array.from({ length: 4 })].map((_, i) => (
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
      {/* Primary CTAs */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Fueling
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                <Droplets className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">
                  {stats.totalLitres.toLocaleString()}
                  L
                </p>
                <p className="text-xs text-muted-foreground">Total Litres</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20 shrink-0">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">
                  ₦
                  {(stats.totalCost / 1000).toFixed(0)}
                  K
                </p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20 shrink-0">
                <Gauge className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">
                  {stats.avgPricePerLitre > 0 ? `₦${stats.avgPricePerLitre.toFixed(0)}/L` : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Avg Price</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20 shrink-0">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{lowEfficiencyVehicles}</p>
                <p className="text-xs text-muted-foreground">Low Efficiency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
        </TabsList>

        <TabsContent
          value="transactions"
          className="space-y-4"
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Fuel className="h-5 w-5 text-primary" />
                    Fuel Consumption (
                    {uniqueVehicleCount}
                    )
                  </CardTitle>
                  <CardDescription className="mt-1">Per-vehicle fuel usage and spend — spot anomalies, theft signals, and efficiency trends.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by vehicle, driver, station..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 bg-background/50 border-border/50"
                  />
                  {fuelQuery.isFetching && !isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Popover
                  open={filterOpen}
                  onOpenChange={(open) => {
                    if (open) {
                      setDraftFuelType(fuelTypeFilter);
                      setDraftQtyMin(qtyMin);
                      setDraftQtyMax(qtyMax);
                      setDraftCostMin(costMin);
                      setDraftCostMax(costMax);
                      setDraftDateFrom(dateFrom);
                      setDraftDateTo(dateTo);
                      setDraftEnableFuelType(fuelTypeFilter !== "all");
                      setDraftEnableQty(Boolean(qtyMin || qtyMax));
                      setDraftEnableCost(Boolean(costMin || costMax));
                      setDraftEnableDate(Boolean(dateFrom || dateTo));
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
                    <Label className="text-sm font-semibold">Show Fuel Records</Label>

                    {/* Fuel Type */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="fuel-flt-type"
                          checked={draftEnableFuelType}
                          onCheckedChange={c => setDraftEnableFuelType(c === true)}
                        />
                        <Label
                          htmlFor="fuel-flt-type"
                          className="text-xs cursor-pointer"
                        >
                          Fuel Type
                        </Label>
                      </div>
                      <Select
                        value={draftFuelType}
                        onValueChange={v => setDraftFuelType(v as "all" | "diesel" | "petrol")}
                        disabled={!draftEnableFuelType}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="petrol">Petrol</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity Range */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="fuel-flt-qty"
                          checked={draftEnableQty}
                          onCheckedChange={c => setDraftEnableQty(c === true)}
                        />
                        <Label
                          htmlFor="fuel-flt-qty"
                          className="text-xs cursor-pointer"
                        >
                          Quantity (L)
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="From"
                          value={draftQtyMin}
                          onChange={e => setDraftQtyMin(e.target.value)}
                          disabled={!draftEnableQty}
                          className="h-9"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="To"
                          value={draftQtyMax}
                          onChange={e => setDraftQtyMax(e.target.value)}
                          disabled={!draftEnableQty}
                          className="h-9"
                        />
                      </div>
                    </div>

                    {/* Total Range */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="fuel-flt-cost"
                          checked={draftEnableCost}
                          onCheckedChange={c => setDraftEnableCost(c === true)}
                        />
                        <Label
                          htmlFor="fuel-flt-cost"
                          className="text-xs cursor-pointer"
                        >
                          Total (₦)
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="From"
                          value={draftCostMin}
                          onChange={e => setDraftCostMin(e.target.value)}
                          disabled={!draftEnableCost}
                          className="h-9"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="To"
                          value={draftCostMax}
                          onChange={e => setDraftCostMax(e.target.value)}
                          disabled={!draftEnableCost}
                          className="h-9"
                        />
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="fuel-flt-date"
                          checked={draftEnableDate}
                          onCheckedChange={c => setDraftEnableDate(c === true)}
                        />
                        <Label
                          htmlFor="fuel-flt-date"
                          className="text-xs cursor-pointer"
                        >
                          Date Range
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!draftEnableDate}
                              className={cn(
                                "h-9 flex-1 justify-start text-left font-normal",
                                !draftDateFrom && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                              {draftDateFrom ? formatDayMonth(draftDateFrom) : "From"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={draftDateFrom}
                              onSelect={setDraftDateFrom}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <span className="text-xs text-muted-foreground">to</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!draftEnableDate}
                              className={cn(
                                "h-9 flex-1 justify-start text-left font-normal",
                                !draftDateTo && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                              {draftDateTo ? formatDayMonth(draftDateTo) : "To"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={draftDateTo}
                              onSelect={setDraftDateTo}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setFuelTypeFilter(draftEnableFuelType ? draftFuelType : "all");
                          setQtyMin(draftEnableQty ? draftQtyMin : "");
                          setQtyMax(draftEnableQty ? draftQtyMax : "");
                          setCostMin(draftEnableCost ? draftCostMin : "");
                          setCostMax(draftEnableCost ? draftCostMax : "");
                          setDateFrom(draftEnableDate ? draftDateFrom : undefined);
                          setDateTo(draftEnableDate ? draftDateTo : undefined);
                          setFilterOpen(false);
                        }}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setFuelTypeFilter("all");
                          setQtyMin("");
                          setQtyMax("");
                          setCostMin("");
                          setCostMax("");
                          setDateFrom(undefined);
                          setDateTo(undefined);
                          setDraftFuelType("all");
                          setDraftQtyMin("");
                          setDraftQtyMax("");
                          setDraftCostMin("");
                          setDraftCostMax("");
                          setDraftDateFrom(undefined);
                          setDraftDateTo(undefined);
                          setDraftEnableFuelType(false);
                          setDraftEnableQty(false);
                          setDraftEnableCost(false);
                          setDraftEnableDate(false);
                        }}
                      >
                        Show All
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <DataTable
                columns={fuelColumns}
                data={filteredTransactions}
                isLoading={isLoading}
                hasActiveFilters={hasActiveFuelFilters}
                emptyState="No fuel transactions recorded."
                filteredEmptyState="No fuel transactions match your filters."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="analytics"
          className="space-y-4"
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-base">
                  {FUEL_METRIC_PERIOD_LABEL[metricsPeriod]}
                  {" "}
                  Consumption
                </CardTitle>
                <CardDescription>
                  Diesel vs Petrol usage by
                  {metricsPeriod === "weekly" ? "week" : "month"}
                </CardDescription>
              </div>
              <Select
                value={metricsPeriod}
                onValueChange={value => setMetricsPeriod(value as FuelMetricsPeriod)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {fuelMetricsQuery.isLoading
                ? (
                    <Skeleton className="h-[300px] w-full" />
                  )
                : fuelMetricsQuery.isError
                  ? (
                      <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                        <p>Unable to load fuel consumption data.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fuelMetricsQuery.refetch()}
                        >
                          Retry
                        </Button>
                      </div>
                    )
                  : fuelConsumptionChartData.length === 0
                    ? (
                        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                          No fuel consumption data available for this period.
                        </div>
                      )
                    : (
                        <ResponsiveContainer
                          width="100%"
                          height={300}
                        >
                          <BarChart data={fuelConsumptionChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="hsl(var(--border))"
                            />
                            <XAxis
                              dataKey="label"
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={12}
                            />
                            <YAxis
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={12}
                            />
                            <Tooltip
                              formatter={value => `${Number(value).toLocaleString()} L`}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            {chartFuelTypes.map((fuelType, idx) => (
                              <Bar
                                key={fuelType}
                                dataKey={fuelType}
                                name={`${fuelType.charAt(0).toUpperCase()}${fuelType.slice(1)} (L)`}
                                fill={FUEL_TYPE_COLORS[idx % FUEL_TYPE_COLORS.length]}
                                radius={[
                                  4,
                                  4,
                                  0,
                                  0,
                                ]}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="efficiency"
          className="space-y-4"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">Vehicle Fuel Efficiency</CardTitle>
                  <CardDescription>
                    Kilometers per litre by vehicle (threshold:
                    {efficiencyThresholdLabel}
                    )
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {efficiencyQuery.isLoading
                    ? (
                        <div className="space-y-4">
                          {[...Array.from({ length: 4 })].map((_, index) => (
                            <Skeleton
                              key={index}
                              className="h-6 w-full"
                            />
                          ))}
                        </div>
                      )
                    : efficiencyQuery.isError
                      ? (
                          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-muted-foreground">
                            <p>Unable to load fuel efficiency data.</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => efficiencyQuery.refetch()}
                            >
                              Retry
                            </Button>
                          </div>
                        )
                      : vehicleEfficiency.length === 0
                        ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No efficiency data available. Record fuel transactions with odometer readings to calculate efficiency.
                            </div>
                          )
                        : (
                            vehicleEfficiency.map((vehicle: VehicleEfficiency) => (
                              <div
                                key={vehicle.vehicleId}
                                className="flex items-center gap-4"
                              >
                                <div className="w-24 font-mono text-sm truncate">{vehicle.vehicleId}</div>
                                <div className="flex-1">
                                  {vehicle.kmPerLiter !== null
                                    ? (
                                        <Progress
                                          value={getEfficiencyProgressValue(vehicle)}
                                          className={cn(
                                            "h-3",
                                            vehicle.belowThreshold && "[&>div]:bg-destructive",
                                            !vehicle.belowThreshold && "[&>div]:bg-success",
                                          )}
                                        />
                                      )
                                    : (
                                        <div className="text-xs text-muted-foreground italic">Insufficient data</div>
                                      )}
                                </div>
                                <div className="w-20 text-right">
                                  <span className="font-medium">
                                    {vehicle.kmPerLiter !== null ? vehicle.kmPerLiter.toFixed(1) : "N/A"}
                                    {" "}
                                    km/L
                                  </span>
                                </div>
                                <div className="w-20 text-right text-sm text-muted-foreground">
                                  {vehicle.threshold !== null ? `${vehicle.threshold} target` : "No target"}
                                </div>
                              </div>
                            ))
                          )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">Budget vs Actual</CardTitle>
                  <CardDescription>{budgetWindowLabel}</CardDescription>
                </div>
                <PeriodFilter
                  value={budgetPeriod}
                  onChange={setBudgetPeriod}
                  variant="short"
                  className="w-[150px]"
                />
              </CardHeader>
              <CardContent>
                {budgetVsActualQuery.isLoading
                  ? (
                      <Skeleton className="h-[300px] w-full" />
                    )
                  : budgetVsActualQuery.isError
                    ? (
                        <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                          <p>Unable to load budget data.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => budgetVsActualQuery.refetch()}
                          >
                            Retry
                          </Button>
                        </div>
                      )
                    : budgetChartData.length === 0
                      ? (
                          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                            No budget data available for this period.
                          </div>
                        )
                      : (
                          <div className="space-y-4">
                            {fleetBudget && (
                              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Fleet budget</p>
                                  <p className="font-semibold">{formatNgn(fleetBudget.budgetedNgn)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Actual spend</p>
                                  <p className="font-semibold">{formatNgn(fleetBudget.actualNgn)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Variance</p>
                                  <p className={cn(
                                    "font-semibold",
                                    fleetBudget.variance > 0 ? "text-destructive" : "text-success",
                                  )}
                                  >
                                    {formatNgn(fleetBudget.variance)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Utilization</p>
                                  <p className="font-semibold">
                                    {fleetBudget.utilizationPct.toFixed(1)}
                                    %
                                  </p>
                                </div>
                              </div>
                            )}
                            <ResponsiveContainer
                              width="100%"
                              height={260}
                            >
                              <LineChart data={budgetChartData}>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="hsl(var(--border))"
                                />
                                <XAxis
                                  dataKey="label"
                                  stroke="hsl(var(--muted-foreground))"
                                  fontSize={12}
                                />
                                <YAxis
                                  stroke="hsl(var(--muted-foreground))"
                                  fontSize={12}
                                  tickFormatter={value => `${Number(value) / 1000}K`}
                                />
                                <Tooltip
                                  formatter={value => formatNgn(Number(value))}
                                  labelFormatter={label => `Vehicle: ${label}`}
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                  }}
                                />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="actualNgn"
                                  name="Actual (NGN)"
                                  stroke="hsl(var(--primary))"
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                  activeDot={{ r: 5 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="budgetedNgn"
                                  name="Budget (NGN)"
                                  stroke="hsl(var(--warning))"
                                  strokeWidth={2}
                                  strokeDasharray="5 5"
                                  dot={{ r: 3 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!transactionPendingDelete}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setTransactionPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fuel transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the fuel transaction record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              loading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (transactionPendingDelete) {
                  void handleDeleteTransaction(transactionPendingDelete.id);
                }
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Fuel Transaction</DialogTitle>
            <DialogDescription>Log a new fuel purchase for a vehicle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Registration</Label>
                <Select
                  value={newTransaction.vehicleReg}
                  onValueChange={value => setNewTransaction({
                    ...newTransaction, vehicleReg: value,
                  })}
                  disabled={vehiclesQuery.isLoading || vehicleOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={vehiclesQuery.isLoading ? "Loading vehicles..." : "Select vehicle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleOptions.map(vehicle => (
                      <SelectItem
                        key={vehicle.value}
                        value={vehicle.value}
                      >
                        {vehicle.label}
                      </SelectItem>
                    ))}
                    {newTransaction.vehicleReg && !vehicleOptions.some(vehicle => vehicle.value === newTransaction.vehicleReg) && (
                      <SelectItem value={newTransaction.vehicleReg}>{newTransaction.vehicleReg}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Select
                  value={newTransaction.driverName}
                  onValueChange={value => setNewTransaction({
                    ...newTransaction, driverName: value,
                  })}
                  disabled={driversQuery.isLoading || driverOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={driversQuery.isLoading ? "Loading drivers..." : "Select driver"} />
                  </SelectTrigger>
                  <SelectContent>
                    {driverOptions.map(driver => (
                      <SelectItem
                        key={driver.value}
                        value={driver.value}
                      >
                        {driver.label}
                      </SelectItem>
                    ))}
                    {newTransaction.driverName && !driverOptions.some(driver => driver.value === newTransaction.driverName) && (
                      <SelectItem value={newTransaction.driverName}>{newTransaction.driverName}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select
                  value={newTransaction.fuelType}
                  onValueChange={(v: any) => setNewTransaction({
                    ...newTransaction, fuelType: v,
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="petrol">Petrol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Station</Label>
                <Input
                  placeholder="e.g. Total Lekki"
                  value={newTransaction.station}
                  onChange={e => setNewTransaction({
                    ...newTransaction, station: e.target.value,
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity (Litres)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={newTransaction.quantity}
                  onChange={e => setNewTransaction({
                    ...newTransaction, quantity: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Litre (₦)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 650"
                  value={newTransaction.pricePerLitre}
                  onChange={e => setNewTransaction({
                    ...newTransaction, pricePerLitre: e.target.value,
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Odometer Reading (optional)</Label>
              <Input
                type="number"
                placeholder="Current mileage"
                value={newTransaction.odometer}
                onChange={e => setNewTransaction({
                  ...newTransaction, odometer: e.target.value,
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
              onClick={handleAddTransaction}
              disabled={recordMutation.isPending || !newTransaction.vehicleReg || !newTransaction.quantity || !newTransaction.pricePerLitre}
            >
              {recordMutation.isPending ? "Recording..." : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="font-mono">{selectedTransaction.vehicleId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p>{selectedTransaction.driverId || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle Type</p>
                  <Badge>{selectedTransaction.vehicleType ?? "—"}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Station</p>
                  <p>{selectedTransaction.station || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p>
                    {selectedTransaction.liters.toFixed(1)}
                    L
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                  <p>
                    ₦
                    {selectedTransaction.totalCost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p>{formatDate(selectedTransaction.recordedAt)}</p>
                </div>
              </div>
              {selectedTransaction.odometer && (
                <div>
                  <p className="text-xs text-muted-foreground">Odometer</p>
                  <p>
                    {selectedTransaction.odometer.toLocaleString()}
                    {" "}
                    km
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Registration</Label>
                <Select
                  value={newTransaction.vehicleReg}
                  onValueChange={value => setNewTransaction({
                    ...newTransaction, vehicleReg: value,
                  })}
                  disabled={vehiclesQuery.isLoading || vehicleOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={vehiclesQuery.isLoading ? "Loading vehicles..." : "Select vehicle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleOptions.map(vehicle => (
                      <SelectItem
                        key={vehicle.value}
                        value={vehicle.value}
                      >
                        {vehicle.label}
                      </SelectItem>
                    ))}
                    {newTransaction.vehicleReg && !vehicleOptions.some(vehicle => vehicle.value === newTransaction.vehicleReg) && (
                      <SelectItem value={newTransaction.vehicleReg}>{newTransaction.vehicleReg}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Select
                  value={newTransaction.driverName}
                  onValueChange={value => setNewTransaction({
                    ...newTransaction, driverName: value,
                  })}
                  disabled={driversQuery.isLoading || driverOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={driversQuery.isLoading ? "Loading drivers..." : "Select driver"} />
                  </SelectTrigger>
                  <SelectContent>
                    {driverOptions.map(driver => (
                      <SelectItem
                        key={driver.value}
                        value={driver.value}
                      >
                        {driver.label}
                      </SelectItem>
                    ))}
                    {newTransaction.driverName && !driverOptions.some(driver => driver.value === newTransaction.driverName) && (
                      <SelectItem value={newTransaction.driverName}>{newTransaction.driverName}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select
                  value={newTransaction.fuelType}
                  onValueChange={(v: any) => setNewTransaction({
                    ...newTransaction, fuelType: v,
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="petrol">Petrol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Station</Label>
                <Input
                  value={newTransaction.station}
                  onChange={e => setNewTransaction({
                    ...newTransaction, station: e.target.value,
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity (Litres)</Label>
                <Input
                  type="number"
                  value={newTransaction.quantity}
                  onChange={e => setNewTransaction({
                    ...newTransaction, quantity: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Litre (₦)</Label>
                <Input
                  type="number"
                  value={newTransaction.pricePerLitre}
                  onChange={e => setNewTransaction({
                    ...newTransaction, pricePerLitre: e.target.value,
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Odometer Reading (optional)</Label>
              <Input
                type="number"
                value={newTransaction.odometer}
                onChange={e => setNewTransaction({
                  ...newTransaction, odometer: e.target.value,
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
              onClick={handleUpdateTransaction}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
