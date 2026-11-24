import type { ReactNode } from "react";
import type { PeriodValue } from "@/features/fleet/components/ui/PeriodFilter";
import type {
  ProfitabilityAnalysisRow, VehicleLookup,
} from "@/features/fleet/utils/fleetFinancials";
import {
  useFleetFinancialSummary,
  useFleetProfitability,
} from "@truckmoov/api/fleet";
import {
  Calculator, DollarSign, TrendingDown, TrendingUp,
} from "lucide-react";
import {
  useCallback, useMemo, useState,
} from "react";
import {
  NavLink, Outlet,
} from "react-router";
import { useCurrency } from "@/contexts/CurrencyContext";
import { VehicleFinancialConfigDialog } from "@/features/fleet/components/ui/VehicleFinancialConfigDialog";
import { VehiclePLStatementBuilder } from "@/features/fleet/components/ui/VehiclePLStatementBuilder";
import {
  normalizeProfitabilityRow, normalizeTier, periodToMonths, TIER_LABELS,
} from "@/features/fleet/utils/fleetFinancials";
import { FINANCIALS_TABS } from "@/features/fleet/utils/fleetFinancialsNav";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/layout/PageHeader";

export type FleetFinancialsLayoutContext = {
  openConfigDialog: () => void;
  openStatementBuilder: () => void;
  profitabilityData: ProfitabilityAnalysisRow[];
  profitabilityPeriod: PeriodValue;
  setProfitabilityPeriod: (p: PeriodValue) => void;
  isProfitabilityFetching: boolean;
  getVehicleName: (id: string) => string;
  /**
   * Build a vehicle-name lookup that also folds in rows the page owns
   * (e.g. the filtered Vehicle P&L list, or the Underperforming list).
   * Kept to preserve the merged lookup behaviour of the original single-file
   * component, where all three data sources contributed names.
   */
  buildVehicleNameLookup: (extraRows: ProfitabilityAnalysisRow[]) => (id: string) => string;
  getTierBadge: (tier: string) => ReactNode;
};

