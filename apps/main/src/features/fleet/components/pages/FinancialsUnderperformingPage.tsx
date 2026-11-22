import type { FleetFinancialsLayoutContext } from "@/features/fleet/components/layout/FleetFinancialsLayout";
import type { PeriodValue } from "@/features/fleet/components/ui/PeriodFilter";
import type { ProfitabilityAnalysisRow } from "@/features/fleet/utils/fleetFinancials";
import { useFleetProfitability } from "@truckmoov/api/fleet";
import {
  AlertTriangle, CheckCircle,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { useOutletContext } from "react-router";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PeriodFilter } from "@/features/fleet/components/ui/PeriodFilter";
import {
  normalizeProfitabilityRow,
  periodToMonths,

} from "@/features/fleet/utils/fleetFinancials";

export default function FinancialsUnderperformingPage() {
  const {
    profitabilityData,
    getTierBadge,
    buildVehicleNameLookup,
  } = useOutletContext<FleetFinancialsLayoutContext>();
  const { format } = useCurrency();

  const [
    underperformingPeriod,
    setUnderperformingPeriod,
  ] = useState<PeriodValue>("30");
  const underperformingPayload = useMemo(
    () => ({ data: { periodMonths: periodToMonths(underperformingPeriod) } }),
    [underperformingPeriod],
  );
  const { data: underperformingResp } = useFleetProfitability(underperformingPayload);
  const underperformingData = useMemo(
    () => (underperformingResp?.data ?? []).map(normalizeProfitabilityRow),
    [underperformingResp?.data],
  );

  const displayData: ProfitabilityAnalysisRow[] = profitabilityData;
  const underperformingSource = underperformingResp ? underperformingData : displayData;
  const underperformingVehicles = underperformingSource
    .filter(v => v.profitability?.tier === "loss-making" || v.profitability?.tier === "marginal")
    .sort((a, b) => (a.profitability?.net_profit || 0) - (b.profitability?.net_profit || 0));

  const getVehicleName = useMemo(
    () => buildVehicleNameLookup(underperformingData),
    [
      buildVehicleNameLookup,
      underperformingData,
    ],
  );

  return (
    <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <div className="rounded-2xl surface-sleek text-card-foreground">
        <div className="p-6 pb-4 flex flex-row items-start justify-between gap-2 space-y-0">
          <div>
            <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Underperforming Assets
            </h3>
            <p className="text-sm text-muted-foreground">
              Vehicles with marginal or negative profitability requiring attention
            </p>
          </div>
          <PeriodFilter
            value={underperformingPeriod}
            onChange={setUnderperformingPeriod}
            variant="short"
            className="rounded-xl px-3.5 w-[140px] h-8"
          />
        </div>
        <div className="p-6 pt-0">
          {underperformingVehicles.length === 0
            ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                  <p className="text-muted-foreground">All vehicles are performing well!</p>
                </div>
              )
            : (
                <div className="space-y-4">
                  {underperformingVehicles.map((item) => {
                    const vehicleName = getVehicleName(item.vehicle_id);
                    const vehicleDescription = [
                      item.make,
                      item.model,
                    ].filter(Boolean).join(" ");
                    const vehicle = {
                      make: vehicleDescription,
                      model: "",
                    };
                    return (
                      <div
                        key={item.vehicle_id}
                        className="rounded-2xl surface-sleek text-card-foreground border-amber-200 dark:border-amber-800"
                      >
                        <div className="p-6 pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                {vehicleName}
                                {getTierBadge(item.profitability?.tier || "marginal")}
                              </h4>
                              <p className="text-sm text-muted-foreground">{`${vehicle.make} ${vehicle.model} • ${item.revenue?.jobs_completed || 0} jobs`}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${(item.profitability?.net_profit || 0) >= 0 ? "text-amber-600" : "text-red-600"}`}>
                                {format(item.profitability?.net_profit || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">{`${(item.profitability?.margin_percent || 0).toFixed(1)}% margin`}</p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Revenue:</span>
                              <span className="ml-2 font-medium">{format(item.revenue?.total || 0)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Costs:</span>
                              <span className="ml-2 font-medium">{format(item.costs?.total || 0)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">KM Driven:</span>
                              <span className="ml-2 font-medium">{`${(item.revenue?.total_km || 0).toFixed(0)} km`}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
