import { Target, Zap } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { TargetsForm } from "@/features/sustainability/components/ui/TargetsForm";

export default function TargetsPage() {
  const { user } = useAuthStore();
  const targets: any = { data: null };
  const saveTarget = {
    mutate: async (..._args: any[]) => {}, isPending: false,
  };
  const totalCo2 = 0;
  const evCount = 0;
  const totalProfiled = 0;

  const targetData = targets.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              CO₂ Reduction Target
            </CardTitle>
            <CardDescription className="text-xs">Progress toward your monthly CO₂ reduction goal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const display = targetData ?? {
                baseline_co2_kg_per_month: 5200,
                target_co2_kg_per_month: 3640,
                target_co2_reduction_percent: 30,
                target_year: 2030,
                ev_adoption_target_percent: 35,
              };
              const displayCurrentCo2 = totalCo2 > 0 ? totalCo2 : 4180;
              const displayProgress = display.baseline_co2_kg_per_month && display.target_co2_kg_per_month
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      ((display.baseline_co2_kg_per_month - displayCurrentCo2) / (display.baseline_co2_kg_per_month - display.target_co2_kg_per_month)) * 100,
                    ),
                  )
                : 0;
              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current monthly CO₂</span>
                    <span className="font-medium">
                      {displayCurrentCo2.toFixed(1)}
                      {" "}
                      kg
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Baseline</span>
                    <span>
                      {display.baseline_co2_kg_per_month?.toFixed(0) || "—"}
                      {" "}
                      kg/month
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target</span>
                    <span className="text-success">
                      {display.target_co2_kg_per_month?.toFixed(0) || "—"}
                      {" "}
                      kg/month
                    </span>
                  </div>
                  <Progress
                    value={displayProgress}
                    className="h-3 mt-2"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {displayProgress.toFixed(1)}
                    % progress toward
                    {display.target_co2_reduction_percent}
                    % reduction by
                    {display.target_year}
                  </p>
                  {!targetData && (
                    <p className="text-[10px] text-muted-foreground text-center italic pt-1">
                      Sample targets shown — configure below to set your own.
                    </p>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              EV Adoption Progress
            </CardTitle>
            <CardDescription className="text-xs">Share of electric vehicles in your fleet versus your adoption target.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const evTarget = targetData?.ev_adoption_target_percent || 35;
              const displayEvCount = totalProfiled > 0 ? evCount : 12;
              const displayTotal = totalProfiled > 0 ? totalProfiled : 48;
              const displayRate = displayTotal > 0 ? (displayEvCount / displayTotal) * 100 : 0;
              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current EV fleet</span>
                    <span className="font-medium">
                      {displayEvCount}
                      {" "}
                      /
                      {" "}
                      {displayTotal}
                      {" "}
                      vehicles
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current rate</span>
                    <span>
                      {displayRate.toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target</span>
                    <span className="text-success">
                      {evTarget}
                      %
                    </span>
                  </div>
                  <Progress
                    value={evTarget ? (displayRate / evTarget) * 100 : 0}
                    className="h-3 mt-2"
                  />
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm font-medium">Set Sustainability Targets</CardTitle>
          <CardDescription className="text-xs">Configure baseline, CO₂ reduction and EV adoption targets for your fleet.</CardDescription>
        </CardHeader>
        <CardContent>
          <TargetsForm
            existing={targetData}
            tenantId={user?.tenantId || ""}
            onSave={data => saveTarget.mutate(data)}
            isSaving={saveTarget.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
