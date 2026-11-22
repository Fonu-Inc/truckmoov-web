import type {
  InstallerJobStatus, SystemInstallationJobsQuery,
} from "@truckmoov/api/auth";
import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import type { InstallationRecord } from "@/features/installers/utils/platformInstallations";
import { useAssignSystemInstallationOrder } from "@truckmoov/api/auth";
import { debounce } from "@truckmoov/app-core/utils/general-utils";
import {
  formatDateInTimezone, formatDateOnlyInTimezone,
} from "@truckmoov/app-core/utils/time-utils";
import { useServerPagination } from "@truckmoov/reusables/hooks/useServerPagination";
import {
  Ban, CheckCircle2, ClipboardList, Clock, Eye, RefreshCw,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { ExportButton } from "@/components/shadcn/export-button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { usePreferences } from "@/contexts/PreferencesContext";
import { usePlatformInstallations } from "@/features/installers/hooks/usePlatformInstallations";
import { installerName } from "@/features/installers/installerOptions";
import {
  canChangeInstallationAssignment,
  eligibleInstallers,
  INSTALLATION_STATUS_LABEL,
  JOB_STATUSES_BY_INSTALLATION_STATUS,
} from "@/features/installers/utils/platformInstallations";
import { InstallationStatusBadge } from "./InstallationStatusBadge";
import { InstallerAssignmentList } from "./InstallerAssignmentList";
import { PlatformInstallationDetails } from "./PlatformInstallationDetails";

const PAGE_SIZE = 8;
const HISTORY_STATUSES: InstallationRecord["status"][] = [
  "completed",
  "cancelled",
];
const VIEW_JOB_STATUSES: Record<"active" | "history", InstallerJobStatus[]> = {
  active: [
    "unassigned",
    "assigned",
    "scheduled",
    "in_progress",
    "overdue",
    "issue_reported",
  ],
  history: [
    "completed",
    "cancelled",
  ],
};

/**
 * Fleetflow's `PlatformInstallationsTab`, live-wired to the installation orders
 * API. The "Installation Assignment" dialog opens from the details dialog's
 * Assigned Installer section and persists through the platform assign route.
 */
export function PlatformInstallationsTab() {
  const assignOrder = useAssignSystemInstallationOrder();
  // Installer occupancy for the assignment dialog, from the shared first page of every job.
  const { allRecords } = usePlatformInstallations({ withInstallers: false });
  const { timezone } = usePreferences();
  const [
    view,
    setView,
  ] = useState<"active" | "history">("active");
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");
  const debouncedSearch = useMemo(
    () => debounce(
      (v: string) => setSearchTerm(v.trim()),
      300,
    ),
    [],
  );
  useEffect(
    () => () => debouncedSearch.cancel(),
    [debouncedSearch],
  );
  const [
    status,
    setStatus,
  ] = useState("all");
  const filterFields = useMemo<FilterField[]>(
    () => [
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
        key: "assignment", label: "Installer assignment", type: "select", options: [
          {
            value: "assigned", label: "Assigned",
          },
          {
            value: "unassigned", label: "Unassigned",
          },
        ],
      },
      ...(view === "history"
        ? [
            {
              key: "startedDate", label: "Date started", type: "daterange",
            },
            {
              key: "completedDate", label: "Date completed", type: "daterange",
            },
            {
              key: "createdDate", label: "Date created", type: "daterange",
            },
          ] as FilterField[]
        : [
            {
              key: "scheduledDate", label: "Scheduled date", type: "daterange",
            } as FilterField,
          ]),
    ],
    [view],
  );
  const [
    filters,
    setFilters,
  ] = useState<FilterValues>({});
  const {
    page, pageSize, setPage,
  } = useServerPagination(
    [
      view,
      searchTerm,
      status,
      filters,
    ],
    PAGE_SIZE,
  );
  const dateRange = (key: string, from: keyof SystemInstallationJobsQuery, to: keyof SystemInstallationJobsQuery) => filters[key]?.enabled
    ? {
        [from]: filters[key].dateFrom || undefined, [to]: filters[key].dateTo || undefined,
      }
    : {};
  const query: SystemInstallationJobsQuery = {
    status: (status === "all" ? VIEW_JOB_STATUSES[view] : JOB_STATUSES_BY_INSTALLATION_STATUS[status as InstallationRecord["status"]] ?? []).join(","),
    search: searchTerm || undefined,
    tenantType: filters.tenantType?.enabled ? filters.tenantType.value as SystemInstallationJobsQuery["tenantType"] || undefined : undefined,
    assignment: filters.assignment?.enabled ? filters.assignment.value as SystemInstallationJobsQuery["assignment"] || undefined : undefined,
    ...dateRange(
      "scheduledDate",
      "scheduledFrom",
      "scheduledTo",
    ),
    ...dateRange(
      "startedDate",
      "startedFrom",
      "startedTo",
    ),
    ...dateRange(
      "completedDate",
      "completedFrom",
      "completedTo",
    ),
    ...dateRange(
      "createdDate",
      "createdFrom",
      "createdTo",
    ),
    page,
    limit: pageSize,
  };
  const {
    records, total, countsByStatus, loading, error, liveInstallers: installers, refresh,
  } = usePlatformInstallations({ query });
  const countOf = (statuses: InstallerJobStatus[]) => statuses.reduce(
    (sum, s) => sum + (countsByStatus?.[s] ?? 0),
    0,
  );
  const [
    detailKey,
    setDetailKey,
  ] = useState<string | null>(null);
  const [
    profileOnly,
    setProfileOnly,
  ] = useState(false);
  const [
    assignmentKey,
    setAssignmentKey,
  ] = useState<string | null>(null);
  const [
    installerId,
    setInstallerId,
  ] = useState("");
  const [
    assignmentError,
    setAssignmentError,
  ] = useState("");
  const enriched = useMemo(
    () => records.map((r) => {
      const installer = installers.find(i => i.id === r.installerId);
      return {
        ...r, installerName: installer ? installerName(installer) : r.installerName,
      };
    }),
    [
      records,
      installers,
    ],
  );
  const totals = {
    total: countOf([
      ...VIEW_JOB_STATUSES.active,
      ...VIEW_JOB_STATUSES.history,
    ]),
    completed: countOf(["completed"]),
    inProgress: countOf(["in_progress"]),
    cancelled: countOf(["cancelled"]),
  };
  const viewStatusOptions = useMemo(
    () => Object.entries(INSTALLATION_STATUS_LABEL).filter(([value]) => JOB_STATUSES_BY_INSTALLATION_STATUS[value as InstallationRecord["status"]]
      && (view === "history" ? HISTORY_STATUSES.includes(value as InstallationRecord["status"]) : !HISTORY_STATUSES.includes(value as InstallationRecord["status"]))),
    [view],
  );
  const pages = Math.max(
    1,
    Math.ceil(total / pageSize),
  );
  const currentPage = page;
  const visible = enriched;
  const detail = enriched.find(r => r.key === detailKey) || null;
  const assignment = enriched.find(r => r.key === assignmentKey) || null;
  const candidates = assignment ? eligibleInstallers(
    assignment,
    installers,
  ) : [];
  const candidate = candidates.find(i => i.id === installerId);
  const openAssignment = (r: InstallationRecord) => {
    setDetailKey(null);
    setAssignmentKey(r.key);
    setInstallerId(r.installerId || "");
    setAssignmentError("");
  };
  const save = () => {
    if (!assignment)
      return;
    setAssignmentError("");
    if (!canChangeInstallationAssignment(assignment.status)) {
      setAssignmentError("Assignment is locked after installation work begins.");
      return;
    }
    if (!candidate) {
      setAssignmentError("Choose an active installer with matching location and capabilities.");
      return;
    }
    assignOrder.mutate(
      {
        id: assignment.id, data: { installerId: candidate.id },
      },
      {
        onSuccess: () => {
          toast.success("Installation assigned");
          setAssignmentKey(null);
          refresh();
        },
        onError: error => setAssignmentError(error.message),
      },
    );
  };
  /** Shows the recorded time when the value carries one; date-only values stay date-only. */
  const dateTime = (value: string) => !value ? "—" : value.includes("T") ? formatDateInTimezone(
    value,
    timezone,
  ) : formatDateOnlyInTimezone(
    value,
    timezone,
  );
  const dateColumns = view === "history"
    ? [
        {
          header: "Date Started", accessor: (r: InstallationRecord) => dateTime(r.startedAt || ""),
        },
        {
          header: "Date Completed", accessor: (r: InstallationRecord) => dateTime(r.completedAt || ""),
        },
        {
          header: "Date Created", accessor: (r: InstallationRecord) => dateTime(r.createdAt),
        },
      ]
    : [
        {
          header: "Scheduled Date", accessor: (r: InstallationRecord) => dateTime(r.scheduledDate),
        },
        {
          header: "Date Created", accessor: (r: InstallationRecord) => dateTime(r.createdAt),
        },
      ];
  const assignedName = (r: InstallationRecord) => {
    const assigned = installers.find(i => i.id === r.installerId);
    return r.installerName || (assigned ? `${assigned.firstName} ${assigned.lastName}`.trim() : "") || "Not assigned";
  };
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Installations"
          value={totals.total}
          icon={ClipboardList}
          loading={loading}
        />
        <StatCard
          title="Completed Installations"
          value={totals.completed}
          icon={CheckCircle2}
          variant="success"
          loading={loading}
        />
        <StatCard
          title="In Progress"
          value={totals.inProgress}
          icon={Clock}
          variant="warning"
          loading={loading}
        />
        <StatCard
          title="Cancelled Installations"
          value={totals.cancelled}
          icon={Ban}
          variant="danger"
          loading={loading}
        />
      </div>
      <Tabs
        value={view}
        onValueChange={(v) => {
          setView(v as "active" | "history");
          setStatus("all");
          setFilters({});
        }}
      >
        <TabsList>
          <TabsTrigger value="active">
            Active Installations
            <Badge
              variant="secondary"
              className="ml-2"
            >
              {countOf(VIEW_JOB_STATUSES.active)}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="history">
            Installation History
            <Badge
              variant="secondary"
              className="ml-2"
            >
              {countOf(VIEW_JOB_STATUSES.history)}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>{view === "history" ? "Installation History" : "Active Installations"}</CardTitle>
              <CardDescription>{view === "history" ? "Completed and cancelled installations." : "Customer bookings, installation assignments and field progress."}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton
                rows={visible}
                filename="installations"
                columns={[
                  {
                    header: "Tenant ", accessor: r => r.customer,
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
                    header: "Assigned Installer", accessor: assignedName,
                  },
                  {
                    header: "Status", accessor: r => INSTALLATION_STATUS_LABEL[r.status],
                  },
                  ...dateColumns,
                ]}
              />
            </div>
          </div>
          <TableToolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              debouncedSearch(v);
            }}
            searchPlaceholder="Search job, customer, vehicle registration or location…"
            status={status}
            onStatusChange={setStatus}
            statusOptions={viewStatusOptions.map(([
              value,
              label,
            ]) => ({
              value, label,
            }))}
            filterEntity="installations"
            filterFields={filterFields}
            filterValues={filters}
            onFiltersApply={setFilters}
          />
        </CardHeader>
        <CardContent className="space-y-4">
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
              ? <p className="py-8 text-center text-sm text-muted-foreground">Loading installations…</p>
              : (
                  <div className="overflow-x-auto rounded-xl border">
                    <Table className="min-w-[1000px]">
                      <TableHeader>
                        <TableRow>
                          {[
                            "Tenant ",
                            "Tenant Type",
                            "Vehicles",
                            "Devices",
                            "Assigned Installer",
                            "Status",
                            ...dateColumns.map(c => c.header),
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
                            <TableCell className="max-w-[220px] whitespace-normal font-medium">{r.customer}</TableCell>
                            <TableCell>{r.tenantType || "Not recorded"}</TableCell>
                            <TableCell>{r.vehicleCount ?? "—"}</TableCell>
                            <TableCell title={r.deviceCount == null ? "No device count recorded" : undefined}>{r.deviceCount ?? 0}</TableCell>
                            <TableCell className="max-w-[190px] whitespace-normal">{assignedName(r)}</TableCell>
                            <TableCell><InstallationStatusBadge status={r.status} /></TableCell>
                            {dateColumns.map(c => (
                              <TableCell
                                key={c.header}
                                className="whitespace-nowrap text-xs"
                              >
                                {c.accessor(r)}
                              </TableCell>
                            ))}
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDetailKey(r.key);
                                  setProfileOnly(false);
                                }}
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
                              colSpan={7 + dateColumns.length}
                              className="py-12 text-center text-sm text-muted-foreground"
                            >
                              {totals.total ? "No installations match your search or filters." : "No recorded installations yet."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              {total ? (currentPage - 1) * pageSize + 1 : 0}
              –
              {Math.min(
                currentPage * pageSize,
                total,
              )}
              {" of "}
              {total}
              {" installations"}
            </span>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span>
                  {`Page ${currentPage} of ${pages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <PlatformInstallationDetails
        record={detail}
        onClose={() => setDetailKey(null)}
        profileOnly={profileOnly}
        installers={installers}
        onAssign={detail && canChangeInstallationAssignment(detail.status) ? () => openAssignment(detail) : undefined}
      />
      <Dialog
        open={!!assignment}
        onOpenChange={open => !open && setAssignmentKey(null)}
      >
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Installation Assignment</DialogTitle>
            <DialogDescription>
              {assignment?.reference}
              {" · "}
              {assignment?.customer}
            </DialogDescription>
          </DialogHeader>
          {assignment && (
            <InstallerAssignmentList
              key={assignment.key}
              record={assignment}
              installers={installers}
              eligibleIds={candidates.map(i => i.id)}
              records={allRecords}
              selectedId={installerId}
              onSelect={setInstallerId}
              disabled={assignOrder.isPending}
            />
          )}
          {assignmentError && (
            <p
              role="alert"
              className="text-sm text-destructive"
            >
              {assignmentError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignmentKey(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={!candidate || assignOrder.isPending}
            >
              {assignOrder.isPending ? "Assigning…" : "Confirm Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
