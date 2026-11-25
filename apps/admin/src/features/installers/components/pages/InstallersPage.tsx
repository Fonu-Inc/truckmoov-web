import type {
  SystemInstaller, SystemInstallerStatus,
} from "@truckmoov/api/auth";
import type {
  FilterDraft, FilterField,
} from "@/components/shadcn/platform-filter-popover";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemInstallersQueryOptions,
  useReactivateSystemInstaller,
  useSuspendSystemInstaller,
} from "@truckmoov/api/auth";
import {
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  HardHat,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import {
  buildEmptyDraft,
  countActiveFilters,
  PlatformFilterPopover,
} from "@/components/shadcn/platform-filter-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { AddInstallerDialog } from "@/features/installers/components/ui/AddInstallerDialog";
import { InstallerProfileSheet } from "@/features/installers/components/ui/InstallerProfileSheet";
import { InstallerStatusBadge } from "@/features/installers/components/ui/InstallerStatusBadge";
import { PlatformInstallationsTab } from "@/features/installers/components/ui/PlatformInstallationsTab";
import { PlatformWaitlistTab } from "@/features/installers/components/ui/PlatformWaitlistTab";
import {
  INSTALLATIONS_FETCH_LIMIT, usePlatformInstallations,
} from "@/features/installers/hooks/usePlatformInstallations";
import {
  capabilityLabel,
  fromApiState,
  installerName,
} from "@/features/installers/installerOptions";
import { installerHasActiveAssignment } from "@/features/installers/utils/platformInstallations";
import { PageTitle } from "@/shared/components/layout/PageTitle";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";

const INSTALLER_FILTER_FIELDS: FilterField[] = [
  {
    key: "availability",
    label: "Availability",
    type: "select",
    options: [
      {
        value: "available", label: "Available",
      },
      {
        value: "assigned", label: "Assigned to a job",
      },
    ],
  },
  {
    key: "dateAdded", label: "Date Added", type: "date",
  },
  {
    key: "lastActivity", label: "Last Activity", type: "date",
  },
];

function inDateRange(iso: string | null | undefined, from?: string, to?: string) {
  if (!iso)
    return false;
  const day = iso.slice(
    0,
    10,
  );
  if (from && day < from)
    return false;
  if (to && day > to)
    return false;
  return true;
}

function fmt(iso?: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      )
    : "-";
}

const PAGE_SIZE = 8;
const SEARCH_PAUSE_MS = 350;

