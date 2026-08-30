import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity,
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  Coffee,
  Eye,
  RefreshCw,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";

type FatigueAlert = any;

const riskLevelColors = {
  low: "bg-success/20 text-success border-success/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-warning/20 text-warning border-warning/30",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

const riskLevelBg = {
  low: "from-success/10 to-transparent",
  medium: "from-warning/10 to-transparent",
  high: "from-warning/10 to-transparent",
  critical: "from-destructive/10 to-transparent",
};

function FatigueScoreGauge({ score }: { score: number }) {
  const percentage = (score / 10) * 100;
  const getColor = () => {
    if (score <= 3)
      return "text-success";
    if (score <= 5)
      return "text-warning";
    if (score <= 7)
      return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="relative w-32 h-32">
      <svg
        className="w-full h-full transform -rotate-90"
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
          className={getColor()}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${getColor()}`}>{score}</span>
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
  return (
    <Card className={`bg-gradient-to-r ${riskLevelBg[alert.risk_level]} border-border/50`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FatigueScoreGauge score={Number(alert.fatigue_score)} />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {alert.driver_name || "Unknown Driver"}
                <Badge
                  variant="outline"
                  className={riskLevelColors[alert.risk_level]}
                >
                  {alert.risk_level}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {alert.driving_duration_minutes}
                  {" "}
                  min driving
                </span>
                <span className="flex items-center gap-1">
                  <Coffee className="h-3 w-3" />
                  Rest compliance:
                  {" "}
                  {alert.rest_compliance_score}
                  /10
                </span>
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                {formatWithPattern(
                  alert.created_at,
                  "PPpp",
                )}
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Fatigue Indicators
              </h4>
              <ul className="space-y-1">
                {alert.indicators.map((indicator, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-warning mt-1">•</span>
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-success" />
                Recommendations
              </h4>
              <ul className="space-y-1">
                {alert.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-success mt-1">✓</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {alert.ai_analysis && (
            <div className="mt-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-primary" />
                AI Analysis
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                {alert.ai_analysis}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function FatigueAIPage() {
  const alerts: FatigueAlert[] = [];
  const isLoading = false;
  const getAlertsStats = () => ({
    avgFatigueScore: 0, avgRestCompliance: 0, critical: 0, high: 0, medium: 0, low: 0, total: 0,
  });
  const [
    expandedId,
    setExpandedId,
  ] = useState<string | null>(null);
  const stats = getAlertsStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Driver Fatigue Detection
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analysis of driving patterns and rest compliance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
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
              {stats.avgFatigueScore}
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
              {stats.avgRestCompliance}
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
            <div className="text-3xl font-bold text-destructive">{stats.critical}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +
              {" "}
              {stats.high}
              {" "}
              high risk alerts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-info/10 to-transparent border-info/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex gap-2 mt-2">
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

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Risk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-success">Low Risk</span>
                <span className="text-sm text-muted-foreground">{stats.low}</span>
              </div>
              <Progress
                value={stats.total > 0 ? (stats.low / stats.total) * 100 : 0}
                className="h-2 [&>div]:bg-success"
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-warning">Medium Risk</span>
                <span className="text-sm text-muted-foreground">{stats.medium}</span>
              </div>
              <Progress
                value={stats.total > 0 ? (stats.medium / stats.total) * 100 : 0}
                className="h-2 [&>div]:bg-warning"
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-warning">High Risk</span>
                <span className="text-sm text-muted-foreground">{stats.high}</span>
              </div>
              <Progress
                value={stats.total > 0 ? (stats.high / stats.total) * 100 : 0}
                className="h-2 [&>div]:bg-warning"
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-destructive">Critical</span>
                <span className="text-sm text-muted-foreground">{stats.critical}</span>
              </div>
              <Progress
                value={stats.total > 0 ? (stats.critical / stats.total) * 100 : 0}
                className="h-2 [&>div]:bg-destructive"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
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
          {isLoading
            ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )
            : alerts.length === 0
              ? (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Fatigue Analyses Yet</h3>
                    <p className="text-muted-foreground mt-1">
                      Fatigue analyses will appear here when drivers are monitored
                    </p>
                  </div>
                )
              : (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {alerts.map(alert => (
                        <AlertCard
                          key={alert.id}
                          alert={alert}
                          expanded={expandedId === alert.id}
                          onToggle={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
        </CardContent>
      </Card>
    </div>
  );
}
