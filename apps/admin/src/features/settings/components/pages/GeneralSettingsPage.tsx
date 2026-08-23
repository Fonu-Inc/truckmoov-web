import type { Timezone } from "@truckmoov/app-core/utils/time-utils";
import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemSettingsQueryOptions,
  useUpdateProfile,
  useUpdateSystemSettings,
} from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import { TIMEZONES } from "@truckmoov/app-core/utils/time-utils";
import {
  Camera,
  Database,
  Globe,
  RefreshCw,
  Save,
  User as UserIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";
import { usePreferences } from "@/contexts/PreferencesContext";
import { getRoleLabel } from "@/features/auth/utils/role-label";
import { useAuthStore } from "@/stores/authStore";

const DATE_RANGE_OPTIONS: Record<ChartDateRange, string> = {
  "today": "Today",
  "yesterday": "Yesterday",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
};

const platformConfigurationSchema = z.object({
  platformName: z.string().trim().min(
    1,
    "Platform name is required.",
  ),
  supportEmail: z.string().trim().email("Enter a valid support email."),
  timezone: z.enum([
    "Africa/Lagos",
    "UTC",
  ]),
  language: z.enum([
    "en",
    "ha",
    "yo",
    "ig",
    "fr",
  ]),
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

const profileSchema = z.object({
  fullName: z.string().trim().min(
    1,
    "Full name is required.",
  ),
  phoneNumber: z.string().trim().max(
    30,
    "Phone number is too long.",
  ).optional(),
});

const displayPreferencesSchema = z.object({
  timezone: z.enum([
    "WAT",
    "UTC",
  ]),
  defaultDateRange: z.enum([
    "today",
    "yesterday",
    "7d",
    "30d",
    "90d",
  ]),
});

type PlatformConfigurationFormValues = z.infer<typeof platformConfigurationSchema>;
type DataRetentionFormValues = z.infer<typeof dataRetentionSchema>;
type ProfileFormValues = z.infer<typeof profileSchema>;
type DisplayPreferencesFormValues = z.infer<typeof displayPreferencesSchema>;

export const PROFILE_FORM_ID = "platform-profile-form";
export const DISPLAY_PREFERENCES_FORM_ID = "display-preferences-form";
export const PLATFORM_CONFIGURATION_FORM_ID = "platform-configuration-form";
export const DATA_RETENTION_FORM_ID = "data-retention-form";

const DEFAULT_PLATFORM_CONFIGURATION_VALUES: PlatformConfigurationFormValues = {
  platformName: "FleetPro",
  supportEmail: "support@fleetpro.com",
  timezone: "Africa/Lagos",
  language: "en",
  allowNewTenantRegistration: true,
  maintenanceMode: false,
  enableBetaFeatures: true,
};

const DEFAULT_DATA_RETENTION_VALUES: DataRetentionFormValues = {
  gpsDataRetentionDays: "365",
  logRetentionDays: "30",
  backupFrequency: "daily",
};

const DEFAULT_PROFILE_VALUES: ProfileFormValues = {
  fullName: "",
  phoneNumber: "",
};

/**
 * `/settings` — the tab bar's first entry, so it is the index route.
 *
 * ponytail: four cards in one page (profile, display preferences, platform
 * configuration, data retention) because they were one tab. Each could become
 * its own route the day General grows a sub-nav; until then splitting it would
 * only add files.
 */
export default function GeneralSettingsPage() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const systemSettings = systemSettingsQuery.data?.data;
  const updateProfile = useUpdateProfile();
  const updatePlatformConfiguration = useUpdateSystemSettings();
  const updateDataRetention = useUpdateSystemSettings();
  const {
    timezone,
    setTimezone,
    defaultDateRange,
    setDefaultDateRange,
  } = usePreferences();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: DEFAULT_PROFILE_VALUES,
  });

  const displayPreferencesForm = useForm<DisplayPreferencesFormValues>({
    resolver: zodResolver(displayPreferencesSchema),
    defaultValues: {
      timezone,
      defaultDateRange,
    },
  });

  const platformConfigurationForm = useForm<PlatformConfigurationFormValues>({
    resolver: zodResolver(platformConfigurationSchema),
    defaultValues: DEFAULT_PLATFORM_CONFIGURATION_VALUES,
  });

  const dataRetentionForm = useForm<DataRetentionFormValues>({
    resolver: zodResolver(dataRetentionSchema),
    defaultValues: DEFAULT_DATA_RETENTION_VALUES,
  });

  const user = useAuthStore(s => s.user);
  const [
    profileAvatar,
    setProfileAvatar,
  ] = useState<string | undefined>(user?.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => {
      if (user) {
        profileForm.reset({
          fullName: user.name ?? "",
          phoneNumber: user.phone ?? "",
        });
        setProfileAvatar(user.avatar);
      }
    },
    [
      user?.id,
      profileForm,
    ],
  );

  useEffect(
    () => {
      displayPreferencesForm.reset({
        timezone,
        defaultDateRange,
      });
    },
    [
      timezone,
      defaultDateRange,
      displayPreferencesForm,
    ],
  );

  useEffect(
    () => {
      if (!systemSettings)
        return;

      platformConfigurationForm.reset({
        platformName: systemSettings.platformName ?? DEFAULT_PLATFORM_CONFIGURATION_VALUES.platformName,
        supportEmail: systemSettings.supportEmail ?? DEFAULT_PLATFORM_CONFIGURATION_VALUES.supportEmail,
        timezone: platformConfigurationSchema.shape.timezone.safeParse(systemSettings.defaults?.timezone).success
          ? systemSettings.defaults?.timezone as PlatformConfigurationFormValues["timezone"]
          : DEFAULT_PLATFORM_CONFIGURATION_VALUES.timezone,
        language: platformConfigurationSchema.shape.language.safeParse(systemSettings.defaults?.language).success
          ? systemSettings.defaults?.language as PlatformConfigurationFormValues["language"]
          : DEFAULT_PLATFORM_CONFIGURATION_VALUES.language,
        allowNewTenantRegistration:
        systemSettings.features?.allowNewTenantRegistration
        ?? DEFAULT_PLATFORM_CONFIGURATION_VALUES.allowNewTenantRegistration,
        maintenanceMode:
        systemSettings.features?.maintenanceMode
        ?? DEFAULT_PLATFORM_CONFIGURATION_VALUES.maintenanceMode,
        enableBetaFeatures:
        systemSettings.features?.enableBetaFeatures
        ?? DEFAULT_PLATFORM_CONFIGURATION_VALUES.enableBetaFeatures,
      });

      dataRetentionForm.reset({
        gpsDataRetentionDays: dataRetentionSchema.shape.gpsDataRetentionDays.safeParse(
          String(systemSettings.retention?.gpsDataRetentionDays),
        ).success
          ? String(systemSettings.retention?.gpsDataRetentionDays) as DataRetentionFormValues["gpsDataRetentionDays"]
          : DEFAULT_DATA_RETENTION_VALUES.gpsDataRetentionDays,
        logRetentionDays: dataRetentionSchema.shape.logRetentionDays.safeParse(
          String(systemSettings.retention?.logRetentionDays),
        ).success
          ? String(systemSettings.retention?.logRetentionDays) as DataRetentionFormValues["logRetentionDays"]
          : DEFAULT_DATA_RETENTION_VALUES.logRetentionDays,
        backupFrequency: dataRetentionSchema.shape.backupFrequency.safeParse(
          systemSettings.retention?.backupFrequency,
        ).success
          ? systemSettings.retention?.backupFrequency as DataRetentionFormValues["backupFrequency"]
          : DEFAULT_DATA_RETENTION_VALUES.backupFrequency,
      });
    },
    [
      systemSettings,
      platformConfigurationForm,
      dataRetentionForm,
    ],
  );

  const handleAvatarPick = () => fileInputRef.current?.click();
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setProfileAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (values: ProfileFormValues) => {
    updateProfile.mutate(
      {
        data: {
          fullName: values.fullName,
          phoneNumber: values.phoneNumber || undefined,
          profilePictureUrl: profileAvatar,
        },
      },
      {
        onSuccess: async () => {
          await useAuthStore.getState().bootstrapFromSession();
          toast.success("Profile saved");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const handleSaveDisplayPreferences = (values: DisplayPreferencesFormValues) => {
    setTimezone(values.timezone as Timezone);
    setDefaultDateRange(values.defaultDateRange as ChartDateRange);
    toast.success("Display preferences saved");
  };

  const handleSavePlatformConfiguration = (values: PlatformConfigurationFormValues) => {
    updatePlatformConfiguration.mutate(
      {
        data: {
          platformName: values.platformName,
          supportEmail: values.supportEmail,
          defaults: {
            ...(systemSettings?.defaults ?? {}),
            timezone: values.timezone,
            language: values.language,
          },
          features: {
            ...(systemSettings?.features ?? {}),
            allowNewTenantRegistration: values.allowNewTenantRegistration,
            maintenanceMode: values.maintenanceMode,
            enableBetaFeatures: values.enableBetaFeatures,
          },
          retention: systemSettings?.retention ?? {
            gpsDataRetentionDays: Number(DEFAULT_DATA_RETENTION_VALUES.gpsDataRetentionDays),
            logRetentionDays: Number(DEFAULT_DATA_RETENTION_VALUES.logRetentionDays),
            backupFrequency: DEFAULT_DATA_RETENTION_VALUES.backupFrequency,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Platform configuration saved");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const handleSaveDataRetention = (values: DataRetentionFormValues) => {
    updateDataRetention.mutate(
      {
        data: {
          platformName: systemSettings?.platformName ?? platformConfigurationForm.getValues("platformName"),
          supportEmail: systemSettings?.supportEmail ?? platformConfigurationForm.getValues("supportEmail"),
          defaults: systemSettings?.defaults ?? {
            timezone: platformConfigurationForm.getValues("timezone"),
            language: platformConfigurationForm.getValues("language"),
          },
          features: systemSettings?.features ?? {
            allowNewTenantRegistration: platformConfigurationForm.getValues("allowNewTenantRegistration"),
            maintenanceMode: platformConfigurationForm.getValues("maintenanceMode"),
            enableBetaFeatures: platformConfigurationForm.getValues("enableBetaFeatures"),
          },
          retention: {
            ...(systemSettings?.retention ?? {}),
            gpsDataRetentionDays: Number(values.gpsDataRetentionDays),
            logRetentionDays: Number(values.logRetentionDays),
            backupFrequency: values.backupFrequency,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Data retention settings saved");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
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
          <Form {...profileForm}>
            <form
              id={PROFILE_FORM_ID}
              onSubmit={profileForm.handleSubmit(handleSaveProfile)}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={profileAvatar}
                      alt={profileForm.watch("fullName")}
                    />
                    <AvatarFallback className="text-lg">
                      {getInitials(profileForm.watch("fullName") || user?.email)}
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
                  <p className="font-medium">{profileForm.watch("fullName") || "Platform Admin"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {user?.role && (
                    <Badge
                      variant="outline"
                      className="mt-1"
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      value={user?.email ?? ""}
                      disabled
                    />
                  </FormControl>
                </FormItem>
                <FormField
                  control={profileForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+234..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  form={PROFILE_FORM_ID}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending
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
            </form>
          </Form>
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
                          {Object.entries(TIMEZONES).map(([
                            code,
                            tz,
                          ]) => (
                            <SelectItem
                              key={code}
                              value={code}
                            >
                              {tz.name}
                              {" "}
                              (
                              {tz.offset}
                              )
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={displayPreferencesForm.control}
                  name="defaultDateRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Time Range</FormLabel>
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
                          {Object.entries(DATE_RANGE_OPTIONS).map(([
                            k,
                            label,
                          ]) => (
                            <SelectItem
                              key={k}
                              value={k}
                            >
                              {label}
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
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </form>
          </Form>
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
          <Form {...platformConfigurationForm}>
            <form
              id={PLATFORM_CONFIGURATION_FORM_ID}
              onSubmit={platformConfigurationForm.handleSubmit(handleSavePlatformConfiguration)}
              className="space-y-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={platformConfigurationForm.control}
                  name="platformName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={platformConfigurationForm.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={platformConfigurationForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Timezone</FormLabel>
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
                          <SelectItem value="Africa/Lagos">
                            WAT - West Africa Time (Africa/Lagos, GMT+1) - default
                          </SelectItem>
                          <SelectItem value="UTC">
                            UTC - Coordinated Universal Time (GMT+0)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={platformConfigurationForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Language</FormLabel>
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
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ha">Hausa</SelectItem>
                          <SelectItem value="yo">Yoruba</SelectItem>
                          <SelectItem value="ig">Igbo</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Platform Features</h4>
                <div className="space-y-4">
                  <FormField
                    control={platformConfigurationForm.control}
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
                    control={platformConfigurationForm.control}
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
                    control={platformConfigurationForm.control}
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
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  form={PLATFORM_CONFIGURATION_FORM_ID}
                  disabled={updatePlatformConfiguration.isPending}
                >
                  {updatePlatformConfiguration.isPending
                    ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      )
                    : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Configuration
                        </>
                      )}
                </Button>
              </div>
            </form>
          </Form>
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
    </div>
  );
}
