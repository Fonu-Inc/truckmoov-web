import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import type { AuthSystemSettings, SystemDefaultTimeRange, SystemSessionTimeoutMinutes } from "@truckmoov/api/auth";
import {
  getSystemSettingsQueryOptions,
  useUpdateSystemSettings,
} from "@truckmoov/api/auth";
import {
  AlertTriangle,
  Camera,
  Database,
  Globe,
  Mail,
  RefreshCw,
  Save,
  Shield,
  User as UserIcon,
} from "lucide-react";
import {
  useEffect, useRef, useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Avatar, AvatarFallback, AvatarImage,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { useAuthStore } from "@/stores/authStore";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";

/**
 * `/settings` — TRU-FE-7 § A (General).
 *
 * PATCH is section-wise per spec: each Save button sends only its section.
 * ponytail: kept Security card as display-only until § C lands the real form.
 * ponytail: My Profile still local-only until PATCH /me ships.
 */

// TRU-FE-7 § A — the six documented keys.
const DEFAULT_TIME_RANGES: Array<{ value: SystemDefaultTimeRange, label: string }> = [
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "this_year", label: "This year" },
];

const displayPreferencesSchema = z.object({
  timezone: z.string().min(1),
  defaultTimeRange: z.enum(["today", "last_7_days", "last_30_days", "last_90_days", "this_month", "this_year"]),
});

// TRU-FE-7 § A — no `enableBetaFeatures` toggle on the page (placebo per spec).
const platformFeaturesSchema = z.object({
  allowNewTenantRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
});

const dataRetentionSchema = z.object({
  gpsDataRetentionDays: z.enum(["90", "180", "365", "730"]),
  logRetentionDays: z.enum(["7", "30", "90"]),
  backupFrequency: z.enum(["hourly", "daily", "weekly"]),
});

// TRU-FE-7 § C — enforced on every token refresh; only these five values accepted.
const securitySchema = z.object({
  requireTwoFactor: z.boolean(),
  sessionTimeoutMinutes: z.enum(["15", "30", "60", "120", "480"]),
  auditLogging: z.boolean(),
});

const supportEmailSchema = z.object({
  supportEmail: z.string().email(),
});

type DisplayPreferencesFormValues = z.infer<typeof displayPreferencesSchema>;
type PlatformFeaturesFormValues = z.infer<typeof platformFeaturesSchema>;
type DataRetentionFormValues = z.infer<typeof dataRetentionSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;
type SupportEmailFormValues = z.infer<typeof supportEmailSchema>;

const DISPLAY_PREFERENCES_FORM_ID = "display-preferences-form";
const PLATFORM_FEATURES_FORM_ID = "platform-features-form";
const DATA_RETENTION_FORM_ID = "data-retention-form";
const SECURITY_FORM_ID = "security-form";
const SUPPORT_EMAIL_FORM_ID = "support-email-form";

const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferencesFormValues = {
  timezone: "Africa/Lagos",
  defaultTimeRange: "last_7_days",
};
const DEFAULT_PLATFORM_FEATURES: PlatformFeaturesFormValues = {
  allowNewTenantRegistration: true,
  maintenanceMode: false,
};
const DEFAULT_DATA_RETENTION: DataRetentionFormValues = {
  gpsDataRetentionDays: "365",
  logRetentionDays: "30",
  backupFrequency: "daily",
};

const DEFAULT_SECURITY: SecurityFormValues = {
  requireTwoFactor: false,
  sessionTimeoutMinutes: "30",
  auditLogging: true,
};

function useSectionMutation() {
  return useUpdateSystemSettings();
}

