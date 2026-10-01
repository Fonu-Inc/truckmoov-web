import type { DriverFatigue } from "@truckmoov/api/fleet";
import { useQueries } from "@tanstack/react-query";
import {
  getDriverFatigueByIdQueryOptions,
  useDriverFatigueSummary,
  useDrivers,
  useRunDriverFatigue,
} from "@truckmoov/api/fleet";
import {
  Activity, AlertTriangle, Brain, ChevronDown, ChevronUp,
  Clock, Coffee, Eye, Loader2, RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";

type RiskLevel = "low" | "medium" | "high" | "critical";

type FatigueAlert = DriverFatigue & {
  driverId: string;
  driverName: string;
  band: RiskLevel;
};

const riskLevelColors: Record<RiskLevel, string> = {
  low: "bg-success/20 text-success border-success/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-warning/20 text-warning border-warning/30",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

const riskLevelBg: Record<RiskLevel, string> = {
  low: "from-success/10 to-transparent",
  medium: "from-warning/10 to-transparent",
  high: "from-warning/10 to-transparent",
  critical: "from-destructive/10 to-transparent",
};

function FatigueScoreGauge({ score }: { score: number }) {
  const percentage = (score / 10) * 100;
  const color = score <= 3
    ? "text-success"
    : score <= 7
      ? "text-warning"
      : "text-destructive";

  return (
    <div className="relative h-32 w-32">
      <svg
        className="h-full w-full -rotate-90 transform"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={`${percentage * 2.51} 251`}
          className={color}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

function AlertCard({
  alert, expanded, onToggle,
}: {
  alert: FatigueAlert;
  expanded: boolean;
  onToggle: () => void;
}) {
  const runMutation = useRunDriverFatigue();
  const rerun = () => runMutation.mutate(
    {
      id: alert.driverId,
      data: {
        drivingMinutes: alert.drivingMinutes ?? 0,
        breakMinutes: alert.breakMinutes ?? undefined,
      },
    },
    {
      onSuccess: () => toast.success(`Fatigue analysis re-run for ${alert.driverName}`),
      onError: error => toast.error(error.message),
    },
  );
  return (
    <Card className={`bg-gradient-to-r border-border/50 ${riskLevelBg[alert.band]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FatigueScoreGauge score={alert.score ?? 0} />
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {alert.driverName}
                <Badge
                  variant="outline"
                  className={riskLevelColors[alert.band]}
                >
                  {alert.band}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {alert.drivingMinutes ?? "—"}
                  {" "}
                  min driving
                </span>
                <span className="flex items-center gap-1">
                  <Coffee className="h-3 w-3" />
                  Rest compliance:
                  {" "}
                  {alert.restCompliance ?? "—"}
                  /10
                </span>
              </CardDescription>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                Data quality:
                {" "}
                {alert.dataQuality}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <Separator className="my-3" />
          {/* ponytail: fleetflow lists indicators and recommendations here; the fatigue API
              returns only analysisText. Add the lists when the response carries them. */}
          {alert.analysisText && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Brain className="h-4 w-4 text-primary" />
                AI Analysis
              </h4>
              <p className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                {alert.analysisText}
              </p>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={rerun}
              disabled={runMutation.isPending}
            >
              {runMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
              Re-run analysis
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function FatigueAIPage() {
  const [
    expandedId,
    setExpandedId,
  ] = useState<string | null>(null);

  const summaryQuery = useDriverFatigueSummary();
  // The fatigue feature can be switched off per deployment: every fatigue route then
  // answers 503 FeatureDisabled. Don't fan out per-driver calls in that case.
  const isDisabled = summaryQuery.error?.statusCode === 503;
  const driversQuery = useDrivers();
  const drivers = driversQuery.data?.data ?? [];
  const fatigueQueries = useQueries({
    queries: drivers.map(d => ({
      ...getDriverFatigueByIdQueryOptions(d.id),
      enabled: summaryQuery.isSuccess,
    })),
  });

  const alerts: FatigueAlert[] = fatigueQueries
    .map((q, i) => {
      const fatigue = q.data?.data;
      const driver = drivers[i];
      if (!fatigue || fatigue.score === null || !fatigue.band || !driver)
        return null;
      return {
        ...fatigue, band: fatigue.band, driverId: driver.id, driverName: driver.name,
      };
    })
    .filter((alert): alert is FatigueAlert => alert !== null)
    .sort((x, y) => (y.score ?? 0) - (x.score ?? 0));
  const isListLoading = summaryQuery.isLoading || fatigueQueries.some(q => q.isLoading);

  const avg = (pick: (a: FatigueAlert) => number | null) => {
    const values = alerts.map(pick).filter((v): v is number => v !== null);
    return values.length ? Math.round(values.reduce(
      (sum, v) => sum + v,
      0,
    ) / values.length) : 0;
  };
  const stats = {
    total: summaryQuery.data?.data?.driversAnalyzed ?? alerts.length,
    critical: alerts.filter(a => a.band === "critical").length,
    high: alerts.filter(a => a.band === "high").length,
    medium: alerts.filter(a => a.band === "medium").length,
    low: alerts.filter(a => a.band === "low").length,
    avgFatigueScore: Math.round(summaryQuery.data?.data?.averageScore ?? avg(a => a.score)),
    avgRestCompliance: avg(a => a.restCompliance),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold">
            <Brain className="h-7 w-7 text-primary" />
            Driver Fatigue Detection
          </h2>
          <p className="mt-1 text-muted-foreground">
            AI-powered analysis of driving patterns and rest compliance
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Average Fatigue Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isDisabled ? "—" : stats.avgFatigueScore}
              /10
            </div>
            <Progress
              value={stats.avgFatigueScore * 10}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Rest Compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isDisabled ? "—" : stats.avgRestCompliance}
              /10
            </div>
            <Progress
              value={stats.avgRestCompliance * 10}
              className="mt-2 h-2 [&>div]:bg-success"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-transparent border-destructive/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{isDisabled ? "—" : stats.critical}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              +
              {" "}
              {stats.high}
              {" "}
              high risk alerts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isDisabled ? "—" : stats.total}</div>
            <div className="mt-2 flex gap-2">
              <Badge
                variant="outline"
                className="text-xs bg-success/10 text-success"
              >
                {stats.low}
                {" "}
                low
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-warning/10 text-warning"
              >
                {stats.medium}
                {" "}
                med
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Recent Fatigue Analyses
          </CardTitle>
          <CardDescription>
            AI-powered fatigue detection results with recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {isDisabled && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Fatigue detection isn't enabled for this account yet.
                </p>
              )}
              {!isDisabled && summaryQuery.isError && (
                <div className="py-6 text-center text-sm">
                  <p className="text-destructive">{summaryQuery.error.message}</p>
                  <Button
                    variant="link"
                    onClick={() => void summaryQuery.refetch()}
                  >
                    Try again
                  </Button>
                </div>
              )}
              {isListLoading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {summaryQuery.isSuccess && !isListLoading && alerts.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No fatigue analyses yet.</p>
              )}
              {alerts.map(alert => (
                <AlertCard
                  key={alert.driverId}
                  alert={alert}
                  expanded={expandedId === alert.driverId}
                  onToggle={() => setExpandedId(expandedId === alert.driverId ? null : alert.driverId)}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
