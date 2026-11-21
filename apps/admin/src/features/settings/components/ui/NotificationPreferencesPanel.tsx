import type {
  PlatformAlertChannel, PlatformAlertSetting, PlatformAlertType, UpdateAlertSettingPayload,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getPlatformAlertSettingsQueryOptions,
  useUpdatePlatformAlertSetting,
} from "@truckmoov/api/auth";
import {
  AlertTriangle, Bell, CreditCard, FileCheck2, Mail, MessageSquare, Send, ServerCrash, ShieldAlert, Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import { cn } from "@/lib/utils";

/**
 * Local-only switches with no API equivalent, persisted per browser.
 * App-prefixed key: both dev servers share localhost storage (see sidebarStore).
 */
const LOCAL_PREFS_KEY = "admin-platform-alert-prefs";
type LocalPrefs = {
  inApp: boolean; suspicious: boolean;
};
// ponytail: no API field — wire to packages/api (in-app channel; suspicious-activity split of security_alerts)
const DEFAULT_LOCAL_PREFS: LocalPrefs = {
  inApp: true, suspicious: false,
};

function readLocalPrefs(): LocalPrefs {
  try {
    return {
      ...DEFAULT_LOCAL_PREFS, ...JSON.parse(localStorage.getItem(LOCAL_PREFS_KEY) || "{}"),
    };
  }
  catch {
    return DEFAULT_LOCAL_PREFS;
  }
}

/** Fleetflow's event categories, each backed by one platform alert type. */
const CATEGORIES: Array<{
  type: PlatformAlertType; icon: typeof Bell; tone: string; title: string; desc: string;
}> = [
  {
    type: "new_tenant_signup", icon: FileCheck2, tone: "text-muted-foreground", title: "Tenant Applications", desc: "New applications submitted for review",
  },
  {
    type: "billing_alerts", icon: CreditCard, tone: "text-muted-foreground", title: "Billing", desc: "Failed payments and billing issues",
  },
  {
    type: "system_errors", icon: ServerCrash, tone: "text-muted-foreground", title: "System Errors", desc: "Critical platform errors and outages",
  },
  // Not in fleetflow — the API has this alert type, so it keeps its row.
  {
    type: "installation_issues", icon: Wrench, tone: "text-muted-foreground", title: "Installation Issues", desc: "Notify when an installer reports an issue on a job",
  },
  {
    type: "security_alerts", icon: ShieldAlert, tone: "text-warning", title: "Critical Security Events", desc: "Get notified for critical and high severity events",
  },
];

const CHANNELS: Array<{
  key: PlatformAlertChannel; icon: typeof Bell; title: string;
}> = [
  {
    key: "email", icon: Mail, title: "Email",
  },
  {
    key: "sms", icon: MessageSquare, title: "SMS",
  },
];

/**
 * `/settings/notifications` — fleetflow's `SecurityNotificationPreferences`,
 * backed by `/auth/system/alert-settings` (one row per alert type):
 *
 * - **Alerts Enabled** is on while any alert type is enabled; flipping it sets
 *   every type's `enabled`.
 * - **Recipient Email** is the first `recipients` entry, written to every type
 *   on blur.
 * - **Email / SMS** are on when every type routes to that channel; flipping
 *   adds or removes it from every type's `channels`.
 * - Each **event category** is its alert type's `enabled`.
 *
 * ponytail: In-app channel, the Suspicious Activity split of `security_alerts`
 * and the Test button have no API — local / toast only.
 */
export function NotificationPreferencesPanel() {
  const {
    data, isLoading, isError, error,
  } = useQuery(getPlatformAlertSettingsQueryOptions());
  const mutation = useUpdatePlatformAlertSetting();
  const [
    bulkPending,
    setBulkPending,
  ] = useState(false);
  const [
    localPrefs,
    setLocalPrefs,
  ] = useState<LocalPrefs>(readLocalPrefs);

  const rows: PlatformAlertSetting[] = data?.data ?? [];
  const byType = new Map(rows.map(row => [
    row.alertType,
    row,
  ]));
  const savedRecipient = rows.find(r => r.recipients.length > 0)?.recipients[0] ?? "";
  const [
    recipientEmail,
    setRecipientEmail,
  ] = useState("");
  // Follow the saved value when it changes — adjusted during render, not in an effect.
  const [
    seededRecipient,
    setSeededRecipient,
  ] = useState<string | null>(null);
  if (seededRecipient !== savedRecipient) {
    setSeededRecipient(savedRecipient);
    setRecipientEmail(savedRecipient);
  }

  const alertsEnabled = rows.some(r => r.enabled);
  const pendingType = mutation.isPending && !bulkPending ? mutation.variables?.alertType : undefined;
  const controlsDisabled = isLoading || bulkPending || !alertsEnabled;

  const setLocalPref = (k: keyof LocalPrefs, v: boolean) => {
    const next = {
      ...localPrefs, [k]: v,
    };
    setLocalPrefs(next);
    try {
      localStorage.setItem(
        LOCAL_PREFS_KEY,
        JSON.stringify(next),
      );
    }
    catch {
      // Storage blocked — the switch still works for this visit.
    }
  };

  /** PATCH every alert type, one request each (the API is per type). */
  async function updateAll(build: (row: PlatformAlertSetting) => UpdateAlertSettingPayload["data"], message: string) {
    setBulkPending(true);
    try {
      await Promise.all(rows.map(row => mutation.mutateAsync({
        alertType: row.alertType, data: build(row),
      })));
      toast.success(message);
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update alert routing");
    }
    finally {
      setBulkPending(false);
    }
  }

  function toggleType(alertType: PlatformAlertType, enabled: boolean) {
    mutation.mutate(
      {
        alertType, data: { enabled },
      },
      {
        onSuccess: () => toast.success("Routing updated"),
        onError: err => toast.error(err.message),
      },
    );
  }

  function saveRecipient() {
    const email = recipientEmail.trim();
    if (email === savedRecipient)
      return;
    if (email && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    void updateAll(
      row => ({
        recipients: [
          ...(email ? [email] : []),
          ...row.recipients.slice(1),
        ],
      }),
      "Recipient email updated",
    );
  }

  function sendTestAlert() {
    // ponytail: no test-alert endpoint — wire to packages/api
    toast.info("Test alerts aren't available yet — nothing was sent.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Who receives platform alerts, through which channels, and for which events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isError && <p className="text-sm text-destructive">{error.message}</p>}

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Mail className="h-5 w-5 text-primary" /></div>
            <div>
              <h4 className="font-medium">Alerts Enabled</h4>
              <p className="text-sm text-muted-foreground">Turn all platform admin alerts on or off</p>
            </div>
          </div>
          {isLoading
            ? <Skeleton className="h-6 w-11 rounded-full" />
            : (
                <Switch
                  aria-label="Platform alerts"
                  checked={alertsEnabled}
                  disabled={bulkPending || rows.length === 0}
                  onCheckedChange={c => void updateAll(
                    () => ({ enabled: c }),
                    c ? "Alerts enabled" : "Alerts disabled",
                  )}
                />
              )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="security_recipient_email">Recipient Email</Label>
          <div className="flex gap-2">
            <Input
              id="security_recipient_email"
              type="email"
              placeholder="alerts@yourcompany.com"
              value={recipientEmail}
              disabled={isLoading || bulkPending}
              onChange={e => setRecipientEmail(e.target.value)}
              onBlur={saveRecipient}
              onKeyDown={e => e.key === "Enter" && saveRecipient()}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={sendTestAlert}
              disabled={!recipientEmail}
            >
              <Send className="mr-2 h-4 w-4" />
              Test
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">This address receives all alerts sent by email</p>
        </div>
        <Separator />
        <div className="space-y-3">
          <h4 className="font-medium">Channels</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {CHANNELS.map((c) => {
              const on = rows.length > 0 && rows.every(r => r.channels.includes(c.key));
              return (
                <label
                  key={c.key}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <c.icon className="h-4 w-4 text-muted-foreground" />
                    {c.title}
                  </span>
                  <Switch
                    aria-label={c.title}
                    checked={on}
                    disabled={controlsDisabled}
                    onCheckedChange={v => void updateAll(
                      row => ({
                        channels: v ? [
                          ...new Set([
                            ...row.channels,
                            c.key,
                          ]),
                        ] : row.channels.filter(ch => ch !== c.key),
                      }),
                      `${c.title} ${v ? "enabled" : "disabled"}`,
                    )}
                  />
                </label>
              );
            })}
            <label className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <span className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
                In-app (notifications bell)
              </span>
              <Switch
                aria-label="In-app (notifications bell)"
                checked={localPrefs.inApp}
                onCheckedChange={v => setLocalPref(
                  "inApp",
                  v,
                )}
                disabled={controlsDisabled}
              />
            </label>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h4 className="font-medium">Event Categories</h4>
          {CATEGORIES.map((r) => {
            const row = byType.get(r.type);
            if (!isLoading && !row)
              return null;
            return (
              <div
                key={r.type}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <r.icon className={cn(
                    "h-5 w-5",
                    r.tone,
                  )}
                  />
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </div>
                {!row
                  ? <Skeleton className="h-6 w-11 rounded-full" />
                  : (
                      <Switch
                        aria-label={r.title}
                        checked={row.enabled}
                        onCheckedChange={c => toggleType(
                          r.type,
                          c,
                        )}
                        disabled={controlsDisabled || pendingType === r.type}
                      />
                    )}
              </div>
            );
          })}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Suspicious Activity</p>
                <p className="text-xs text-muted-foreground">Get notified for suspicious and unusual-location sign-ins</p>
              </div>
            </div>
            <Switch
              aria-label="Suspicious Activity"
              checked={localPrefs.suspicious}
              onCheckedChange={c => setLocalPref(
                "suspicious",
                c,
              )}
              disabled={controlsDisabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
