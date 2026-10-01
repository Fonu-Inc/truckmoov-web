import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity, AlertTriangle, Bell, Car, Gauge, MapPin, Minus,
  RefreshCw, RotateCcw, Shield, TrendingDown, TrendingUp,
  User, Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";

type EventType = "harsh_braking" | "harsh_acceleration" | "harsh_cornering" | "overspeeding";
type Severity = "low" | "medium" | "high" | "critical";
type Trend = "improving" | "stable" | "declining";
type AlertType = "entry" | "exit" | "dwell";

type DriverScore = {
  driverId: string;
  driverName: string;
  overallScore: number;
  brakingScore: number;
  accelerationScore: number;
  corneringScore: number;
  speedingScore: number;
  totalEvents: number;
  eventBreakdown: {
    harshBraking: number;
    harshAcceleration: number;
    harshCornering: number;
    overspeeding: number;
  };
  trend: Trend;
};

type BehaviorEvent = {
  id: string;
  deviceId: string;
  driverId: string;
  eventType: EventType;
  severity: Severity;
  speed?: number;
  createdAt: Date;
};

type GeofenceAlert = {
  id: string;
  deviceId: string;
  geofenceName: string;
  alertType: AlertType;
  triggeredAt: Date;
};

// ponytail: empty until the driver-behaviour + geofence APIs land.
const DRIVER_SCORES: DriverScore[] = [];
const BEHAVIOR_EVENTS: BehaviorEvent[] = [];
const GEOFENCE_ALERTS: GeofenceAlert[] = [];

function ScoreGauge({
  score, label,
}: {
  score: number; label: string;
}) {
  const scoreColor = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  return (
    <div className="text-center space-y-2">
      <div className="relative mx-auto h-16 w-16 md:h-20 md:w-20">
        <svg
          className="h-full w-full -rotate-90 transform"
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
            className={scoreColor}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${scoreColor}`}>{score}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DriverScoreCard({
  score, rank,
}: {
  score: DriverScore; rank: number;
}) {
  const trendIcon = score.trend === "improving"
    ? <TrendingUp className="h-4 w-4 text-success" />
    : score.trend === "declining"
      ? <TrendingDown className="h-4 w-4 text-destructive" />
      : <Minus className="h-4 w-4 text-muted-foreground" />;

  const badge = score.overallScore >= 90
    ? {
        label: "Excellent", className: "bg-success text-success-foreground",
      }
    : score.overallScore >= 80
      ? {
          label: "Good", className: "bg-primary text-primary-foreground",
        }
      : score.overallScore >= 60
        ? {
            label: "Fair", className: "bg-warning text-warning-foreground",
          }
        : {
            label: "Poor", className: "",
          };

  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardContent className="p-4">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground">
              #
              {rank}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{score.driverName}</p>
              <p className="text-xs text-muted-foreground">
                {score.totalEvents}
                {" "}
                events recorded
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {trendIcon}
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <ScoreGauge
            score={score.brakingScore}
            label="Braking"
          />
          <ScoreGauge
            score={score.accelerationScore}
            label="Accel"
          />
          <ScoreGauge
            score={score.corneringScore}
            label="Cornering"
          />
          <ScoreGauge
            score={score.speedingScore}
            label="Speed"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs md:grid-cols-4">
          <div className="rounded-lg bg-destructive/10 p-2">
            <p className="font-semibold text-destructive">{score.eventBreakdown.harshBraking}</p>
            <p className="text-muted-foreground">Hard Brake</p>
          </div>
          <div className="rounded-lg bg-warning/10 p-2">
            <p className="font-semibold text-warning">{score.eventBreakdown.harshAcceleration}</p>
            <p className="text-muted-foreground">Hard Accel</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <p className="font-semibold text-primary">{score.eventBreakdown.harshCornering}</p>
            <p className="text-muted-foreground">Sharp Turn</p>
          </div>
          <div className="rounded-lg bg-accent/10 p-2">
            <p className="font-semibold text-accent">{score.eventBreakdown.overspeeding}</p>
            <p className="text-muted-foreground">Speeding</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventItem({ event }: { event: BehaviorEvent }) {
  const eventIcon = event.eventType === "harsh_braking"
    ? <Car className="h-4 w-4" />
    : event.eventType === "harsh_acceleration"
      ? <Zap className="h-4 w-4" />
      : event.eventType === "harsh_cornering"
        ? <RotateCcw className="h-4 w-4" />
        : <Gauge className="h-4 w-4" />;

  const severityColor = event.severity === "critical"
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : event.severity === "high"
      ? "bg-warning/10 text-warning border-warning/30"
      : event.severity === "medium"
        ? "bg-primary/10 text-primary border-primary/30"
        : "bg-muted text-muted-foreground border-border";

  return (
    <div className={`rounded-lg border p-3 ${severityColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {eventIcon}
          <span className="text-sm font-medium capitalize">
            {event.eventType.replace(
              /_/g,
              " ",
            )}
          </span>
          <Badge
            variant="outline"
            className="text-xs capitalize"
          >
            {event.severity}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatRelative(event.createdAt)}
        </span>
      </div>
      {event.speed && (
        <p className="mt-1 text-xs text-muted-foreground">
          Speed:
          {" "}
          {event.speed}
          {" "}
          km/h
        </p>
      )}
    </div>
  );
}

