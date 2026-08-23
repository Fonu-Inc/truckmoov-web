import type { DispatcherPreferences } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getDispatchPreferencesQueryOptions,
  useUpdateDispatchPreferences,
} from "@truckmoov/api/auth";
import { AlertCircle } from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { toast } from "sonner";

import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/shadcn/alert";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";

const WEEK_DAYS: {
  index: number; short: string; label: string;
}[] = [
  {
    index: 0, short: "Sun", label: "Sunday",
  },
  {
    index: 1, short: "Mon", label: "Monday",
  },
  {
    index: 2, short: "Tue", label: "Tuesday",
  },
  {
    index: 3, short: "Wed", label: "Wednesday",
  },
  {
    index: 4, short: "Thu", label: "Thursday",
  },
  {
    index: 5, short: "Fri", label: "Friday",
  },
  {
    index: 6, short: "Sat", label: "Saturday",
  },
];

const HOUR_TICKS = [
  0,
  4,
  8,
  12,
  16,
  20,
  24,
];

function timeToFraction(hhmm: string): number {
  const [
    h,
    m,
  ] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m))
    return 0;
  return (h * 60 + m) / (24 * 60);
}

/** Timezone list from the runtime — no bundled data. */
function getTimezones(): string[] {
  const supported = Intl.supportedValuesOf?.("timeZone");
  return supported && supported.length > 0
    ? supported
    : [new Intl.DateTimeFormat().resolvedOptions().timeZone];
}

function LoadingPanel() {
  return (
    <div
      className="space-y-6"
      aria-label="Loading dispatch preferences"
    >
      {[
        3,
        1,
      ].map(rowCount => (
        <Card
          key={rowCount}
          className="bg-card/50 border-border/50"
        >
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: rowCount }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-10 w-full"
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type CoverageStripProps = {
  shiftStart: string;
  shiftEnd: string;
};

function CoverageStrip({
  shiftStart, shiftEnd,
}: CoverageStripProps) {
  const start = timeToFraction(shiftStart);
  const end = timeToFraction(shiftEnd);
  const overnight = end <= start;
  const label = overnight
    ? `Overnight shift, ${shiftStart} to ${shiftEnd}`
    : `Shift from ${shiftStart} to ${shiftEnd}`;

  return (
    <div className="space-y-1.5">
      <div
        className="relative h-3 rounded-sm bg-muted overflow-hidden"
        role="img"
        aria-label={label}
      >
        {overnight
          ? (
              <>
                <div
                  className="absolute inset-y-0 bg-primary motion-safe:transition-[left,width] duration-200"
                  style={{
                    left: 0, width: `${end * 100}%`,
                  }}
                />
                <div
                  className="absolute inset-y-0 bg-primary motion-safe:transition-[left,width] duration-200"
                  style={{
                    left: `${start * 100}%`, width: `${(1 - start) * 100}%`,
                  }}
                />
              </>
            )
          : (
              <div
                className="absolute inset-y-0 bg-primary motion-safe:transition-[left,width] duration-200"
                style={{
                  left: `${start * 100}%`, width: `${Math.max(
                    end - start,
                    0,
                  ) * 100}%`,
                }}
              />
            )}
      </div>
      <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
        {HOUR_TICKS.map(h => (
          <span key={h}>
            {h.toString().padStart(
              2,
              "0",
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DispatchPreferencesPanel() {
  const preferencesQuery = useQuery(getDispatchPreferencesQueryOptions());
  const updateMutation = useUpdateDispatchPreferences();
  const serverPreferences = preferencesQuery.data?.data.dispatcherPreferences;
  const [
    preferences,
    setPreferences,
  ] = useState<DispatcherPreferences | null>(null);
  const timezones = useMemo(
    getTimezones,
    [],
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => {
      if (serverPreferences)
        setPreferences(serverPreferences);
    },
    [serverPreferences],
  );

  useEffect(
    () => () => {
      if (debounceRef.current)
        clearTimeout(debounceRef.current);
    },
    [],
  );

  if (preferencesQuery.isPending)
    return <LoadingPanel />;

  if (preferencesQuery.isError || !preferences) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load dispatch preferences</AlertTitle>
        <AlertDescription>{preferencesQuery.error?.message ?? "The server returned an invalid response."}</AlertDescription>
      </Alert>
    );
  }

  const patch = (partial: Partial<DispatcherPreferences>, previous: DispatcherPreferences) => {
    updateMutation.mutate(
      { data: partial },
      {
        onSuccess: () => toast.success("Dispatch preferences updated"),
        onError: (error) => {
          setPreferences(previous);
          toast.error(error.message);
        },
      },
    );
  };

  const debouncedPatch = (partial: Partial<DispatcherPreferences>, previous: DispatcherPreferences) => {
    if (debounceRef.current)
      clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      patch,
      400,
      partial,
      previous,
    );
  };

  const updateField = <K extends keyof DispatcherPreferences>(
    key: K,
    value: DispatcherPreferences[K],
    { debounce }: { debounce: boolean },
  ) => {
    const previous = preferences;
    setPreferences({
      ...preferences, [key]: value,
    });
    const partial = { [key]: value } as Partial<DispatcherPreferences>;
    if (debounce) {
      debouncedPatch(
        partial,
        previous,
      );
    }
    else {
      patch(
        partial,
        previous,
      );
    }
  };

  const toggleDay = (dayIndex: number) => {
    const active = preferences.workDays.includes(dayIndex);
    const nextDays = active
      ? preferences.workDays.filter(d => d !== dayIndex)
      : [
          ...preferences.workDays,
          dayIndex,
        ].sort((a, b) => a - b);
    updateField(
      "workDays",
      nextDays,
      { debounce: false },
    );
  };

  return (
    <>
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Shift window</CardTitle>
          <CardDescription>Timezone and the hours you're on the desk. Overnight windows wrap around midnight.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="dispatch-timezone">Timezone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={value => updateField(
                  "timezone",
                  value,
                  { debounce: false },
                )}
              >
                <SelectTrigger
                  id="dispatch-timezone"
                  className="w-full"
                >
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {timezones.map(tz => (
                    <SelectItem
                      key={tz}
                      value={tz}
                    >
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dispatch-shift-start">Start</Label>
              <Input
                id="dispatch-shift-start"
                type="time"
                value={preferences.shiftStart}
                onChange={e => updateField(
                  "shiftStart",
                  e.target.value,
                  { debounce: true },
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dispatch-shift-end">End</Label>
              <Input
                id="dispatch-shift-end"
                type="time"
                value={preferences.shiftEnd}
                onChange={e => updateField(
                  "shiftEnd",
                  e.target.value,
                  { debounce: true },
                )}
              />
            </div>
          </div>
          <CoverageStrip
            shiftStart={preferences.shiftStart}
            shiftEnd={preferences.shiftEnd}
          />
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Working days</CardTitle>
          <CardDescription>Which days you cover. Off days silence assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="group"
            aria-label="Working days"
            className="flex flex-wrap gap-2"
          >
            {WEEK_DAYS.map((day) => {
              const active = preferences.workDays.includes(day.index);
              return (
                <Button
                  key={day.index}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  aria-label={day.label}
                  aria-pressed={active}
                  disabled={updateMutation.isPending}
                  onClick={() => toggleDay(day.index)}
                >
                  {day.short}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
