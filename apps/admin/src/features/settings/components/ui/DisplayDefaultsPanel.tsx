import type {
  SystemDateFormat, SystemDefaultTimeRange, SystemTimeFormat,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemSettingsQueryOptions,
  useUpdateSystemSettings,
} from "@truckmoov/api/auth";
import { Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";

/**
 * Fleetflow's `TIMEZONES` (`lib/timezone.ts`), each mapped to the IANA zone the
 * API stores in `defaults.timezone`.
 */
const TIMEZONES: Array<{
  value: string; name: string; offset: string;
}> = [
  {
    value: "Africa/Lagos", name: "West Africa Time", offset: "GMT+1",
  },
  {
    value: "UTC", name: "Coordinated Universal Time", offset: "GMT+0",
  },
];

/** Fleetflow's `DATE_RANGE_OPTIONS`, mapped to the API's `defaultTimeRange` keys. */
const DATE_RANGE_OPTIONS: Array<{
  value: SystemDefaultTimeRange; label: string;
}> = [
  {
    value: "today", label: "Today",
  },
  {
    value: "yesterday", label: "Yesterday",
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
];

/** API keys fleetflow has no option for — shown as an extra item only when saved. */
const EXTRA_RANGE_LABELS: Partial<Record<SystemDefaultTimeRange, string>> = {
  this_month: "This Month",
  this_year: "This Year",
};

type DisplayDefaults = {
  timezone?: string;
  defaultTimeRange?: SystemDefaultTimeRange;
  dateFormat?: SystemDateFormat;
  timeFormat?: SystemTimeFormat;
};

/**
 * `/settings/display` — fleetflow's Display Defaults card: Default Timezone,
 * Default Reporting Range, Date Format, Time Format, all system settings
 * `defaults`. Like fleetflow, every select applies on change (no Save button).
 */
export function DisplayDefaultsPanel() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const defaults = systemSettingsQuery.data?.data?.defaults;
  const updateSettings = useUpdateSystemSettings();
  // Values picked on this visit — shown straight away, rolled back on error.
  const [
    pending,
    setPending,
  ] = useState<DisplayDefaults>({});

  const timezone = pending.timezone ?? defaults?.timezone ?? "Africa/Lagos";
  const savedRange = pending.defaultTimeRange ?? defaults?.defaultTimeRange ?? "last_7_days";
  const range = savedRange;
  const dateFormat = pending.dateFormat ?? defaults?.dateFormat ?? "dd/MM/yyyy";
  const timeFormat = pending.timeFormat ?? defaults?.timeFormat ?? "24h";

  const timezoneOptions = TIMEZONES.some(tz => tz.value === timezone)
    ? TIMEZONES
    : [
        {
          value: timezone, name: timezone, offset: "",
        },
        ...TIMEZONES,
      ];
  const rangeOptions = DATE_RANGE_OPTIONS.some(r => r.value === range)
    ? DATE_RANGE_OPTIONS
    : [
        ...DATE_RANGE_OPTIONS,
        {
          value: savedRange, label: EXTRA_RANGE_LABELS[savedRange] ?? savedRange,
        },
      ];

  const saveDefaults = (value: DisplayDefaults, message?: string) => {
    setPending(p => ({
      ...p, ...value,
    }));
    updateSettings.mutate(
      {
        data: {
          defaults: {
            ...(defaults ?? {}), ...pending, ...value,
          },
        },
      },
      {
        onSuccess: () => {
          if (message)
            toast.success(message);
        },
        onError: (error) => {
          toast.error(error.message);
          setPending({});
        },
      },
    );
  };

  const handleRange = (v: string) => saveDefaults({ defaultTimeRange: v as SystemDefaultTimeRange });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Display Defaults
          </CardTitle>
          <CardDescription>Default timezone, date/time format and reporting range for charts, tables and reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Timezone</Label>
              <Select
                value={timezone}
                onValueChange={v => saveDefaults({ timezone: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map(tz => (
                    <SelectItem
                      key={tz.value}
                      value={tz.value}
                    >
                      {tz.offset ? `${tz.name} (${tz.offset})` : tz.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Reporting Range</Label>
              <Select
                value={range}
                onValueChange={handleRange}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rangeOptions.map(r => (
                    <SelectItem
                      key={r.value}
                      value={r.value}
                    >
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={dateFormat}
                onValueChange={v => saveDefaults(
                  { dateFormat: v as SystemDateFormat },
                  "Date format updated",
                )}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                  <SelectItem value="d MMM yyyy">20 Nov 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select
                value={timeFormat}
                onValueChange={v => saveDefaults(
                  { timeFormat: v as SystemTimeFormat },
                  "Time format updated",
                )}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24-hour (14:30)</SelectItem>
                  <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
