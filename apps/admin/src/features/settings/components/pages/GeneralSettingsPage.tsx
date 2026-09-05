import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemSettingsQueryOptions,
  useUpdateSystemSettings,
} from "@truckmoov/api/auth";
import {
  Camera,
  Database,
  Globe,
  Mail,
  RefreshCw,
  Save,
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
import { useAuthStore } from "@/stores/authStore";

/**
 * `/settings` — matches fleetflow's General tab card layout:
 * My Profile / Display Preferences / Platform Features / Data Retention / Support Email.
 *
 * ponytail: Profile, Display Preferences, and Support Email are unwired local
 * state to match fleetflow's shape. Wire when the API exposes user profile
 * updates + user preference storage + platform support email endpoint.
 * Platform Features + Data Retention keep their real @truckmoov/api wiring.
 */

const platformFeaturesSchema = z.object({
  allowNewTenantRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
  enableBetaFeatures: z.boolean(),
});

const dataRetentionSchema = z.object({
  gpsDataRetentionDays: z.enum([
    "90",
    "180",
    "365",
    "730",
  ]),
  logRetentionDays: z.enum([
    "7",
    "30",
    "90",
  ]),
  backupFrequency: z.enum([
    "hourly",
    "daily",
    "weekly",
  ]),
});

type PlatformFeaturesFormValues = z.infer<typeof platformFeaturesSchema>;
type DataRetentionFormValues = z.infer<typeof dataRetentionSchema>;

const PLATFORM_FEATURES_FORM_ID = "platform-features-form";
const DATA_RETENTION_FORM_ID = "data-retention-form";

const DEFAULT_PLATFORM_FEATURES: PlatformFeaturesFormValues = {
  allowNewTenantRegistration: true,
  maintenanceMode: false,
  enableBetaFeatures: true,
};

const DEFAULT_DATA_RETENTION: DataRetentionFormValues = {
  gpsDataRetentionDays: "365",
  logRetentionDays: "30",
  backupFrequency: "daily",
};

const TIMEZONE_OPTIONS = [
  {
    code: "Africa/Lagos", label: "WAT — West Africa Time (GMT+1)",
  },
  {
    code: "UTC", label: "UTC — Coordinated Universal Time (GMT+0)",
  },
];

const DATE_RANGE_OPTIONS = [
  {
    code: "today", label: "Today",
  },
  {
    code: "7d", label: "Last 7 days",
  },
  {
    code: "30d", label: "Last 30 days",
  },
  {
    code: "90d", label: "Last 90 days",
  },
];

export default function GeneralSettingsPage() {
  const user = useAuthStore(s => s.user);
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const systemSettings = systemSettingsQuery.data?.data;
  const updatePlatformFeatures = useUpdateSystemSettings();
  const updateDataRetention = useUpdateSystemSettings();

  // Profile — unwired local state to match fleetflow shape
  const [
    profileName,
    setProfileName,
  ] = useState("");
  const [
    profilePhone,
    setProfilePhone,
  ] = useState("");
  const [
    profileAvatar,
    setProfileAvatar,
  ] = useState<string | undefined>();
  const [
    savingProfile,
    setSavingProfile,
  ] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Display Preferences — unwired local state
  const [
    timezone,
    setTimezone,
  ] = useState("Africa/Lagos");
  const [
    defaultDateRange,
    setDefaultDateRange,
  ] = useState("7d");

  // Support Email — unwired local state
  const [
    supportEmail,
    setSupportEmail,
  ] = useState("support@fleetpro.ng");
  const [
    responseTime,
    setResponseTime,
  ] = useState("24");

  const platformFeaturesForm = useForm<PlatformFeaturesFormValues>({
    resolver: zodResolver(platformFeaturesSchema),
    defaultValues: DEFAULT_PLATFORM_FEATURES,
  });

  const dataRetentionForm = useForm<DataRetentionFormValues>({
    resolver: zodResolver(dataRetentionSchema),
    defaultValues: DEFAULT_DATA_RETENTION,
  });

  useEffect(
    () => {
      if (!systemSettings) {
        return;
      }
      platformFeaturesForm.reset({
        allowNewTenantRegistration:
          systemSettings.features?.allowNewTenantRegistration
          ?? DEFAULT_PLATFORM_FEATURES.allowNewTenantRegistration,
        maintenanceMode:
          systemSettings.features?.maintenanceMode
          ?? DEFAULT_PLATFORM_FEATURES.maintenanceMode,
        enableBetaFeatures:
          systemSettings.features?.enableBetaFeatures
          ?? DEFAULT_PLATFORM_FEATURES.enableBetaFeatures,
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
      setSupportEmail(systemSettings.supportEmail ?? "support@fleetpro.ng");
    },
    [
      systemSettings,
      platformFeaturesForm,
      dataRetentionForm,
    ],
  );

  const handleAvatarPick = () => fileInputRef.current?.click();
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setProfileAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSavingProfile(true);
    // ponytail: no user-profile update endpoint yet; fake latency
    await new Promise(r => setTimeout(
      r,
      500,
    ));
    setSavingProfile(false);
    toast.success("Profile updated");
  };

  const handleSavePlatformFeatures = (values: PlatformFeaturesFormValues) => {
    updatePlatformFeatures.mutate(
      {
        data: {
          platformName: systemSettings?.platformName ?? "FleetPro",
          supportEmail: systemSettings?.supportEmail ?? supportEmail,
          defaults: systemSettings?.defaults ?? {
            timezone: "Africa/Lagos", language: "en",
          },
          features: {
            ...(systemSettings?.features ?? {}),
            ...values,
          },
          retention: systemSettings?.retention ?? {
            gpsDataRetentionDays: Number(DEFAULT_DATA_RETENTION.gpsDataRetentionDays),
            logRetentionDays: Number(DEFAULT_DATA_RETENTION.logRetentionDays),
            backupFrequency: DEFAULT_DATA_RETENTION.backupFrequency,
          },
        },
      },
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
          platformName: systemSettings?.platformName ?? "FleetPro",
          supportEmail: systemSettings?.supportEmail ?? supportEmail,
          defaults: systemSettings?.defaults ?? {
            timezone: "Africa/Lagos", language: "en",
          },
          features: systemSettings?.features ?? DEFAULT_PLATFORM_FEATURES,
          retention: {
            ...(systemSettings?.retention ?? {}),
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

  return (
    <div className="space-y-6">
      {/* My Profile */}
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
                <Badge
                  variant="outline"
                  className="mt-1 capitalize"
                >
                  {user.role.replace(
                    /_/g,
                    " ",
                  )}
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
              <Input
                id="profileEmail"
                value={user?.email ?? ""}
                disabled
              />
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
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile
                ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  )
                : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
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
            Centralized time and date defaults. These become the default filters for charts,
            tables, and reports across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Timezone</Label>
              <Select
                value={timezone}
                onValueChange={setTimezone}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map(tz => (
                    <SelectItem
                      key={tz.code}
                      value={tz.code}
                    >
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Time Range</Label>
              <Select
                value={defaultDateRange}
                onValueChange={setDefaultDateRange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map(r => (
                    <SelectItem
                      key={r.code}
                      value={r.code}
                    >
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Platform Features
          </CardTitle>
          <CardDescription>
            Toggle platform-wide capabilities
          </CardDescription>
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
                      <p className="text-sm text-muted-foreground">
                        Enable self-service tenant onboarding
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
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
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable platform access
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={platformFeaturesForm.control}
                name="enableBetaFeatures"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Enable Beta Features</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Allow access to experimental features
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
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
                    ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      )
                    : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Features
                        </>
                      )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Data Retention */}
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                    ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      )
                    : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Retention
                        </>
                      )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Support Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Support Email
          </CardTitle>
          <CardDescription>
            Email address tenants use to reach platform support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Support Email Address</Label>
              <Input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                placeholder="support@fleetpro.ng"
              />
            </div>
            <div className="space-y-2">
              <Label>Response Time Commitment</Label>
              <Select
                value={responseTime}
                onValueChange={setResponseTime}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">Within 4 hours</SelectItem>
                  <SelectItem value="24">Within 24 hours</SelectItem>
                  <SelectItem value="48">Within 48 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => toast.success("Support settings saved")}>
              <Save className="h-4 w-4 mr-2" />
              Save Support Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
