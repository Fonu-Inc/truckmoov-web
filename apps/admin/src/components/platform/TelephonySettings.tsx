import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { Badge } from "@/components/shadcn/badge";
import { Separator } from "@/components/shadcn/separator";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Mic,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Loader2,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  DollarSign,
  TrendingUp,
  Bell,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ConnectionStatus {
  api: "connected" | "disconnected" | "error";
  webhook: "active" | "inactive" | "error";
  lastCheck: Date;
}

interface UsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalMinutes: number;
  recordingsCount: number;
  apiCalls: number;
  apiLimit: number;
}

interface LiveCall {
  id: string;
  type: "incoming" | "outgoing";
  status: "ringing" | "connected" | "ended" | "failed";
  driverName: string;
  phoneNumber: string;
  startTime: Date;
  duration?: number;
}

interface CostBreakdown {
  monthlyBudget: number;
  currentSpend: number;
  projectedSpend: number;
  outboundCalls: { count: number; cost: number };
  inboundCalls: { count: number; cost: number };
  recordings: { count: number; cost: number };
  transcriptions: { count: number; cost: number };
  alertThreshold: number;
}

export function TelephonySettings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [fonuSettings, setFonuSettings] = useState({
    apiKey: "",
    apiSecret: "",
    webhookUrl: "",
    defaultCallerId: "+234",
    enableRecording: true,
    recordingRetentionDays: 90,
    transcriptionEnabled: true,
    defaultLanguage: "en",
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    api: "connected",
    webhook: "active",
    lastCheck: new Date(),
  });

  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalCalls: 1247,
    successfulCalls: 1189,
    failedCalls: 58,
    totalMinutes: 4823,
    recordingsCount: 892,
    apiCalls: 15420,
    apiLimit: 50000,
  });

  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([
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

  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>({
    monthlyBudget: 150000,
    currentSpend: 87500,
    projectedSpend: 125000,
    outboundCalls: { count: 823, cost: 41150 },
    inboundCalls: { count: 424, cost: 12720 },
    recordings: { count: 892, cost: 22300 },
    transcriptions: { count: 456, cost: 11330 },
    alertThreshold: 80,
  });

  // Simulate live call updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCalls((prev) =>
        prev.map((call) => {
          if (call.status === "connected") {
            return {
              ...call,
              duration: Math.floor((Date.now() - call.startTime.getTime()) / 1000),
            };
          }
          return call;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("fonu-voice", {
        body: { action: "test_connection" },
      });

      if (error) {
        setConnectionStatus((prev) => ({ ...prev, api: "error", lastCheck: new Date() }));
        toast.error("Connection test failed");
      } else {
        setConnectionStatus((prev) => ({ ...prev, api: "connected", lastCheck: new Date() }));
        toast.success("Fonu API connection successful");
      }
    } catch (err) {
      setConnectionStatus((prev) => ({ ...prev, api: "error", lastCheck: new Date() }));
      toast.error("Failed to test connection");
    } finally {
      setIsTesting(false);
    }
  };

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setUsageStats((prev) => ({
        ...prev,
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 100),
      }));
      setIsRefreshing(false);
      toast.success("Usage statistics refreshed");
    }, 1000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  Last checked: {connectionStatus.lastCheck.toLocaleTimeString()}
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
                <p className="text-2xl font-bold mt-1">{successRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {usageStats.successfulCalls.toLocaleString()} / {usageStats.totalCalls.toLocaleString()} calls
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
                <Progress value={apiUsagePercent} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {usageStats.apiCalls.toLocaleString()} / {usageStats.apiLimit.toLocaleString()} calls
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              {liveCalls.filter((c) => c.status === "connected" || c.status === "ringing").length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            <div className="space-y-3">
              {liveCalls.map((call) => (
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
                        <p className="font-mono text-sm font-medium">{formatDuration(call.duration)}</p>
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
                {Math.round(spendPercentage)}% of Budget
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
              <span>{Math.round(spendPercentage)}% used</span>
              <span>Projected: {formatCurrency(costBreakdown.projectedSpend)}</span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <PhoneOutgoing className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Outbound Calls</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(costBreakdown.outboundCalls.cost)}</p>
              <p className="text-xs text-muted-foreground">{costBreakdown.outboundCalls.count.toLocaleString()} calls</p>
            </div>

            <div className="p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <PhoneIncoming className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Inbound Calls</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(costBreakdown.inboundCalls.cost)}</p>
              <p className="text-xs text-muted-foreground">{costBreakdown.inboundCalls.count.toLocaleString()} calls</p>
            </div>

            <div className="p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Recordings</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(costBreakdown.recordings.cost)}</p>
              <p className="text-xs text-muted-foreground">{costBreakdown.recordings.count.toLocaleString()} recordings</p>
            </div>

            <div className="p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Transcriptions</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(costBreakdown.transcriptions.cost)}</p>
              <p className="text-xs text-muted-foreground">{costBreakdown.transcriptions.count.toLocaleString()} transcribed</p>
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
                  Get notified when spending reaches {costBreakdown.alertThreshold}% of budget
                </p>
              </div>
            </div>
            <Select
              value={costBreakdown.alertThreshold.toString()}
              onValueChange={(value) => 
                setCostBreakdown({ ...costBreakdown, alertThreshold: parseInt(value) })
              }
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

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Fonu API Configuration
          </CardTitle>
          <CardDescription>
            Configure your Fonu telephony integration credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fonuApiKey">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="fonuApiKey"
                    type={showApiKey ? "text" : "password"}
                    value={fonuSettings.apiKey}
                    onChange={(e) => setFonuSettings({ ...fonuSettings, apiKey: e.target.value })}
                    placeholder="fonu_key_••••••••••••"
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(fonuSettings.apiKey, "API Key")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Found in your Fonu dashboard under API settings
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fonuApiSecret">API Secret</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="fonuApiSecret"
                    type={showApiSecret ? "text" : "password"}
                    value={fonuSettings.apiSecret}
                    onChange={(e) => setFonuSettings({ ...fonuSettings, apiSecret: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowApiSecret(!showApiSecret)}
                    >
                      {showApiSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(fonuSettings.apiSecret, "API Secret")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Webhook Configuration</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhookUrl"
                    value={fonuSettings.webhookUrl || `https://yntqriwlxuytworbzuux.supabase.co/functions/v1/fonu-webhook`}
                    onChange={(e) => setFonuSettings({ ...fonuSettings, webhookUrl: e.target.value })}
                    placeholder="https://your-domain.com/webhooks/fonu"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(
                      fonuSettings.webhookUrl || `https://yntqriwlxuytworbzuux.supabase.co/functions/v1/fonu-webhook`,
                      "Webhook URL"
                    )}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add this URL to your Fonu dashboard webhook settings
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="callerId">Default Caller ID</Label>
                <Input
                  id="callerId"
                  value={fonuSettings.defaultCallerId}
                  onChange={(e) => setFonuSettings({ ...fonuSettings, defaultCallerId: e.target.value })}
                  placeholder="+234 800 000 0000"
                />
                <p className="text-xs text-muted-foreground">
                  Nigerian phone number for outbound calls
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Call Settings</h4>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Call Recording</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically record all calls for quality assurance
                  </p>
                </div>
                <Switch
                  checked={fonuSettings.enableRecording}
                  onCheckedChange={(checked) => setFonuSettings({ ...fonuSettings, enableRecording: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>AI Transcription</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-transcribe recordings with AI
                  </p>
                </div>
                <Switch
                  checked={fonuSettings.transcriptionEnabled}
                  onCheckedChange={(checked) => setFonuSettings({ ...fonuSettings, transcriptionEnabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Recording Retention</Label>
                <Select
                  value={fonuSettings.recordingRetentionDays.toString()}
                  onValueChange={(value) => setFonuSettings({ ...fonuSettings, recordingRetentionDays: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="180">180 Days</SelectItem>
                    <SelectItem value="365">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select
                  value={fonuSettings.defaultLanguage}
                  onValueChange={(value) => setFonuSettings({ ...fonuSettings, defaultLanguage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ha">Hausa</SelectItem>
                    <SelectItem value="yo">Yoruba</SelectItem>
                    <SelectItem value="ig">Igbo</SelectItem>
                    <SelectItem value="pcm">Nigerian Pidgin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PhoneCall className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button variant="outline" asChild>
              <a href="https://fonu.com/dashboard" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Fonu Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



