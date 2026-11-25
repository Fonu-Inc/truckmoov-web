import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import type { InstallationRecord } from "@/features/installers/utils/platformInstallations";
import {
  formatDateInTimezone, formatDateOnlyInTimezone,
} from "@truckmoov/app-core/utils/time-utils";
import {
  ClipboardList, Clock, Eye, Hourglass, RefreshCw, TriangleAlert,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/shadcn/button";
import {
  CardDescription, CardTitle,
} from "@/components/shadcn/card";
import { ExportButton } from "@/components/shadcn/export-button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { usePreferences } from "@/contexts/PreferencesContext";
import { usePlatformInstallations } from "@/features/installers/hooks/usePlatformInstallations";
import {
  INSTALLATION_STATUS_LABEL,
  waitlistRecords,
} from "@/features/installers/utils/platformInstallations";
import { InstallationStatusBadge } from "./InstallationStatusBadge";
import { PlatformInstallationDetails } from "./PlatformInstallationDetails";

const WAITLIST_QUERY = {
  status: "unassigned", page: 1, limit: 100,
};

const FILTER_FIELDS: FilterField[] = [
  {
    key: "tenantType", label: "Tenant type", type: "select", options: [
      {
        value: "enterprise", label: "Enterprise",
      },
      {
        value: "owner_operator", label: "Owner-Operator",
      },
    ],
  },
  {
    key: "wstatus", label: "Status", type: "select", options: [
      {
        value: "awaiting_assignment", label: INSTALLATION_STATUS_LABEL.awaiting_assignment,
      },
      {
        value: "requires_attention", label: INSTALLATION_STATUS_LABEL.requires_attention,
      },
    ],
  },
  {
    key: "createdDate", label: "Date created", type: "daterange",
  },
];

function inDayRange(value: string, from?: string, to?: string) {
  const day = value.slice(
    0,
    10,
  );
  return (!from || day >= from) && (!to || day <= to);
}

/**
 * Fleetflow's Installers → Waitlist tab. Every unassigned installation order is
 * on the waitlist; one whose location no active installer covers is flagged
 * "Requires Attention". The list is one server page (the API's 100-row cap),
 * searched and filtered here, since "Requires Attention" is worked out on the client.
 */
export function PlatformWaitlistTab() {
  const { timezone } = usePreferences();
  const {
    records, loading, error, liveInstallers: installers, installersLoaded, refresh,
  } = usePlatformInstallations({ query: WAITLIST_QUERY });
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    filters,
    setFilters,
  ] = useState<FilterValues>({});
  const [
    detailKey,
    setDetailKey,
  ] = useState<string | null>(null);

  const waitlist = useMemo(
    () => waitlistRecords(
      records,
      installersLoaded ? installers : null,
    ),
    [
      records,
      installers,
      installersLoaded,
    ],
  );
  const [weekAhead] = useState(() => new Date(Date.now() + 7 * 86_400_000).toLocaleDateString("en-CA"));
  // As in fleetflow, overdue bookings count too: anything due within the next 7 days or earlier.
  const totals = {
    total: waitlist.length,
    awaiting: waitlist.filter(r => r.status === "awaiting_assignment").length,
    attention: waitlist.filter(r => r.status === "requires_attention").length,
    soon: waitlist.filter(r => !!r.scheduledDate && r.scheduledDate <= weekAhead).length,
  };

  const query = search.trim().toLowerCase();
  const visible = waitlist.filter((r) => {
    if (query && ![
      r.customer,
      r.reference,
    ].some(v => v.toLowerCase().includes(query))) {
      return false;
    }
    const tenantType = filters.tenantType;
    if (tenantType?.enabled && tenantType.value && (r.tenantType || "").toLowerCase().replace(
      "-",
      "_",
    ) !== tenantType.value) {
      return false;
    }
    const status = filters.wstatus;
    if (status?.enabled && status.value && r.status !== status.value)
      return false;
    const created = filters.createdDate;
    if (created?.enabled && !inDayRange(
      r.createdAt,
      created.dateFrom,
      created.dateTo,
    )) {
      return false;
    }
    return true;
  });

  /** Shows the booked time when the order has one; otherwise just the day. */
  const scheduled = (r: InstallationRecord) => {
    const at = r.liveDetails?.scheduledAt;
    if (typeof at === "string" && at) {
      return formatDateInTimezone(
        at,
        timezone,
      );
    }
    return r.scheduledDate
      ? formatDateOnlyInTimezone(
          r.scheduledDate,
          timezone,
        )
      : "-";
  };
  const created = (r: InstallationRecord) => formatDateInTimezone(
    r.createdAt,
    timezone,
  );
  const detail = waitlist.find(r => r.key === detailKey) || null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total on Waitlist"
          value={totals.total}
          icon={ClipboardList}
          loading={loading}
        />
        <StatCard
          title="Awaiting Assignment"
          value={totals.awaiting}
          icon={Hourglass}
          variant="warning"
          loading={loading}
        />
        <StatCard
          title="Requires Attention"
          value={totals.attention}
          icon={TriangleAlert}
          variant="danger"
          loading={loading}
        />
        <StatCard
          title="Scheduled Within 7 Days"
          value={totals.soon}
          icon={Clock}
          loading={loading}
        />
      </div>
      <div className="rounded-2xl surface-sleek text-card-foreground min-w-0">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="font-display">Installation Waitlist</CardTitle>
              <CardDescription>Installations awaiting assignment, and those that require attention because no installer covers their location.</CardDescription>
            </div>
            <ExportButton
              rows={visible}
              filename="installation-waitlist"
              columns={[
                {
                  header: "Tenant", accessor: r => r.customer,
                },
                {
                  header: "Tenant Type", accessor: r => r.tenantType || "Not recorded",
                },
                {
                  header: "Vehicles", accessor: r => r.vehicleCount ?? "Not recorded",
                },
                {
                  header: "Devices", accessor: r => r.deviceCount ?? 0,
                },
                {
                  header: "Status", accessor: r => INSTALLATION_STATUS_LABEL[r.status],
                },
                {
                  header: "Scheduled Date", accessor: scheduled,
                },
                {
                  header: "Date Created", accessor: created,
                },
              ]}
            />
          </div>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search tenant or installation…"
            filterEntity="installations"
            filterFields={FILTER_FIELDS}
            filterValues={filters}
            onFiltersApply={setFilters}
          />
        </div>
        <div className="p-6 pt-0 space-y-4">
          {error
            ? (
                <div
                  role="alert"
                  className="flex flex-wrap items-center gap-3 text-sm text-destructive"
                >
                  {error}
                  <Button
                    variant="outline"
                    onClick={refresh}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try again
                  </Button>
                </div>
              )
            : loading && !records.length
              ? <p className="py-8 text-center text-sm text-muted-foreground">Loading waitlist…</p>
              : (
                  <div className="overflow-x-auto rounded-xl border">
                    <Table className="min-w-[960px]">
                      <TableHeader>
                        <TableRow>
                          {[
                            "Tenant",
                            "Tenant Type",
                            "Vehicles",
                            "Devices",
                            "Status",
                            "Scheduled Date",
                            "Date Created",
                            "Actions",
                          ].map(h => (
                            <TableHead
                              key={h}
                              className={h === "Actions" ? "text-right" : ""}
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visible.map(r => (
                          <TableRow key={r.key}>
                            <TableCell className="max-w-[200px] whitespace-normal font-medium">{r.customer}</TableCell>
                            <TableCell>{r.tenantType || "Not recorded"}</TableCell>
                            <TableCell>{r.vehicleCount ?? "-"}</TableCell>
                            <TableCell>{r.deviceCount ?? 0}</TableCell>
                            <TableCell><InstallationStatusBadge status={r.status} /></TableCell>
                            <TableCell className="whitespace-nowrap text-xs">{scheduled(r)}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs">{created(r)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDetailKey(r.key)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!visible.length && (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="py-12 text-center text-sm text-muted-foreground"
                            >
                              {waitlist.length ? "No installations match your search or filters." : "No installations are waiting for an installer."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{`${visible.length} ${visible.length === 1 ? "installation" : "installations"} on the waitlist`}</span>
          </div>
        </div>
      </div>
      <PlatformInstallationDetails
        record={detail}
        onClose={() => setDetailKey(null)}
        installers={installers}
      />
    </>
  );
}
