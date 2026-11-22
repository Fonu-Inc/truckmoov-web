import type {
  FleetDriver, FuelRecord, Vehicle,
} from "@truckmoov/api/fleet";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  exportFuelTransactions, useDrivers, useFuelSummary, useFuelTransactionsList, useFuelWeeklyAnalytics, useRecordFuelTransaction, useVehicles,
} from "@truckmoov/api/fleet";
import {
  formatDayMonth, formatDayMonthTime,
} from "@truckmoov/app-core/utils/time-utils";
import {
  CalendarIcon, DollarSign, Download, Droplets, Fuel, Gauge, Plus, Search, SlidersHorizontal,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { Navigate } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Calendar } from "@/components/shadcn/calendar";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs, TabsContent, TabsTrigger,
} from "@/components/shadcn/tabs";
import { useIsOwnerOperatorAccount } from "@/features/auth/hooks/useOrganizationType";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/layout/PageHeader";

type FuelTransaction = FuelRecord;

type FuelConsumptionChartPoint = {
  label: string;
  // dynamic fuel-type keys populated at runtime
  [fuelType: string]: number | string;
};

// Design app's card / sub-tab classes, copied verbatim.
const SURFACE_CARD_CLASS = "rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50";
const SUB_TABS_LIST_CLASS = "inline-flex h-10 items-center justify-center rounded-xl p-1 text-muted-foreground bg-muted/50 mb-4";
const SUB_TAB_TRIGGER_CLASS = "rounded-lg px-3.5";

// ponytail: 4-color palette; extend when a tenant genuinely stocks a 5th fuel type
const FUEL_TYPE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
];

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

