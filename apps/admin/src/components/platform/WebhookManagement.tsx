import { formatDayMonthTime, formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Badge } from "@/components/shadcn/badge";
import { Switch } from "@/components/shadcn/switch";
import { Separator } from "@/components/shadcn/separator";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/shadcn/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Webhook,
  Plus,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Activity,
  History,
  Settings,
  Code,
  ExternalLink,
  Zap,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { ExportButton } from "@/components/shadcn/export-button";
import { TableToolbar } from "@/components/shadcn/table-toolbar";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret: string;
  retryCount: number;
  retryDelay: number;
  headers: Record<string, string>;
  lastTriggered: Date | null;
  status: "active" | "failing" | "disabled";
  successRate: number;
  totalCalls: number;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  status: "success" | "failed" | "pending" | "retrying";
  statusCode: number | null;
  requestBody: string;
  responseBody: string | null;
  duration: number | null;
  timestamp: Date;
  attempts: number;
}

const availableEvents = [
  { value: "job.created", label: "Job Created", category: "Jobs" },
  { value: "job.updated", label: "Job Updated", category: "Jobs" },
  { value: "job.completed", label: "Job Completed", category: "Jobs" },
  { value: "job.cancelled", label: "Job Cancelled", category: "Jobs" },
  { value: "driver.assigned", label: "Driver Assigned", category: "Drivers" },
  { value: "driver.status_change", label: "Driver Status Change", category: "Drivers" },
  { value: "driver.location_update", label: "Driver Location Update", category: "Drivers" },
  { value: "vehicle.geofence_enter", label: "Geofence Entry", category: "Vehicles" },
  { value: "vehicle.geofence_exit", label: "Geofence Exit", category: "Vehicles" },
  { value: "vehicle.alert", label: "Vehicle Alert", category: "Vehicles" },
  { value: "device.offline", label: "Device Offline", category: "IoT" },
  { value: "device.online", label: "Device Online", category: "IoT" },
  { value: "device.low_battery", label: "Low Battery", category: "IoT" },
  { value: "payment.success", label: "Payment Success", category: "Billing" },
  { value: "payment.failed", label: "Payment Failed", category: "Billing" },
  { value: "invoice.created", label: "Invoice Created", category: "Billing" },
  { value: "security.login", label: "User Login", category: "Security" },
  { value: "security.suspicious_activity", label: "Suspicious Activity", category: "Security" },
];

