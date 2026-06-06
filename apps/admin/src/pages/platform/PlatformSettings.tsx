import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar";
import { useAuthStore } from "@/stores/authStore";
import { Camera, User as UserIcon } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Separator } from "@/components/shadcn/separator";
import { Badge } from "@/components/shadcn/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
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
import { PlanPricingManager } from "@/components/platform/PlanPricingManager";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { TIMEZONES, type Timezone } from "@/lib/timezone";
import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";

const DATE_RANGE_OPTIONS: Record<ChartDateRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
};

export default function PlatformSettings() {
  const [saving, setSaving] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { timezone, setTimezone, defaultDateRange, setDefaultDateRange } = usePreferences();

  const user = useAuthStore((s) => s.user);
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? "");
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(user?.avatar);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name ?? "");
      setProfilePhone(user.phone ?? "");
      setProfileAvatar(user.avatar);
    }
  }, [user?.id]);

  const handleAvatarPick = () => fileInputRef.current?.click();
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setProfileAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    toast.info('Coming soon');
    return;
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved successfully");
    }, 1000);
  };

  return (
    <DashboardLayout
      title="Platform Settings"
      subtitle="Configure global platform settings and integrations"
    >
      <Tabs defaultValue="general" className="space-y-6">
        <div className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-center gap-1 p-1">
            <TabsTrigger value="general" className="px-2.5 py-1 text-xs">General</TabsTrigger>
            <TabsTrigger value="team" className="px-2.5 py-1 text-xs">Team</TabsTrigger>
            <TabsTrigger value="ai-providers" className="px-2.5 py-1 text-xs">AI</TabsTrigger>
            <TabsTrigger value="integrations" className="px-2.5 py-1 text-xs">Integrations</TabsTrigger>
            <TabsTrigger value="api-governance" className="px-2.5 py-1 text-xs">API Governance</TabsTrigger>
            <TabsTrigger value="whatsapp" className="px-2.5 py-1 text-xs">WhatsApp</TabsTrigger>
            <TabsTrigger value="webhooks" className="px-2.5 py-1 text-xs">Webhooks</TabsTrigger>
            <TabsTrigger value="kyc-review" className="px-2.5 py-1 text-xs">KYC Review</TabsTrigger>
            <TabsTrigger value="telephony" className="px-2.5 py-1 text-xs">Telephony</TabsTrigger>
            <TabsTrigger value="notifications" className="px-2.5 py-1 text-xs">Notifications</TabsTrigger>
            <TabsTrigger value="security" className="px-2.5 py-1 text-xs">Security</TabsTrigger>
            <TabsTrigger value="service-tiers" className="px-2.5 py-1 text-xs">Service Tiers</TabsTrigger>
            <TabsTrigger value="billing" className="px-2.5 py-1 text-xs">Billing</TabsTrigger>
            <TabsTrigger value="api" className="px-2.5 py-1 text-xs">API</TabsTrigger>
            <TabsTrigger value="feature-flags" className="px-2.5 py-1 text-xs">Feature Flags</TabsTrigger>
            <TabsTrigger value="upgrades" className="px-2.5 py-1 text-xs">Upgrades</TabsTrigger>
          </TabsList>
        </div>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          {/* Admin Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                My Profile
              </CardTitle>
              <CardDescription>
                Update your name, contact details, and profile photo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileAvatar} alt={profileName} />
                    <AvatarFallback className="text-lg">
                      {(profileName || user?.email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={handleAvatarPick}
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:opacity-90"
                    aria-label="Change avatar"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p className="font-medium">{profileName || "Platform Admin"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {user?.role && (
                    <Badge variant="outline" className="mt-1 capitalize">
                      {user.role.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Full Name</Label>
                  <Input
                    id="profileName"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileEmail">Email</Label>
                  <Input id="profileEmail" value={user?.email ?? ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profilePhone">Phone</Label>
                  <Input
                    id="profilePhone"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+234..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Save Profile</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Display Preferences
              </CardTitle>
              <CardDescription>
                Centralized time and date defaults. These become the default filters for charts,
                tables, and reports across the platform. Users can still override locally on a
                per-view basis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Timezone</Label>
                  <Select value={timezone} onValueChange={(v) => setTimezone(v as Timezone)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIMEZONES).map(([code, tz]) => (
                        <SelectItem key={code} value={code}>
                          {tz.name} ({tz.offset})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Time Range</Label>
                  <Select
                    value={defaultDateRange}
                    onValueChange={(v) => setDefaultDateRange(v as ChartDateRange)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DATE_RANGE_OPTIONS).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <Input id="platformName" defaultValue="FleetPro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" type="email" defaultValue="support@fleetpro.com" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Billing Configuration
              </CardTitle>
              <CardDescription>
                Set the global default currency. All financial data across the platform — charts,
                tables, invoices, and analytics — will reflect this selection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Platform Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCIES).map(([code, c]) => (
                        <SelectItem key={code} value={code}>
                          {c.symbol} {c.code} — {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Currently active: <span className="font-medium">{CURRENCIES[currency].name}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <PlanPricingManager />
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

      </Tabs>
    </DashboardLayout>
  );
}



