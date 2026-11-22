import type { ActivityLog } from "@truckmoov/api/auth";
import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import { useQuery } from "@tanstack/react-query";
import {
  getActivityLogQueryOptions, getOrganizationUsersQueryOptions,
} from "@truckmoov/api/auth";
import {
  Activity, Download, FilePen, FilePlus2, FileX2, ListChecks, Shield,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { ExportButton } from "@/components/shadcn/export-button";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { getRoleLabel } from "@/features/auth/utils/role-label";
import { FleetTablePager } from "@/features/fleet/components/ui/FleetTablePager";
import { useClientPage } from "@/features/fleet/utils/useClientPage";
import { cn } from "@/lib/utils";

/** The design app's three action badges. Anything else shows the raw action. */
type AuditVerb = "create" | "update" | "delete";

type AuditLogEntry = {
  id: string;
  user: string;
  role: string;
  roleKey: string;
  verb: AuditVerb | null;
  action: string;
  category: string;
  entity: string;
  details: string;
  timestamp: Date;
};

const VERB_PATTERNS: [AuditVerb, RegExp][] = [
  [
    "create",
    /creat|add|invit|register|upload/i,
  ],
  [
    "update",
    /updat|edit|chang|assign|enabl|disabl|verif|approv|renam/i,
  ],
  [
    "delete",
    /delet|remov|revok|terminat|archiv/i,
  ],
];

function classifyAction(action: string): AuditVerb | null {
  return VERB_PATTERNS.find(([
    , pattern,
  ]) => pattern.test(action))?.[0] ?? null;
}

function titleCase(value: string): string {
  return value
    .replace(
      /[_.-]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      c => c.toUpperCase(),
    );
}

/** The design app's audit-log role tints (Tenant Admin → info, Operations Manager → accent, the rest → warning). */
const roleColors: Record<string, string> = {
  ENTERPRISE_ADMIN: "bg-info/15 text-info border-info/30",
  AGGREGATOR_ADMIN: "bg-info/15 text-info border-info/30",
  OWNER_OPERATOR: "bg-info/15 text-info border-info/30",
  OPERATIONS_MANAGER: "bg-accent/15 text-accent border-accent/30",
};
const DEFAULT_ROLE_COLOR = "bg-warning/15 text-warning border-warning/30";

const actionColors: Record<AuditVerb, string> = {
  create: "bg-success/20 text-success border-success/30",
  update: "bg-primary/20 text-primary border-primary/30",
  delete: "bg-destructive/20 text-destructive border-destructive/30",
};
const DEFAULT_ACTION_COLOR = "bg-muted text-muted-foreground border-border";

// The design app's card, verbatim. The shared shadcn `Card` adds a border and shadow it doesn't have.
const CARD = "rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50";

const COLUMN_COUNT = 7;

const formatTimestamp = (d: Date) => d.toLocaleString("en-GB");

/**
 * Settings → Audit Log. Routed directly from `shared/lib/route.tsx`.
 * Rows come from the tenant activity log (`GET /auth/activity-log`); actor
 * names are resolved against the organisation's members.
 */
export function AuditLogPanel() {
  const activityQuery = useQuery(getActivityLogQueryOptions());
  const usersQuery = useQuery(getOrganizationUsersQueryOptions());

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    filters,
    setFilters,
  ] = useState<FilterValues>({});

  const entries = useMemo<AuditLogEntry[]>(
    () => {
      const names = new Map(
        (usersQuery.data?.data.users ?? []).map(u => [
          u.userId,
          u.profile?.fullName || u.email,
        ]),
      );
      return (activityQuery.data?.data ?? []).map((log: ActivityLog) => ({
        id: log.id,
        user: names.get(log.actorId) ?? (log.actorId || "—"),
        role: log.actorRole ? getRoleLabel(log.actorRole) : "—",
        roleKey: log.actorRole,
        verb: classifyAction(log.action),
        action: log.action,
        category: log.entityType ? titleCase(log.entityType) : "—",
        entity: log.entityId || "—",
        details: log.summary || "—",
        timestamp: new Date(log.occurredAt),
      }));
    },
    [
      activityQuery.data,
      usersQuery.data,
    ],
  );

  const categories = useMemo(
    () => [...new Set(entries.map(e => e.category))].filter(c => c !== "—").sort(),
    [entries],
  );

  const filterFields: FilterField[] = [
    {
      type: "select",
      key: "category",
      label: "Category",
      options: categories.map(c => ({
        value: c, label: c,
      })),
    },
    {
      type: "daterange", key: "timestamp", label: "Date & Time Range",
    },
  ];

  const filtered = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      const category = filters.category;
      const range = filters.timestamp;
      return entries.filter((e) => {
        if (q && ![
          e.user,
          e.entity,
          e.details,
        ].some(v => v.toLowerCase().includes(q))) {
          return false;
        }
        if (status !== "all" && e.verb !== status)
          return false;
        if (category?.enabled && category.value && e.category !== category.value)
          return false;
        if (range?.enabled) {
          if (range.dateFrom && e.timestamp < new Date(`${range.dateFrom}T00:00:00`))
            return false;
          if (range.dateTo && e.timestamp > new Date(`${range.dateTo}T23:59:59.999`))
            return false;
        }
        return true;
      });
    },
    [
      entries,
      search,
      status,
      filters,
    ],
  );

  const auditPage = useClientPage(filtered);

  const stats = [
    {
      label: "Total Events", value: entries.length, icon: Activity, tint: "bg-primary/20", color: "text-primary",
    },
    {
      label: "Creates", value: entries.filter(e => e.verb === "create").length, icon: FilePlus2, tint: "bg-success/20", color: "text-success",
    },
    {
      label: "Updates", value: entries.filter(e => e.verb === "update").length, icon: FilePen, tint: "bg-primary/20", color: "text-primary",
    },
    {
      label: "Deletes", value: entries.filter(e => e.verb === "delete").length, icon: FileX2, tint: "bg-destructive/20", color: "text-destructive",
    },
  ];

  const hasActiveFilters = !!search || status !== "all" || Object.values(filters).some(f => f?.enabled);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div
              key={s.label}
              className={CARD}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    s.tint,
                  )}
                  >
                    <s.icon className={cn(
                      "h-5 w-5",
                      s.color,
                    )}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    {activityQuery.isLoading
                      ? <Skeleton className="h-7 w-10" />
                      : <p className="text-xl font-bold truncate">{s.value}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={CARD}>
          <div className="space-y-1.5 p-6 pb-4 flex flex-row items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Activity Log
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Recorded activity and changes, listed with their dates and details.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton
                rows={filtered}
                filename="audit-log"
                columns={[
                  {
                    header: "User", accessor: "user",
                  },
                  {
                    header: "Role", accessor: "role",
                  },
                  {
                    header: "Action", accessor: e => e.verb ?? e.action,
                  },
                  {
                    header: "Category", accessor: "category",
                  },
                  {
                    header: "Entity", accessor: "entity",
                  },
                  {
                    header: "Details", accessor: "details",
                  },
                  {
                    header: "Timestamp", accessor: e => formatTimestamp(e.timestamp),
                  },
                ]}
              />
              <Button
                variant="gradient"
                onClick={() => toast.success(`Report generated for ${filtered.length} entries`)}
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by user, entity or details..."
              status={status}
              onStatusChange={setStatus}
              statusOptions={[
                {
                  value: "all", label: "All actions",
                },
                {
                  value: "create", label: "Create",
                },
                {
                  value: "update", label: "Update",
                },
                {
                  value: "delete", label: "Delete",
                },
              ]}
              filterEntity="events"
              filterFields={filterFields}
              filterValues={filters}
              onFiltersApply={setFilters}
            />
            <div className="rounded-md border border-border/50 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityQuery.isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow
                          key={`skeleton-${i}`}
                          className="border-border/50"
                        >
                          {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : activityQuery.isError
                      ? (
                          <TableRow>
                            <TableCell
                              colSpan={COLUMN_COUNT}
                              className="text-center py-8"
                            >
                              <p className="text-destructive">Unable to load the audit log.</p>
                              <Button
                                variant="link"
                                className="mt-1"
                                onClick={() => activityQuery.refetch()}
                              >
                                Retry
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      : filtered.length === 0
                        ? (
                            <TableRow>
                              <TableCell
                                colSpan={COLUMN_COUNT}
                                className="text-center py-8 text-muted-foreground"
                              >
                                {hasActiveFilters ? "No audit events match your filters." : "No audit events recorded yet."}
                              </TableCell>
                            </TableRow>
                          )
                        : auditPage.pageRows.map(e => (
                            <TableRow
                              key={e.id}
                              className="border-border/50"
                            >
                              <TableCell className="font-medium">{e.user}</TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-1 font-medium ${roleColors[e.roleKey] ?? DEFAULT_ROLE_COLOR}`}>
                                  <Shield className="h-3 w-3" />
                                  {e.role}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm hover:bg-primary/90 ${e.verb ? actionColors[e.verb] : DEFAULT_ACTION_COLOR}`}>
                                  {e.verb ?? e.action}
                                </div>
                              </TableCell>
                              <TableCell>{e.category}</TableCell>
                              <TableCell>{e.entity}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-md truncate">{e.details}</TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatTimestamp(e.timestamp)}</TableCell>
                            </TableRow>
                          ))}
                </TableBody>
              </Table>
            </div>
            <FleetTablePager
              page={auditPage.page}
              pageSize={auditPage.pageSize}
              total={auditPage.total}
              onPageChange={auditPage.setPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