function GeofenceAlertItem({ alert }: { alert: GeofenceAlert }) {
  const isEntry = alert.alertType === "entry";
  return (
    <div className={`rounded-lg border p-3 ${isEntry ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${isEntry ? "text-success" : "text-warning"}`} />
          <div>
            <p className="text-sm font-medium">{alert.geofenceName}</p>
            <p className="text-xs text-muted-foreground">
              Device
              {" "}
              {alert.deviceId.slice(
                0,
                8,
              )}
              ...
            </p>
          </div>
        </div>
        <div className="text-right">
          <Badge
            variant={isEntry ? "default" : "secondary"}
            className="text-xs"
          >
            {alert.alertType.toUpperCase()}
          </Badge>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRelative(alert.triggeredAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BehaviourPage() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("scores");
  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const driverScores = DRIVER_SCORES;
  const events = BEHAVIOR_EVENTS;
  const alerts = GEOFENCE_ALERTS;

  const behaviorStats = {
    averageScore: driverScores.length
      ? Math.round(driverScores.reduce(
          (s, d) => s + d.overallScore,
          0,
        ) / driverScores.length)
      : 0,
    last24h: events.length,
    total: events.length,
    critical: events.filter(e => e.severity === "critical").length,
  };

  const geofenceStats = {
    entries: alerts.filter(a => a.alertType === "entry").length,
    exits: alerts.filter(a => a.alertType === "exit").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{behaviorStats.averageScore}</p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-warning" />
            <p className="text-2xl font-bold">{behaviorStats.last24h}</p>
            <p className="text-xs text-muted-foreground">Events (24h)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="mx-auto mb-1 h-5 w-5 text-accent" />
            <p className="text-2xl font-bold">{driverScores.length}</p>
            <p className="text-xs text-muted-foreground">Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="mx-auto mb-1 h-5 w-5 text-success" />
            <p className="text-2xl font-bold">{geofenceStats.entries}</p>
            <p className="text-xs text-muted-foreground">Zone Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="mx-auto mb-1 h-5 w-5 text-destructive" />
            <p className="text-2xl font-bold">{geofenceStats.exits}</p>
            <p className="text-xs text-muted-foreground">Zone Exits</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-4">
              <TabsTrigger
                value="scores"
                className="gap-2"
              >
                <Activity className="h-4 w-4" />
                Performance Ranking
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Behavior Events
                {behaviorStats.critical > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 flex h-5 w-5 items-center justify-center p-0 text-[10px]"
                  >
                    {behaviorStats.critical}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="scores"
              className="mt-0"
            >
              <div className="grid gap-4">
                <p className="text-xs text-muted-foreground">
                  Drivers are ranked by performance score — braking (30%), speeding (30%),
                  acceleration (20%) and cornering (20%), calculated from recorded telemetry events.
                </p>
                {driverScores.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">No drivers scored yet.</p>
                )}
                {driverScores.map((score, index) => (
                  <DriverScoreCard
                    key={score.driverId}
                    score={score}
                    rank={index + 1}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent
              value="events"
              className="mt-0"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Behavior Events</CardTitle>
                  <CardDescription>
                    {behaviorStats.total}
                    {" "}
                    total events recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {events.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">No behaviour events recorded.</p>
                      )}
                      {events.slice(
                        0,
                        50,
                      ).map(event => (
                        <EventItem
                          key={event.id}
                          event={event}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  Geofence Alerts
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="flex h-5 min-w-[20px] items-center justify-center p-0 text-[10px]"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUnreadCount(0)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
              <CardDescription>
                Real-time zone entry/exit notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[550px] pr-4">
                <div className="space-y-2">
                  {alerts.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">No geofence alerts.</p>
                  )}
                  {alerts.map(alert => (
                    <GeofenceAlertItem
                      key={alert.id}
                      alert={alert}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
