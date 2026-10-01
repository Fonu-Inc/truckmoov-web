import type { ColumnDef } from "@tanstack/react-table";
import type { SystemAuthEvent } from "@truckmoov/api/auth";
import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemAuthEventsQueryOptions,
  getSystemTenantsQueryOptions,
} from "@truckmoov/api/auth";
import {
  formatDateInTimezone,
  TIMEZONES,
} from "@truckmoov/app-core/utils/time-utils";
import {
  CheckCircle,
  LogIn,
  XCircle,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { usePreferences } from "@/contexts/PreferencesContext";

const FILTER_FIELDS: FilterField[] = [
  {
    key: "dateRange", label: "Date range", type: "daterange",
  },
];

const STATUS_OPTIONS = [
  {
    value: "all", label: "All results",
  },
  {
    value: "success", label: "Worked",
  },
  {
    value: "failed", label: "Failed",
  },
];

const ACTION_LABELS: Record<string, string> = {
  login: "Signed in",
  logout: "Signed out",
  refresh: "Stayed signed in",
  access: "Tried a page they cannot use",
};

const FAILURE_LABELS: Record<string, string> = {
  account_locked: "Account blocked or email not verified",
  mfa_failed: "Verification code refused",
  suspicious: "Flagged as suspicious",
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [
    debounced,
    setDebounced,
  ] = useState(value);
  useEffect(
    () => {
      const timeout = window.setTimeout(
        setDebounced,
        delayMs,
        value,
      );
      return () => window.clearTimeout(timeout);
    },
    [
      delayMs,
      value,
    ],
  );
  return debounced;
}

function ResultBadge({ event }: { event: SystemAuthEvent }) {
  if (event.status === "success") {
    return (
      <Badge className="bg-success/10 text-success border-success/30">
        <CheckCircle className="h-3 w-3 mr-1" />
        Worked
      </Badge>
    );
  }
  if (event.status === "failed") {
    const reason = event.failureReason
      ? FAILURE_LABELS[event.failureReason] ?? "Sign-in refused"
      : null;
    return (
      <div className="space-y-1">
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
        {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
      </div>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}

function companyName(
  tenantId: string | null | undefined,
  names: Map<string, string>,
) {
  if (!tenantId)
    return "—";
  if (tenantId === "system")
    return "Fonu platform team";
  return names.get(tenantId) ?? "—";
}

export default function PlatformSignIns() {
  const { timezone } = usePreferences();
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
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    pageSize,
    setPageSize,
  ] = useState(25);

  const debouncedSearch = useDebouncedValue(
    search,
    300,
  );
  const from = filters.dateRange?.enabled ? filters.dateRange.dateFrom : undefined;
  const to = filters.dateRange?.enabled ? filters.dateRange.dateTo : undefined;
  const statusParam = status === "success" || status === "failed" ? status : undefined;

  useEffect(
    () => {
      setPage(1);
    },
    [
      debouncedSearch,
      statusParam,
      from,
      to,
      pageSize,
    ],
  );

  const eventsQuery = useQuery(
    getSystemAuthEventsQueryOptions({
      params: {
        offset: (page - 1) * pageSize,
        limit: pageSize,
        search: debouncedSearch || undefined,
        status: statusParam,
        from: from || undefined,
        to: to || undefined,
      },
    }),
  );
  const tenantsQuery = useQuery(getSystemTenantsQueryOptions());

  const tenantNames = useMemo(
    () => new Map(
      (tenantsQuery.data?.data.tenants ?? []).map(t => [
        t.id,
        t.name,
      ]),
    ),
    [tenantsQuery.data],
  );

  const items = eventsQuery.data?.data.items ?? [];
  const total = eventsQuery.data?.data.total ?? 0;

  const columns = useMemo<ColumnDef<SystemAuthEvent>[]>(
    () => [
      {
        id: "who",
        header: "Who",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.email ?? "—"}</span>
        ),
      },
      {
        id: "company",
        header: "Company",
        cell: ({ row }) => (
          <span className="text-sm">{companyName(
            row.original.tenantId,
            tenantNames,
          )}
          </span>
        ),
      },
      {
        id: "what",
        header: "What happened",
        cell: ({ row }) => (
          <span className="text-sm">
            {ACTION_LABELS[row.original.eventType ?? ""] ?? "Other activity"}
          </span>
        ),
      },
      {
        id: "result",
        header: "Result",
        cell: ({ row }) => <ResultBadge event={row.original} />,
      },
      {
        id: "when",
        header: `When (${TIMEZONES[timezone].offset})`,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.occurredAt
              ? formatDateInTimezone(
                  row.original.occurredAt,
                  timezone,
                  {
                    dateStyle: "medium", timeStyle: "short",
                  },
                )
              : "—"}
          </span>
        ),
      },
    ],
    [
      timezone,
      tenantNames,
    ],
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5 text-primary" />
          Sign-ins
        </CardTitle>
        <CardDescription>Who signed in, who was turned away, and when, across all companies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by email..."
            status={status}
            onStatusChange={setStatus}
            statusOptions={STATUS_OPTIONS}
            filterEntity="sign-ins"
            filterFields={FILTER_FIELDS}
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
            errorMessage={eventsQuery.error?.message ?? "Could not load sign-ins"}
            onRetry={() => eventsQuery.refetch()}
            hasActiveFilters={
              Boolean(debouncedSearch)
              || Boolean(statusParam)
              || Object.values(filters).some(f => f?.enabled)
            }
            emptyState="No sign-ins yet."
            filteredEmptyState="No sign-ins match your filters."
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
  );
}