export default function InstallersPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "installations" || tabParam === "waitlist" ? tabParam : "installers";
  const pageTitle = activeTab === "installers" ? "Installer" : activeTab === "waitlist" ? "Installation Waitlist" : "Installations";
  const pageDescription = activeTab === "installers"
    ? "Manage installer profiles, service areas, capabilities and availability."
    : activeTab === "waitlist"
      ? "Installations awaiting automatic installer assignment, with locations no installer currently covers flagged for review."
      : "Assign installers and track customer installations from scheduling to completion.";
  // Occupancy comes from installation orders as in fleetflow, plus the API's own active-job count.
  const { allRecords } = usePlatformInstallations({ withInstallers: false });
  const {
    confirm, confirmDialog,
  } = useConfirmAction();
  const suspend = useSuspendSystemInstaller();
  const reactivate = useReactivateSystemInstaller();

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState<"all" | SystemInstallerStatus>("all");
  const [
    filters,
    setFilters,
  ] = useState<FilterDraft>(() => buildEmptyDraft(INSTALLER_FILTER_FIELDS));
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    addOpen,
    setAddOpen,
  ] = useState(false);
  const [
    editInstaller,
    setEditInstaller,
  ] = useState<SystemInstaller | null>(null);
  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(null);

  useEffect(
    () => {
      const timer = setTimeout(
        () => {
          setSearchTerm(search.trim());
          setPage(1);
        },
        SEARCH_PAUSE_MS,
      );
      return () => clearTimeout(timer);
    },
    [search],
  );

  // The API has no availability or date params, so with popover filters on the
  // page loads one wide page and filters and pages it client-side.
  const filtering = countActiveFilters(filters) > 0;
  const {
    data, isLoading, isError, error, refetch,
  } = useQuery(getSystemInstallersQueryOptions({
    search: searchTerm || undefined,
    status: status === "all" ? undefined : status,
    page: filtering ? 1 : page,
    limit: filtering ? INSTALLATIONS_FETCH_LIMIT : PAGE_SIZE,
  }));

  const isAssigned = (i: SystemInstaller) => i.activeJobs > 0 || installerHasActiveAssignment(
    i.id,
    allRecords,
  );
  const availability = (i: SystemInstaller) => (isAssigned(i) ? "Assigned to a job" : "Available");
  const loaded = data?.data.items ?? [];
  const installers = filtering
    ? loaded.filter((i) => {
        const fA = filters.availability;
        const matchAvailability
          = !fA?.enabled
            || !fA.value
            || (fA.value === "assigned" ? isAssigned(i) : !isAssigned(i));
        const fD = filters.dateAdded;
        const matchAdded = !fD?.enabled || inDateRange(
          i.createdAt,
          fD.from,
          fD.to,
        );
        const fL = filters.lastActivity;
        const matchActivity = !fL?.enabled || inDateRange(
          i.lastActivityAt,
          fL.from,
          fL.to,
        );
        return matchAvailability && matchAdded && matchActivity;
      })
    : loaded;
  const summary = data?.data.summary;
  const total = data?.data.total ?? 0;
  const selected = installers.find(i => i.id === selectedId) ?? null;

  const act = (
    action: typeof suspend,
    installer: SystemInstaller,
    done: string,
  ) => action.mutate(
    { id: installer.id },
    {
      onSuccess: () => toast.success(`${installerName(installer)} ${done}.`),
      onError: err => toast.error(err.message),
    },
  );

  const pages = Math.max(
    1,
    Math.ceil((filtering ? installers.length : total) / PAGE_SIZE),
  );
  const current = filtering
    ? installers.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE,
      )
    : installers;

  return (
    <>
      <div className="space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={tab => setSearchParams(tab === "installers" ? {} : { tab })}
          className="space-y-4 min-w-0"
        >
          <div className="flex justify-center">
            <TabsList className="h-auto max-w-full flex-wrap gap-1">
              <TabsTrigger value="installers">Installers</TabsTrigger>
              <TabsTrigger value="installations">Installations</TabsTrigger>
              <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            </TabsList>
          </div>
          <PageTitle
            title={pageTitle}
            description={pageDescription}
            primaryActions={activeTab === "installers"
              ? (
                  <Button
                    onClick={() => setAddOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {" "}
                    Add Installer
                  </Button>
                )
              : undefined}
          />
          <TabsContent
            value="installers"
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Installers"
                value={summary?.total ?? 0}
                loading={isLoading}
                icon={HardHat}
              />
              <StatCard
                title="Active Installers"
                value={summary?.active ?? 0}
                loading={isLoading}
                icon={CheckCircle2}
                variant="success"
              />
              <StatCard
                title="Invitations Sent"
                value={summary?.invited ?? 0}
                loading={isLoading}
                icon={Clock}
                variant="warning"
              />
              <StatCard
                title="Suspended Installers"
                value={summary?.suspended ?? 0}
                loading={isLoading}
                icon={PauseCircle}
                variant="danger"
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <CardTitle>Installer Pool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search installers, ID, email or area"
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      setStatus(v as "all" | SystemInstallerStatus);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[190px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invitation Sent</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <PlatformFilterPopover
                    entity="installers"
                    fields={INSTALLER_FILTER_FIELDS}
                    value={filters}
                    onApply={(next) => {
                      setFilters(next);
                      setPage(1);
                    }}
                    onReset={() => {
                      setFilters(buildEmptyDraft(INSTALLER_FILTER_FIELDS));
                      setPage(1);
                    }}
                  />
                </div>

                <div className="overflow-x-auto rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Installer Name</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Service Area</TableHead>
                        <TableHead>Capabilities</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Current Workload</TableHead>
                        <TableHead>Jobs Completed</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={12}
                          className="px-4 py-2 text-xs font-normal text-muted-foreground"
                        >
                          Details and current information for installer pool.
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {current.map(i => (
                        <TableRow key={i.id}>
                          <TableCell className="font-medium">{installerName(i)}</TableCell>
                          <TableCell>{i.phoneNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{i.email}</TableCell>
                          <TableCell>{i.serviceAreas.map(fromApiState).join(", ")}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {i.capabilities.slice(
                                0,
                                2,
                              ).map(c => (
                                <Badge
                                  key={c}
                                  variant="secondary"
                                  className="rounded-full"
                                >
                                  {capabilityLabel(c)}
                                </Badge>
                              ))}
                              {i.capabilities.length > 2 && (
                                <Badge
                                  variant="secondary"
                                  className="rounded-full"
                                >
                                  +
                                  {i.capabilities.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={isAssigned(i) ? "rounded-full border-warning/20 bg-warning/10 text-warning" : "rounded-full border-success/20 bg-success/10 text-success"}
                            >
                              {availability(i)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <InstallerStatusBadge status={i.status} />
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {i.activeJobs}
                            {" active "}
                            {i.activeJobs === 1 ? "job" : "jobs"}
                          </TableCell>
                          <TableCell className="tabular-nums">{i.jobsCompleted}</TableCell>
                          <TableCell>{fmt(i.createdAt)}</TableCell>
                          <TableCell>{fmt(i.lastActivityAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedId(i.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {" "}
                                  View Installer Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditInstaller(i);
                                    setAddOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {" "}
                                  Edit Installer Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {i.status === "suspended"
                                  ? (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          confirm({
                                            title: "Reactivate this installer?",
                                            description: `${installerName(i)} will be able to sign in and receive new installation jobs again.`,
                                            confirmLabel: "Reactivate Installer",
                                            destructive: false,
                                            onConfirm: () => act(
                                              reactivate,
                                              i,
                                              "reactivated",
                                            ),
                                          })}
                                      >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        {" "}
                                        Reactivate Installer
                                      </DropdownMenuItem>
                                    )
                                  : (
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() =>
                                          confirm({
                                            title: "Suspend this installer?",
                                            description: `${installerName(i)} will no longer be able to sign in or be assigned new installation jobs.`,
                                            confirmLabel: "Suspend Installer",
                                            onConfirm: () => act(
                                              suspend,
                                              i,
                                              "suspended",
                                            ),
                                          })}
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        {" "}
                                        Suspend Installer
                                      </DropdownMenuItem>
                                    )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {current.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={10}
                            className="py-12 text-center"
                          >
                            {isLoading
                              ? <p className="text-sm text-muted-foreground">Loading installers…</p>
                              : isError
                                ? (
                                    <div
                                      role="alert"
                                      className="flex flex-col items-center gap-2 text-sm text-destructive"
                                    >
                                      {error ? `Couldn't load installers: ${error.message}` : "Couldn't load installers"}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void refetch()}
                                      >
                                        Try again
                                      </Button>
                                    </div>
                                  )
                                : (
                                    <>
                                      <p className="text-sm font-medium">No installers found</p>
                                      <p className="text-xs text-muted-foreground">
                                        Adjust your search or add an installer to the pool.
                                      </p>
                                    </>
                                  )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {`Showing ${current.length} of ${filtering ? installers.length : total} installers`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <span>
                      {`Page ${page} of ${pages}`}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent
            value="installations"
            className="space-y-6"
          >
            <PlatformInstallationsTab />
          </TabsContent>
          <TabsContent
            value="waitlist"
            className="space-y-6"
          >
            <PlatformWaitlistTab />
          </TabsContent>
        </Tabs>
      </div>

      <AddInstallerDialog
        open={addOpen}
        onOpenChange={(v) => {
          setAddOpen(v);
          if (!v)
            setEditInstaller(null);
        }}
        installer={editInstaller}
      />
      <InstallerProfileSheet
        installer={selected}
        open={selectedId !== null}
        onOpenChange={v => !v && setSelectedId(null)}
        onStartEdit={() => {
          setEditInstaller(selected);
          setSelectedId(null);
          setAddOpen(true);
        }}
      />
      {confirmDialog}
    </>
  );
}
