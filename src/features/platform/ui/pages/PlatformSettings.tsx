import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Database,
  Zap,
  Mail,
  MessageSquare,
  CreditCard,
  Server,
  Key,
  Users,
  Building2,
  Save,
  RefreshCw,
  Phone,
  FileCheck,
  Wallet,
  Bot,
  Link2,
  Layers,
} from "lucide-react";
import { TelephonySettings } from "@/components/platform/TelephonySettings";
import { IntegrationSettings } from "@/components/platform/IntegrationSettings";
import { WebhookManagement } from "@/components/platform/WebhookManagement";
import { KYCReviewWorkflow } from "@/components/platform/KYCReviewWorkflow";
import { CommunicationPricing } from "@/components/platform/CommunicationPricing";
import { TenantWalletManagement } from "@/components/platform/TenantWalletManagement";
import { WalletTransactionHistory } from "@/components/platform/WalletTransactionHistory";
import { PlatformTeamManagement } from "@/components/platform/PlatformTeamManagement";
import { WhatsAppAssistPanel } from "@/components/platform/WhatsAppAssistPanel";
import { WhatsAppHealthDashboard } from "@/components/platform/WhatsAppHealthDashboard";
import { PlatformAISettings } from "@/components/platform/PlatformAISettings";
import { IntegrationsGovernance } from "@/components/platform/IntegrationsGovernance";
import { TieredServicesManager } from "@/components/platform/TieredServicesManager";
import { PhoneNumberManagement } from "@/components/platform/PhoneNumberManagement";
import { SenderIdApprovalQueue } from "@/components/platform/SenderIdApprovalQueue";
import { FeatureFlagsPanel } from "@/components/platform/FeatureFlagsPanel";
import { OrgUpgradeQueue } from "@/components/platform/OrgUpgradeQueue";
import { toast } from "sonner";

