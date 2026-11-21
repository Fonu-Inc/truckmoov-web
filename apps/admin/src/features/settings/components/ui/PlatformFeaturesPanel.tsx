import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemSettingsQueryOptions,
  useUpdateSystemSettings,
} from "@truckmoov/api/auth";
import {
  Globe, RefreshCw, Save,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel,
} from "@/components/shadcn/form";
import { Switch } from "@/components/shadcn/switch";

// TRU-FE-7 § A — no `enableBetaFeatures` toggle (placebo per spec; fleetflow has one).
const platformFeaturesSchema = z.object({
  allowNewTenantRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
});

type PlatformFeaturesFormValues = z.infer<typeof platformFeaturesSchema>;

export const PLATFORM_FEATURES_FORM_ID = "platform-features-form";

const DEFAULT_PLATFORM_FEATURES: PlatformFeaturesFormValues = {
  allowNewTenantRegistration: true,
  maintenanceMode: false,
};

/**
 * `/settings/features` — fleetflow's Platform Features card. Unlike fleetflow
 * (display-only switches), both switches are saved to system settings
 * `features`, section-wise.
 */
export function PlatformFeaturesPanel() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const systemSettings = systemSettingsQuery.data?.data;
  const updateSettings = useUpdateSystemSettings();

  const form = useForm<PlatformFeaturesFormValues>({
    resolver: zodResolver(platformFeaturesSchema),
    defaultValues: DEFAULT_PLATFORM_FEATURES,
  });

  useEffect(
    () => {
      if (!systemSettings)
        return;
      form.reset({
        allowNewTenantRegistration:
        systemSettings.features?.allowNewTenantRegistration
        ?? DEFAULT_PLATFORM_FEATURES.allowNewTenantRegistration,
        maintenanceMode:
        systemSettings.features?.maintenanceMode
        ?? DEFAULT_PLATFORM_FEATURES.maintenanceMode,
      });
    },
    [
      systemSettings,
      form,
    ],
  );

  const handleSave = (values: PlatformFeaturesFormValues) => {
    updateSettings.mutate(
      {
        data: {
          features: {
            ...(systemSettings?.features ?? {}), ...values,
          },
        },
      },
      {
        onSuccess: () => toast.success("Platform features saved"),
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
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
        <Form {...form}>
          <form
            id={PLATFORM_FEATURES_FORM_ID}
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-4"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                form={PLATFORM_FEATURES_FORM_ID}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending
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
  );
}