export function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: "wh-1",
      name: "Job Notifications",
      url: "https://api.example.com/webhooks/jobs",
      events: ["job.created", "job.completed", "job.cancelled"],
      enabled: true,
      secret: "whsec_abc123xyz",
      retryCount: 3,
      retryDelay: 5,
      headers: { "X-Custom-Header": "fleetpro" },
      lastTriggered: new Date(Date.now() - 300000),
      status: "active",
      successRate: 98.5,
      totalCalls: 1247,
    },
    {
      id: "wh-2",
      name: "Driver Status Updates",
      url: "https://api.example.com/webhooks/drivers",
      events: ["driver.assigned", "driver.status_change"],
      enabled: true,
      secret: "whsec_def456uvw",
      retryCount: 3,
      retryDelay: 10,
      headers: {},
      lastTriggered: new Date(Date.now() - 60000),
      status: "active",
      successRate: 99.2,
      totalCalls: 892,
    },
    {
      id: "wh-3",
      name: "Payment Events",
      url: "https://api.example.com/webhooks/payments",
      events: ["payment.success", "payment.failed", "invoice.created"],
      enabled: true,
      secret: "whsec_ghi789rst",
      retryCount: 5,
      retryDelay: 15,
      headers: { "Authorization": "Bearer token123" },
      lastTriggered: new Date(Date.now() - 3600000),
      status: "failing",
      successRate: 72.3,
      totalCalls: 456,
    },
    {
      id: "wh-4",
      name: "Zapier Integration",
      url: "https://hooks.zapier.com/hooks/catch/123456/abcdef",
      events: ["job.completed"],
      enabled: false,
      secret: "",
      retryCount: 1,
      retryDelay: 0,
      headers: {},
      lastTriggered: null,
      status: "disabled",
      successRate: 0,
      totalCalls: 0,
    },
  ]);

  const [logs, setLogs] = useState<WebhookLog[]>([
    {
      id: "log-1",
      webhookId: "wh-1",
      webhookName: "Job Notifications",
      event: "job.completed",
      status: "success",
      statusCode: 200,
      requestBody: '{"event":"job.completed","data":{"jobId":"JOB-001"}}',
      responseBody: '{"received":true}',
      duration: 245,
      timestamp: new Date(Date.now() - 300000),
      attempts: 1,
    },
    {
      id: "log-2",
      webhookId: "wh-2",
      webhookName: "Driver Status Updates",
      event: "driver.assigned",
      status: "success",
      statusCode: 200,
      requestBody: '{"event":"driver.assigned","data":{"driverId":"DRV-001"}}',
      responseBody: '{"ok":true}',
      duration: 189,
      timestamp: new Date(Date.now() - 60000),
      attempts: 1,
    },
    {
      id: "log-3",
      webhookId: "wh-3",
      webhookName: "Payment Events",
      event: "payment.success",
      status: "failed",
      statusCode: 500,
      requestBody: '{"event":"payment.success","data":{"paymentId":"PAY-001"}}',
      responseBody: '{"error":"Internal Server Error"}',
      duration: 1523,
      timestamp: new Date(Date.now() - 3600000),
      attempts: 3,
    },
    {
      id: "log-4",
      webhookId: "wh-1",
      webhookName: "Job Notifications",
      event: "job.created",
      status: "retrying",
      statusCode: null,
      requestBody: '{"event":"job.created","data":{"jobId":"JOB-002"}}',
      responseBody: null,
      duration: null,
      timestamp: new Date(),
      attempts: 2,
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Recent Deliveries toolbar state
  const [logSearch, setLogSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logFilters, setLogFilters] = useState<import("@/components/ui/table-toolbar").FilterValues>({});

  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
    retryCount: 3,
    retryDelay: 5,
    secret: "",
  });

  const handleAddWebhook = () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const webhook: WebhookConfig = {
      id: `wh-${Date.now()}`,
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      enabled: true,
      secret: newWebhook.secret || `whsec_${Math.random().toString(36).substring(2, 15)}`,
      retryCount: newWebhook.retryCount,
      retryDelay: newWebhook.retryDelay,
      headers: {},
      lastTriggered: null,
      status: "active",
      successRate: 0,
      totalCalls: 0,
    };

    setWebhooks(prev => [...prev, webhook]);
    setNewWebhook({ name: "", url: "", events: [], retryCount: 3, retryDelay: 5, secret: "" });
    setIsAddDialogOpen(false);
    toast.success("Webhook created successfully");
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
    toast.success("Webhook deleted");
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(prev =>
      prev.map(w =>
        w.id === id
          ? { ...w, enabled: !w.enabled, status: !w.enabled ? "active" : "disabled" }
          : w
      )
    );
  };

  const handleTestWebhook = async (webhook: WebhookConfig) => {
    setTestingWebhook(webhook.id);
    
    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const log: WebhookLog = {
        id: `log-${Date.now()}`,
        webhookId: webhook.id,
        webhookName: webhook.name,
        event: "test.ping",
        status: "success",
        statusCode: 200,
        requestBody: JSON.stringify({ event: "test.ping", timestamp: new Date().toISOString() }),
        responseBody: '{"received":true}',
        duration: Math.floor(Math.random() * 300) + 100,
        timestamp: new Date(),
        attempts: 1,
      };

      setLogs(prev => [log, ...prev]);
      toast.success(`Test webhook sent to ${webhook.name}`);
    } catch (error) {
      toast.error("Failed to send test webhook");
    } finally {
      setTestingWebhook(null);
    }
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
  };

  const handleRegenerateSecret = (id: string) => {
    const newSecret = `whsec_${Math.random().toString(36).substring(2, 15)}`;
    setWebhooks(prev =>
      prev.map(w => (w.id === id ? { ...w, secret: newSecret } : w))
    );
    toast.success("Secret regenerated");
  };

  const getStatusBadge = (status: WebhookConfig["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case "failing":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Failing</Badge>;
      case "disabled":
        return <Badge variant="secondary">Disabled</Badge>;
    }
  };

  const getLogStatusBadge = (status: WebhookLog["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-success/10 text-success border-success/20">Success</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "retrying":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Retrying</Badge>;
    }
  };

  const toggleEventSelection = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6 text-primary" />
            Webhook Management
          </h2>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time event notifications
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a new webhook endpoint to receive event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="My Webhook"
                    value={newWebhook.name}
                    onChange={e => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL *</Label>
                  <Input
                    placeholder="https://api.example.com/webhook"
                    value={newWebhook.url}
                    onChange={e => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Events to Subscribe *</Label>
                <div className="border border-border rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid gap-2 grid-cols-2">
                    {availableEvents.map(event => (
                      <label
                        key={event.value}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newWebhook.events.includes(event.value)}
                          onChange={() => toggleEventSelection(event.value)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{event.label}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {event.category}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Retry Count</Label>
                  <Select
                    value={newWebhook.retryCount.toString()}
                    onValueChange={v => setNewWebhook(prev => ({ ...prev, retryCount: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No retries</SelectItem>
                      <SelectItem value="1">1 retry</SelectItem>
                      <SelectItem value="3">3 retries</SelectItem>
                      <SelectItem value="5">5 retries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Retry Delay (seconds)</Label>
                  <Select
                    value={newWebhook.retryDelay.toString()}
                    onValueChange={v => setNewWebhook(prev => ({ ...prev, retryDelay: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Signing Secret (optional)</Label>
                <Input
                  placeholder="Leave empty to auto-generate"
                  value={newWebhook.secret}
                  onChange={e => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Used to verify webhook authenticity via HMAC signature
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddWebhook}>Create Webhook</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Webhook className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{webhooks.length}</p>
                <p className="text-sm text-muted-foreground">Total Webhooks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {webhooks.filter(w => w.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {webhooks.filter(w => w.status === "failing").length}
                </p>
                <p className="text-sm text-muted-foreground">Failing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Activity className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {webhooks.reduce((acc, w) => acc + w.totalCalls, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" />
            Delivery Logs
          </TabsTrigger>
        </TabsList>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          {webhooks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium">No webhooks configured</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a webhook to start receiving event notifications
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {webhooks.map(webhook => (
                <Card key={webhook.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{webhook.name}</h3>
                          {getStatusBadge(webhook.status)}
                          <Switch
                            checked={webhook.enabled}
                            onCheckedChange={() => handleToggleWebhook(webhook.id)}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ExternalLink className="h-4 w-4" />
                          <code className="bg-muted/50 px-2 py-1 rounded text-xs">
                            {webhook.url}
                          </code>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map(event => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {webhook.lastTriggered && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last triggered: {formatDayMonthTime(webhook.lastTriggered)}
                            </span>
                          )}
                          <span>Success rate: {webhook.successRate}%</span>
                          <span>{webhook.totalCalls.toLocaleString()} calls</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestWebhook(webhook)}
                          disabled={testingWebhook === webhook.id || !webhook.enabled}
                        >
                          {testingWebhook === webhook.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedWebhook(webhook);
                                setIsTestDialogOpen(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send Test Event
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopySecret(webhook.secret)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Secret
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRegenerateSecret(webhook.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Regenerate Secret
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteWebhook(webhook.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Secret display */}
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Signing Secret</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-sm">
                            {showSecrets[webhook.id] ? webhook.secret : "••••••••••••••••"}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              setShowSecrets(prev => ({ ...prev, [webhook.id]: !prev[webhook.id] }))
                            }
                          >
                            {showSecrets[webhook.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopySecret(webhook.secret)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Retries: {webhook.retryCount} | Delay: {webhook.retryDelay}s
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Recent Deliveries
                  </CardTitle>
                  <CardDescription>View webhook delivery attempts and responses</CardDescription>
                </div>
                <ExportButton
                  filename="webhook-deliveries"
                  rows={logs}
                  columns={[
                    { header: "Webhook", accessor: (l) => l.webhookName },
                    { header: "Event", accessor: (l) => l.event },
                    { header: "Status", accessor: (l) => l.status },
                    { header: "Status Code", accessor: (l) => l.statusCode ?? "" },
                    { header: "Duration (ms)", accessor: (l) => l.duration ?? "" },
                    { header: "Attempts", accessor: (l) => l.attempts },
                    { header: "Timestamp", accessor: (l) => formatWithPattern(l.timestamp, "yyyy-MM-dd HH:mm:ss") },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const eventOptions = Array.from(new Set(logs.map((l) => l.event))).map((e) => ({
                  value: e,
                  label: e,
                }));
                return (
                  <TableToolbar
                    search={logSearch}
                    onSearchChange={setLogSearch}
                    searchPlaceholder="Search by webhook or event..."
                    status={logStatusFilter}
                    onStatusChange={setLogStatusFilter}
                    statusOptions={[
                      { value: "success", label: "Success" },
                      { value: "failed", label: "Failed" },
                      { value: "pending", label: "Pending" },
                      { value: "retrying", label: "Retrying" },
                    ]}
                    filterEntity="deliveries"
                    filterFields={[
                      { type: "select", key: "event", label: "Event", options: eventOptions },
                      {
                        type: "range",
                        key: "duration",
                        label: "Duration (ms)",
                        placeholderFrom: "Min",
                        placeholderTo: "Max",
                      },
                      { type: "date", key: "after", label: "After date" },
                    ]}
                    filterValues={logFilters}
                    onFiltersApply={setLogFilters}
                  />
                );
              })()}
              {(() => {
                const q = logSearch.trim().toLowerCase();
                const eventVal = logFilters.event?.enabled ? logFilters.event.value : undefined;
                const durFrom = logFilters.duration?.enabled
                  ? Number(logFilters.duration.from)
                  : undefined;
                const durTo = logFilters.duration?.enabled
                  ? Number(logFilters.duration.to)
                  : undefined;
                const afterDate = logFilters.after?.enabled && logFilters.after.date
                  ? new Date(logFilters.after.date)
                  : undefined;
                const filteredLogs = logs.filter((log) => {
                  if (q && !`${log.webhookName} ${log.event}`.toLowerCase().includes(q)) return false;
                  if (logStatusFilter !== "all" && log.status !== logStatusFilter) return false;
                  if (eventVal && log.event !== eventVal) return false;
                  if (durFrom !== undefined && !Number.isNaN(durFrom) && (log.duration ?? 0) < durFrom)
                    return false;
                  if (durTo !== undefined && !Number.isNaN(durTo) && (log.duration ?? 0) > durTo)
                    return false;
                  if (afterDate && log.timestamp < afterDate) return false;
                  return true;
                });
                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Webhook</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.webhookName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.event}
                        </Badge>
                      </TableCell>
                      <TableCell>{getLogStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {log.statusCode ? (
                          <code
                            className={`text-xs ${
                              log.statusCode >= 200 && log.statusCode < 300
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {log.statusCode}
                          </code>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{log.duration ? `${log.duration}ms` : "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatWithPattern(log.timestamp, "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsLogDialogOpen(true);
                          }}
                        >
                          <Code className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Send Test Event</DialogTitle>
            <DialogDescription>
              Send a test event to {selectedWebhook?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select defaultValue="test.ping">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test.ping">test.ping</SelectItem>
                  {selectedWebhook?.events.map(event => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payload (JSON)</Label>
              <textarea
                className="w-full min-h-[150px] p-3 rounded-lg border border-border bg-background font-mono text-sm"
                defaultValue={JSON.stringify({ event: "test.ping", timestamp: new Date().toISOString() }, null, 2)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedWebhook) handleTestWebhook(selectedWebhook);
                setIsTestDialogOpen(false);
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Detail Dialog */}
      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>
              {selectedLog?.webhookName} - {selectedLog?.event}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                {getLogStatusBadge(selectedLog.status)}
                <span className="text-sm text-muted-foreground">
                  {formatWithPattern(selectedLog.timestamp, "PPpp")}
                </span>
                {selectedLog.duration && (
                  <span className="text-sm text-muted-foreground">
                    {selectedLog.duration}ms
                  </span>
                )}
                {selectedLog.attempts > 1 && (
                  <Badge variant="outline">{selectedLog.attempts} attempts</Badge>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Request Body</Label>
                <pre className="p-3 rounded-lg bg-muted/50 text-sm overflow-auto max-h-48">
                  {JSON.stringify(JSON.parse(selectedLog.requestBody), null, 2)}
                </pre>
              </div>
              {selectedLog.responseBody && (
                <div className="space-y-2">
                  <Label>Response Body</Label>
                  <pre className="p-3 rounded-lg bg-muted/50 text-sm overflow-auto max-h-48">
                    {JSON.stringify(JSON.parse(selectedLog.responseBody), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