export default function PlatformSettings() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved successfully");
    }, 1000);
  };

  return (
    <>
      <Tabs defaultValue="general" className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto flex-wrap gap-1 p-1 lg:flex-nowrap">
            <TabsTrigger value="general" className="shrink-0">General</TabsTrigger>
            <TabsTrigger value="team" className="shrink-0">Team</TabsTrigger>
            <TabsTrigger value="ai-providers" className="shrink-0">AI</TabsTrigger>
            <TabsTrigger value="integrations" className="shrink-0">Integrations</TabsTrigger>
            <TabsTrigger value="api-governance" className="shrink-0">API Governance</TabsTrigger>
            <TabsTrigger value="whatsapp" className="shrink-0">WhatsApp</TabsTrigger>
            <TabsTrigger value="webhooks" className="shrink-0">Webhooks</TabsTrigger>
            <TabsTrigger value="kyc-review" className="shrink-0">KYC Review</TabsTrigger>
            <TabsTrigger value="telephony" className="shrink-0">Telephony</TabsTrigger>
            <TabsTrigger value="notifications" className="shrink-0">Notifications</TabsTrigger>
            <TabsTrigger value="security" className="shrink-0">Security</TabsTrigger>
            <TabsTrigger value="service-tiers" className="shrink-0">Service Tiers</TabsTrigger>
            <TabsTrigger value="billing" className="shrink-0">Billing</TabsTrigger>
            <TabsTrigger value="api" className="shrink-0">API</TabsTrigger>
            <TabsTrigger value="feature-flags" className="shrink-0">Feature Flags</TabsTrigger>
            <TabsTrigger value="upgrades" className="shrink-0">Upgrades</TabsTrigger>
          </TabsList>
        </div>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Platform Configuration
              </CardTitle>
              <CardDescription>
                General settings for the fleet management platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input id="platformName" defaultValue="Truckmoov" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" type="email" defaultValue="support@truckmoov.com" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select defaultValue="africa/lagos">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="africa/lagos">Africa/Lagos (WAT, GMT+1)</SelectItem>
                      <SelectItem value="africa/johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="europe/london">Europe/London</SelectItem>
                      <SelectItem value="america/new_york">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ha">Hausa</SelectItem>
                      <SelectItem value="yo">Yoruba</SelectItem>
                      <SelectItem value="ig">Igbo</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Platform Features</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow New Tenant Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable self-service tenant onboarding
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable platform access
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Beta Features</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow access to experimental features
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Data Retention
              </CardTitle>
              <CardDescription>
                Configure how long data is retained in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>GPS Data Retention</Label>
                  <Select defaultValue="365">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 Days</SelectItem>
                      <SelectItem value="180">180 Days</SelectItem>
                      <SelectItem value="365">1 Year</SelectItem>
                      <SelectItem value="730">2 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Log Retention</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Team */}
        <TabsContent value="team" className="space-y-6">
          <PlatformTeamManagement />
        </TabsContent>

        {/* AI Providers */}
        <TabsContent value="ai-providers" className="space-y-6">
          <PlatformAISettings />
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <IntegrationSettings />
        </TabsContent>

        {/* API Governance - Platform SuperAdmin Controls */}
        <TabsContent value="api-governance" className="space-y-6">
          <IntegrationsGovernance />
        </TabsContent>

        {/* WhatsApp Assist & Health */}
        <TabsContent value="whatsapp" className="space-y-6">
          <WhatsAppAssistPanel />
          <WhatsAppHealthDashboard />
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <WebhookManagement />
        </TabsContent>

        {/* KYC Review Workflow */}
        <TabsContent value="kyc-review" className="space-y-6">
          <KYCReviewWorkflow />
        </TabsContent>

        {/* Telephony Settings */}
        <TabsContent value="telephony" className="space-y-6">
          <TelephonySettings />
          <PhoneNumberManagement />
          <SenderIdApprovalQueue />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure platform-wide notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Admin Alerts</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Tenant Signup</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when a new tenant registers
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>System Errors</Label>
                      <p className="text-sm text-muted-foreground">
                        Critical system error notifications
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Billing Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Failed payments and billing issues
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Suspicious activity and security events
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notification Channels</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <Switch id="email-notif" defaultChecked />
                    <Label htmlFor="email-notif">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="sms-notif" defaultChecked />
                    <Label htmlFor="sms-notif">SMS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="slack-notif" />
                    <Label htmlFor="slack-notif">Slack</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Platform security and access control settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically logout after inactivity
                    </p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>IP Whitelisting</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict access to specific IP addresses
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all administrative actions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Password Policy</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Minimum Length</Label>
                    <Select defaultValue="12">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8 characters</SelectItem>
                        <SelectItem value="10">10 characters</SelectItem>
                        <SelectItem value="12">12 characters</SelectItem>
                        <SelectItem value="16">16 characters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Password Expiry</Label>
                    <Select defaultValue="90">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Tiers - Tiered Subscription Plans */}
        <TabsContent value="service-tiers" className="space-y-6">
          <TieredServicesManager />
        </TabsContent>

        {/* Billing - Wallet & Usage-Based Billing */}
        <TabsContent value="billing" className="space-y-6">
          <CommunicationPricing />
          <TenantWalletManagement />
          <WalletTransactionHistory />
        </TabsContent>

        {/* API */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Manage API keys and rate limiting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Public API</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow external API access
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Rate Limit (requests/minute)</Label>
                  <Select defaultValue="100">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 requests/min</SelectItem>
                      <SelectItem value="100">100 requests/min</SelectItem>
                      <SelectItem value="500">500 requests/min</SelectItem>
                      <SelectItem value="1000">1000 requests/min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Webhook Configuration</h4>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input placeholder="https://your-server.com/webhooks" />
                </div>
                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="flex gap-2">
                    <Input defaultValue="whsec_••••••••••••••••" type="password" className="flex-1" />
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="feature-flags" className="space-y-6">
          <FeatureFlagsPanel />
        </TabsContent>

        {/* Upgrades */}
        <TabsContent value="upgrades" className="space-y-6">
          <OrgUpgradeQueue />
        </TabsContent>

        {/* <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div> */}
      </Tabs>
    </>
  );
}
