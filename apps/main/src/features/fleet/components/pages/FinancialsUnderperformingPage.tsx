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
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Underperforming Assets
            </CardTitle>
            <CardDescription>
              Vehicles with marginal or negative profitability requiring attention
            </CardDescription>
          </div>
          <PeriodFilter
            value={underperformingPeriod}
            onChange={setUnderperformingPeriod}
            variant="short"
            className="w-[140px] h-8"
          />
        </CardHeader>
        <CardContent>
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
                      <Card
                        key={item.vehicle_id}
                        className="border-warning/30"
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                {vehicleName}
                                {getTierBadge(item.profitability?.tier || "marginal")}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {vehicle?.make}
                                {" "}
                                {vehicle?.model}
                                {" "}
                                •
                                {" "}
                                {item.revenue?.jobs_completed || 0}
                                {" "}
                                jobs
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${(item.profitability?.net_profit || 0) >= 0 ? "text-warning" : "text-destructive"}`}>
                                {format(item.profitability?.net_profit || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(item.profitability?.margin_percent || 0).toFixed(1)}
                                % margin
                              </p>
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
                              <span className="ml-2 font-medium">
                                {(item.revenue?.total_km || 0).toFixed(0)}
                                {" "}
                                km
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