export function FleetFinancialsLayout() {
  const vehicles: VehicleLookup[] = useMemo(
    () => [],
    [],
  );
  const { format } = useCurrency();
  const [
    profitabilityPeriod,
    setProfitabilityPeriod,
  ] = useState<PeriodValue>("30");
  // KPI cards follow the same period picker as the profitability table.
  const { data: financialSummaryResp } = useFleetFinancialSummary({ params: { periodMonths: periodToMonths(profitabilityPeriod) } });
  const profitabilityPayload = useMemo(
    () => ({ data: { periodMonths: periodToMonths(profitabilityPeriod) } }),
    [profitabilityPeriod],
  );
  const {
    data: profitabilityResp,
    isFetching: isProfitabilityFetching,
  } = useFleetProfitability(profitabilityPayload);
  const profitabilityData = useMemo(
    () => (profitabilityResp?.data ?? []).map(normalizeProfitabilityRow),
    [profitabilityResp?.data],
  );

  const [
    configDialogOpen,
    setConfigDialogOpen,
  ] = useState(false);
  const [
    statementBuilderOpen,
    setStatementBuilderOpen,
  ] = useState(false);

  const fleetTotals = profitabilityData.reduce(
    (acc, v) => ({
      totalRevenue: acc.totalRevenue + (v.revenue?.total || 0),
      totalCosts: acc.totalCosts + (v.costs?.total || 0),
      totalProfit: acc.totalProfit + (v.profitability?.net_profit || 0),
      jobsCompleted: acc.jobsCompleted + (v.revenue?.jobs_completed || 0),
      totalKm: acc.totalKm + (v.revenue?.total_km || 0),
    }),
    {
      totalRevenue: 0, totalCosts: 0, totalProfit: 0, jobsCompleted: 0, totalKm: 0,
    },
  );

  const fleetMargin = fleetTotals.totalRevenue > 0
    ? (fleetTotals.totalProfit / fleetTotals.totalRevenue) * 100
    : 0;

  const displayTotals = profitabilityData.reduce(
    (acc, v) => ({
      totalRevenue: acc.totalRevenue + (v.revenue?.total || 0),
      totalCosts: acc.totalCosts + (v.costs?.total || 0),
      totalProfit: acc.totalProfit + (v.profitability?.net_profit || 0),
    }),
    {
      totalRevenue: 0, totalCosts: 0, totalProfit: 0,
    },
  );
  const displayMargin = displayTotals.totalRevenue > 0
    ? (displayTotals.totalProfit / displayTotals.totalRevenue) * 100
    : 0;
  const financialSummary = financialSummaryResp?.data;
  const hasFinancialSummaryValues = Boolean(
    financialSummary
    && (
      financialSummary.totalRevenue !== 0
      || financialSummary.totalCost !== 0
      || financialSummary.totalProfit !== 0
      || financialSummary.avgMarginPercent !== 0
    ),
  );
  const summaryStats = hasFinancialSummaryValues
    ? {
        totalRevenue: financialSummary!.totalRevenue,
        totalCost: financialSummary!.totalCost,
        totalProfit: financialSummary!.totalProfit,
        avgMarginPercent: financialSummary!.avgMarginPercent,
        vehicleCount: financialSummary!.vehicleCount,
      }
    : {
        totalRevenue: displayTotals.totalRevenue || fleetTotals.totalRevenue,
        totalCost: displayTotals.totalCosts || fleetTotals.totalCosts,
        totalProfit: displayTotals.totalProfit || fleetTotals.totalProfit,
        avgMarginPercent: displayMargin || fleetMargin,
        vehicleCount: financialSummary?.vehicleCount ?? profitabilityData.length,
      };

  const buildVehicleNameLookup = useCallback(
    (extraRows: ProfitabilityAnalysisRow[]) => {
      const lookup = Object.fromEntries(
        [
          ...profitabilityData,
          ...extraRows,
        ].map(item => [
          item.vehicle_id,
          item.name || item.plateNumber,
        ]),
      );
      return (vehicleId: string) => {
        if (lookup[vehicleId])
          return lookup[vehicleId] as string;
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle?.registrationNumber || vehicleId.slice(
          0,
          8,
        );
      };
    },
    [
      profitabilityData,
      vehicles,
    ],
  );

  const getVehicleName = useMemo(
    () => buildVehicleNameLookup([]),
    [buildVehicleNameLookup],
  );

  const getTierBadge = useCallback(
    (tier: string) => {
      // Design app's tier badge colours, copied verbatim (incl. its palette classes).
      const colors: Record<string, string> = {
        "excellent": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        "good": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        "marginal": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        "loss-making": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        "unscored": "bg-muted text-muted-foreground",
      };
      return (
        <div className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow-sm hover:bg-primary/90",
          colors[normalizeTier(tier)] || colors.marginal,
        )}
        >
          {TIER_LABELS[normalizeTier(tier)] || tier}
        </div>
      );
    },
    [],
  );

  const ctx: FleetFinancialsLayoutContext = {
    openConfigDialog: () => setConfigDialogOpen(true),
    openStatementBuilder: () => setStatementBuilderOpen(true),
    profitabilityData,
    profitabilityPeriod,
    setProfitabilityPeriod,
    isProfitabilityFetching,
    getVehicleName,
    buildVehicleNameLookup,
    getTierBadge,
  };

  return (
    <>
      <PageHeader
        title="Financials"
        description="Details and current information for financials."
      />
      <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl surface-sleek text-card-foreground">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{format(summaryStats.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{`Total Revenue · ${fleetTotals.jobsCompleted} jobs`}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl surface-sleek text-card-foreground">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{format(summaryStats.totalCost)}</p>
                    <p className="text-xs text-muted-foreground">{`Total Costs · ${fleetTotals.totalKm.toFixed(0)} km`}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl surface-sleek text-card-foreground">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${summaryStats.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {format(summaryStats.totalProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground">{`Net Profit · ${summaryStats.avgMarginPercent.toFixed(1)}% margin`}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl surface-sleek text-card-foreground">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Calculator className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {fleetTotals.totalKm > 0 ? format(fleetTotals.totalCosts / fleetTotals.totalKm) : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Cost per KM · Fleet average</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <nav
              aria-label="Financials sections"
              className="h-10 items-center rounded-xl bg-secondary/60 text-muted-foreground inline-flex w-auto justify-start gap-1 p-1"
            >
              {FINANCIALS_TABS.map(t => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end
                  className={({ isActive }) => cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg py-1.5 text-sm font-medium ring-offset-background transition-all duration-150 hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-3",
                    isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
                  )}
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>

            <Outlet context={ctx} />
          </div>
        </div>
      </div>

      <VehicleFinancialConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        vehicles={vehicles.map(v => ({
          id: v.id,
          registration_number: v.registrationNumber,
          make: v.make,
          model: v.model,
        }))}
      />

      <VehiclePLStatementBuilder
        open={statementBuilderOpen}
        onOpenChange={setStatementBuilderOpen}
        data={profitabilityData}
        vehicleNameLookup={getVehicleName}
        defaultPeriodLabel={`Last ${profitabilityPeriod} days`}
        periodMonths={periodToMonths(profitabilityPeriod)}
      />
    </>
  );
}

export default FleetFinancialsLayout;
