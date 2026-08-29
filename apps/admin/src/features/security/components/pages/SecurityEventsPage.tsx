import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemSecurityEventsQueryOptions,
} from "@truckmoov/api/auth";
import type {
  SystemSecurityEvent,
  SystemSecurityEventSeverity,
} from "@truckmoov/api/auth";
import {
  formatDateInTimezone,
  TIMEZONES,
} from "@truckmoov/app-core/utils/time-utils";
import { Building2, Clock, Download, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  TableToolbar,
  type FilterField,
  type FilterValues,
} from "@/components/shadcn/table-toolbar";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  getSecurityEventIcon,
  getSeverityBadge,
} from "@/features/security/utils/securityBadges";

// ponytail: `tenantId` filter dropped — mocked list was hard-coded and the
// server takes a raw tenantId string. Re-add when there's a tenant lookup source.
const SECURITY_EVENT_FILTER_FIELDS: FilterField[] = [
  { key: "dateRange", label: "Date range", type: "daterange" },
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "All severities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(setDebounced, delayMs, value);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);
  return debounced;
}

function formatEventType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function SecurityEventsPage() {
  const { timezone } = usePreferences();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [filters, setFilters] = useState<FilterValues>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const debouncedSearch = useDebouncedValue(search, 300);
  const from = filters.dateRange?.enabled ? filters.dateRange.dateFrom : undefined;
  const to = filters.dateRange?.enabled ? filters.dateRange.dateTo : undefined;
  const severityParam =
    severity === "low" || severity === "medium" || severity === "high" || severity === "critical"
      ? (severity as SystemSecurityEventSeverity)
      : undefined;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, severityParam, from, to, pageSize]);

  const eventsQuery = useQuery(
    getSystemSecurityEventsQueryOptions({
      params: {
        offset: (page - 1) * pageSize,
        limit: pageSize,
        search: debouncedSearch || undefined,
        severity: severityParam,
        from: from || undefined,
        to: to || undefined,
      },
    }),
  );

  const items = eventsQuery.data?.data.items ?? [];
  const total = eventsQuery.data?.data.total ?? 0;

  const columns = useMemo<ColumnDef<SystemSecurityEvent>[]>(() => [
    {
      id: "event",
      header: "Event",
      cell: ({ row }) => (
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {getSecurityEventIcon(row.original.eventType)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {formatEventType(row.original.eventType)}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[360px]">
              {row.original.summary ?? "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "severity",
      header: "Severity",
      cell: ({ row }) => getSeverityBadge((row.original.severity ?? "low") as SystemSecurityEventSeverity),
    },
    {
      id: "tenant",
      header: "Tenant",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-xs truncate max-w-[200px]">
            {row.original.tenantId ?? "System"}
          </span>
        </div>
      ),
    },
    {
      id: "related",
      header: "Related",
      cell: ({ row }) => {
        const t = row.original.relatedEntityType;
        const id = row.original.relatedEntityId;
        if (!t && !id) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">{t ?? "—"}</p>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono truncate inline-block max-w-[200px]">
              {id ?? "—"}
            </code>
          </div>
        );
      },
    },
    {
      id: "time",
      header: `Time (${TIMEZONES[timezone].offset})`,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {row.original.occurredAt
            ? formatDateInTimezone(row.original.occurredAt, timezone, { hour: "2-digit", minute: "2-digit" })
            : "—"}
        </div>
      ),
    },
  ], [timezone]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Security Events
              </CardTitle>
              <CardDescription>
                Full event log of authentication, access control and suspicious activity
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Coming soon")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search events..."
              status={severity}
              onStatusChange={setSeverity}
              statusOptions={SEVERITY_OPTIONS}
              filterEntity="security events"
              filterFields={SECURITY_EVENT_FILTER_FIELDS}
              filterValues={filters}
              onFiltersApply={setFilters}
            />
          </div>
          <div className="rounded-lg border">
            <DataTable
              columns={columns}
              data={items}
              isLoading={eventsQuery.isLoading}
              isError={eventsQuery.isError}
              errorMessage={eventsQuery.error?.message ?? "Failed to load"}
              onRetry={() => eventsQuery.refetch()}
              hasActiveFilters={
                Boolean(debouncedSearch)
                || Boolean(severityParam)
                || Object.values(filters).some(f => f?.enabled)
              }
              emptyState="No security events."
              filteredEmptyState="No events match your filters."
              pagination={{
                page,
                pageSize,
                total,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
