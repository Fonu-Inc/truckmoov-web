import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDriverBehavior, DriverScore, DriverBehaviorEvent } from "@/hooks/useDriverBehavior";
import { useGeofenceAlerts, GeofenceAlert } from "@/hooks/useGeofenceAlerts";
import { mockDrivers } from "@/data/mockData";
import { formatDistanceToNow } from "date-fns";
import {
  Activity, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Gauge, Car, RotateCcw, Zap, MapPin, Shield, Bell, RefreshCw,
  Wifi, WifiOff, User
} from "lucide-react";

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-success";
    if (s >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="text-center space-y-2">
      <div className="relative w-20 h-20 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
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
          <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DriverScoreCard({ score, rank }: { score: DriverScore; rank: number }) {
  const driver = mockDrivers.find(d => d.id === score.driverId);
  const driverName = driver?.name || `Driver ${score.driverId.slice(0, 6)}`;

  const getTrendIcon = () => {
    switch (score.trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreBadge = (s: number) => {
    if (s >= 90) return { label: "Excellent", className: "bg-success text-success-foreground" };
    if (s >= 80) return { label: "Good", className: "bg-primary text-primary-foreground" };
    if (s >= 60) return { label: "Fair", className: "bg-warning text-warning-foreground" };
    return { label: "Poor", className: "" };
  };

  const badge = getScoreBadge(score.overallScore);

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
              #{rank}
            </div>
            <div>
              <p className="font-semibold">{driverName}</p>
              <p className="text-xs text-muted-foreground">{score.totalEvents} events recorded</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <ScoreGauge score={score.brakingScore} label="Braking" />
          <ScoreGauge score={score.accelerationScore} label="Accel" />
          <ScoreGauge score={score.corneringScore} label="Cornering" />
          <ScoreGauge score={score.speedingScore} label="Speed" />
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-destructive/10">
            <p className="font-semibold text-destructive">{score.eventBreakdown.harshBraking}</p>
            <p className="text-muted-foreground">Hard Brake</p>
          </div>
          <div className="p-2 rounded-lg bg-warning/10">
            <p className="font-semibold text-warning">{score.eventBreakdown.harshAcceleration}</p>
            <p className="text-muted-foreground">Hard Accel</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <p className="font-semibold text-primary">{score.eventBreakdown.harshCornering}</p>
            <p className="text-muted-foreground">Sharp Turn</p>
          </div>
          <div className="p-2 rounded-lg bg-accent/10">
            <p className="font-semibold text-accent">{score.eventBreakdown.overspeeding}</p>
            <p className="text-muted-foreground">Speeding</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventItem({ event }: { event: DriverBehaviorEvent }) {
  const getEventIcon = () => {
    switch (event.eventType) {
      case 'harsh_braking': return <Car className="h-4 w-4" />;
      case 'harsh_acceleration': return <Zap className="h-4 w-4" />;
      case 'harsh_cornering': return <RotateCcw className="h-4 w-4" />;
      case 'overspeeding': return <Gauge className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = () => {
    switch (event.severity) {
      case 'critical': return "bg-destructive/10 text-destructive border-destructive/30";
      case 'high': return "bg-warning/10 text-warning border-warning/30";
      case 'medium': return "bg-primary/10 text-primary border-primary/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getSeverityColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getEventIcon()}
          <span className="font-medium text-sm capitalize">
            {event.eventType.replace(/_/g, ' ')}
          </span>
          <Badge variant="outline" className="text-xs capitalize">
            {event.severity}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(event.createdAt, { addSuffix: true })}
        </span>
      </div>
      {event.speed && (
        <p className="text-xs mt-1 text-muted-foreground">
          Speed: {event.speed} km/h
        </p>
      )}
    </div>
  );
}

function GeofenceAlertItem({ alert }: { alert: GeofenceAlert }) {
  const isEntry = alert.alertType === 'entry';

  return (
    <div className={`p-3 rounded-lg border ${isEntry ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${isEntry ? 'text-success' : 'text-warning'}`} />
          <div>
            <p className="font-medium text-sm">{alert.geofenceName}</p>
            <p className="text-xs text-muted-foreground">
              Device {alert.deviceId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="text-right">
          <Badge variant={isEntry ? "default" : "secondary"} className="text-xs">
            {alert.alertType.toUpperCase()}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(alert.triggeredAt, { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Demo fallback data ───────────────────────────────────────────────
const DEMO_TENANT_ID = "demo-tenant";
const now = Date.now();
const minutes = (m: number) => new Date(now - m * 60_000);

const DEMO_DRIVER_SCORES: DriverScore[] = [
  {
    driverId: "drv-001", driverName: "Adebayo Okonkwo",
    overallScore: 92, brakingScore: 94, accelerationScore: 90, corneringScore: 95, speedingScore: 89,
    totalEvents: 7,
    eventBreakdown: { harshBraking: 2, harshAcceleration: 1, harshCornering: 1, overspeeding: 3 },
    trend: 'improving', recentEvents: [],
  },
  {
    driverId: "drv-002", driverName: "Chinedu Eze",
    overallScore: 85, brakingScore: 88, accelerationScore: 82, corneringScore: 86, speedingScore: 84,
    totalEvents: 12,
    eventBreakdown: { harshBraking: 4, harshAcceleration: 3, harshCornering: 2, overspeeding: 3 },
    trend: 'stable', recentEvents: [],
  },
  {
    driverId: "drv-003", driverName: "Ibrahim Suleiman",
    overallScore: 78, brakingScore: 75, accelerationScore: 80, corneringScore: 82, speedingScore: 74,
    totalEvents: 18,
    eventBreakdown: { harshBraking: 5, harshAcceleration: 4, harshCornering: 3, overspeeding: 6 },
    trend: 'declining', recentEvents: [],
  },
  {
    driverId: "drv-004", driverName: "Tunde Bakare",
    overallScore: 71, brakingScore: 68, accelerationScore: 72, corneringScore: 75, speedingScore: 69,
    totalEvents: 24,
    eventBreakdown: { harshBraking: 7, harshAcceleration: 5, harshCornering: 4, overspeeding: 8 },
    trend: 'declining', recentEvents: [],
  },
  {
    driverId: "drv-005", driverName: "Femi Adeyemi",
    overallScore: 88, brakingScore: 90, accelerationScore: 86, corneringScore: 89, speedingScore: 87,
    totalEvents: 9,
    eventBreakdown: { harshBraking: 2, harshAcceleration: 2, harshCornering: 2, overspeeding: 3 },
    trend: 'improving', recentEvents: [],
  },
];

const DEMO_BEHAVIOR_EVENTS: DriverBehaviorEvent[] = [
  { id: "e1", deviceId: "dev-001", driverId: "drv-003", eventType: 'overspeeding', severity: 'critical', speed: 118, createdAt: minutes(8), tenantId: DEMO_TENANT_ID },
  { id: "e2", deviceId: "dev-002", driverId: "drv-004", eventType: 'harsh_braking', severity: 'high', speed: 72, createdAt: minutes(22), tenantId: DEMO_TENANT_ID },
  { id: "e3", deviceId: "dev-003", driverId: "drv-002", eventType: 'harsh_cornering', severity: 'medium', speed: 54, createdAt: minutes(41), tenantId: DEMO_TENANT_ID },
  { id: "e4", deviceId: "dev-004", driverId: "drv-001", eventType: 'harsh_acceleration', severity: 'low', speed: 38, createdAt: minutes(68), tenantId: DEMO_TENANT_ID },
  { id: "e5", deviceId: "dev-001", driverId: "drv-003", eventType: 'overspeeding', severity: 'high', speed: 102, createdAt: minutes(95), tenantId: DEMO_TENANT_ID },
  { id: "e6", deviceId: "dev-005", driverId: "drv-005", eventType: 'harsh_braking', severity: 'medium', speed: 61, createdAt: minutes(140), tenantId: DEMO_TENANT_ID },
  { id: "e7", deviceId: "dev-002", driverId: "drv-004", eventType: 'overspeeding', severity: 'critical', speed: 124, createdAt: minutes(180), tenantId: DEMO_TENANT_ID },
  { id: "e8", deviceId: "dev-003", driverId: "drv-002", eventType: 'harsh_acceleration', severity: 'medium', speed: 47, createdAt: minutes(220), tenantId: DEMO_TENANT_ID },
  { id: "e9", deviceId: "dev-004", driverId: "drv-001", eventType: 'harsh_cornering', severity: 'low', speed: 32, createdAt: minutes(285), tenantId: DEMO_TENANT_ID },
  { id: "e10", deviceId: "dev-005", driverId: "drv-005", eventType: 'overspeeding', severity: 'high', speed: 98, createdAt: minutes(360), tenantId: DEMO_TENANT_ID },
];

const DEMO_GEOFENCE_ALERTS: GeofenceAlert[] = [
  { id: "g1", deviceId: "dev-001-fleet", geofenceName: "Apapa Port Zone", alertType: 'entry', latitude: 6.4474, longitude: 3.3903, triggeredAt: minutes(5), tenantId: DEMO_TENANT_ID },
  { id: "g2", deviceId: "dev-002-fleet", geofenceName: "Lagos HQ Depot", alertType: 'exit', latitude: 6.5244, longitude: 3.3792, triggeredAt: minutes(18), tenantId: DEMO_TENANT_ID },
  { id: "g3", deviceId: "dev-003-fleet", geofenceName: "Tin Can Island", alertType: 'entry', latitude: 6.4400, longitude: 3.3550, triggeredAt: minutes(34), tenantId: DEMO_TENANT_ID },
  { id: "g4", deviceId: "dev-004-fleet", geofenceName: "Ikeja Warehouse", alertType: 'dwell', latitude: 6.6018, longitude: 3.3515, triggeredAt: minutes(52), tenantId: DEMO_TENANT_ID },
  { id: "g5", deviceId: "dev-005-fleet", geofenceName: "Abuja Distribution Hub", alertType: 'exit', latitude: 9.0765, longitude: 7.3986, triggeredAt: minutes(75), tenantId: DEMO_TENANT_ID },
  { id: "g6", deviceId: "dev-001-fleet", geofenceName: "Lekki Toll Gate", alertType: 'entry', latitude: 6.4474, longitude: 3.5644, triggeredAt: minutes(110), tenantId: DEMO_TENANT_ID },
  { id: "g7", deviceId: "dev-002-fleet", geofenceName: "Port Harcourt Terminal", alertType: 'entry', latitude: 4.8156, longitude: 7.0498, triggeredAt: minutes(165), tenantId: DEMO_TENANT_ID },
  { id: "g8", deviceId: "dev-003-fleet", geofenceName: "Kano Logistics Park", alertType: 'exit', latitude: 12.0022, longitude: 8.5920, triggeredAt: minutes(220), tenantId: DEMO_TENANT_ID },
];

export function DriverBehaviorTab() {
  const { 
    events: realEvents, 
    driverScores: realScores, 
    stats: realBehaviorStats, 
    isLoading: behaviorLoading, 
    isConnected: behaviorConnected,
    refresh: refreshBehavior 
  } = useDriverBehavior();
  
  const { 
    alerts: realAlerts, 
    stats: realGeofenceStats, 
    isConnected: geofenceConnected,
    unreadCount: realUnreadCount,
    markAllRead,
    refresh: refreshGeofence 
  } = useGeofenceAlerts();

  const [activeTab, setActiveTab] = useState("scores");

  // Demo fallback when no real data
  const useDemo = !behaviorLoading && realScores.length === 0 && realEvents.length === 0;
  const driverScores = useDemo ? DEMO_DRIVER_SCORES : realScores;
  const events = useDemo ? DEMO_BEHAVIOR_EVENTS : realEvents;
  const alerts = useDemo || realAlerts.length === 0 ? DEMO_GEOFENCE_ALERTS : realAlerts;
  const unreadCount = useDemo ? 3 : realUnreadCount;

  const behaviorStats = useDemo
    ? {
        averageScore: Math.round(DEMO_DRIVER_SCORES.reduce((s, d) => s + d.overallScore, 0) / DEMO_DRIVER_SCORES.length),
        last24h: DEMO_BEHAVIOR_EVENTS.length,
        total: DEMO_BEHAVIOR_EVENTS.length,
        critical: DEMO_BEHAVIOR_EVENTS.filter(e => e.severity === 'critical').length,
      }
    : realBehaviorStats;

  const geofenceStats = useDemo || realAlerts.length === 0
    ? {
        entries: DEMO_GEOFENCE_ALERTS.filter(a => a.alertType === 'entry').length,
        exits: DEMO_GEOFENCE_ALERTS.filter(a => a.alertType === 'exit').length,
      }
    : realGeofenceStats;

  const handleRefresh = () => {
    refreshBehavior();
    refreshGeofence();
  };

  return (
    <div className="space-y-6">
      {/* Connection Status & Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {behaviorConnected && geofenceConnected ? (
                <Wifi className="h-4 w-4 text-success" />
              ) : (
                <WifiOff className="h-4 w-4 text-warning" />
              )}
              <span className="text-xs font-medium">
                {behaviorConnected && geofenceConnected ? 'Live' : 'Connecting...'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="w-full">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{behaviorStats.averageScore}</p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-warning" />
            <p className="text-2xl font-bold">{behaviorStats.last24h}</p>
            <p className="text-xs text-muted-foreground">Events (24h)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-5 w-5 mx-auto mb-1 text-accent" />
            <p className="text-2xl font-bold">{driverScores.length}</p>
            <p className="text-xs text-muted-foreground">Drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-2xl font-bold">{geofenceStats.entries}</p>
            <p className="text-xs text-muted-foreground">Zone Entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold">{geofenceStats.exits}</p>
            <p className="text-xs text-muted-foreground">Zone Exits</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Driver Scores & Events */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="scores" className="gap-2">
                <Activity className="h-4 w-4" />
                Driver Scores
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Behavior Events
                {behaviorStats.critical > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {behaviorStats.critical}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scores" className="mt-0">
              {behaviorLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="h-48 animate-pulse bg-muted/50" />
                  ))}
                </div>
              ) : driverScores.length > 0 ? (
                <div className="grid gap-4">
                  {driverScores.map((score, index) => (
                    <DriverScoreCard key={score.driverId} score={score} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium">No Driver Data</p>
                  <p className="text-sm text-muted-foreground">
                    Driver behavior events will appear here as they're recorded
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Behavior Events</CardTitle>
                  <CardDescription>
                    {behaviorStats.total} total events recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {events.slice(0, 50).map(event => (
                        <EventItem key={event.id} event={event} />
                      ))}
                      {events.length === 0 && (
                        <div className="text-center py-8">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No events recorded yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Geofence Alerts Sidebar */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Geofence Alerts
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </CardTitle>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead}>
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
                  {alerts.length > 0 ? (
                    alerts.map(alert => (
                      <GeofenceAlertItem key={alert.id} alert={alert} />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No geofence alerts</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Alerts will appear when vehicles enter or exit zones
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
