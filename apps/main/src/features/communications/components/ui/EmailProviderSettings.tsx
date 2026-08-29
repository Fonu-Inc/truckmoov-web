import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Send,
  Settings,
  Shield,
  TestTube,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  RadioGroup, RadioGroupItem,
} from "@/components/shadcn/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";

type EmailProvider = "sendgrid" | "aws_ses" | "resend" | "none";

type ProviderConfig = {
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  aws_ses: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    fromEmail: string;
    fromName: string;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
};

export function EmailProviderSettings() {
  const [
    activeProvider,
    setActiveProvider,
  ] = useState<EmailProvider>("resend");
  const [
    isConnected,
    setIsConnected,
  ] = useState(true);
  const [
    isTesting,
    setIsTesting,
  ] = useState(false);
  const [
    isSaving,
    setIsSaving,
  ] = useState(false);
  const [
    showSecrets,
    setShowSecrets,
  ] = useState<Record<string, boolean>>({});
  const [
    testDialogOpen,
    setTestDialogOpen,
  ] = useState(false);
  const [
    testEmail,
    setTestEmail,
  ] = useState("");

  const [
    config,
    setConfig,
  ] = useState<ProviderConfig>({
    sendgrid: {
      apiKey: "",
      fromEmail: "notifications@fleetpro.ng",
      fromName: "FleetPro Notifications",
    },
    aws_ses: {
      accessKeyId: "",
      secretAccessKey: "",
      region: "eu-west-1",
      fromEmail: "notifications@fleetpro.ng",
      fromName: "FleetPro Notifications",
    },
    resend: {
      apiKey: "re_••••••••••••",
      fromEmail: "notifications@resend.dev",
      fromName: "FleetPro Notifications",
    },
  });

  const [
    notificationSettings,
    setNotificationSettings,
  ] = useState({
    budgetAlerts: true,
    securityAlerts: true,
    jobNotifications: true,
    driverAlerts: true,
    systemReports: false,
  });

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({
      ...prev, [key]: !prev[key],
    }));
  };

  const handleTestConnection = async () => {
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }

    setIsTesting(true);
    // Simulate API call
    setTimeout(
      () => {
        setIsTesting(false);
        setTestDialogOpen(false);
        toast.success(`Test email sent to ${testEmail}`);
      },
      2000,
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(
      () => {
        setIsSaving(false);
        setIsConnected(true);
        toast.success("Email provider settings saved");
      },
      1500,
    );
  };

  const providers = [
    {
      id: "resend" as const,
      name: "Resend",
      description: "Modern email API for developers",
      logo: "📧",
      recommended: true,
    },
    {
      id: "sendgrid" as const,
      name: "SendGrid",
      description: "Twilio's email delivery platform",
      logo: "📨",
    },
    {
      id: "aws_ses" as const,
      name: "AWS SES",
      description: "Amazon Simple Email Service",
      logo: "☁️",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Provider
              </CardTitle>
              <CardDescription>
                Configure your email service provider for sending notifications
              </CardDescription>
            </div>
            {isConnected && activeProvider !== "none" && (
              <Badge className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={activeProvider}
            onValueChange={value => setActiveProvider(value as EmailProvider)}
            className="grid gap-4 md:grid-cols-3"
          >
            {providers.map(provider => (
              <div
                key={provider.id}
                className="relative"
              >
                <RadioGroupItem
                  value={provider.id}
                  id={provider.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={provider.id}
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-border bg-card p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                >
                  <div className="text-3xl mb-2">{provider.logo}</div>
                  <div className="text-center">
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                  </div>
                  {provider.recommended && (
                    <Badge
                      variant="secondary"
                      className="mt-2 text-xs"
                    >
                      Recommended
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Separator />

          {/* Provider-specific configuration */}
          {activeProvider === "sendgrid" && (
            <div className="space-y-4">
              <h4 className="font-medium">SendGrid Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>API Key</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets.sendgridApiKey ? "text" : "password"}
                      value={config.sendgrid.apiKey}
                      onChange={e =>
                        setConfig({
                          ...config,
                          sendgrid: {
                            ...config.sendgrid, apiKey: e.target.value,
                          },
                        })}
                      placeholder="SG.xxxxxxxxxxxxxxxxxxxx"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => toggleShowSecret("sendgridApiKey")}
                    >
                      {showSecrets.sendgridApiKey
                        ? (
                            <EyeOff className="h-4 w-4" />
                          )
                        : (
                            <Eye className="h-4 w-4" />
                          )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your API key from
                    {" "}
                    <a
                      href="https://app.sendgrid.com/settings/api_keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      SendGrid Dashboard
                    </a>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    value={config.sendgrid.fromEmail}
                    onChange={e =>
                      setConfig({
                        ...config,
                        sendgrid: {
                          ...config.sendgrid, fromEmail: e.target.value,
                        },
                      })}
                    placeholder="notifications@yourdomain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={config.sendgrid.fromName}
                    onChange={e =>
                      setConfig({
                        ...config,
                        sendgrid: {
                          ...config.sendgrid, fromName: e.target.value,
                        },
                      })}
                    placeholder="FleetPro Notifications"
                  />
                </div>
              </div>
            </div>
          )}

          {activeProvider === "aws_ses" && (
            <div className="space-y-4">
              <h4 className="font-medium">AWS SES Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Access Key ID</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets.awsAccessKey ? "text" : "password"}
                      value={config.aws_ses.accessKeyId}
                      onChange={e =>
                        setConfig({
                          ...config,
                          aws_ses: {
                            ...config.aws_ses, accessKeyId: e.target.value,
                          },
                        })}
                      placeholder="AKIAXXXXXXXXXXXXXXXXX"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => toggleShowSecret("awsAccessKey")}
                    >
                      {showSecrets.awsAccessKey
                        ? (
                            <EyeOff className="h-4 w-4" />
                          )
                        : (
                            <Eye className="h-4 w-4" />
                          )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secret Access Key</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets.awsSecretKey ? "text" : "password"}
                      value={config.aws_ses.secretAccessKey}
                      onChange={e =>
                        setConfig({
                          ...config,
                          aws_ses: {
                            ...config.aws_ses, secretAccessKey: e.target.value,
                          },
                        })}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => toggleShowSecret("awsSecretKey")}
                    >
                      {showSecrets.awsSecretKey
                        ? (
                            <EyeOff className="h-4 w-4" />
                          )
                        : (
                            <Eye className="h-4 w-4" />
                          )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={config.aws_ses.region}
                    onValueChange={value =>
                      setConfig({
                        ...config,
                        aws_ses: {
                          ...config.aws_ses, region: value,
                        },
                      })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                      <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                      <SelectItem value="eu-central-1">EU (Frankfurt)</SelectItem>
                      <SelectItem value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
                      <SelectItem value="af-south-1">Africa (Cape Town)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    value={config.aws_ses.fromEmail}
                    onChange={e =>
                      setConfig({
                        ...config,
                        aws_ses: {
                          ...config.aws_ses, fromEmail: e.target.value,
                        },
                      })}
                    placeholder="notifications@yourdomain.com"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>Make sure your sending domain is verified in AWS SES</span>
              </div>
            </div>
          )}

          {activeProvider === "resend" && (
            <div className="space-y-4">
              <h4 className="font-medium">Resend Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>API Key</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets.resendApiKey ? "text" : "password"}
                      value={config.resend.apiKey}
                      onChange={e =>
                        setConfig({
                          ...config,
                          resend: {
                            ...config.resend, apiKey: e.target.value,
                          },
                        })}
                      placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => toggleShowSecret("resendApiKey")}
                    >
                      {showSecrets.resendApiKey
                        ? (
                            <EyeOff className="h-4 w-4" />
                          )
                        : (
                            <Eye className="h-4 w-4" />
                          )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your API key from
                    {" "}
                    <a
                      href="https://resend.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Resend Dashboard
                    </a>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    value={config.resend.fromEmail}
                    onChange={e =>
                      setConfig({
                        ...config,
                        resend: {
                          ...config.resend, fromEmail: e.target.value,
                        },
                      })}
                    placeholder="notifications@yourdomain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={config.resend.fromName}
                    onChange={e =>
                      setConfig({
                        ...config,
                        resend: {
                          ...config.resend, fromName: e.target.value,
                        },
                      })}
                    placeholder="FleetPro Notifications"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>API keys are encrypted and stored securely</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setTestDialogOpen(true)}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>
            <Button
              variant="gradient"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )
                : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which notifications to send via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              key: "budgetAlerts", label: "Budget Alerts", description: "Telephony budget threshold notifications",
            },
            {
              key: "securityAlerts", label: "Security Alerts", description: "IP blocking and suspicious activity alerts",
            },
            {
              key: "jobNotifications", label: "Job Notifications", description: "Job assignment and completion updates",
            },
            {
              key: "driverAlerts", label: "Driver Alerts", description: "SOS signals and driver status updates",
            },
            {
              key: "systemReports", label: "System Reports", description: "Daily/weekly summary reports",
            },
          ].map(item => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
            >
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                onCheckedChange={checked =>
                  setNotificationSettings(prev => ({
                    ...prev, [item.key]: checked,
                  }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Test Email Dialog */}
      <Dialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify your configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setTestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting
                ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )
                : (
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