export default function GeneralSettingsPage() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const systemSettings = systemSettingsQuery.data?.data as AuthSystemSettings | undefined;
  const updateDisplayPreferences = useSectionMutation();
  const updatePlatformFeatures = useSectionMutation();
  const updateDataRetention = useSectionMutation();
  const updateSecurity = useSectionMutation();
  const updateSupportEmail = useSectionMutation();

  // ponytail: My Profile is local state until PATCH /me lands.
  const user = useAuthStore(s => s.user);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ponytail: Response Time Commitment isn't in the API, local-only.
  const [responseTime, setResponseTime] = useState("24");

  const displayPreferencesForm = useForm<DisplayPreferencesFormValues>({
    resolver: zodResolver(displayPreferencesSchema),
    defaultValues: DEFAULT_DISPLAY_PREFERENCES,
  });
  const platformFeaturesForm = useForm<PlatformFeaturesFormValues>({
    resolver: zodResolver(platformFeaturesSchema),
    defaultValues: DEFAULT_PLATFORM_FEATURES,
  });
  const dataRetentionForm = useForm<DataRetentionFormValues>({
    resolver: zodResolver(dataRetentionSchema),
    defaultValues: DEFAULT_DATA_RETENTION,
  });
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: DEFAULT_SECURITY,
  });
  const supportEmailForm = useForm<SupportEmailFormValues>({
    resolver: zodResolver(supportEmailSchema),
    defaultValues: { supportEmail: "" },
  });

  useEffect(
    () => {
      if (!systemSettings)
        return;
      displayPreferencesForm.reset({
        timezone: systemSettings.defaults?.timezone ?? DEFAULT_DISPLAY_PREFERENCES.timezone,
        defaultTimeRange:
          (DEFAULT_TIME_RANGES.some(r => r.value === systemSettings.defaults?.defaultTimeRange)
            ? systemSettings.defaults?.defaultTimeRange
            : DEFAULT_DISPLAY_PREFERENCES.defaultTimeRange) as SystemDefaultTimeRange,
      });
      platformFeaturesForm.reset({
        allowNewTenantRegistration:
          systemSettings.features?.allowNewTenantRegistration
          ?? DEFAULT_PLATFORM_FEATURES.allowNewTenantRegistration,
        maintenanceMode:
          systemSettings.features?.maintenanceMode
          ?? DEFAULT_PLATFORM_FEATURES.maintenanceMode,
      });
      dataRetentionForm.reset({
        gpsDataRetentionDays: dataRetentionSchema.shape.gpsDataRetentionDays.safeParse(
          String(systemSettings.retention?.gpsDataRetentionDays),
        ).success
          ? String(systemSettings.retention?.gpsDataRetentionDays) as DataRetentionFormValues["gpsDataRetentionDays"]
          : DEFAULT_DATA_RETENTION.gpsDataRetentionDays,
        logRetentionDays: dataRetentionSchema.shape.logRetentionDays.safeParse(
          String(systemSettings.retention?.logRetentionDays),
        ).success
          ? String(systemSettings.retention?.logRetentionDays) as DataRetentionFormValues["logRetentionDays"]
          : DEFAULT_DATA_RETENTION.logRetentionDays,
        backupFrequency: dataRetentionSchema.shape.backupFrequency.safeParse(
          systemSettings.retention?.backupFrequency,
        ).success
          ? systemSettings.retention?.backupFrequency as DataRetentionFormValues["backupFrequency"]
          : DEFAULT_DATA_RETENTION.backupFrequency,
      });
      securityForm.reset({
        requireTwoFactor: systemSettings.security?.requireTwoFactor ?? DEFAULT_SECURITY.requireTwoFactor,
        sessionTimeoutMinutes: securitySchema.shape.sessionTimeoutMinutes.safeParse(
          String(systemSettings.security?.sessionTimeoutMinutes),
        ).success
          ? String(systemSettings.security?.sessionTimeoutMinutes) as SecurityFormValues["sessionTimeoutMinutes"]
          : DEFAULT_SECURITY.sessionTimeoutMinutes,
        auditLogging: systemSettings.security?.auditLogging ?? DEFAULT_SECURITY.auditLogging,
      });
      supportEmailForm.reset({ supportEmail: systemSettings.supportEmail ?? "" });
    },
    [
      systemSettings,
      displayPreferencesForm,
      platformFeaturesForm,
      dataRetentionForm,
      securityForm,
      supportEmailForm,
    ],
  );

  // TRU-FE-7 § A — section-wise PATCH. Each save sends only the section it owns.
  const handleSaveDisplayPreferences = (values: DisplayPreferencesFormValues) => {
    updateDisplayPreferences.mutate(
      { data: { defaults: { ...(systemSettings?.defaults ?? {}), ...values } } },
      {
        onSuccess: () => toast.success("Display preferences saved"),
        onError: error => toast.error(error.message),
      },
    );
  };
  const handleSavePlatformFeatures = (values: PlatformFeaturesFormValues) => {
    updatePlatformFeatures.mutate(
      { data: { features: { ...(systemSettings?.features ?? {}), ...values } } },
      {
        onSuccess: () => toast.success("Platform features saved"),
        onError: error => toast.error(error.message),
      },
    );
  };
  const handleSaveDataRetention = (values: DataRetentionFormValues) => {
    updateDataRetention.mutate(
      {
        data: {
          retention: {
            gpsDataRetentionDays: Number(values.gpsDataRetentionDays),
            logRetentionDays: Number(values.logRetentionDays),
            backupFrequency: values.backupFrequency,
          },
        },
      },
      {
        onSuccess: () => toast.success("Data retention settings saved"),
        onError: error => toast.error(error.message),
      },
    );
  };
  const handleSaveSecurity = (values: SecurityFormValues) => {
    updateSecurity.mutate(
      {
        data: {
          security: {
            requireTwoFactor: values.requireTwoFactor,
            sessionTimeoutMinutes: Number(values.sessionTimeoutMinutes) as SystemSessionTimeoutMinutes,
            auditLogging: values.auditLogging,
          },
        },
      },
      {
        onSuccess: () => toast.success("Security settings saved"),
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleSaveSupportEmail = (values: SupportEmailFormValues) => {
    updateSupportEmail.mutate(
      { data: { supportEmail: values.supportEmail } },
      {
        onSuccess: () => toast.success("Support email saved"),
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* My Profile — ponytail: local state only; wire when PATCH /me ships. */}
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
                <AvatarImage
                  src={profileAvatar}
                  alt={profileName}
                />
                <AvatarFallback className="text-lg">
                  {(profileName || user?.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:opacity-90"
                aria-label="Change avatar"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file)
                    setProfileAvatar(URL.createObjectURL(file));
                }}
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
                onChange={e => setProfileName(e.target.value)}
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
                onChange={e => setProfilePhone(e.target.value)}
                placeholder="+234..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => toast.info("Backend endpoint pending — profile not persisted")}>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Display Preferences
          </CardTitle>
          <CardDescription>
            Centralised time and date defaults used across the platform&apos;s charts, tables, and reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...displayPreferencesForm}>
            <form
              id={DISPLAY_PREFERENCES_FORM_ID}
              onSubmit={displayPreferencesForm.handleSubmit(handleSaveDisplayPreferences)}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={displayPreferencesForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Timezone</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                          <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={displayPreferencesForm.control}
                  name="defaultTimeRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Time Range</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEFAULT_TIME_RANGES.map(r => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  form={DISPLAY_PREFERENCES_FORM_ID}
                  disabled={updateDisplayPreferences.isPending}
                >
                  {updateDisplayPreferences.isPending
                    ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    : <><Save className="h-4 w-4 mr-2" />Save Preferences</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Platform Features — ponytail: Beta toggle removed per spec § A (placebo). */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Platform Features
          </CardTitle>
          <CardDescription>Toggle platform-wide capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...platformFeaturesForm}>
            <form
              id={PLATFORM_FEATURES_FORM_ID}
              onSubmit={platformFeaturesForm.handleSubmit(handleSavePlatformFeatures)}
              className="space-y-4"
            >
              <FormField
                control={platformFeaturesForm.control}
                name="allowNewTenantRegistration"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Allow New Tenant Registration</FormLabel>
                      <p className="text-sm text-muted-foreground">Enable self-service tenant onboarding</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={platformFeaturesForm.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Maintenance Mode</FormLabel>
                      <p className="text-sm text-muted-foreground">Temporarily disable platform access</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  form={PLATFORM_FEATURES_FORM_ID}
                  disabled={updatePlatformFeatures.isPending}
                >
                  {updatePlatformFeatures.isPending
                    ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    : <><Save className="h-4 w-4 mr-2" />Save Features</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Security Settings — TRU-FE-7 § C. Enforced on every token refresh. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Settings
          </CardTitle>
          <CardDescription>Platform security and access control settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...securityForm}>
            <form
              id={SECURITY_FORM_ID}
              onSubmit={securityForm.handleSubmit(handleSaveSecurity)}
              className="space-y-4"
            >
              <FormField
                control={securityForm.control}
                name="requireTwoFactor"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Two-Factor Authentication</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for all admin accounts. Admins who haven&apos;t enrolled are prompted at next login (not locked out).
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={securityForm.control}
                name="sessionTimeoutMinutes"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Session Timeout</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Checked on every token refresh. Past this window the session is destroyed and the admin is signed out for inactivity.
                      </p>
                    </div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={securityForm.control}
                name="auditLogging"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Audit Logging</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Log all administrative actions. The setting change that turns this off is always recorded.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  form={SECURITY_FORM_ID}
                  disabled={updateSecurity.isPending}
                >
                  {updateSecurity.isPending
                    ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    : <><Save className="h-4 w-4 mr-2" />Save Security</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Data Retention — spec § A: no enforcement job runs off these yet (TD-6). */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Data Retention
              </CardTitle>
              <CardDescription>Configure how long data is retained in the system</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 text-warning border-warning/40 shrink-0">
              <AlertTriangle className="h-3 w-3" />
              Not yet enforced
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Values are saved but no sweep, deletion or backup job is currently keyed off them.
          </p>
          <Form {...dataRetentionForm}>
            <form
              id={DATA_RETENTION_FORM_ID}
              onSubmit={dataRetentionForm.handleSubmit(handleSaveDataRetention)}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={dataRetentionForm.control}
                  name="gpsDataRetentionDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GPS Data Retention</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="90">90 Days</SelectItem>
                          <SelectItem value="180">180 Days</SelectItem>
                          <SelectItem value="365">1 Year</SelectItem>
                          <SelectItem value="730">2 Years</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dataRetentionForm.control}
                  name="logRetentionDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Log Retention</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dataRetentionForm.control}
                  name="backupFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Backup Frequency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  form={DATA_RETENTION_FORM_ID}
                  disabled={updateDataRetention.isPending}
                >
                  {updateDataRetention.isPending
                    ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    : <><Save className="h-4 w-4 mr-2" />Save Retention</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Support Email — ponytail: Response Time is not on the API, stays local for now. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Support Email
          </CardTitle>
          <CardDescription>Email address tenants use to reach platform support</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...supportEmailForm}>
            <form
              id={SUPPORT_EMAIL_FORM_ID}
              onSubmit={supportEmailForm.handleSubmit(handleSaveSupportEmail)}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={supportEmailForm.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="support@truckmoov.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label>Response Time Commitment</Label>
                  <Select value={responseTime} onValueChange={setResponseTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">Within 4 hours</SelectItem>
                      <SelectItem value="24">Within 24 hours</SelectItem>
                      <SelectItem value="48">Within 48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Local only until the API exposes a response-time field.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  form={SUPPORT_EMAIL_FORM_ID}
                  disabled={updateSupportEmail.isPending}
                >
                  {updateSupportEmail.isPending
                    ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    : <><Save className="h-4 w-4 mr-2" />Save Support Settings</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
