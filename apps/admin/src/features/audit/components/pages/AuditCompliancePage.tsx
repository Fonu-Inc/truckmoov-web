import type {
  FilterDraft, FilterField,
} from "@/components/shadcn/platform-filter-popover";
import type {
  AuditView, UnifiedAuditEntry,
} from "@/features/audit/utils/unifiedAudit";
import { useQuery } from "@tanstack/react-query";
import { getSystemAuditLogQueryOptions } from "@truckmoov/api/auth";
import { formatDateInTimezone } from "@truckmoov/app-core/utils/time-utils";
import {
  Archive, Lock, Search, ShieldCheck,
} from "lucide-react";
import {
  useMemo, useRef, useState,
} from "react";
import { useSearchParams } from "react-router";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import {
  buildEmptyDraft, PlatformFilterPopover,
} from "@/components/shadcn/platform-filter-popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  outClass, sevClass,
} from "@/features/audit/components/ui/auditBadgeStyles";
import { AuditEntryDialog } from "@/features/audit/components/ui/AuditEntryDialog";
import { useHorizontalOverflow } from "@/features/audit/hooks/useHorizontalOverflow";
import {
  buildDemoAuditEntries,
  CATEGORY_LABELS,
  filterUnifiedAudit,
  fromSystemAuditEntry,
  OUTCOME_LABELS,
  SEVERITY_LABELS,
  SOURCE_LABELS,
  VIEW_LABELS,
  VIEWS,
} from "@/features/audit/utils/unifiedAudit";
import { cn } from "@/lib/utils";

/** GET /auth/system/audit-log caps `limit` at 500 and has no offset. */
const AUDIT_LOG_LIMIT = 500;

const exportColumns = [
  {
    header: "Timestamp", accessor: (r: UnifiedAuditEntry) => r.timestamp,
  },
  {
    header: "Actor", accessor: (r: UnifiedAuditEntry) => r.actorName,
  },
  {
    header: "Actor email", accessor: (r: UnifiedAuditEntry) => r.actorEmail ?? "",
  },
  {
    header: "Event", accessor: (r: UnifiedAuditEntry) => r.action,
  },
  {
    header: "Category", accessor: (r: UnifiedAuditEntry) => CATEGORY_LABELS[r.category],
  },
  {
    header: "Outcome", accessor: (r: UnifiedAuditEntry) => OUTCOME_LABELS[r.outcome],
  },
  {
    header: "Severity", accessor: (r: UnifiedAuditEntry) => SEVERITY_LABELS[r.severity],
  },
  {
    header: "Resource", accessor: (r: UnifiedAuditEntry) => r.resource,
  },
  {
    header: "Tenant", accessor: (r: UnifiedAuditEntry) => r.tenantName,
  },
  {
    header: "IP address", accessor: (r: UnifiedAuditEntry) => r.ipAddress ?? "",
  },
  {
    header: "Location", accessor: (r: UnifiedAuditEntry) => r.location ?? "",
  },
  {
    header: "Device", accessor: (r: UnifiedAuditEntry) => r.device ?? "",
  },
  {
    header: "Source", accessor: (r: UnifiedAuditEntry) => SOURCE_LABELS[r.source],
  },
  {
    header: "Description", accessor: (r: UnifiedAuditEntry) => r.description,
  },
];

/**
 * One immutable cross-tenant audit log — security events, SIM activity and
 * platform operations — with saved views as tabs, kept in `?view=`. Replaces the old
 * Security section and Compliance & Audit page (both URLs redirect here).
 *
 * Live rows come from GET /auth/system/audit-log. When that errors or returns
 * nothing, the page shows fleetflow's 30 demo entries instead, so it never
 * renders empty — real records replace the sample entries.
 */
