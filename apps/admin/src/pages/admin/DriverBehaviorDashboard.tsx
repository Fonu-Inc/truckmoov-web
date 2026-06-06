import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Progress } from "@/components/shadcn/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { mockDrivers } from "@/data/mockData";
import { formatDistanceToNow } from "date-fns";
import {
  Activity, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Gauge, Car, RotateCcw, Zap, MapPin, Shield, Bell, RefreshCw,
  Wifi, WifiOff, ChevronRight, User, Clock
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";

type DriverScore = {
  driverId: string;
  overallScore: number;
  brakingScore: number;
  accelerationScore: number;
  corneringScore: number;
  speedingScore: number;
  totalEvents: number;
  trend: "improving" | "declining" | "stable";
  eventBreakdown: { harshBraking: number; harshAcceleration: number; harshCornering: number; overspeeding: number };
};
type DriverBehaviorEvent = {
  id: string;
  eventType: string;
  severity: string;
  speed?: number;
  createdAt: Date;
};
type GeofenceAlert = {
  id: string;
  alertType: "entry" | "exit";
  geofenceName: string;
  deviceId: string;
  triggeredAt: Date;
};
const useDriverBehavior = () => ({
  events: [] as DriverBehaviorEvent[],
  driverScores: [] as DriverScore[],
  stats: { averageScore: 0, last24h: 0, critical: 0, total: 0 },
  isLoading: false,
  isConnected: false,
  refresh: () => {},
});
const useGeofenceAlerts = () => ({
  alerts: [] as GeofenceAlert[],
  recentAlerts: [] as GeofenceAlert[],
  stats: { entries: 0, exits: 0 },
  isConnected: false,
  unreadCount: 0,
  markAllRead: () => {},
  refresh: () => {},
});

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
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
    if (s >= 90) return { label: "Excellent", variant: "default" as const, className: "bg-success text-success-foreground" };
    if (s >= 80) return { label: "Good", variant: "default" as const, className: "bg-primary text-primary-foreground" };
    if (s >= 60) return { label: "Fair", variant: "secondary" as const, className: "bg-warning text-warning-foreground" };
    return { label: "Poor", variant: "destructive" as const, className: "" };
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
          <ScoreGauge score={score.brakingScore} label="Braking" color="red" />
          <ScoreGauge score={score.accelerationScore} label="Accel" color="orange" />
          <ScoreGauge score={score.corneringScore} label="Cornering" color="blue" />
          <ScoreGauge score={score.speedingScore} label="Speed" color="purple" />
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

export default function DriverBehaviorDashboard() {
  const { 
    events, 
    driverScores, 
    stats: behaviorStats, 
    isLoading: behaviorLoading, 
    isConnected: behaviorConnected,
    refresh: refreshBehavior 
  } = useDriverBehavior();
  
  const { 
    alerts, 
    recentAlerts,
    stats: geofenceStats, 
    isConnected: geofenceConnected,
    unreadCount,
    markAllRead,
    refresh: refreshGeofence 
  } = useGeofenceAlerts();

  const [activeTab, setActiveTab] = useState("scores");

  const handleRefresh = () => {
    refreshBehavior();
    refreshGeofence();
  };

  return (
    <DashboardLayout 
      title="Driver Behavior & Geofencing" 
      subtitle="Real-time driver scoring and geofence monitoring"
    >
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

        {/* Geofence Alert Charts */}
        {(() => {
          const trendData = recentAlerts.length > 0
            ? Object.values(
                recentAlerts.reduce<Record<string, { name: string; entries: number; exits: number; dwell: number }>>(
                  (acc, a) => {
                    const key = a.triggeredAt.toLocaleDateString("en-US", { weekday: "short" });
                    acc[key] = acc[key] || { name: key, entries: 0, exits: 0, dwell: 0 };
                    if (a.alertType === "entry") acc[key].entries += 1;
                    else if (a.alertType === "exit") acc[key].exits += 1;
                    else acc[key].dwell += 1;
                    return acc;
                  },
                  {}
                )
              )
            : [];
          const typeData = geofenceStats.entries + geofenceStats.exits > 0
            ? [
                { name: "Entry", value: geofenceStats.entries, fill: "hsl(142 76% 36%)" },
                { name: "Exit", value: geofenceStats.exits, fill: "hsl(220 70% 55%)" },
              ]
            : [];
          const zoneData: never[] = [];
          return (
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Geofence Alerts (Last 7 Days)
                  </CardTitle>
                  <CardDescription>Entries, exits and dwell events per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="entries" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="exits" fill="hsl(220 70% 55%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="dwell" fill="hsl(48 96% 53%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Alert Type Breakdown
                  </CardTitle>
                  <CardDescription>Distribution by trigger type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={typeData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {typeData.map((entry, idx) => (
                          <Cell key={idx} fill={(entry as any).fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Top Geofence Zones
                  </CardTitle>
                  <CardDescription>Most active zones by entry/exit volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={zoneData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={110} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="entries" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="exits" fill="hsl(220 70% 55%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          );
        })()}

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
    </DashboardLayout>
  );
}



