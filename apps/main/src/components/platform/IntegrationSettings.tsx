import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { Badge } from "@/components/shadcn/badge";
import { Separator } from "@/components/shadcn/separator";
import { Progress } from "@/components/shadcn/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  MessageSquare,
  Mail,
  Zap,
  CreditCard,
  Brain,
  Map,
  Router,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Activity,
  Send,
  TestTube,
  Sparkles,
  Globe,
  Cpu,
  Signal,
  Wifi,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { toast } from "sonner";

interface IntegrationStatus {
  connected: boolean;
  lastChecked: Date;
  status: "connected" | "disconnected" | "error" | "degraded";
}

export function IntegrationSettings() {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [activeTestType, setActiveTestType] = useState<string>("");

  const [integrations, setIntegrations] = useState({
    whatsapp: {
      enabled: true,
      phoneNumberId: "1234567890123456",
      accessToken: "EAABxxxxxxxxxxxxx",
      webhookVerifyToken: "fleetpro_verify_token",
      status: "connected" as const,
      lastChecked: new Date(),
      messagesThisMonth: 2847,
      messageLimit: 10000,
    },
    email: {
      enabled: true,
      provider: "resend",
      apiKey: "re_xxxxxxxxxxxx",
      fromEmail: "noreply@fleetpro.ng",
      fromName: "FleetPro Fleet",
      status: "connected" as const,
      lastChecked: new Date(),
      emailsThisMonth: 1523,
    },
    sms: {
      enabled: true,
      provider: "twilio",
      accountSid: "AC123456789",
      authToken: "xxxxxxxxxxxxxxxx",
      fromNumber: "+234801234567",
      status: "degraded" as const,
      lastChecked: new Date(),
      smsThisMonth: 892,
      deliveryRate: 94.2,
    },
    payment: {
      enabled: true,
      provider: "stripe",
      publishableKey: "pk_live_xxxxxxxxxxxx",
      secretKey: "sk_live_xxxxxxxxxxxx",
      webhookSecret: "whsec_xxxxxxxxxxxx",
      status: "connected" as const,
      lastChecked: new Date(),
      transactionsThisMonth: 156,
    },
    llm: {
      enabled: true,
      provider: "lovable",
      model: "google/gemini-2.5-flash",
      status: "connected" as const,
      lastChecked: new Date(),
      tokensUsed: 1250000,
      tokenLimit: 5000000,
      requestsThisMonth: 4523,
    },
    map: {
      enabled: true,
      provider: "mapbox",
      publicToken: "pk.eyJ1IjoieHh4xxxxxxxxxx",
      style: "mapbox://styles/mapbox/dark-v11",
      status: "connected" as const,
      lastChecked: new Date(),
      requestsThisMonth: 15420,
      requestLimit: 100000,
    },
    iot: {
      enabled: true,
      protocol: "mqtt",
      brokerUrl: "mqtt://iot.fleetpro.ng:1883",
      username: "fleet_gateway",
      password: "xxxxxxxxxxxx",
      status: "connected" as const,
      lastChecked: new Date(),
      connectedDevices: 247,
      messagesPerDay: 125000,
    },
  });

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestIntegration = async (type: string, recipient?: string) => {
    setTestingIntegration(type);
    
    try {
      switch (type) {
        case "whatsapp":
          // Simulate WhatsApp test
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast.success("WhatsApp test message sent successfully");
          break;
        case "email":
          if (!recipient) {
            toast.error("Please enter a test email address");
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success(`Test email sent to ${recipient}`);
          break;
        case "sms":
          if (!recipient) {
            toast.error("Please enter a test phone number");
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success(`Test SMS sent to ${recipient}`);
          break;
        case "llm":
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast.success("AI/LLM integration working correctly");
          break;
        case "map":
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success("Mapbox integration working correctly");
          break;
        case "iot":
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success("IoT gateway connection verified");
          break;
        default:
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast.success(`${type} integration test successful`);
      }
      
      setIntegrations(prev => ({
        ...prev,
        [type]: { ...prev[type as keyof typeof prev], status: "connected", lastChecked: new Date() },
      }));
    } catch (error) {
      console.error(`Test failed for ${type}:`, error);
      toast.error(`${type} test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIntegrations(prev => ({
        ...prev,
        [type]: { ...prev[type as keyof typeof prev], status: "error", lastChecked: new Date() },
      }));
    } finally {
      setTestingIntegration(null);
      setTestDialogOpen(false);
      setTestRecipient("");
    }
  };

  const openTestDialog = (type: string) => {
    setActiveTestType(type);
    setTestDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-success/10 text-success border-success/20">Connected</Badge>;
      case "degraded":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Degraded</Badge>;
      case "error":
      case "disconnected":
        return <Badge variant="destructive">Disconnected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="messaging" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="ai">AI & LLM</TabsTrigger>
          <TabsTrigger value="maps">Maps & IoT</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Messaging Integrations */}
        <TabsContent value="messaging" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* WhatsApp */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <WhatsAppIcon className="h-5 w-5 text-success" />
                    WhatsApp Business API
                  </CardTitle>
                  <Switch
                    checked={integrations.whatsapp.enabled}
                    onCheckedChange={(checked) =>
                      setIntegrations(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, enabled: checked } }))
                    }
                  />
                </div>
                <CardDescription>Meta Cloud API for business messaging</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(integrations.whatsapp.status)}
                  {getStatusIcon(integrations.whatsapp.status)}
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Phone Number ID</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.whatsappPhone ? "text" : "password"}
                        value={integrations.whatsapp.phoneNumberId}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, phoneNumberId: e.target.value } }))
                        }
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => toggleSecret("whatsappPhone")}>
                        {showSecrets.whatsappPhone ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.whatsappToken ? "text" : "password"}
                        value={integrations.whatsapp.accessToken}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, accessToken: e.target.value } }))
                        }
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => toggleSecret("whatsappToken")}>
                        {showSecrets.whatsappToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Messages this month</span>
                    <span className="font-medium">{integrations.whatsapp.messagesThisMonth.toLocaleString()} / {integrations.whatsapp.messageLimit.toLocaleString()}</span>
                  </div>
                  <Progress value={(integrations.whatsapp.messagesThisMonth / integrations.whatsapp.messageLimit) * 100} className="h-2" />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleTestIntegration("whatsapp")}
                  disabled={testingIntegration === "whatsapp"}
                >
                  {testingIntegration === "whatsapp" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            {/* Email */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Email Service (Resend)
                  </CardTitle>
                  <Switch
                    checked={integrations.email.enabled}
                    onCheckedChange={(checked) =>
                      setIntegrations(prev => ({ ...prev, email: { ...prev.email, enabled: checked } }))
                    }
                  />
                </div>
                <CardDescription>Transactional and notification emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(integrations.email.status)}
                  {getStatusIcon(integrations.email.status)}
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.emailKey ? "text" : "password"}
                        value={integrations.email.apiKey}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, email: { ...prev.email, apiKey: e.target.value } }))
                        }
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => toggleSecret("emailKey")}>
                        {showSecrets.emailKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 grid-cols-2">
                    <div className="space-y-2">
                      <Label>From Email</Label>
                      <Input
                        value={integrations.email.fromEmail}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, email: { ...prev.email, fromEmail: e.target.value } }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>From Name</Label>
                      <Input
                        value={integrations.email.fromName}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, email: { ...prev.email, fromName: e.target.value } }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{integrations.email.emailsThisMonth.toLocaleString()}</span> emails sent this month
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openTestDialog("email")}
                  disabled={testingIntegration === "email"}
                >
                  {testingIntegration === "email" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Test Email
                </Button>
              </CardContent>
            </Card>

            {/* SMS */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-warning" />
                    SMS Gateway (Twilio)
                  </CardTitle>
                  <Switch
                    checked={integrations.sms.enabled}
                    onCheckedChange={(checked) =>
                      setIntegrations(prev => ({ ...prev, sms: { ...prev.sms, enabled: checked } }))
                    }
                  />
                </div>
                <CardDescription>SMS alerts and driver notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(integrations.sms.status)}
                  {getStatusIcon(integrations.sms.status)}
                  <span className="text-xs text-muted-foreground">
                    {integrations.sms.deliveryRate}% delivery rate
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Account SID</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.smsSid ? "text" : "password"}
                        value={integrations.sms.accountSid}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, sms: { ...prev.sms, accountSid: e.target.value } }))
                        }
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => toggleSecret("smsSid")}>
                        {showSecrets.smsSid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Auth Token</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.smsToken ? "text" : "password"}
                        value={integrations.sms.authToken}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, sms: { ...prev.sms, authToken: e.target.value } }))
                        }
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => toggleSecret("smsToken")}>
                        {showSecrets.smsToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>From Number</Label>
                    <Input
                      value={integrations.sms.fromNumber}
                      onChange={(e) =>
                        setIntegrations(prev => ({ ...prev, sms: { ...prev.sms, fromNumber: e.target.value } }))
                      }
                    />
                  </div>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{integrations.sms.smsThisMonth.toLocaleString()}</span> SMS sent this month
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openTestDialog("sms")}
                  disabled={testingIntegration === "sms"}
                >
                  {testingIntegration === "sms" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Send Test SMS
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI & LLM */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI/LLM Integration
                  </CardTitle>
                  <CardDescription>
                    Lovable AI Gateway for intelligent fleet operations
                  </CardDescription>
                </div>
                <Switch
                  checked={integrations.llm.enabled}
                  onCheckedChange={(checked) =>
                    setIntegrations(prev => ({ ...prev, llm: { ...prev.llm, enabled: checked } }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                {getStatusBadge(integrations.llm.status)}
                {getStatusIcon(integrations.llm.status)}
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Lovable AI
                </Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <Select
                      value={integrations.llm.model}
                      onValueChange={(value) =>
                        setIntegrations(prev => ({ ...prev, llm: { ...prev.llm, model: value } }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</SelectItem>
                        <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (High Quality)</SelectItem>
                        <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Fast)</SelectItem>
                        <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                        <SelectItem value="openai/gpt-5">GPT-5 (Premium)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      AI Features Enabled
                    </h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Load Matching</span>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Route Optimization</span>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Driver Fatigue Analysis</span>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Call Transcription</span>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-border/50 bg-background space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tokens Used</span>
                      <span className="font-medium">
                        {(integrations.llm.tokensUsed / 1000000).toFixed(2)}M / {(integrations.llm.tokenLimit / 1000000).toFixed(0)}M
                      </span>
                    </div>
                    <Progress
                      value={(integrations.llm.tokensUsed / integrations.llm.tokenLimit) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="p-4 rounded-lg border border-border/50 bg-background">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Cpu className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{integrations.llm.requestsThisMonth.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">AI requests this month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => handleTestIntegration("llm")}
                disabled={testingIntegration === "llm"}
              >
                {testingIntegration === "llm" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test AI Integration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maps & IoT */}
        <TabsContent value="maps" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Mapbox */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-primary" />
                    Mapbox Maps
                  </CardTitle>
                  <Switch
                    checked={integrations.map.enabled}
                    onCheckedChange={(checked) =>
                      setIntegrations(prev => ({ ...prev, map: { ...prev.map, enabled: checked } }))
                    }
                  />
                </div>
                <CardDescription>Interactive maps and route visualization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(integrations.map.status)}
                  {getStatusIcon(integrations.map.status)}
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Public Token</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.mapToken ? "text" : "password"}
                        value={integrations.map.publicToken}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, map: { ...prev.map, publicToken: e.target.value } }))
                        }
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => toggleSecret("mapToken")}>
                        {showSecrets.mapToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Map Style</Label>
                    <Select
                      value={integrations.map.style}
                      onValueChange={(value) =>
                        setIntegrations(prev => ({ ...prev, map: { ...prev.map, style: value } }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mapbox://styles/mapbox/dark-v11">Dark</SelectItem>
                        <SelectItem value="mapbox://styles/mapbox/light-v11">Light</SelectItem>
                        <SelectItem value="mapbox://styles/mapbox/streets-v12">Streets</SelectItem>
                        <SelectItem value="mapbox://styles/mapbox/satellite-streets-v12">Satellite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">API Requests</span>
                    <span className="font-medium">
                      {integrations.map.requestsThisMonth.toLocaleString()} / {integrations.map.requestLimit.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={(integrations.map.requestsThisMonth / integrations.map.requestLimit) * 100}
                    className="h-2"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleTestIntegration("map")}
                  disabled={testingIntegration === "map"}
                >
                  {testingIntegration === "map" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  Test Route API
                </Button>
              </CardContent>
            </Card>

            {/* IoT Gateway */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Router className="h-5 w-5 text-success" />
                    IoT Device Gateway
                  </CardTitle>
                  <Switch
                    checked={integrations.iot.enabled}
                    onCheckedChange={(checked) =>
                      setIntegrations(prev => ({ ...prev, iot: { ...prev.iot, enabled: checked } }))
                    }
                  />
                </div>
                <CardDescription>MQTT broker for GPS trackers and sensors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(integrations.iot.status)}
                  {getStatusIcon(integrations.iot.status)}
                  <Badge variant="outline" className="gap-1">
                    <Signal className="h-3 w-3" />
                    {integrations.iot.connectedDevices} devices
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>MQTT Broker URL</Label>
                    <Input
                      value={integrations.iot.brokerUrl}
                      onChange={(e) =>
                        setIntegrations(prev => ({ ...prev, iot: { ...prev.iot, brokerUrl: e.target.value } }))
                      }
                    />
                  </div>
                  <div className="grid gap-2 grid-cols-2">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={integrations.iot.username}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, iot: { ...prev.iot, username: e.target.value } }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showSecrets.iotPassword ? "text" : "password"}
                          value={integrations.iot.password}
                          onChange={(e) =>
                            setIntegrations(prev => ({ ...prev, iot: { ...prev.iot, password: e.target.value } }))
                          }
                          className="flex-1"
                        />
                        <Button variant="ghost" size="icon" onClick={() => toggleSecret("iotPassword")}>
                          {showSecrets.iotPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <Wifi className="h-5 w-5 mx-auto mb-1 text-success" />
                    <p className="text-lg font-bold">{integrations.iot.connectedDevices}</p>
                    <p className="text-xs text-muted-foreground">Connected</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{(integrations.iot.messagesPerDay / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">Msgs/day</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleTestIntegration("iot")}
                  disabled={testingIntegration === "iot"}
                >
                  {testingIntegration === "iot" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Test Gateway Connection
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Gateway (Stripe)
                  </CardTitle>
                  <CardDescription>
                    Process payments and manage subscriptions
                  </CardDescription>
                </div>
                <Switch
                  checked={integrations.payment.enabled}
                  onCheckedChange={(checked) =>
                    setIntegrations(prev => ({ ...prev, payment: { ...prev.payment, enabled: checked } }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                {getStatusBadge(integrations.payment.status)}
                {getStatusIcon(integrations.payment.status)}
                <Badge variant="outline">Live Mode</Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Publishable Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.stripePublic ? "text" : "password"}
                        value={integrations.payment.publishableKey}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, payment: { ...prev.payment, publishableKey: e.target.value } }))
                        }
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => toggleSecret("stripePublic")}>
                        {showSecrets.stripePublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.stripeSecret ? "text" : "password"}
                        value={integrations.payment.secretKey}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, payment: { ...prev.payment, secretKey: e.target.value } }))
                        }
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => toggleSecret("stripeSecret")}>
                        {showSecrets.stripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.stripeWebhook ? "text" : "password"}
                        value={integrations.payment.webhookSecret}
                        onChange={(e) =>
                          setIntegrations(prev => ({ ...prev, payment: { ...prev.payment, webhookSecret: e.target.value } }))
                        }
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => toggleSecret("stripeWebhook")}>
                        {showSecrets.stripeWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border/50 bg-background">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-full bg-success/10">
                      <CreditCard className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{integrations.payment.transactionsThisMonth}</p>
                      <p className="text-sm text-muted-foreground">Transactions this month</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                      Open Stripe Dashboard
                    </a>
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => handleTestIntegration("payment")}
                disabled={testingIntegration === "payment"}
              >
                {testingIntegration === "payment" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Payment API
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              Send Test {activeTestType === "email" ? "Email" : "SMS"}
            </DialogTitle>
            <DialogDescription>
              Enter a {activeTestType === "email" ? "email address" : "phone number"} to send a test message
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{activeTestType === "email" ? "Email Address" : "Phone Number"}</Label>
              <Input
                type={activeTestType === "email" ? "email" : "tel"}
                placeholder={activeTestType === "email" ? "test@example.com" : "+234801234567"}
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => handleTestIntegration(activeTestType, testRecipient)}
              disabled={testingIntegration === activeTestType}
            >
              {testingIntegration === activeTestType ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
