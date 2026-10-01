import type { InstallerDisplayPreferences } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateInstallerDisplayPreferences } from "@truckmoov/api/auth";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

// ponytail: a short list of zones installers are likely to use; the server accepts any IANA name.
// Swap for Intl.supportedValuesOf("timeZone") once the tsconfig lib reaches ES2022.
const TIMEZONES = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Abidjan",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "America/New_York",
  "UTC",
];

const TIME_RANGES = [
  [
    "today",
    "Today",
  ],
  [
    "last_7_days",
    "Last 7 Days",
  ],
  [
    "last_30_days",
    "Last 30 Days",
  ],
  [
    "last_90_days",
    "Last 90 Days",
  ],
] as const;

const displaySchema = z.object({
  timezone: z.string().min(
    1,
    "Choose a time zone.",
  ),
  defaultTimeRange: z.enum([
    "today",
    "last_7_days",
    "last_30_days",
    "last_90_days",
  ]),
});

type DisplayValues = z.infer<typeof displaySchema>;

export const DISPLAY_PREFERENCES_FORM_ID = "installer-display-preferences-form";

export function DisplayPreferencesForm({ preferences }: { preferences: InstallerDisplayPreferences }) {
  const update = useUpdateInstallerDisplayPreferences();
  const zones = TIMEZONES.includes(preferences.timezone) ? TIMEZONES : [
    preferences.timezone,
    ...TIMEZONES,
  ];

  const form = useForm<DisplayValues>({
    resolver: zodResolver(displaySchema),
    defaultValues: preferences,
  });

  function onSubmit(values: DisplayValues) {
    update.mutate(
      { data: values },
      {
        onSuccess: () => toast.success("Display preferences saved."),
        onError: error => toast.error(error.message),
      },
    );
  }

  return (
    <Form {...form}>
      <form
        id={DISPLAY_PREFERENCES_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Timezone</FormLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {zones.map(z => (
                      <SelectItem
                        key={z}
                        value={z}
                      >
                        {z.replace(
                          "_",
                          " ",
                        )}
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
              <FormItem>
                <FormLabel>Default Time Range</FormLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_RANGES.map(([
                      value,
                      label,
                    ]) => (
                      <SelectItem
                        key={value}
                        value={value}
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
        <Button
          type="submit"
          form={DISPLAY_PREFERENCES_FORM_ID}
          loading={update.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save preferences
        </Button>
      </form>
    </Form>
  );
}
