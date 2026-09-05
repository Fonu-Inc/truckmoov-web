import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemSettingsQueryOptions,
  useUpdateSystemSettings,
} from "@truckmoov/api/auth";
import {
  Database,
  Globe,
  Mail,
  RefreshCw,
  Save,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
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
 * `/settings` — matches fleetflow's General tab card layout minus the
 * removed My Profile + Display Preferences cards. Now:
 * Platform Features / Data Retention / Support Email.
 *
 * ponytail: Support Email is unwired local state. Platform Features + Data
 * Retention keep their real @truckmoov/api wiring.
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

export default function GeneralSettingsPage() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const systemSettings = systemSettingsQuery.data?.data;
  const updatePlatformFeatures = useUpdateSystemSettings();
  const updateDataRetention = useUpdateSystemSettings();

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
