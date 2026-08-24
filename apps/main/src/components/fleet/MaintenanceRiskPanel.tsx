import {
  Activity,
  AlertTriangle,
  Info,
  RefreshCw,
  Shield,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/shadcn/tooltip";

export function MaintenanceRiskPanel() {
  const riskScores: any[] = [];
  const isLoading = false;
  const isComputing = false;
  const computeAllRiskScores = async (..._args: any[]) => {};
  const getRiskLevelColor = (_level: string) => "";
  const vehicles: any[] = [];

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    return vehicle?.registrationNumber || `${vehicle?.make} ${vehicle?.model}` || "Unknown";
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "high": return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "moderate": return <Activity className="h-4 w-4 text-warning" />;
      default: return <Shield className="h-4 w-4 text-success" />;
    }
  };

  const criticalCount = riskScores?.filter(s => s.risk_level === "critical").length || 0;
  const highCount = riskScores?.filter(s => s.risk_level === "high").length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Risk Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[
              1,
              2,
              3,
            ].map(i => (
              <div
                key={i}
                className="h-16 bg-muted rounded"
              />
            ))}
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
            <Activity className="h-5 w-5" />
            Predictive Maintenance
          </CardTitle>
          <CardDescription>
            AI-powered risk scoring based on telemetry & history
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={computeAllRiskScores}
          disabled={isComputing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isComputing ? "animate-spin" : ""}`} />
          Recompute All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Badges */}
        <div className="flex gap-2 flex-wrap">
          {criticalCount > 0 && (
            <Badge variant="destructive">
              {criticalCount}
              {" "}
              Critical
            </Badge>
          )}
          {highCount > 0 && (
            <Badge className="bg-warning/10 text-warning">
              {highCount}
              {" "}
              High Risk
            </Badge>
          )}
          <Badge variant="outline">
            {riskScores?.length || 0}
            {" "}
            Vehicles Scored
          </Badge>
        </div>

        {/* Risk Score List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {riskScores?.slice(
            0,
            10,
          ).map(score => (
            <div
              key={score.id}
              className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getRiskIcon(score.risk_level)}
                  <span className="font-medium">{getVehicleName(score.vehicle_id)}</span>
                </div>
                <Badge className={getRiskLevelColor(score.risk_level)}>
                  {score.risk_level.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <Progress
                    value={score.overall_risk_score}
                    className="h-2"
                  />
                </div>
                <span className="text-sm font-mono w-12 text-right">
                  {score.overall_risk_score.toFixed(0)}
                  %
                </span>
              </div>

              {/* Contributing Factors */}
              {score.contributing_factors && Array.isArray(score.contributing_factors) && score.contributing_factors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {score.contributing_factors.slice(
                    0,
                    3,
                  ).map((factor: any, idx: number) => (
                    <TooltipProvider key={idx}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="text-xs cursor-help"
                          >
                            {factor.factor}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{factor.value}</p>
                          <p className="text-xs text-muted-foreground">
                            Impact:
                            {factor.impact}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {score.recommendations && score.recommendations.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {score.recommendations[0]}
                </div>
              )}

              {/* Confidence */}
              <div className="mt-2 text-xs text-muted-foreground">
                Confidence:
                {" "}
                {score.confidence_score?.toFixed(0)}
                % •
                {score.data_points_analyzed}
                {" "}
                data points
              </div>
            </div>
          ))}
        </div>

        {!riskScores || riskScores.length === 0
          ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No risk scores computed yet</p>
                <Button
                  variant="link"
                  onClick={computeAllRiskScores}
                  disabled={isComputing}
                >
                  Compute risk scores for all vehicles
                </Button>
              </div>
            )
          : null}

        {/* Advisory Note */}
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
          <Info className="h-3 w-3 inline mr-1" />
          Risk scores are advisory only and do not block dispatch operations
        </div>
      </CardContent>
    </Card>
  );
}
