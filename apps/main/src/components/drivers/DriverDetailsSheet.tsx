import type { Driver } from "@/types";
import {
  daysUntil, formatDate, formatDayMonthTime, formatRelative,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Activity, AlertTriangle, Award, Brain, Car, Clock,
  Coffee, CreditCard, Gauge, Loader2,
  Mail, MessageSquare, Minus, Phone, Play, RefreshCw, RotateCcw, Route,
  Shield, Star, TrendingDown, TrendingUp, Truck, User, Zap,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { mockVehicles } from "@/data/mockData";

type DriverDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
};

const statusColors: Record<string, string> = {
  available: "bg-success/20 text-success border-success/30",
  active: "bg-primary/20 text-primary border-primary/30",
  offline: "bg-muted text-muted-foreground border-muted",
  suspended: "bg-destructive/20 text-destructive border-destructive/30",
};

const commIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4" />,
  sms: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  voice: <Phone className="h-4 w-4" />,
};

const riskLevelColors: Record<string, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

// Score gauge component
function ScoreGauge({
  score, label, size = "md",
}: {
  score: number; label: string; size?: "sm" | "md";
}) {
  const getScoreColor = (s: number) => {
    if (s >= 80)
      return "text-success";
    if (s >= 60)
      return "text-warning";
    return "text-destructive";
  };

  const dimensions = size === "sm" ? "w-14 h-14" : "w-20 h-20";
  const textSize = size === "sm" ? "text-sm" : "text-lg";

  return (
    <div className="text-center space-y-1">
      <div className={`relative ${dimensions} mx-auto`}>
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 36 36"
        >
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/20"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${textSize} font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// Fatigue gauge
function FatigueGauge({ score }: { score: number }) {
  const percentage = (score / 10) * 100;
  const getColor = () => {
    if (score <= 3)
      return "text-success";
    if (score <= 5)
      return "text-warning";
    if (score <= 7)
      return "text-orange-400";
    return "text-destructive";
  };

  return (
    <div className="relative w-24 h-24">
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
        <span className={`text-xl font-bold ${getColor()}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

function normalizeDeviceId(deviceId?: string) {
  if (!deviceId)
    return undefined;

  // Demo data uses dev1/dev2/... but real telemetry uses deterministic UUIDs.
  // Map: dev1 -> d1a1a1a1-0001-4000-8000-000000000001
  const match = /^dev(\d+)$/.exec(deviceId);
  if (!match)
    return deviceId;

  const n = match[1];
  const segment = n.padStart(
    4,
    "0",
  );
  const suffix = n.padStart(
    12,
    "0",
  );
  return `d1a1a1a1-${segment}-4000-8000-${suffix}`;
}

export function DriverDetailsSheet({
  open, onOpenChange, driver,
}: DriverDetailsSheetProps) {
  const events: any[] = [];
  const driverScores: any[] = [];
  const fatigueAlerts: any[] = [];
  const analyzeFatigue = async (..._args: any[]) => {};
  const isAnalyzing = false;
  const refetchFatigue = () => null;
  const [
    isRunningAnalysis,
    setIsRunningAnalysis,
  ] = useState(false);

  // Find device ID(s) associated with this driver via their assigned vehicle
  const driverDeviceIds = useMemo(
    () => {
      if (!driver)
        return [];
      // Find vehicles where this driver is assigned
      const assignedVehicles = mockVehicles.filter(
        v => v.currentDriver === driver.id || (driver.currentVehicle && v.id === driver.currentVehicle),
      );

      return assignedVehicles
        .map(v => normalizeDeviceId(v.deviceId))
        .filter(Boolean) as string[];
    },
    [driver],
  );

  // Get driver-specific data - match by driver_id OR device_id
  const driverScore = useMemo(
    () => {
      return driverScores.find(s =>
        s.driverId === driver?.id
        || driverDeviceIds.includes(s.driverId));
    },
    [
      driverScores,
      driver?.id,
      driverDeviceIds,
    ],
  );

  const driverEvents = useMemo(
    () => {
      return events.filter(e =>
        e.driverId === driver?.id
        || driverDeviceIds.includes(e.deviceId)).slice(
        0,
        10,
      );
    },
    [
      events,
      driver?.id,
      driverDeviceIds,
    ],
  );

  const driverFatigueAlerts = useMemo(
    () => {
      return fatigueAlerts.filter(a =>
        a.driver_id === driver?.id
        || driverDeviceIds.includes(a.device_id)).slice(
        0,
        5,
      );
    },
    [
      fatigueAlerts,
      driver?.id,
      driverDeviceIds,
    ],
  );

  const latestFatigueAlert = driverFatigueAlerts[0];

  // Run fatigue analysis for the driver's device
  const handleRunFatigueAnalysis = async () => {
    if (!driver || driverDeviceIds.length === 0) {
      toast.error(
        "No Device Assigned",
        { description: "This driver has no assigned vehicle/device to analyze." },
      );
      return;
    }

    setIsRunningAnalysis(true);
    try {
      // Use the first device ID assigned to this driver
      const deviceId = driverDeviceIds[0];
      // Determine tenant (for demo use tenant-001)
      const tenantId = "tenant-001";

      await analyzeFatigue(
        deviceId,
        tenantId,
        driver.id,
        driver.name,
      );

      // Refresh alerts to show the new one
      setTimeout(
        refetchFatigue,
        500,
      );
    }
    catch {
      // Error handled by the hook
    }
    finally {
      setIsRunningAnalysis(false);
    }
  };

  if (!driver)
    return null;

  const daysUntilExpiry = daysUntil(driver.licenseExpiry);
  const licenseWarning = daysUntilExpiry <= 30;

  // Calculate overall behavior score
  const overallBehaviorScore = driverScore?.overallScore ?? 85;
  const fatigueScore = latestFatigueAlert ? Number(latestFatigueAlert.fatigue_score) : 2;

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "harsh_braking": return <Car className="h-3 w-3" />;
      case "harsh_acceleration": return <Zap className="h-3 w-3" />;
      case "harsh_cornering": return <RotateCcw className="h-3 w-3" />;
      case "overspeeding": return <Gauge className="h-3 w-3" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-destructive/10 text-destructive border-destructive/30";
      case "high": return "bg-warning/10 text-warning border-warning/30";
      case "medium": return "bg-primary/10 text-primary border-primary/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "improving": return <TrendingUp className="h-4 w-4 text-success" />;
      case "declining": return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border p-6">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {driver.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <DialogTitle className="text-xl">{driver.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusColors[driver.status]}>
                    {driver.status.replace(
                      "_",
                      " ",
                    )}
                  </Badge>
                  <div className="flex items-center gap-1 text-warning">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{driver.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Score Summary */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-3 text-center">
                <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{overallBehaviorScore}</p>
                <p className="text-xs text-muted-foreground">Behavior</p>
              </CardContent>
            </Card>
            <Card className={`border-border/50 ${fatigueScore > 5 ? "bg-warning/10" : "bg-muted/30"}`}>
              <CardContent className="p-3 text-center">
                <Brain className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">
                  {fatigueScore}
                  /10
                </p>
                <p className="text-xs text-muted-foreground">Fatigue</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-3 text-center">
                <Shield className="h-5 w-5 mx-auto mb-1 text-success" />
                <p className="text-xl font-bold">{driverScore?.eventBreakdown.harshBraking ?? 0}</p>
                <p className="text-xs text-muted-foreground">Alerts</p>
              </CardContent>
            </Card>
          </div>
        </DialogHeader>

        <Tabs
          defaultValue="overview"
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-4 bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="fatigue">Fatigue</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-4 mt-4"
          >
            {/* Contact Information */}
            <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{driver.phone}</span>
                </div>
                {driver.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{driver.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {commIcons[driver.communicationPreference]}
                  <span className="capitalize">
                    Preferred:
                    {driver.communicationPreference}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {driver.totalTrips}
                    {" "}
                    total trips
                  </span>
                </div>
                {/* US-E02-005 / US-E09-005 — WhatsApp opt-in status */}
                <div className="col-span-2 flex items-center justify-between rounded-md border border-border/50 bg-background/40 p-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">WhatsApp opt-in</span>
                    <Badge
                      variant="outline"
                      className="bg-success/10 text-success border-success/30 text-[10px]"
                    >
                      Opted In
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => toast.success(`Opt-in request resent to ${driver.name}`)}
                  >
                    Resend opt-in
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* License Information */}
            <Card className={`border-border/50 ${licenseWarning ? "bg-warning/10 border-warning/30" : "bg-muted/30"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  License Information
                  {licenseWarning && <AlertTriangle className="h-4 w-4 text-warning" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">License Number</p>
                  <p className="font-medium">{driver.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expiry Date</p>
                  <p className={`font-medium ${licenseWarning ? "text-warning" : ""}`}>
                    {formatDate(driver.licenseExpiry)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Days Until Expiry</p>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={Math.min(
                        100,
                        (daysUntilExpiry / 365) * 100,
                      )}
                      className="flex-1 h-2"
                    />
                    <span className={`text-sm font-medium ${licenseWarning ? "text-warning" : ""}`}>
                      {daysUntilExpiry}
                      {" "}
                      days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unified Safety Overview */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Safety Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ScoreGauge
                      score={overallBehaviorScore}
                      label="Overall"
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">Behavior Score</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {getTrendIcon(driverScore?.trend)}
                        {driverScore?.trend || "stable"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FatigueGauge score={fatigueScore} />
                    <div>
                      <p className="font-medium">Fatigue Level</p>
                      <p className="text-xs text-muted-foreground">
                        {fatigueScore <= 3 ? "Low risk" : fatigueScore <= 5 ? "Moderate" : "High risk"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="behavior"
            className="space-y-4 mt-4"
          >
            {/* Detailed Behavior Scores */}
            {driverScore ? (
              <>
                <Card className="bg-muted/30 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Driving Behavior Scores
                    </CardTitle>
                    <CardDescription>
                      Based on
                      {" "}
                      {driverScore.totalEvents}
                      {" "}
                      recorded events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <ScoreGauge
                        score={driverScore.brakingScore}
                        label="Braking"
                      />
                      <ScoreGauge
                        score={driverScore.accelerationScore}
                        label="Accel"
                      />
                      <ScoreGauge
                        score={driverScore.corneringScore}
                        label="Cornering"
                      />
                      <ScoreGauge
                        score={driverScore.speedingScore}
                        label="Speed"
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <p className="font-semibold text-destructive">{driverScore.eventBreakdown.harshBraking}</p>
                        <p className="text-muted-foreground">Hard Brake</p>
                      </div>
                      <div className="p-2 rounded-lg bg-warning/10">
                        <p className="font-semibold text-warning">{driverScore.eventBreakdown.harshAcceleration}</p>
                        <p className="text-muted-foreground">Hard Accel</p>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10">
                        <p className="font-semibold text-primary">{driverScore.eventBreakdown.harshCornering}</p>
                        <p className="text-muted-foreground">Sharp Turn</p>
                      </div>
                      <div className="p-2 rounded-lg bg-accent/10">
                        <p className="font-semibold text-accent">{driverScore.eventBreakdown.overspeeding}</p>
                        <p className="text-muted-foreground">Speeding</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Events */}
                <Card className="bg-muted/30 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px] pr-2">
                      <div className="space-y-2">
                        {driverEvents.length > 0
                          ? driverEvents.map(event => (
                              <div
                                key={event.id}
                                className={`p-2 rounded-lg border ${getSeverityColor(event.severity)}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getEventIcon(event.eventType)}
                                    <span className="text-xs font-medium capitalize">
                                      {event.eventType.replace(
                                        /_/g,
                                        " ",
                                      )}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] h-4"
                                    >
                                      {event.severity}
                                    </Badge>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatRelative(event.createdAt)}
                                  </span>
                                </div>
                                {event.speed && (
                                  <p className="text-[10px] mt-1 text-muted-foreground">
                                    Speed:
                                    {" "}
                                    {event.speed}
                                    {" "}
                                    km/h
                                  </p>
                                )}
                              </div>
                            ))
                          : (
                              <div className="text-center py-6">
                                <Shield className="h-8 w-8 mx-auto mb-2 text-success" />
                                <p className="text-sm text-muted-foreground">No behavior events recorded</p>
                              </div>
                            )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-muted/30 border-border/50">
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium">No Behavior Data</p>
                  <p className="text-sm text-muted-foreground">
                    Behavior metrics will appear once the driver has telemetry events
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent
            value="fatigue"
            className="space-y-4 mt-4"
          >
            {/* Current Fatigue Status */}
            <Card className={`border-border/50 ${latestFatigueAlert && Number(latestFatigueAlert.fatigue_score) > 5 ? "bg-warning/10 border-warning/30" : "bg-muted/30"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Current Fatigue Status
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRunFatigueAnalysis}
                    disabled={isRunningAnalysis || isAnalyzing || driverDeviceIds.length === 0}
                    className="gap-1.5 h-7 text-xs"
                  >
                    {isRunningAnalysis || isAnalyzing
                      ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Analyzing...
                          </>
                        )
                      : (
                          <>
                            <RefreshCw className="h-3 w-3" />
                            Run Analysis
                          </>
                        )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {latestFatigueAlert
                  ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <FatigueGauge score={Number(latestFatigueAlert.fatigue_score)} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={riskLevelColors[latestFatigueAlert.risk_level]}>
                                {latestFatigueAlert.risk_level}
                                {" "}
                                risk
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatRelative(latestFatigueAlert.created_at)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {latestFatigueAlert.driving_duration_minutes}
                                {" "}
                                min driving
                              </div>
                              <div className="flex items-center gap-1">
                                <Coffee className="h-3 w-3" />
                                Rest:
                                {" "}
                                {latestFatigueAlert.rest_compliance_score}
                                /10
                              </div>
                            </div>
                          </div>
                        </div>

                        {latestFatigueAlert.recommendations.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-xs font-medium mb-2 flex items-center gap-1">
                                <Shield className="h-3 w-3 text-success" />
                                Recommendations
                              </p>
                              <ul className="space-y-1">
                                {latestFatigueAlert.recommendations.slice(
                                  0,
                                  3,
                                ).map((rec, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-muted-foreground flex items-start gap-1"
                                  >
                                    <span className="text-success mt-0.5">✓</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        )}

                        {latestFatigueAlert.ai_analysis && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-xs font-medium mb-2 flex items-center gap-1">
                                <Brain className="h-3 w-3 text-primary" />
                                AI Analysis
                              </p>
                              <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                {latestFatigueAlert.ai_analysis}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  : (
                      <div className="text-center py-6">
                        <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-medium">No Fatigue Alerts</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Run an AI fatigue analysis to assess this driver's condition
                        </p>
                        <Button
                          onClick={handleRunFatigueAnalysis}
                          disabled={isRunningAnalysis || isAnalyzing || driverDeviceIds.length === 0}
                          className="gap-2"
                        >
                          {isRunningAnalysis || isAnalyzing
                            ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Analyzing...
                                </>
                              )
                            : (
                                <>
                                  <Play className="h-4 w-4" />
                                  Run Fatigue Analysis
                                </>
                              )}
                        </Button>
                        {driverDeviceIds.length === 0 && (
                          <p className="text-xs text-warning mt-2">
                            No device assigned to this driver
                          </p>
                        )}
                      </div>
                    )}
              </CardContent>
            </Card>

            {/* Fatigue History */}
            {driverFatigueAlerts.length > 1 && (
              <Card className="bg-muted/30 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Fatigue History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px] pr-2">
                    <div className="space-y-2">
                      {driverFatigueAlerts.slice(1).map(alert => (
                        <div
                          key={alert.id}
                          className="p-2 rounded-lg border border-border/50 bg-muted/20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {alert.fatigue_score}
                                /10
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] h-4 ${riskLevelColors[alert.risk_level]}`}
                              >
                                {alert.risk_level}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDayMonthTime(alert.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent
            value="history"
            className="space-y-4 mt-4"
          >
            {/* Trip & Performance History */}
            <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold">{driver.totalTrips}</p>
                    <p className="text-xs text-muted-foreground">Total Trips</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-warning">
                      <Star className="h-5 w-5 fill-current" />
                      <span className="text-2xl font-bold">{driver.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-success" />
                      Safety Score
                    </span>
                    <span className="text-sm font-medium">
                      {overallBehaviorScore}
                      %
                    </span>
                  </div>
                  <Progress
                    value={overallBehaviorScore}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-primary" />
                      Rest Compliance
                    </span>
                    <span className="text-sm font-medium">
                      {latestFatigueAlert?.rest_compliance_score ?? 8}
                      /10
                    </span>
                  </div>
                  <Progress
                    value={((latestFatigueAlert?.rest_compliance_score ?? 8) / 10) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Combined Event Timeline */}
            <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-2">
                  <div className="space-y-2">
                    {driverEvents.slice(
                      0,
                      5,
                    ).map(event => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-2 rounded-lg border border-border/50"
                      >
                        <div className={`p-1.5 rounded-full ${getSeverityColor(event.severity)}`}>
                          {getEventIcon(event.eventType)}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium capitalize">
                            {event.eventType.replace(
                              /_/g,
                              " ",
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatRelative(event.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4"
                        >
                          {event.severity}
                        </Badge>
                      </div>
                    ))}
                    {driverEvents.length === 0 && (
                      <div className="text-center py-6">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
