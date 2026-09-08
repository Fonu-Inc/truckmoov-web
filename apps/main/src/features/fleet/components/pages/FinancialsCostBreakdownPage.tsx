import type { ColumnDef } from "@tanstack/react-table";
import type { FleetFinancialsLayoutContext } from "@/features/fleet/components/layout/FleetFinancialsLayout";
import type { PeriodValue } from "@/features/fleet/components/ui/PeriodFilter";
import type { ProfitabilityAnalysisRow } from "@/features/fleet/utils/fleetFinancials";
import {
  exportFleetCostBreakdown,
  useFleetProfitability,
} from "@truckmoov/api/fleet";
import {
  Download, Search, SlidersHorizontal,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { useOutletContext } from "react-router";
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

import { useCurrency } from "@/contexts/CurrencyContext";
import {
  DEMO_PL,
  downloadBlob,
  getFilenameFromDisposition,
  normalizeProfitabilityRow,
  periodToMonths,
} from "@/features/fleet/utils/fleetFinancials";

export default function FinancialsCostBreakdownPage() {
  const { getVehicleName } = useOutletContext<FleetFinancialsLayoutContext>();
  const { format } = useCurrency();

  const [costBreakdownPeriod] = useState<PeriodValue>("30");
  const costBreakdownPayload = useMemo(
    () => ({ data: { periodMonths: periodToMonths(costBreakdownPeriod) } }),
    [costBreakdownPeriod],
  );
  const { data: profitabilityResp } = useFleetProfitability(costBreakdownPayload);
  const profitabilityData = useMemo(
    () => (profitabilityResp?.data ?? []).map(normalizeProfitabilityRow),
    [profitabilityResp?.data],
  );

  const [
    isExportingCostBreakdown,
    setIsExportingCostBreakdown,
  ] = useState(false);

  // Detailed Cost Analysis filters
  const [
    costSearch,
    setCostSearch,
  ] = useState("");

  const [
    costFilterOpen,
    setCostFilterOpen,
  ] = useState(false);
  const [
    costTotalEnabled,
    setCostTotalEnabled,
  ] = useState(false);
  const [
    costTotalMin,
    setCostTotalMin,
  ] = useState("");
  const [
    costTotalMax,
    setCostTotalMax,
  ] = useState("");
  const [
    draftCostTotalEnabled,
    setDraftCostTotalEnabled,
  ] = useState(false);
  const [
    draftCostTotalMin,
    setDraftCostTotalMin,
  ] = useState("");
  const [
    draftCostTotalMax,
    setDraftCostTotalMax,
  ] = useState("");
  const [
    costFuelEnabled,
    setCostFuelEnabled,
  ] = useState(false);
  const [
    costFuelMin,
    setCostFuelMin,
  ] = useState("");
  const [
    costFuelMax,
    setCostFuelMax,
  ] = useState("");
  const [
    draftCostFuelEnabled,
    setDraftCostFuelEnabled,
  ] = useState(false);
  const [
    draftCostFuelMin,
    setDraftCostFuelMin,
  ] = useState("");
  const [
    draftCostFuelMax,
    setDraftCostFuelMax,
  ] = useState("");
  const [
    costWagesEnabled,
    setCostWagesEnabled,
  ] = useState(false);
  const [
    costWagesMin,
    setCostWagesMin,
  ] = useState("");
  const [
    costWagesMax,
    setCostWagesMax,
  ] = useState("");
  const [
    draftCostWagesEnabled,
    setDraftCostWagesEnabled,
  ] = useState(false);
  const [
    draftCostWagesMin,
    setDraftCostWagesMin,
  ] = useState("");
  const [
    draftCostWagesMax,
    setDraftCostWagesMax,
  ] = useState("");
  const [
    costMaintEnabled,
    setCostMaintEnabled,
  ] = useState(false);
  const [
    costMaintMin,
    setCostMaintMin,
  ] = useState("");
  const [
    costMaintMax,
    setCostMaintMax,
  ] = useState("");
  const [
    draftCostMaintEnabled,
    setDraftCostMaintEnabled,
  ] = useState(false);
  const [
    draftCostMaintMin,
    setDraftCostMaintMin,
  ] = useState("");
  const [
    draftCostMaintMax,
    setDraftCostMaintMax,
  ] = useState("");

  const displayData: ProfitabilityAnalysisRow[] = profitabilityData.length > 0 ? profitabilityData : DEMO_PL;

  const handleExportCostBreakdown = async () => {
    setIsExportingCostBreakdown(true);
    try {
      const result = await exportFleetCostBreakdown();
      const filename = getFilenameFromDisposition(
        result.contentDisposition,
        "vehicle-cost-analysis.csv",
      );
      downloadBlob(
        new Blob(
          [result.blob],
          { type: result.contentType || "text/csv" },
        ),
        filename,
      );
    }
    finally {
      setIsExportingCostBreakdown(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Detailed Cost Analysis</CardTitle>
              <CardDescription>Per-vehicle cost breakdown</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleExportCostBreakdown}
              disabled={isExportingCostBreakdown}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExportingCostBreakdown ? "Exporting..." : "Export Data"}
            </Button>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle..."
                value={costSearch}
                onChange={e => setCostSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover
              open={costFilterOpen}
              onOpenChange={(open) => {
                if (open) {
                  setDraftCostTotalEnabled(costTotalEnabled);
                  setDraftCostTotalMin(costTotalMin);
                  setDraftCostTotalMax(costTotalMax);
                  setDraftCostFuelEnabled(costFuelEnabled);
                  setDraftCostFuelMin(costFuelMin);
                  setDraftCostFuelMax(costFuelMax);
                  setDraftCostWagesEnabled(costWagesEnabled);
                  setDraftCostWagesMin(costWagesMin);
                  setDraftCostWagesMax(costWagesMax);
                  setDraftCostMaintEnabled(costMaintEnabled);
                  setDraftCostMaintMin(costMaintMin);
                  setDraftCostMaintMax(costMaintMax);
                }
                setCostFilterOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="relative"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                  {(costTotalEnabled || costFuelEnabled || costWagesEnabled || costMaintEnabled) && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-1.5 text-[10px]"
                    >
                      {[
                        costTotalEnabled,
                        costFuelEnabled,
                        costWagesEnabled,
                        costMaintEnabled,
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
                    id: "cost-total", label: "Total Cost (₦)", enabled: draftCostTotalEnabled, setEnabled: setDraftCostTotalEnabled, min: draftCostTotalMin, setMin: setDraftCostTotalMin, max: draftCostTotalMax, setMax: setDraftCostTotalMax,
                  },
                  {
                    id: "cost-fuel", label: "Fuel Cost (₦)", enabled: draftCostFuelEnabled, setEnabled: setDraftCostFuelEnabled, min: draftCostFuelMin, setMin: setDraftCostFuelMin, max: draftCostFuelMax, setMax: setDraftCostFuelMax,
                  },
                  {
                    id: "cost-wages", label: "Wages Cost (₦)", enabled: draftCostWagesEnabled, setEnabled: setDraftCostWagesEnabled, min: draftCostWagesMin, setMin: setDraftCostWagesMin, max: draftCostWagesMax, setMax: setDraftCostWagesMax,
                  },
                  {
                    id: "cost-maint", label: "Maintenance Cost (₦)", enabled: draftCostMaintEnabled, setEnabled: setDraftCostMaintEnabled, min: draftCostMaintMin, setMin: setDraftCostMaintMin, max: draftCostMaintMax, setMax: setDraftCostMaintMax,
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
                      setCostTotalEnabled(draftCostTotalEnabled);
                      setCostTotalMin(draftCostTotalEnabled ? draftCostTotalMin : "");
                      setCostTotalMax(draftCostTotalEnabled ? draftCostTotalMax : "");
                      setCostFuelEnabled(draftCostFuelEnabled);
                      setCostFuelMin(draftCostFuelEnabled ? draftCostFuelMin : "");
                      setCostFuelMax(draftCostFuelEnabled ? draftCostFuelMax : "");
                      setCostWagesEnabled(draftCostWagesEnabled);
                      setCostWagesMin(draftCostWagesEnabled ? draftCostWagesMin : "");
                      setCostWagesMax(draftCostWagesEnabled ? draftCostWagesMax : "");
                      setCostMaintEnabled(draftCostMaintEnabled);
                      setCostMaintMin(draftCostMaintEnabled ? draftCostMaintMin : "");
                      setCostMaintMax(draftCostMaintEnabled ? draftCostMaintMax : "");
                      setCostFilterOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setCostTotalEnabled(false);
                      setCostTotalMin("");
                      setCostTotalMax("");
                      setCostFuelEnabled(false);
                      setCostFuelMin("");
                      setCostFuelMax("");
                      setCostWagesEnabled(false);
                      setCostWagesMin("");
                      setCostWagesMax("");
                      setCostMaintEnabled(false);
                      setCostMaintMin("");
                      setCostMaintMax("");
                      setDraftCostTotalEnabled(false);
                      setDraftCostTotalMin("");
                      setDraftCostTotalMax("");
                      setDraftCostFuelEnabled(false);
                      setDraftCostFuelMin("");
                      setDraftCostFuelMax("");
                      setDraftCostWagesEnabled(false);
                      setDraftCostWagesMin("");
                      setDraftCostWagesMax("");
                      setDraftCostMaintEnabled(false);
                      setDraftCostMaintMin("");
                      setDraftCostMaintMax("");
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
            const rows = displayData.filter((item) => {
              const name = getVehicleName(item.vehicle_id).toLowerCase();
              if (costSearch && !name.includes(costSearch.toLowerCase()))
                return false;
              if (costTotalEnabled) {
                const t = item.costs?.total ?? 0;
                if (costTotalMin && t < Number(costTotalMin))
                  return false;
                if (costTotalMax && t > Number(costTotalMax))
                  return false;
              }
              if (costFuelEnabled) {
                const f = item.costs?.fuel ?? 0;
                if (costFuelMin && f < Number(costFuelMin))
                  return false;
                if (costFuelMax && f > Number(costFuelMax))
                  return false;
              }
              if (costWagesEnabled) {
                const m = item.costs?.wages ?? 0;
                if (costWagesMin && m < Number(costWagesMin))
                  return false;
                if (costWagesMax && m > Number(costWagesMax))
                  return false;
              }
              if (costMaintEnabled) {
                const mn = item.costs?.maintenance ?? 0;
                if (costMaintMin && mn < Number(costMaintMin))
                  return false;
                if (costMaintMax && mn > Number(costMaintMax))
                  return false;
              }
              return true;
            });
            const columns: ColumnDef<ProfitabilityAnalysisRow>[] = [
              {
                id: "vehicle",
                header: "Vehicle",
                meta: { className: "font-medium" },
                cell: ({ row }) => getVehicleName(row.original.vehicle_id),
              },
              {
                id: "fuel", header: "Fuel", meta: { className: "text-right" }, cell: ({ row }) => format(row.original.costs?.fuel || 0),
              },
              {
                id: "maintenance", header: "Maintenance", meta: { className: "text-right" }, cell: ({ row }) => format(row.original.costs?.maintenance || 0),
              },
              {
                id: "wages", header: "Wages", meta: { className: "text-right" }, cell: ({ row }) => format(row.original.costs?.wages || 0),
              },
              {
                id: "insurance", header: "Insurance", meta: { className: "text-right" }, cell: ({ row }) => format(row.original.costs?.insurance || 0),
              },
              {
                id: "depreciation", header: "Depreciation", meta: { className: "text-right" }, cell: ({ row }) => format(row.original.costs?.depreciation || 0),
              },
              {
                id: "total", header: "Total", meta: { className: "text-right font-semibold" }, cell: ({ row }) => format(row.original.costs?.total || 0),
              },
            ];
            return (
              <DataTable
                columns={columns}
                data={rows}
                emptyState="No cost data yet."
                filteredEmptyState="No vehicles match your filters."
              />
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
