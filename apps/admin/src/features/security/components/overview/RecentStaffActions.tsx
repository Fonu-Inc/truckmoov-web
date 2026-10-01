import { useQuery } from "@tanstack/react-query";
import { getSystemActionHistoryQueryOptions } from "@truckmoov/api/auth";
import type { SystemAuditLogEntry } from "@truckmoov/api/auth";
import { formatDateInTimezone } from "@truckmoov/app-core/utils/time-utils";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { usePreferences } from "@/contexts/PreferencesContext";
import { ListSkeleton } from "@/components/ui/skeletons";
import { describeAction } from "@/utils/auditActions";

const PREFIXES = ["system.tenant.", "system.sim.", "system.device."];
const SHOWN = 8;

const OVERRIDES: Record<string, string> = {
  "system.tenant.suspended": "Suspended a customer",
  "system.tenant.reactivated": "Reinstated a customer",
  "system.tenant.status_changed": "Changed a customer's status",
};

function simSuspensionSentence(entry: SystemAuditLogEntry) {
  return entry.summary?.toLowerCase().includes("reactivated") ? "Reinstated a SIM" : "Suspended a SIM";
}

function actionSentence(entry: SystemAuditLogEntry) {
  if (entry.action === "system.sim.suspension_changed")
    return simSuspensionSentence(entry);
  return OVERRIDES[entry.action] ?? describeAction(entry.action);
}

function entrySentence(entry: SystemAuditLogEntry) {
  const who = entry.actorName ?? entry.actorEmail ?? "A staff member";
  const what = actionSentence(entry);
  const where = entry.tenantName ? ` for ${entry.tenantName}` : "";
  return `${who} ${what.charAt(0).toLowerCase()}${what.slice(1)}${where}`;
}

function ActionRow({ entry, timezone }: { entry: SystemAuditLogEntry; timezone: Parameters<typeof formatDateInTimezone>[1] }) {
  return (
    <li className="flex items-start justify-between gap-4 py-3 text-sm">
      <span>{entrySentence(entry)}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDateInTimezone(entry.occurredAt, timezone, { dateStyle: "medium", timeStyle: "short" })}
      </span>
    </li>
  );
}

export function RecentStaffActions() {
  const { timezone } = usePreferences();
  const { data, isPending, isError, refetch } = useQuery(
    getSystemActionHistoryQueryOptions({ prefixes: PREFIXES, limit: SHOWN }),
  );
  const entries = data?.slice(0, SHOWN) ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent staff actions</CardTitle>
        <CardDescription>Suspensions and reinstatements by our team</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending && <ListSkeleton rows={4} />}
        {isError && (
          <div className="py-4 text-center">
            <p className="text-sm font-medium">Couldn't load recent actions</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        )}
        {data && entries.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">No actions recorded yet.</p>
        )}
        {entries.length > 0 && (
          <ul className="divide-y">
            {entries.map(entry => <ActionRow key={entry.id} entry={entry} timezone={timezone} />)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
