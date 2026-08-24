import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemSettingsQueryOptions,
  useUpdateSystemSettings,
} from "@truckmoov/api/auth";
import {
  Database,
  Globe,
  RefreshCw,
  Save,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { ChangePasswordCard } from "@/features/settings/components/ui/ChangePasswordCard";

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

type PlatformConfigurationFormValues = z.infer<typeof platformConfigurationSchema>;
type DataRetentionFormValues = z.infer<typeof dataRetentionSchema>;

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

/**
 * `/settings` — the tab bar's first entry, so it is the index route.
 *
 * ponytail: three cards in one page (change password, platform configuration,
 * data retention) because they were one tab. Each could become its own route
 * the day General grows a sub-nav; until then splitting it would only add files.
 */
export default function GeneralSettingsPage() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const systemSettings = systemSettingsQuery.data?.data;
  const updatePlatformConfiguration = useUpdateSystemSettings();
  const updateDataRetention = useUpdateSystemSettings();

  const platformConfigurationForm = useForm<PlatformConfigurationFormValues>({
    resolver: zodResolver(platformConfigurationSchema),
    defaultValues: DEFAULT_PLATFORM_CONFIGURATION_VALUES,
  });

  const dataRetentionForm = useForm<DataRetentionFormValues>({
    resolver: zodResolver(dataRetentionSchema),
    defaultValues: DEFAULT_DATA_RETENTION_VALUES,
  });

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
      <ChangePasswordCard />

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
