import {
  formatClockDuration,
  formatTime,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Mic,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

type ConnectionStatus = {
  api: "connected" | "disconnected" | "error";
  webhook: "active" | "inactive" | "error";
  lastCheck: Date;
};

type UsageStats = {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalMinutes: number;
  recordingsCount: number;
  apiCalls: number;
  apiLimit: number;
};

type LiveCall = {
  id: string;
  type: "incoming" | "outgoing";
  status: "ringing" | "connected" | "ended" | "failed";
  driverName: string;
  phoneNumber: string;
  startTime: Date;
  duration?: number;
};

type CostBreakdown = {
  monthlyBudget: number;
  currentSpend: number;
  projectedSpend: number;
  outboundCalls: {
    count: number;
    cost: number;
  };
  inboundCalls: {
    count: number;
    cost: number;
  };
  recordings: {
    count: number;
    cost: number;
  };
  transcriptions: {
    count: number;
    cost: number;
  };
  alertThreshold: number;
};

export function TelephonySettings() {
  const [_isRefreshing] = useState(false);

  const [connectionStatus] = useState<ConnectionStatus>({
    api: "connected",
    webhook: "active",
    lastCheck: new Date(),
  });

  const [usageStats] = useState<UsageStats>({
    totalCalls: 1247,
    successfulCalls: 1189,
    failedCalls: 58,
    totalMinutes: 4823,
    recordingsCount: 892,
    apiCalls: 15420,
    apiLimit: 50000,
  });

  const [
    liveCalls,
    setLiveCalls,
  ] = useState<LiveCall[]>([
    {
      id: "call-1",
      type: "incoming",
      status: "connected",
      driverName: "Musa Ibrahim",
      phoneNumber: "+234 803 456 7890",
      startTime: new Date(Date.now() - 180000),
      duration: 180,
    },
    {
      id: "call-2",
      type: "outgoing",
      status: "ringing",
      driverName: "Chidi Okonkwo",
      phoneNumber: "+234 812 345 6789",
      startTime: new Date(),
    },
    {
      id: "call-3",
      type: "incoming",
      status: "connected",
      driverName: "Fatima Abubakar",
      phoneNumber: "+234 708 123 4567",
      startTime: new Date(Date.now() - 420000),
      duration: 420,
    },
  ]);

  const [
    costBreakdown,
    setCostBreakdown,
  ] = useState<CostBreakdown>({
    monthlyBudget: 150000,
    currentSpend: 87500,
    projectedSpend: 125000,
    outboundCalls: {
      count: 823,
      cost: 41150,
    },
    inboundCalls: {
      count: 424,
      cost: 12720,
    },
    recordings: {
      count: 892,
      cost: 22300,
    },
    transcriptions: {
      count: 456,
      cost: 11330,
    },
    alertThreshold: 80,
  });

  // Simulate live call updates
  useEffect(
    () => {
      const interval = setInterval(
        () => {
          setLiveCalls(prev =>
            prev.map((call) => {
              if (call.status === "connected") {
                return {
                  ...call,
                  duration: Math.floor((Date.now() - call.startTime.getTime()) / 1000),
                };
              }
              return call;
            }));
        },
        1000,
      );

      return () => clearInterval(interval);
    },
    [],
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
      },
    ).format(amount);
  };

  const getCallStatusIcon = (call: LiveCall) => {
    if (call.type === "incoming") {
      return <PhoneIncoming className="h-4 w-4 text-success" />;
    }
    return <PhoneOutgoing className="h-4 w-4 text-primary" />;
  };

  const getCallStatusBadge = (status: LiveCall["status"]) => {
    switch (status) {
      case "ringing":
        return <Badge className="bg-warning/10 text-warning border-warning/20 animate-pulse">Ringing</Badge>;
      case "connected":
        return <Badge className="bg-success/10 text-success border-success/20">Connected</Badge>;
      case "ended":
        return <Badge variant="secondary">Ended</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const spendPercentage = (costBreakdown.currentSpend / costBreakdown.monthlyBudget) * 100;
  const isOverBudgetAlert = spendPercentage >= costBreakdown.alertThreshold;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return <Badge className="bg-success/10 text-success border-success/20">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const successRate = usageStats.totalCalls > 0
    ? ((usageStats.successfulCalls / usageStats.totalCalls) * 100).toFixed(1)
    : 0;

  const apiUsagePercent = (usageStats.apiCalls / usageStats.apiLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Connection Status Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Fonu Telephony Status
              </CardTitle>
              <CardDescription>
                Real-time connection health and API status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
            {/* API Status */}
            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Connection</span>
                  {getStatusIcon(connectionStatus.api)}
                </div>
                <div className="mt-2">
                  {getStatusBadge(connectionStatus.api)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Last checked:
                  {" "}
                  {formatTime(connectionStatus.lastCheck)}
                </p>
              </CardContent>
            </Card>

            {/* Webhook Status */}
            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Webhook</span>
                  {getStatusIcon(connectionStatus.webhook)}
                </div>
                <div className="mt-2">
                  {getStatusBadge(connectionStatus.webhook)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Receiving events
                </p>
              </CardContent>
            </Card>

            {/* Success Rate */}
            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <p className="text-2xl font-bold mt-1">
                  {successRate}
                  %
                </p>
                <p className="text-xs text-muted-foreground">
                  {usageStats.successfulCalls.toLocaleString()}
                  {" "}
                  /
                  {usageStats.totalCalls.toLocaleString()}
                  {" "}
                  calls
                </p>
              </CardContent>
            </Card>

            {/* API Usage */}
            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Usage</span>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <Progress
                  value={apiUsagePercent}
                  className="mt-2 h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {usageStats.apiCalls.toLocaleString()}
                  {" "}
                  /
                  {usageStats.apiLimit.toLocaleString()}
                  {" "}
                  calls
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Call Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Call Volume & Usage
          </CardTitle>
          <CardDescription>
            Monthly telephony usage breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="p-2 rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{usageStats.totalCalls.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Calls</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="p-2 rounded-full bg-success/10">
                <PhoneOutgoing className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{usageStats.successfulCalls.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="p-2 rounded-full bg-destructive/10">
                <PhoneMissed className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{usageStats.failedCalls.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="p-2 rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{usageStats.totalMinutes.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Minutes Used</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="p-2 rounded-full bg-primary/10">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{usageStats.recordingsCount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Recordings</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Call Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
                Live Call Activity
              </CardTitle>
              <CardDescription>
                Real-time incoming and outgoing calls
              </CardDescription>
            </div>
            <Badge className="bg-success/10 text-success border-success/20">
              {liveCalls.filter(c => c.status === "connected" || c.status === "ringing").length}
              {" "}
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            <div className="space-y-3">
              {liveCalls.map(call => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${call.type === "incoming" ? "bg-success/10" : "bg-primary/10"}`}>
                      {getCallStatusIcon(call)}
                    </div>
                    <div>
                      <p className="font-medium">{call.driverName}</p>
                      <p className="text-sm text-muted-foreground">{call.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {call.duration !== undefined && (
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium">{formatClockDuration(call.duration)}</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                    )}
                    {getCallStatusBadge(call.status)}
                  </div>
                </div>
              ))}
              {liveCalls.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <PhoneCall className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No active calls at the moment</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Cost Tracking & Billing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Cost Tracking & Billing
              </CardTitle>
              <CardDescription>
                Monthly telephony spend breakdown and alerts
              </CardDescription>
            </div>
            {isOverBudgetAlert && (
              <Badge className="bg-warning/10 text-warning border-warning/20 animate-pulse">
                <Bell className="h-3 w-3 mr-1" />
                {Math.round(spendPercentage)}
                % of Budget
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Budget Overview */}
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Monthly Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(costBreakdown.monthlyBudget)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Current Spend</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(costBreakdown.currentSpend)}</p>
              </div>
            </div>
            <Progress
              value={spendPercentage}
              className={`h-3 ${spendPercentage >= 100 ? "bg-destructive/20" : spendPercentage >= costBreakdown.alertThreshold ? "bg-warning/20" : ""}`}
            />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>
                {Math.round(spendPercentage)}
                % used
              </span>
              <span>
                Projected:
                {formatCurrency(costBreakdown.projectedSpend)}
              </span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
            <div className="p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <PhoneOutgoing className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Outbound Calls</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(costBreakdown.outboundCalls.cost)}</p>
              <p className="text-xs text-muted-foreground">
                {costBreakdown.outboundCalls.count.toLocaleString()}
                {" "}
                calls
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <PhoneIncoming className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Inbound Calls</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(costBreakdown.inboundCalls.cost)}</p>
              <p className="text-xs text-muted-foreground">
                {costBreakdown.inboundCalls.count.toLocaleString()}
                {" "}
                calls
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Recordings</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(costBreakdown.recordings.cost)}</p>
              <p className="text-xs text-muted-foreground">
                {costBreakdown.recordings.count.toLocaleString()}
                {" "}
                recordings
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Transcriptions</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(costBreakdown.transcriptions.cost)}</p>
              <p className="text-xs text-muted-foreground">
                {costBreakdown.transcriptions.count.toLocaleString()}
                {" "}
                transcribed
              </p>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">Budget Alert Threshold</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when spending reaches
                  {" "}
                  {costBreakdown.alertThreshold}
                  % of budget
                </p>
              </div>
            </div>
            <Select
              value={costBreakdown.alertThreshold.toString()}
              onValueChange={value =>
                setCostBreakdown({
                  ...costBreakdown,
                  alertThreshold: parseInt(value),
                })}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Trend */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
            <TrendingUp className="h-5 w-5 text-success" />
            <div>
              <p className="font-medium text-success">On Track</p>
              <p className="text-sm text-muted-foreground">
                Projected spend is within budget for this month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ponytail: Fonu API Configuration moved to /settings/telephony/config */}
    </div>
  );
}
