import type {
  DriverBehaviorBand, DriverBehaviorEvent, DriverBehaviorRankingItem, DriverGeofenceAlert,
} from "@truckmoov/api/fleet";
import {
  useDriverBehaviorEvents,
  useDriverBehaviorRanking,
  useDriverBehaviorSummary,
  useDriverGeofenceAlerts,
  useGeofences,
  useMarkGeofenceAlertsRead,
  useVehicles,
} from "@truckmoov/api/fleet";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity, AlertTriangle, Bell, Car, Gauge, Loader2, MapPin,
  RefreshCw, RotateCcw, Shield,
  User, Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";

const BAND_BADGE: Record<DriverBehaviorBand, {
  label: string; className: string;
}> = {
  excellent: {
    label: "Excellent", className: "bg-success text-success-foreground",
  },
  strong: {
    label: "Strong", className: "bg-primary text-primary-foreground",
  },
  fair: {
    label: "Fair", className: "bg-warning text-warning-foreground",
  },
  poor: {
    label: "Poor", className: "",
  },
  unscored: {
    label: "Unscored", className: "bg-muted text-muted-foreground",
  },
};

function StateMessage({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>;
}

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
  score: DriverBehaviorRankingItem; rank: number | null;
}) {
  // ponytail: fleetflow shows a trend arrow here; the ranking API has no trend field yet.
  const badge = BAND_BADGE[score.band] ?? BAND_BADGE.poor;
  const { scores } = score;

  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardContent className="p-4">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground">
              {rank === null ? "—" : `#${rank}`}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{score.driverName}</p>
              <p className="text-xs text-muted-foreground">
                {score.eventsRecorded}
                {" "}
                events recorded
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2">
          <ScoreGauge
            score={scores.braking}
            label="Braking"
          />
          <ScoreGauge
            score={scores.acceleration}
            label="Accel"
          />
          <ScoreGauge
            score={scores.cornering}
            label="Cornering"
          />
          <ScoreGauge
            score={scores.speed}
            label="Speed"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-lg bg-destructive/10 p-2">
            <p className="font-semibold text-destructive">{scores.counts.hardBrake}</p>
            <p className="text-muted-foreground">Hard Brake</p>
          </div>
          <div className="rounded-lg bg-warning/10 p-2">
            <p className="font-semibold text-warning">{scores.counts.hardAccel}</p>
            <p className="text-muted-foreground">Hard Accel</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <p className="font-semibold text-primary">{scores.counts.sharpTurn}</p>
            <p className="text-muted-foreground">Sharp Turn</p>
          </div>
          <div className="rounded-lg bg-accent/10 p-2">
            <p className="font-semibold text-accent">{scores.counts.speeding}</p>
            <p className="text-muted-foreground">Speeding</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventItem({ event }: { event: DriverBehaviorEvent }) {
  const eventIcon = event.type === "harsh_braking"
    ? <Car className="h-4 w-4" />
    : event.type === "harsh_acceleration"
      ? <Zap className="h-4 w-4" />
      : event.type === "harsh_cornering"
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
            {event.type.replace(
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
          {formatRelative(new Date(event.occurredAt))}
        </span>
      </div>
      {event.speedKph !== null && (
        <p className="mt-1 text-xs text-muted-foreground">
          Speed:
          {" "}
          {event.speedKph}
          {" "}
          km/h
        </p>
      )}
    </div>
  );
}

function GeofenceAlertItem({
  alert, zoneName, vehicleName,
}: {
  alert: DriverGeofenceAlert; zoneName: string; vehicleName: string;
}) {
  const isEntry = alert.type === "entry";
  return (
    <div className={`rounded-lg border p-3 ${isEntry ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${isEntry ? "text-success" : "text-warning"}`} />
          <div>
            <p className="text-sm font-medium">{zoneName}</p>
            <p className="text-xs text-muted-foreground">
              {vehicleName}
            </p>
          </div>
        </div>
        <div className="text-right">
          <Badge
            variant={isEntry ? "default" : "secondary"}
            className="text-xs"
          >
            {alert.type.toUpperCase()}
          </Badge>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRelative(new Date(alert.at))}
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
  const summaryQuery = useDriverBehaviorSummary();
  const rankingQuery = useDriverBehaviorRanking();
  const eventsQuery = useDriverBehaviorEvents({ params: { limit: 50 } });
  const alertsQuery = useDriverGeofenceAlerts();
  const geofencesQuery = useGeofences();
  const vehiclesQuery = useVehicles();
  const markReadMutation = useMarkGeofenceAlertsRead();

  const summary = summaryQuery.data?.data;
  const driverScores = rankingQuery.data?.data?.items ?? [];
  const events = eventsQuery.data?.data?.items ?? [];
  const eventsTotal = eventsQuery.data?.data?.total ?? 0;
  const criticalCount = eventsQuery.data?.data?.criticalCount ?? 0;
  const alerts = alertsQuery.data?.data?.items ?? [];
  const unreadIds = alerts.filter(alert => !alert.read).map(alert => alert.id);
  const unreadCount = alertsQuery.data?.data?.unread ?? unreadIds.length;

  // Alerts carry ids only — names come from the geofence and vehicle lists.
  const zoneName = (id: string) => (geofencesQuery.data?.data ?? []).find(g => g.id === id)?.name ?? "Geofence zone";
  const vehicleName = (id: string) => {
    const vehicle = (vehiclesQuery.data?.data ?? []).find(v => v.id === id);
    return vehicle ? vehicle.plateNumber : `Vehicle ${id.slice(
      0,
      8,
    )}...`;
  };

  const queries = [
    summaryQuery,
    rankingQuery,
    eventsQuery,
    alertsQuery,
  ];
  const isRefreshing = queries.some(q => q.isFetching);
  const refreshAll = () => queries.forEach(q => void q.refetch());

  const markRead = () => markReadMutation.mutate(
    { data: { alertIds: unreadIds } },
    { onError: error => toast.error(error.message) },
  );

  const behaviorStats = {
    averageScore: summary?.averageScore ?? null,
    last24h: summary?.eventsLast24h ?? 0,
    drivers: summary?.driversTotal ?? 0,
    critical: criticalCount,
    entries: summary?.zoneEntries ?? 0,
    exits: summary?.zoneExits ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{behaviorStats.averageScore ?? "—"}</p>
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
            <p className="text-2xl font-bold">{behaviorStats.drivers}</p>
            <p className="text-xs text-muted-foreground">Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="mx-auto mb-1 h-5 w-5 text-success" />
            <p className="text-2xl font-bold">{behaviorStats.entries}</p>
            <p className="text-xs text-muted-foreground">Zone Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="mx-auto mb-1 h-5 w-5 text-destructive" />
            <p className="text-2xl font-bold">{behaviorStats.exits}</p>
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
                {rankingQuery.isLoading && <StateMessage><Loader2 className="mx-auto h-5 w-5 animate-spin" /></StateMessage>}
                {rankingQuery.isError && (
                  <StateMessage>
                    <span className="text-destructive">{rankingQuery.error.message}</span>
                    <Button
                      variant="link"
                      onClick={() => void rankingQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </StateMessage>
                )}
                {rankingQuery.isSuccess && driverScores.length === 0 && <StateMessage>No drivers scored yet.</StateMessage>}
                {driverScores.map(score => (
                  <DriverScoreCard
                    key={score.driverId}
                    score={score}
                    rank={score.rank}
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
                    {eventsTotal}
                    {" "}
                    total events recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {eventsQuery.isLoading && <StateMessage><Loader2 className="mx-auto h-5 w-5 animate-spin" /></StateMessage>}
                      {eventsQuery.isError && <StateMessage><span className="text-destructive">{eventsQuery.error.message}</span></StateMessage>}
                      {eventsQuery.isSuccess && events.length === 0 && <StateMessage>No behaviour events recorded.</StateMessage>}
                      {events.map(event => (
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
                    onClick={markRead}
                    disabled={markReadMutation.isPending || unreadIds.length === 0}
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
                  {alertsQuery.isLoading && <StateMessage><Loader2 className="mx-auto h-5 w-5 animate-spin" /></StateMessage>}
                  {alertsQuery.isError && <StateMessage><span className="text-destructive">{alertsQuery.error.message}</span></StateMessage>}
                  {alertsQuery.isSuccess && alerts.length === 0 && <StateMessage>No geofence alerts.</StateMessage>}
                  {alerts.map(alert => (
                    <GeofenceAlertItem
                      key={alert.id}
                      alert={alert}
                      zoneName={zoneName(alert.geofenceId)}
                      vehicleName={vehicleName(alert.vehicleId)}
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
