import {
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { useCurrency } from "@/contexts/CurrencyContext";

export function MaintenanceSLADashboard() {
  const slaMetrics: any = null;
  const isLoading = false;
  const isRefreshing = false;
  const refreshSLAMetrics = async (..._args: any[]) => {};
  const getCostTrendIndicator = () => null as any;
  const getOverdueStatus = () => "healthy" as string;
  const { format: formatCurrency } = useCurrency();

  const costTrend = getCostTrendIndicator();
  const overdueStatus = getOverdueStatus();

  const getOverdueStatusColor = () => {
    switch (overdueStatus) {
      case "critical": return "text-destructive bg-destructive/10";
      case "warning": return "text-warning bg-warning/10";
      case "attention": return "text-warning bg-warning/10";
      case "healthy": return "text-success bg-success/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance SLA Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance SLA Dashboard
          </CardTitle>
          <CardDescription>
            Fleet-level maintenance performance metrics
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshSLAMetrics}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fleet Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Total Vehicles</div>
            <div className="text-2xl font-bold">{slaMetrics?.total_vehicles || 0}</div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Overdue</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-destructive">
                {slaMetrics?.vehicles_with_overdue || 0}
              </span>
              <Badge className={getOverdueStatusColor()}>
                {(slaMetrics?.overdue_percentage || 0).toFixed(1)}
                %
              </Badge>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Due Soon</div>
            <div className="text-2xl font-bold text-warning">
              {slaMetrics?.vehicles_with_due_soon || 0}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">On-Time Rate</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-success">
                {(slaMetrics?.on_time_completion_rate || 0).toFixed(1)}
                %
              </span>
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overdue Rate Progress */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overdue Rate</span>
              <Badge variant={overdueStatus === "healthy" ? "default" : "destructive"}>
                {overdueStatus}
              </Badge>
            </div>
            <Progress
              value={100 - (slaMetrics?.overdue_percentage || 0)}
              className="h-2"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              Target: &lt; 5% overdue vehicles
            </div>
          </div>

          {/* Average Delay */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Average Service Delay</span>
            </div>
            <div className="text-2xl font-bold">
              {(slaMetrics?.avg_delay_days || 0).toFixed(1)}
              {" "}
              days
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Average days past due when serviced
            </div>
          </div>
        </div>

        {/* Cost Metrics */}
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">30-Day Cost Summary</span>
            </div>
            {costTrend && (
              <div className={`flex items-center gap-1 text-sm ${
                costTrend.severity === "bad"
                  ? "text-destructive"
                  : costTrend.severity === "good"
                    ? "text-success"
                    : "text-muted-foreground"
              }`}
              >
                {costTrend.direction === "up"
                  ? (
                      <TrendingUp className="h-4 w-4" />
                    )
                  : costTrend.direction === "down"
                    ? (
                        <TrendingDown className="h-4 w-4" />
                      )
                    : null}
                {costTrend.value.toFixed(1)}
                % vs previous
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
              <div className="text-xl font-bold">
                {formatCurrency(slaMetrics?.total_maintenance_cost_30d || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Avg per Vehicle</div>
              <div className="text-xl font-bold">
                {formatCurrency(slaMetrics?.avg_cost_per_vehicle_30d || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completions</div>
              <div className="text-xl font-bold">
                {slaMetrics?.total_completions_30d || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {slaMetrics?.computed_at && (
          <div className="text-xs text-muted-foreground text-center">
            Last computed:
            {" "}
            {new Date(slaMetrics.computed_at).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