export default function AuditCompliancePage() {
  const [
    params,
    setParams,
  ] = useSearchParams();
  const { timezone } = usePreferences();
  const liveQuery = useQuery(getSystemAuditLogQueryOptions({ params: { limit: AUDIT_LOG_LIMIT } }));
  const isLoading = liveQuery.isLoading;
  const live = liveQuery.data?.data?.items;

  const viewParam = params.get("view") as AuditView | null;
  const view: AuditView = viewParam && VIEWS.includes(viewParam) ? viewParam : "all";
  const setParam = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(patch).forEach(([
      k,
      v,
    ]) => (v === null ? p.delete(k) : p.set(
      k,
      v,
    )));
    setParams(
      p,
      { replace: true },
    );
  };

  const entries: UnifiedAuditEntry[] = useMemo(
    () => {
      if (isLoading)
        return [];
      return live && live.length > 0 ? live.map(fromSystemAuditEntry) : buildDemoAuditEntries();
    },
    [
      isLoading,
      live,
    ],
  );

  const fields: FilterField[] = useMemo(
    () => {
      const uniq = <T,>(arr: [string, T][]) => Array.from(new Map(arr).entries());
      return [
        {
          key: "tenant", label: "Tenant", type: "select", options: uniq(entries.map(e => [
            e.tenantId,
            e.tenantName,
          ])).map(([
            value,
            label,
          ]) => ({
            value, label,
          })),
        },
        {
          key: "actor", label: "Actor / user", type: "select", options: uniq(entries.map(e => [
            e.actorEmail || e.actorName,
            e.actorEmail ? `${e.actorName} (${e.actorEmail})` : e.actorName,
          ])).map(([
            value,
            label,
          ]) => ({
            value, label,
          })),
        },
        {
          key: "eventType", label: "Event type", type: "select", options: uniq(entries.map(e => [
            e.eventType,
            e.action,
          ])).map(([
            value,
            label,
          ]) => ({
            value, label,
          })),
        },
        {
          key: "category", label: "Category", type: "select", options: Object.entries(CATEGORY_LABELS).map(([
            value,
            label,
          ]) => ({
            value, label,
          })),
        },
        {
          key: "outcome", label: "Outcome", type: "select", options: Object.entries(OUTCOME_LABELS).map(([
            value,
            label,
          ]) => ({
            value, label,
          })),
        },
        {
          key: "severity", label: "Severity", type: "select", options: Object.entries(SEVERITY_LABELS).map(([
            value,
            label,
          ]) => ({
            value, label,
          })),
        },
        {
          key: "source", label: "Source", type: "select", options: Object.entries(SOURCE_LABELS).map(([
            value,
            label,
          ]) => ({
            value, label,
          })),
        },
        {
          key: "date", label: "Date range", type: "date",
        },
      ];
    },
    [entries],
  );

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    draft,
    setDraft,
  ] = useState<FilterDraft>(() => {
    const d = buildEmptyDraft(fields);
    const t = params.get("tenant");
    if (t) {
      d.tenant = {
        enabled: true, value: t,
      };
    }
    return d;
  });
  const rows = useMemo(
    () => {
      const pick = (k: string) => (draft[k]?.enabled ? draft[k]?.value || undefined : undefined);
      return filterUnifiedAudit(
        entries,
        {
          search,
          view,
          tenant: pick("tenant"),
          actor: pick("actor"),
          eventType: pick("eventType"),
          category: pick("category"),
          outcome: pick("outcome"),
          severity: pick("severity"),
          source: pick("source"),
          from: draft.date?.enabled ? draft.date.from : undefined,
          to: draft.date?.enabled ? draft.date.to : undefined,
        },
      );
    },
    [
      entries,
      search,
      view,
      draft,
    ],
  );

  // A row click picks an entry; otherwise `?event=<id>` (the notification deep link) does.
  const [
    picked,
    setPicked,
  ] = useState<UnifiedAuditEntry | null>(null);
  const eventParam = params.get("event");
  const selected = picked ?? (eventParam ? entries.find(e => e.id === eventParam) ?? null : null);
  const closeDetails = () => {
    setPicked(null);
    if (eventParam)
      setParam({ event: null });
  };

  const fmt = (ts: string) => formatDateInTimezone(
    ts,
    timezone,
    {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    },
  );

  // Fleetflow hides its scroll hint at `xl`, so wide screens that still overflow
  // got no cue. Here the hint and the right-edge fade follow the real overflow.
  const tableRef = useRef<HTMLTableElement>(null);
  const {
    overflows, atEnd,
  } = useHorizontalOverflow(tableRef);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Total Entries"
          value={entries.length.toLocaleString()}
          icon={Archive}
          loading={isLoading}
        />
        <StatCard
          title="Immutability"
          value="Enforced"
          icon={Lock}
        />
        <StatCard
          title="Retention (NCC)"
          value="7 years"
          icon={ShieldCheck}
        />
      </div>

      <Tabs
        value={view}
        onValueChange={(value) => {
          if (VIEWS.includes(value as AuditView)) {
            setParam({
              view: value, event: null,
            });
          }
        }}
        className="space-y-4"
      >
        <TabsList
          aria-label="Audit views"
          className="h-auto flex-wrap"
        >
          {VIEWS.map(v => (
            <TabsTrigger
              key={v}
              value={v}
            >
              {VIEW_LABELS[v]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent
          value={view}
          className="mt-0"
        >
          <Card className="min-w-0">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Audit Log</CardTitle>
                  <CardDescription>Immutable cross-tenant audit trail retained for 7 years per NCC requirements</CardDescription>
                </div>
                <ExportButton
                  rows={rows}
                  columns={exportColumns}
                  filename="platform_audit_log"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Search audit log"
                    placeholder="Search actor, event, resource, tenant, IP or location..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <PlatformFilterPopover
                  entity="audit entries"
                  fields={fields}
                  value={draft}
                  onApply={setDraft}
                  onReset={() => setDraft(buildEmptyDraft(fields))}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {overflows && (
                <p
                  className={cn(
                    "text-xs text-muted-foreground",
                    atEnd && "invisible",
                  )}
                  aria-hidden={atEnd}
                >
                  Scroll sideways to see all columns →
                </p>
              )}
              <div className="relative">
                <div className="max-w-full overflow-x-auto rounded-xl border">
                  <Table
                    ref={tableRef}
                    className="min-w-[1180px]"
                  >
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Outcome / Severity</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>IP &amp; Location</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading && entries.length === 0
                        ? (
                            <TableRow>
                              <TableCell
                                colSpan={9}
                                className="py-8 text-center text-muted-foreground"
                              >
                                Loading…
                              </TableCell>
                            </TableRow>
                          )
                        : rows.length === 0
                          ? (
                              <TableRow>
                                <TableCell
                                  colSpan={9}
                                  className="py-8 text-center text-muted-foreground"
                                >
                                  No audit entries match these filters.
                                </TableCell>
                              </TableRow>
                            )
                          : rows.map(e => (
                              <TableRow
                                key={e.id}
                                className="cursor-pointer align-top"
                                onClick={() => setPicked(e)}
                              >
                                <TableCell className="whitespace-nowrap text-sm">{fmt(e.timestamp)}</TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium">{e.actorName}</div>
                                  {e.actorEmail && <div className="text-xs text-muted-foreground">{e.actorEmail}</div>}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{e.action}</div>
                                  <div className="text-xs text-muted-foreground">{CATEGORY_LABELS[e.category]}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "rounded-full whitespace-nowrap",
                                        outClass[e.outcome],
                                      )}
                                    >
                                      {OUTCOME_LABELS[e.outcome]}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "rounded-full whitespace-nowrap",
                                        sevClass[e.severity],
                                      )}
                                    >
                                      {SEVERITY_LABELS[e.severity]}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">{e.resource}</TableCell>
                                <TableCell className="text-sm">{e.tenantName}</TableCell>
                                <TableCell>
                                  <div className="font-mono text-xs">{e.ipAddress ?? "—"}</div>
                                  <div className="text-xs text-muted-foreground">{e.location ?? "—"}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full"
                                  >
                                    {SOURCE_LABELS[e.source]}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      setPicked(e);
                                    }}
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                    </TableBody>
                  </Table>
                </div>
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-y-px right-px w-12 rounded-r-xl bg-gradient-to-l from-card to-transparent transition-opacity",
                    overflows && !atEnd ? "opacity-100" : "opacity-0",
                  )}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {rows.length}
                  {" "}
                  of
                  {" "}
                  {entries.length}
                  {" "}
                  entries ·
                  {" "}
                  {VIEW_LABELS[view]}
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Entries are immutable. Retained for 7 years per NCC regulatory requirement.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditEntryDialog
        entry={selected}
        onClose={closeDetails}
        formatTimestamp={fmt}
      />
    </div>
  );
}