function capitalizeFuelType(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** `/fleet/fuel` — the design app's Fuel tab. */
export function FuelTab() {
  // Fuel is hidden in owner operators' accounts (manual records only); a direct link lands on Vehicles.
  if (useIsOwnerOperatorAccount()) {
    return (
      <Navigate
        to="/fleet"
        replace
      />
    );
  }
  return <FuelTabContent />;
}

function FuelTabContent() {
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
  const vehiclesQuery = useVehicles();
  const driversQuery = useDrivers();
  const weeklyAnalyticsQuery = useFuelWeeklyAnalytics();
  const transactions = fuelQuery.data?.data ?? [];
  const isLoading = fuelQuery.isLoading && !fuelQuery.data;
  const vehicles = useMemo(
    () => vehiclesQuery.data?.data ?? [],
    [vehiclesQuery.data],
  );
  const vehicleOptions = useMemo(
    () => {
      const seen = new Set<string>();

      return vehicles.flatMap((vehicle) => {
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
    [vehicles],
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
  // Server 400s an unknown registration with field=vehicleRegistration — shown under the select.
  const [
    vehicleRegError,
    setVehicleRegError,
  ] = useState<string | null>(null);

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

  const findVehicle = (transaction: FuelTransaction) => vehicles.find(
    vehicle =>
      vehicle.id === transaction.vehicleId
      || (!!transaction.vehiclePlateNumber && (vehicle.registrationNumber === transaction.vehiclePlateNumber || vehicle.plateNumber === transaction.vehiclePlateNumber)),
  );

  const getVehicleName = (transaction: FuelTransaction) => {
    const vehicle = findVehicle(transaction);
    return [
      vehicle?.make,
      vehicle?.model,
    ].filter(Boolean).join(" ") || "—";
  };

  const getVehiclePlate = (transaction: FuelTransaction) => {
    const vehicle = findVehicle(transaction);
    return transaction.vehiclePlateNumber || (vehicle ? getVehicleRegistration(vehicle) : "") || "—";
  };

  const summary = summaryQuery.data?.data;
  const weeklyAnalytics = weeklyAnalyticsQuery.data?.data;

  const fuelConsumptionChartData = useMemo<FuelConsumptionChartPoint[]>(
    () => (weeklyAnalytics?.days ?? []).map(d => ({
      label: d.day,
      ...d.litres,
    })),
    [weeklyAnalytics],
  );

  const chartFuelTypes = weeklyAnalytics?.fuelTypes?.length
    ? weeklyAnalytics.fuelTypes
    : [
        "diesel",
        "petrol",
      ];
  const stats = {
    totalLitres: summary?.totalLitres ?? 0,
    totalCost: summary?.totalCostNgn ?? 0,
    transactionCount: summary?.transactionCount ?? 0,
  };
  const averageLitres = stats.transactionCount > 0
    ? `${(stats.totalLitres / stats.transactionCount).toFixed(1)}L`
    : "-";

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
    setVehicleRegError(null);
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
        setVehicleRegError(err.message ?? "Unknown vehicle registration");
      }
      else {
        toast.error(err?.message ?? "Failed to record transaction");
      }
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportFuelTransactions(queryParams);
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

  const kpiTiles = [
    {
      label: "Total Litres",
      value: `${stats.totalLitres.toLocaleString()}L`,
      icon: Droplets,
      chip: "bg-primary/20",
      tint: "text-primary",
    },
    {
      label: "Total Spent",
      value: `₦${(stats.totalCost / 1000).toFixed(0)}K`,
      icon: DollarSign,
      chip: "bg-success/20",
      tint: "text-success",
    },
    {
      label: "Average Litres",
      value: averageLitres,
      icon: Gauge,
      chip: "bg-accent/20",
      tint: "text-accent",
    },
  ];

  return (
    <>
      <PageHeader
        title="Fuel"
        description="Fuel usage, refuelling records, and associated costs."
        actions={(
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Fueling
          </Button>
        )}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpiTiles.map(tile => (
            <div
              key={tile.label}
              className={SURFACE_CARD_CLASS}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    tile.chip,
                  )}
                  >
                    <tile.icon className={cn(
                      "h-5 w-5",
                      tile.tint,
                    )}
                    />
                  </div>
                  <div>
                    {summaryQuery.isLoading
                      ? <Skeleton className="h-8 w-16" />
                      : <p className="text-2xl font-bold">{tile.value}</p>}
                    <p className="text-xs text-muted-foreground">{tile.label}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsPrimitive.List className={SUB_TABS_LIST_CLASS}>
            <TabsTrigger
              value="transactions"
              className={SUB_TAB_TRIGGER_CLASS}
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className={SUB_TAB_TRIGGER_CLASS}
            >
              Analytics
            </TabsTrigger>
          </TabsPrimitive.List>

          <TabsContent
            value="transactions"
            className="space-y-4"
          >
            <div className={SURFACE_CARD_CLASS}>
              <div className="flex flex-col p-6 pb-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold tracking-tight text-foreground font-display flex items-center gap-2 text-base">
                      <Fuel className="h-5 w-5 text-primary" />
                      {`Fuel Consumption (${uniqueVehicleCount})`}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Per-vehicle fuel usage and spend — spot anomalies, theft signals, and efficiency trends.</p>
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
                      className="pl-10 bg-background/50 border-border/50"
                    />
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
              </div>
              <div className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow
                            key={`skeleton-${i}`}
                            className="border-border/50"
                          >
                            {Array.from({ length: 7 }).map((__, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : filteredTransactions.length === 0
                        ? (
                            <TableRow className="hover:bg-transparent">
                              <TableCell
                                colSpan={7}
                                className="text-center py-8 text-muted-foreground"
                              >
                                {hasActiveFuelFilters ? "No fuel transactions match your filters." : "No fuel transactions recorded."}
                              </TableCell>
                            </TableRow>
                          )
                        : filteredTransactions.map(transaction => (
                            <TableRow
                              key={transaction.id}
                              className="hover:bg-muted/50 border-border/50"
                            >
                              <TableCell className="min-w-[180px]">
                                <p className="font-medium whitespace-nowrap">{getVehicleName(transaction)}</p>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">{getVehiclePlate(transaction)}</p>
                              </TableCell>
                              <TableCell>{transaction.driverName || "—"}</TableCell>
                              <TableCell className="max-w-[150px] truncate">{transaction.station || "—"}</TableCell>
                              <TableCell className="capitalize">{transaction.fuelType || "—"}</TableCell>
                              <TableCell>{`${transaction.liters.toFixed(1)}L`}</TableCell>
                              <TableCell className="font-medium">{`₦${transaction.totalCost.toLocaleString()}`}</TableCell>
                              <TableCell>{formatDayMonthTime(transaction.recordedAt)}</TableCell>
                            </TableRow>
                          ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="analytics"
            className="space-y-4"
          >
            <div className={SURFACE_CARD_CLASS}>
              <div className="p-6 pb-4 flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <h3 className="font-semibold tracking-tight text-foreground font-display text-base">Weekly Consumption</h3>
                  <p className="text-sm text-muted-foreground">{`${chartFuelTypes.map(capitalizeFuelType).join(" vs ")} usage by day`}</p>
                </div>
              </div>
              <div className="p-6 pt-0">
                {weeklyAnalyticsQuery.isLoading
                  ? (
                      <Skeleton className="h-[300px] w-full" />
                    )
                  : weeklyAnalyticsQuery.isError
                    ? (
                        <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                          <p>Unable to load fuel consumption data.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => weeklyAnalyticsQuery.refetch()}
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
                                  name={`${capitalizeFuelType(fuelType)} (L)`}
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
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
                    onValueChange={(value) => {
                      setVehicleRegError(null);
                      setNewTransaction({
                        ...newTransaction, vehicleReg: value,
                      });
                    }}
                    disabled={vehiclesQuery.isLoading || vehicleOptions.length === 0}
                  >
                    <SelectTrigger aria-invalid={!!vehicleRegError}>
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
                  {vehicleRegError && <p className="text-sm font-medium text-destructive">{vehicleRegError}</p>}
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
      </div>
    </>
  );
}
