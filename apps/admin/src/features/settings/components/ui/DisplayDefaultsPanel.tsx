import type { SystemDefaultTimeRange } from "@truckmoov/api/auth";
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

/**
 * Fleetflow's `DATE_RANGE_OPTIONS`, mapped to the API's `defaultTimeRange`
 * keys. "Yesterday" has no API key, so it's kept per browser (ponytail below).
 */
const DATE_RANGE_OPTIONS: Array<{
  value: SystemDefaultTimeRange | "yesterday"; label: string;
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

// ponytail: mock data from fleetflow parity port — wire to packages/api
// (no API field for date/time format or a "yesterday" default range; per browser).
// App-prefixed: both dev servers share localhost storage (see sidebarStore).
const LOCAL_KEY = "admin-platform-display-defaults";
type LocalDisplay = {
  dateFormat: string; timeFormat: string; yesterday?: boolean;
};
const DEFAULT_LOCAL: LocalDisplay = {
  dateFormat: "dd/MM/yyyy", timeFormat: "24h",
};

function readLocal(): LocalDisplay {
  try {
    return {
      ...DEFAULT_LOCAL, ...JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"),
    };
  }
  catch {
    return DEFAULT_LOCAL;
  }
}

/**
 * `/settings/display` — fleetflow's Display Defaults card: Default Timezone,
 * Default Reporting Range, Date Format, Time Format. Like fleetflow, every
 * select applies on change (no Save button).
 *
 * Timezone and reporting range are system settings `defaults` (live). Date and
 * Time Format — and the "Yesterday" range, which the API has no key for — are
 * per browser (ponytail).
 */
export function DisplayDefaultsPanel() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const defaults = systemSettingsQuery.data?.data?.defaults;
  const updateSettings = useUpdateSystemSettings();
  const [
    local,
    setLocal,
  ] = useState<LocalDisplay>(readLocal);
  // Values picked on this visit — shown straight away, rolled back on error.
  const [
    pending,
    setPending,
  ] = useState<{
    timezone?: string; defaultTimeRange?: SystemDefaultTimeRange;
  }>({});

  const timezone = pending.timezone ?? defaults?.timezone ?? "Africa/Lagos";
  const savedRange = pending.defaultTimeRange ?? defaults?.defaultTimeRange ?? "last_7_days";
  const range = local.yesterday ? "yesterday" : savedRange;

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

  const saveLocal = (value: Partial<LocalDisplay>, message?: string) => {
    const next = {
      ...local, ...value,
    };
    setLocal(next);
    try {
      localStorage.setItem(
        LOCAL_KEY,
        JSON.stringify(next),
      );
    }
    catch {
      // Storage blocked — the choice still holds for this visit.
    }
    if (message)
      toast.success(message);
  };

  const saveDefaults = (value: {
    timezone?: string; defaultTimeRange?: SystemDefaultTimeRange;
  }) => {
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
        onError: (error) => {
          toast.error(error.message);
          setPending({});
        },
      },
    );
  };

  const handleRange = (v: string) => {
    if (v === "yesterday") {
      saveLocal({ yesterday: true });
      return;
    }
    if (local.yesterday)
      saveLocal({ yesterday: false });
    saveDefaults({ defaultTimeRange: v as SystemDefaultTimeRange });
  };

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
                value={local.dateFormat}
                onValueChange={v => saveLocal(
                  { dateFormat: v },
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
                value={local.timeFormat}
                onValueChange={v => saveLocal(
                  { timeFormat: v },
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
