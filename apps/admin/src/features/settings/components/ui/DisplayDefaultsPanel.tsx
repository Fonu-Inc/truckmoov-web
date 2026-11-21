import type { SystemDefaultTimeRange } from "@truckmoov/api/auth";
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
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/shadcn/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";

// TRU-FE-7 § A — the six documented keys (fleetflow's own range keys differ; the API's win).
const DEFAULT_TIME_RANGES: Array<{
  value: SystemDefaultTimeRange; label: string;
}> = [
  {
    value: "today", label: "Today",
  },
  {
    value: "last_7_days", label: "Last 7 Days",
  },
  {
    value: "last_30_days", label: "Last 30 Days",
  },
  {
    value: "last_90_days", label: "Last 90 Days",
  },
  {
    value: "this_month", label: "This Month",
  },
  {
    value: "this_year", label: "This Year",
  },
];

/** IANA zones offered as the platform default — Africa first, then major hubs. */
const TIMEZONES: Array<{
  value: string; label: string;
}> = [
  {
    value: "Africa/Lagos", label: "Lagos (WAT, UTC+1)",
  },
  {
    value: "Africa/Accra", label: "Accra (GMT, UTC+0)",
  },
  {
    value: "Africa/Abidjan", label: "Abidjan (GMT, UTC+0)",
  },
  {
    value: "Africa/Dakar", label: "Dakar (GMT, UTC+0)",
  },
  {
    value: "Africa/Douala", label: "Douala (WAT, UTC+1)",
  },
  {
    value: "Africa/Kinshasa", label: "Kinshasa (WAT, UTC+1)",
  },
  {
    value: "Africa/Cairo", label: "Cairo (EET, UTC+2)",
  },
  {
    value: "Africa/Johannesburg", label: "Johannesburg (SAST, UTC+2)",
  },
  {
    value: "Africa/Nairobi", label: "Nairobi (EAT, UTC+3)",
  },
  {
    value: "Africa/Addis_Ababa", label: "Addis Ababa (EAT, UTC+3)",
  },
  {
    value: "UTC", label: "UTC (UTC+0)",
  },
  {
    value: "Europe/London", label: "London (GMT/BST)",
  },
  {
    value: "Europe/Paris", label: "Paris (CET/CEST)",
  },
  {
    value: "Asia/Dubai", label: "Dubai (GST, UTC+4)",
  },
  {
    value: "Asia/Kolkata", label: "Kolkata (IST, UTC+5:30)",
  },
  {
    value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)",
  },
  {
    value: "America/New_York", label: "New York (ET)",
  },
  {
    value: "America/Chicago", label: "Chicago (CT)",
  },
  {
    value: "America/Los_Angeles", label: "Los Angeles (PT)",
  },
];

const displayDefaultsSchema = z.object({
  timezone: z.string().min(1),
  defaultTimeRange: z.enum([
    "today",
    "last_7_days",
    "last_30_days",
    "last_90_days",
    "this_month",
    "this_year",
  ]),
});

type DisplayDefaultsFormValues = z.infer<typeof displayDefaultsSchema>;

export const DISPLAY_DEFAULTS_FORM_ID = "display-defaults-form";

const DEFAULT_DISPLAY: DisplayDefaultsFormValues = {
  timezone: "Africa/Lagos",
  defaultTimeRange: "last_7_days",
};

/**
 * `/settings/display` — fleetflow's Display Defaults card, saved to system
 * settings `defaults`. Fleetflow's Date/Time Format selects are left out: no
 * API field, and not in the change document.
 */
export function DisplayDefaultsPanel() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const systemSettings = systemSettingsQuery.data?.data;
  const updateSettings = useUpdateSystemSettings();

  const form = useForm<DisplayDefaultsFormValues>({
    resolver: zodResolver(displayDefaultsSchema),
    defaultValues: DEFAULT_DISPLAY,
  });

  useEffect(
    () => {
      if (!systemSettings)
        return;
      const range = systemSettings.defaults?.defaultTimeRange;
      form.reset({
        timezone: systemSettings.defaults?.timezone ?? DEFAULT_DISPLAY.timezone,
        defaultTimeRange: range && DEFAULT_TIME_RANGES.some(r => r.value === range)
          ? range
          : DEFAULT_DISPLAY.defaultTimeRange,
      });
    },
    [
      systemSettings,
      form,
    ],
  );

  const timezone = form.watch("timezone");
  // Keep a saved zone selectable even if it isn't in the curated list.
  const timezoneOptions = TIMEZONES.some(tz => tz.value === timezone)
    ? TIMEZONES
    : [
        {
          value: timezone, label: timezone,
        },
        ...TIMEZONES,
      ];

  const handleSave = (values: DisplayDefaultsFormValues) => {
    updateSettings.mutate(
      {
        data: {
          defaults: {
            ...(systemSettings?.defaults ?? {}), ...values,
          },
        },
      },
      {
        onSuccess: () => toast.success("Display defaults saved"),
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Display Defaults
        </CardTitle>
        <CardDescription>Default timezone and reporting range for charts, tables and reports.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            id={DISPLAY_DEFAULTS_FORM_ID}
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Default Timezone</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timezoneOptions.map(tz => (
                          <SelectItem
                            key={tz.value}
                            value={tz.value}
                          >
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultTimeRange"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Default Reporting Range</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEFAULT_TIME_RANGES.map(r => (
                          <SelectItem
                            key={r.value}
                            value={r.value}
                          >
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
                form={DISPLAY_DEFAULTS_FORM_ID}
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
                        Save Defaults
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
