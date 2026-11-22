import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import type { InstallationRecord } from "@/features/installers/utils/platformInstallations";
import { useAssignSystemInstallationOrder } from "@truckmoov/api/auth";
import {
  formatDateInTimezone, formatDateOnlyInTimezone,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Ban, CheckCircle2, ClipboardList, Clock, Eye, RefreshCw,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
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
  filterInstallationRecords,
  filterInstallationsByFields,
  INSTALLATION_STATUS_LABEL,
  installationTotals,
} from "@/features/installers/utils/platformInstallations";
import { InstallationStatusBadge } from "./InstallationStatusBadge";
import { InstallerAssignmentList } from "./InstallerAssignmentList";
import { PlatformInstallationDetails } from "./PlatformInstallationDetails";

const PAGE_SIZE = 8;
const HISTORY_STATUSES: InstallationRecord["status"][] = [
  "completed",
  "cancelled",
];

/**
 * Fleetflow's `PlatformInstallationsTab`, live-wired to the installation orders
 * API. The "Installation Assignment" dialog opens from the details dialog's
 * Assigned Installer section and persists through the platform assign route.
 */
export function PlatformInstallationsTab() {
  const {
    records, loading, error, liveInstallers: installers, refresh,
  } = usePlatformInstallations();
  const assignOrder = useAssignSystemInstallationOrder();
  const allRecords = records;
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
  const [
    page,
    setPage,
  ] = useState(1);
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
  const totals = installationTotals(enriched);
  const activeRecords = useMemo(
    () => enriched.filter(r => !HISTORY_STATUSES.includes(r.status)),
    [enriched],
  );
  const historyRecords = useMemo(
    () => enriched.filter(r => HISTORY_STATUSES.includes(r.status)),
    [enriched],
  );
  const viewRecords = view === "history" ? historyRecords : activeRecords;
  const viewStatusOptions = useMemo(
    () => Object.entries(INSTALLATION_STATUS_LABEL).filter(([value]) => view === "history" ? HISTORY_STATUSES.includes(value as InstallationRecord["status"]) : !HISTORY_STATUSES.includes(value as InstallationRecord["status"])),
    [view],
  );
  const filtered = useMemo(
    () => filterInstallationsByFields(
      filterInstallationRecords(
        viewRecords,
        search,
        status,
        [],
        "newest",
      ),
      {
        tenantType: filters.tenantType?.enabled ? filters.tenantType.value : undefined,
        assignment: filters.assignment?.enabled ? filters.assignment.value : undefined,
        scheduledFrom: filters.scheduledDate?.enabled ? filters.scheduledDate.dateFrom : undefined,
        scheduledTo: filters.scheduledDate?.enabled ? filters.scheduledDate.dateTo : undefined,
        startedFrom: filters.startedDate?.enabled ? filters.startedDate.dateFrom : undefined,
        startedTo: filters.startedDate?.enabled ? filters.startedDate.dateTo : undefined,
        completedFrom: filters.completedDate?.enabled ? filters.completedDate.dateFrom : undefined,
        completedTo: filters.completedDate?.enabled ? filters.completedDate.dateTo : undefined,
        createdFrom: filters.createdDate?.enabled ? filters.createdDate.dateFrom : undefined,
        createdTo: filters.createdDate?.enabled ? filters.createdDate.dateTo : undefined,
      },
    ),
    [
      viewRecords,
      search,
      status,
      filters,
    ],
  );
  const pages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  );
  const currentPage = Math.min(
    page,
    pages,
  );
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
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
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="active">
            Active Installations
            {" "}
          </TabsTrigger>
          <TabsTrigger value="history">Installation History</TabsTrigger>
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
                rows={filtered}
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
              setPage(1);
            }}
            searchPlaceholder="Search installation, customer, fleet or installer…"
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            statusOptions={viewStatusOptions.map(([
              value,
              label,
            ]) => ({
              value, label,
            }))}
            filterEntity="installations"
            filterFields={filterFields}
            filterValues={filters}
            onFiltersApply={(next) => {
              setFilters(next);
              setPage(1);
            }}
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
                              {records.length ? "No installations match your search or filters." : "No recorded installations yet."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}
              –
              {Math.min(
                currentPage * PAGE_SIZE,
                filtered.length,
              )}
              {" of "}
              {filtered.length}
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
