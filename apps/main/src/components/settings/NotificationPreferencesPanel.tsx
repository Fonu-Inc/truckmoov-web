import type { NotificationPreferences } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getNotificationPreferencesQueryOptions,

  useUpdateNotificationPreferences,
} from "@truckmoov/api/auth";
import {
  AlertCircle, Bell, Mail, Phone,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";

import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";

type SupportedPreferenceKey = "incidentAlerts" | "smsAlerts" | "pushAlerts";

type PreferenceRow = {
  key: string;
  label: string;
  description: string;
  apiKey?: SupportedPreferenceKey;
  icon?: typeof Bell;
};

const ALERT_PREFERENCES: PreferenceRow[] = [
  {
    key: "jobAssignment", label: "Job Assignments", description: "When new jobs are assigned to drivers",
  },
  {
    key: "jobCompletion", label: "Job Completions", description: "When jobs are marked as completed",
  },
  {
    key: "driverAlerts", apiKey: "incidentAlerts", label: "Driver Alerts", description: "SOS signals and emergency notifications",
  },
  {
    key: "maintenanceReminders", label: "Maintenance Reminders", description: "Upcoming vehicle maintenance schedules",
  },
  {
    key: "fuelAlerts", label: "Fuel Alerts", description: "Low fuel warnings and refueling events",
  },
  {
    key: "geofenceAlerts", label: "Geofence Alerts", description: "When vehicles enter or exit zones",
  },
];

const DELIVERY_CHANNELS: PreferenceRow[] = [
  {
    key: "emailDigest", label: "Email Digest", description: "Daily summary of all activities", icon: Mail,
  },
  {
    key: "smsAlerts", apiKey: "smsAlerts", label: "SMS Alerts", description: "Critical alerts via SMS", icon: Phone,
  },
  {
    key: "pushNotifications", apiKey: "pushAlerts", label: "Push Notifications", description: "Real-time browser notifications", icon: Bell,
  },
];

function LoadingPanel() {
  return (
    <div
      className="space-y-6"
      aria-label="Loading notification preferences"
    >
      {[
        6,
        3,
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
                className="h-16 w-full"
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function NotificationPreferencesPanel() {
  const preferencesQuery = useQuery(getNotificationPreferencesQueryOptions());
  const updateMutation = useUpdateNotificationPreferences();
  const serverPreferences = preferencesQuery.data?.data.notificationPreferences;
  const [
    preferences,
    setPreferences,
  ] = useState<NotificationPreferences | null>(null);

  useEffect(
    () => {
      if (serverPreferences)
        setPreferences(serverPreferences);
    },
    [serverPreferences],
  );

  if (preferencesQuery.isPending)
    return <LoadingPanel />;

  if (preferencesQuery.isError || !preferences) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load notification preferences</AlertTitle>
        <AlertDescription>{preferencesQuery.error?.message ?? "The server returned an invalid response."}</AlertDescription>
      </Alert>
    );
  }

  const updatePreference = (key: SupportedPreferenceKey, checked: boolean) => {
    const previousValue = preferences[key];
    setPreferences(current => current
      ? {
          ...current, [key]: checked,
        }
      : current);

    updateMutation.mutate(
      { data: { [key]: checked } },
      {
        onSuccess: () => toast.success("Notification preference updated"),
        onError: (error) => {
          setPreferences(current => current
            ? {
                ...current, [key]: previousValue,
              }
            : current);
          toast.error(error.message);
        },
      },
    );
  };

  const renderRows = (rows: PreferenceRow[], showIcons = false) => rows.map((item) => {
    const isSupported = item.apiKey !== undefined;
    const Icon = item.icon;
    return (
      <div
        key={item.key}
        className="flex items-center justify-between gap-4 py-3 border-b border-border/50 last:border-0"
      >
        <div className={showIcons ? "flex items-center gap-3" : undefined}>
          {showIcons && Icon && (
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{item.label}</p>
              {!isSupported && <Badge variant="outline">Backend support required</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
        <Switch
          aria-label={item.label}
          checked={isSupported ? preferences[item.apiKey!] : false}
          disabled={!isSupported || updateMutation.isPending}
          onCheckedChange={checked => item.apiKey && updatePreference(
            item.apiKey,
            checked,
          )}
        />
      </div>
    );
  });

  return (
    <>
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Alert Preferences</CardTitle>
          <CardDescription>Choose which events trigger notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{renderRows(ALERT_PREFERENCES)}</CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Delivery Channels</CardTitle>
          <CardDescription>How you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderRows(
            DELIVERY_CHANNELS,
            true,
          )}
        </CardContent>
      </Card>
    </>
  );
}
