import type { SystemInstaller, SystemInstallerStatus } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemInstallersQueryOptions,
  useReactivateSystemInstaller,
  useResendSystemInstallerInvite,
  useSuspendSystemInstaller,
} from "@truckmoov/api/auth";
import {
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  HardHat,
  Mail,
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
import { TableSkeleton } from "@/components/ui/skeletons";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";
import { AddInstallerDialog } from "@/features/installers/components/ui/AddInstallerDialog";
import { InstallerProfileDialog } from "@/features/installers/components/ui/InstallerProfileDialog";
import { InstallerStatusBadge } from "@/features/installers/components/ui/InstallerStatusBadge";
import {
  AVAILABILITY_LABEL,
  capabilityLabel,
  fromApiState,
  installerName,
} from "@/features/installers/installerOptions";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";

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
    : "—";
}

const PAGE_SIZE = 8;
const SEARCH_PAUSE_MS = 350;

export default function InstallersPage() {
  const {
    confirm, confirmDialog,
  } = useConfirmAction();
  const suspend = useSuspendSystemInstaller();
  const reactivate = useReactivateSystemInstaller();
  const resendInvite = useResendSystemInstallerInvite();

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

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery(getSystemInstallersQueryOptions({
    search: searchTerm || undefined,
    status: status === "all" ? undefined : status,
    page,
    limit: PAGE_SIZE,
  }));

  const installers = data?.data.items ?? [];
  const summary = data?.data.summary;
  const total = data?.data.total ?? 0;
  const pages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE),
  );
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

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Installers"
            value={summary?.total ?? 0}
            loading={isLoading}
            icon={HardHat}
          />
          <StatCard
            title="Active"
            value={summary?.active ?? 0}
            loading={isLoading}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Invitation Sent"
            value={summary?.invited ?? 0}
            loading={isLoading}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Suspended"
            value={summary?.suspended ?? 0}
            loading={isLoading}
            icon={PauseCircle}
            variant="danger"
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Installer Pool</CardTitle>
            <Button
              onClick={() => setAddOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {" "}
              Add Installer
            </Button>
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
            </div>

            <div className="overflow-x-auto rounded-2xl border">
              <Table className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
                <TableHeader>
                  <TableRow>
                    <TableHead>Installer Name</TableHead>
                    <TableHead>Installer ID</TableHead>
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
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableSkeleton
                      rows={PAGE_SIZE}
                      columns={13}
                    />
                  )}
                  {installers.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{installerName(i)}</TableCell>
                      <TableCell className="text-muted-foreground">{i.code}</TableCell>
                      <TableCell>{i.phoneNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{i.email}</TableCell>
                      <TableCell>
                        <TooltipWrapper content={i.serviceAreas.map(fromApiState).join(", ")}>
                          <span className="block max-w-[180px] truncate">
                            {i.serviceAreas.map(fromApiState).join(", ")}
                          </span>
                        </TooltipWrapper>
                      </TableCell>
                      <TableCell>
                        <TooltipWrapper content={i.capabilities.map(capabilityLabel).join(", ")}>
                          <div className="flex items-center gap-1">
                            {i.capabilities[0] && (
                              <Badge
                                variant="secondary"
                                className="max-w-[200px] rounded-full"
                              >
                                <span className="truncate">{capabilityLabel(i.capabilities[0])}</span>
                              </Badge>
                            )}
                            {i.capabilities.length > 1 && (
                              <Badge
                                variant="secondary"
                                className="shrink-0 rounded-full"
                              >
                                +
                                {i.capabilities.length - 1}
                              </Badge>
                            )}
                          </div>
                        </TooltipWrapper>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="rounded-full"
                        >
                          {AVAILABILITY_LABEL[i.availability]}
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
                            {i.status === "invited" && (
                              <DropdownMenuItem onClick={() => act(resendInvite, i, "was sent a new invite")}>
                                <Mail className="mr-2 h-4 w-4" />
                                {" "}
                                Resend Invite
                              </DropdownMenuItem>
                            )}
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
                                        onConfirm: () => act(reactivate, i, "reactivated"),
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
                                        onConfirm: () => act(suspend, i, "suspended"),
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
                  {installers.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={13}
                        className="py-12 text-center"
                      >
                        {isError && (
                          <>
                            <p className="text-sm font-medium">Couldn't load installers</p>
                            <p className="text-xs text-muted-foreground">{error.message}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => void refetch()}
                            >
                              Try again
                            </Button>
                          </>
                        )}
                        {!isError && (
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
                Showing
                {" "}
                {installers.length}
                {" of "}
                {total}
                {" installers"}
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
                  Page
                  {" "}
                  {page}
                  {" of "}
                  {pages}
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
      <InstallerProfileDialog
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
