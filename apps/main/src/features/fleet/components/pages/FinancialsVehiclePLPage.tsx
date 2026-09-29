import type { ColumnDef } from "@tanstack/react-table";
import type { FleetFinancialsLayoutContext } from "@/features/fleet/components/layout/FleetFinancialsLayout";
import type { ProfitabilityAnalysisRow } from "@/features/fleet/utils/fleetFinancials";
import {
  exportVehiclePL,
  useFleetProfitability,
} from "@truckmoov/api/fleet";
import {
  Download, FileText, Search, SlidersHorizontal,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { useOutletContext } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";

import { useCurrency } from "@/contexts/CurrencyContext";
import {
  downloadBlob,
  getFilenameFromDisposition,
  normalizeProfitabilityRow,
  optionalNumber,
  periodToMonths,
  useDebouncedValue,
} from "@/features/fleet/utils/fleetFinancials";

export default function FinancialsVehiclePLPage() {
  const {
    profitabilityPeriod,
    openConfigDialog,
    openStatementBuilder,
    getTierBadge,
    buildVehicleNameLookup,
  } = useOutletContext<FleetFinancialsLayoutContext>();
  const { format } = useCurrency();

  // Vehicle P&L filters
  const [
    vehicleSearch,
    setVehicleSearch,
  ] = useState("");
  const [
    vehicleStatusFilter,
    setVehicleStatusFilter,
  ] = useState<string>("all");
  const [
    vehicleFilterOpen,
    setVehicleFilterOpen,
  ] = useState(false);
  const [
    marginFilterEnabled,
    setMarginFilterEnabled,
  ] = useState(false);
  const [
    draftMarginFilterEnabled,
    setDraftMarginFilterEnabled,
  ] = useState(false);
  const [
    marginMin,
    setMarginMin,
  ] = useState("");
  const [
    marginMax,
    setMarginMax,
  ] = useState("");
  const [
    draftMarginMin,
    setDraftMarginMin,
  ] = useState("");
  const [
    draftMarginMax,
    setDraftMarginMax,
  ] = useState("");
  const [
    revenueFilterEnabled,
    setRevenueFilterEnabled,
  ] = useState(false);
  const [
    draftRevenueFilterEnabled,
    setDraftRevenueFilterEnabled,
  ] = useState(false);
  const [
    revenueMin,
    setRevenueMin,
  ] = useState("");
  const [
    revenueMax,
    setRevenueMax,
  ] = useState("");
  const [
    draftRevenueMin,
    setDraftRevenueMin,
  ] = useState("");
  const [
    draftRevenueMax,
    setDraftRevenueMax,
  ] = useState("");
  const [
    profitFilterEnabled,
    setProfitFilterEnabled,
  ] = useState(false);
  const [
    draftProfitFilterEnabled,
    setDraftProfitFilterEnabled,
  ] = useState(false);
  const [
    profitMin,
    setProfitMin,
  ] = useState("");
  const [
    profitMax,
    setProfitMax,
  ] = useState("");
  const [
    draftProfitMin,
    setDraftProfitMin,
  ] = useState("");
  const [
    draftProfitMax,
    setDraftProfitMax,
  ] = useState("");
  const [
    scoreFilterEnabled,
    setScoreFilterEnabled,
  ] = useState(false);
  const [
    draftScoreFilterEnabled,
    setDraftScoreFilterEnabled,
  ] = useState(false);
  const [
    scoreMin,
    setScoreMin,
  ] = useState("");
  const [
    scoreMax,
    setScoreMax,
  ] = useState("");
  const [
    draftScoreMin,
    setDraftScoreMin,
  ] = useState("");
  const [
    draftScoreMax,
    setDraftScoreMax,
  ] = useState("");
  const debouncedVehicleSearch = useDebouncedValue(vehicleSearch.trim());
  const debouncedVehicleFilters = useDebouncedValue({
    status: vehicleStatusFilter,
    marginFilterEnabled,
    marginMin,
    marginMax,
    revenueFilterEnabled,
    revenueMin,
    revenueMax,
    profitFilterEnabled,
    profitMin,
    profitMax,
    scoreFilterEnabled,
    scoreMin,
    scoreMax,
  });
  const vehicleProfitabilityPayload = useMemo(
    () => ({
      data: {
        periodMonths: periodToMonths(profitabilityPeriod),
        search: debouncedVehicleSearch || undefined,
        marginFrom: debouncedVehicleFilters.marginFilterEnabled ? optionalNumber(debouncedVehicleFilters.marginMin) : undefined,
        marginTo: debouncedVehicleFilters.marginFilterEnabled ? optionalNumber(debouncedVehicleFilters.marginMax) : undefined,
        revenueFrom: debouncedVehicleFilters.revenueFilterEnabled ? optionalNumber(debouncedVehicleFilters.revenueMin) : undefined,
        revenueTo: debouncedVehicleFilters.revenueFilterEnabled ? optionalNumber(debouncedVehicleFilters.revenueMax) : undefined,
        netProfitFrom: debouncedVehicleFilters.profitFilterEnabled ? optionalNumber(debouncedVehicleFilters.profitMin) : undefined,
        netProfitTo: debouncedVehicleFilters.profitFilterEnabled ? optionalNumber(debouncedVehicleFilters.profitMax) : undefined,
        scoreFrom: debouncedVehicleFilters.scoreFilterEnabled ? optionalNumber(debouncedVehicleFilters.scoreMin) : undefined,
        scoreTo: debouncedVehicleFilters.scoreFilterEnabled ? optionalNumber(debouncedVehicleFilters.scoreMax) : undefined,
      },
    }),
    [
      profitabilityPeriod,
      debouncedVehicleSearch,
      debouncedVehicleFilters,
    ],
  );
  const {
    data: vehicleProfitabilityResp,
    isFetching: isVehicleProfitabilityFetching,
  } = useFleetProfitability(vehicleProfitabilityPayload);
  const vehicleProfitabilityData = useMemo(
    () => (vehicleProfitabilityResp?.data ?? []).map(normalizeProfitabilityRow),
    [vehicleProfitabilityResp?.data],
  );

  // ponytail: profitability DTO rejects `status` (400), so the tier filter runs client-side.
  const tierFilter = debouncedVehicleFilters.status;
  const vehicleTableData = tierFilter === "all"
    ? vehicleProfitabilityData
    : vehicleProfitabilityData.filter(v => v.profitability?.tier === tierFilter);
  const getVehicleName = useMemo(
    () => buildVehicleNameLookup(vehicleProfitabilityData),
    [
      buildVehicleNameLookup,
      vehicleProfitabilityData,
    ],
  );

  const [
    isExportingVehiclePL,
    setIsExportingVehiclePL,
  ] = useState(false);
  // ponytail: the server export takes only the period, so the table's search/filters don't narrow it.
  const handleExportVehiclePL = async () => {
    setIsExportingVehiclePL(true);
    try {
      const result = await exportVehiclePL({ params: { periodMonths: periodToMonths(profitabilityPeriod) } });
      downloadBlob(
        new Blob(
          [result.blob],
          { type: result.contentType || "text/csv" },
        ),
        getFilenameFromDisposition(
          result.contentDisposition,
          "vehicle-profit-and-loss.csv",
        ),
      );
    }
    catch {
      toast.error("Failed to export vehicle P&L");
    }
    finally {
      setIsExportingVehiclePL(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action buttons — outside the table card, top-right */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={openStatementBuilder}
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate Statement
        </Button>
        <Button onClick={openConfigDialog}>
          Configure Costs
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Vehicle Profit & Loss</CardTitle>
              <CardDescription>Individual vehicle financial performance</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleExportVehiclePL}
              loading={isExportingVehiclePL}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle..."
                value={vehicleSearch}
                onChange={e => setVehicleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={vehicleStatusFilter}
              onValueChange={setVehicleStatusFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="marginal">Marginal</SelectItem>
                <SelectItem value="loss-making">Loss-Making</SelectItem>
              </SelectContent>
            </Select>
            <Popover
              open={vehicleFilterOpen}
              onOpenChange={(open) => {
                if (open) {
                  setDraftMarginFilterEnabled(marginFilterEnabled);
                  setDraftMarginMin(marginMin);
                  setDraftMarginMax(marginMax);
                  setDraftRevenueFilterEnabled(revenueFilterEnabled);
                  setDraftRevenueMin(revenueMin);
                  setDraftRevenueMax(revenueMax);
                  setDraftProfitFilterEnabled(profitFilterEnabled);
                  setDraftProfitMin(profitMin);
                  setDraftProfitMax(profitMax);
                  setDraftScoreFilterEnabled(scoreFilterEnabled);
                  setDraftScoreMin(scoreMin);
                  setDraftScoreMax(scoreMax);
                }
                setVehicleFilterOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="relative"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                  {(marginFilterEnabled || revenueFilterEnabled || profitFilterEnabled || scoreFilterEnabled) && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-1.5 text-[10px]"
                    >
                      {[
                        marginFilterEnabled,
                        revenueFilterEnabled,
                        profitFilterEnabled,
                        scoreFilterEnabled,
                      ].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 space-y-4 max-h-[70vh] overflow-y-auto"
              >
                <Label className="text-sm font-semibold">Show Vehicles</Label>

                {[
                  {
                    id: "vpl-margin", label: "Margin %", enabled: draftMarginFilterEnabled, setEnabled: setDraftMarginFilterEnabled, min: draftMarginMin, setMin: setDraftMarginMin, max: draftMarginMax, setMax: setDraftMarginMax,
                  },
                  {
                    id: "vpl-revenue", label: "Revenue (₦)", enabled: draftRevenueFilterEnabled, setEnabled: setDraftRevenueFilterEnabled, min: draftRevenueMin, setMin: setDraftRevenueMin, max: draftRevenueMax, setMax: setDraftRevenueMax,
                  },
                  {
                    id: "vpl-profit", label: "Net Profit (₦)", enabled: draftProfitFilterEnabled, setEnabled: setDraftProfitFilterEnabled, min: draftProfitMin, setMin: setDraftProfitMin, max: draftProfitMax, setMax: setDraftProfitMax,
                  },
                  {
                    id: "vpl-score", label: "Score (0–100)", enabled: draftScoreFilterEnabled, setEnabled: setDraftScoreFilterEnabled, min: draftScoreMin, setMin: setDraftScoreMin, max: draftScoreMax, setMax: setDraftScoreMax,
                  },
                ].map(f => (
                  <div
                    key={f.id}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={f.id}
                        checked={f.enabled}
                        onCheckedChange={c => f.setEnabled(c === true)}
                      />
                      <Label
                        htmlFor={f.id}
                        className="text-xs cursor-pointer"
                      >
                        {f.label}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="From"
                        value={f.min}
                        onChange={e => f.setMin(e.target.value)}
                        disabled={!f.enabled}
                        className="h-9"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="number"
                        placeholder="To"
                        value={f.max}
                        onChange={e => f.setMax(e.target.value)}
                        disabled={!f.enabled}
                        className="h-9"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex justify-between gap-2 pt-3 border-t border-border">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setMarginFilterEnabled(draftMarginFilterEnabled);
                      setMarginMin(draftMarginFilterEnabled ? draftMarginMin : "");
                      setMarginMax(draftMarginFilterEnabled ? draftMarginMax : "");
                      setRevenueFilterEnabled(draftRevenueFilterEnabled);
                      setRevenueMin(draftRevenueFilterEnabled ? draftRevenueMin : "");
                      setRevenueMax(draftRevenueFilterEnabled ? draftRevenueMax : "");
                      setProfitFilterEnabled(draftProfitFilterEnabled);
                      setProfitMin(draftProfitFilterEnabled ? draftProfitMin : "");
                      setProfitMax(draftProfitFilterEnabled ? draftProfitMax : "");
                      setScoreFilterEnabled(draftScoreFilterEnabled);
                      setScoreMin(draftScoreFilterEnabled ? draftScoreMin : "");
                      setScoreMax(draftScoreFilterEnabled ? draftScoreMax : "");
                      setVehicleFilterOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setMarginFilterEnabled(false);
                      setMarginMin("");
                      setMarginMax("");
                      setRevenueFilterEnabled(false);
                      setRevenueMin("");
                      setRevenueMax("");
                      setProfitFilterEnabled(false);
                      setProfitMin("");
                      setProfitMax("");
                      setScoreFilterEnabled(false);
                      setScoreMin("");
                      setScoreMax("");
                      setDraftMarginFilterEnabled(false);
                      setDraftMarginMin("");
                      setDraftMarginMax("");
                      setDraftRevenueFilterEnabled(false);
                      setDraftRevenueMin("");
                      setDraftRevenueMax("");
                      setDraftProfitFilterEnabled(false);
                      setDraftProfitMin("");
                      setDraftProfitMax("");
                      setDraftScoreFilterEnabled(false);
                      setDraftScoreMin("");
                      setDraftScoreMax("");
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
          {(() => {
            const plColumns: ColumnDef<ProfitabilityAnalysisRow>[] = [
              {
                id: "vehicle",
                header: "Vehicle",
                meta: { className: "font-medium" },
                cell: ({ row }) => getVehicleName(row.original.vehicle_id),
              },
              {
                id: "revenue",
                header: "Revenue",
                meta: { className: "text-right text-success" },
                cell: ({ row }) => format(row.original.revenue?.total || 0),
              },
              {
                id: "costs",
                header: "Costs",
                meta: { className: "text-right text-destructive" },
                cell: ({ row }) => format(row.original.costs?.total || 0),
              },
              {
                id: "profit",
                header: "Profit",
                meta: { className: "text-right font-semibold" },
                cell: ({ row }) => (
                  <span className={(row.original.profitability?.net_profit || 0) >= 0 ? "text-success" : "text-destructive"}>
                    {format(row.original.profitability?.net_profit || 0)}
                  </span>
                ),
              },
              {
                id: "margin",
                header: "Margin",
                meta: { className: "text-right" },
                cell: ({ row }) => `${(row.original.profitability?.margin_percent || 0).toFixed(1)}%`,
              },
              {
                id: "status",
                header: "Status",
                cell: ({ row }) => getTierBadge(row.original.profitability?.tier || "marginal"),
              },
              {
                id: "score",
                header: "Score",
                meta: { className: "text-right" },
                cell: ({ row }) => (
                  <div className="flex items-center gap-2 justify-end">
                    <Progress
                      value={row.original.profitability?.score || 0}
                      className="w-16 h-2"
                    />
                    <span className="text-sm">{row.original.profitability?.score || 0}</span>
                  </div>
                ),
              },
            ];
            return (
              <DataTable
                columns={plColumns}
                data={vehicleTableData}
                emptyState={isVehicleProfitabilityFetching ? "Calculating profitability..." : "No matching vehicle profit and loss data."}
              />
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
