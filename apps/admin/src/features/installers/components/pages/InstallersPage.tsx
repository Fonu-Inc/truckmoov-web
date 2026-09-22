import type {
  Installer,
  InstallerStatus,
} from "@/features/installers/demoData";
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
  useMemo,
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
import { AddInstallerDialog } from "@/features/installers/components/ui/AddInstallerDialog";
import { InstallerProfileDialog } from "@/features/installers/components/ui/InstallerProfileDialog";
import { InstallerStatusBadge } from "@/features/installers/components/ui/InstallerStatusBadge";
import {
  installerName,
  SEED_INSTALLERS,
  SEED_JOBS,
} from "@/features/installers/demoData";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";

function fmt(iso?: string) {
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

const ACTIVE_JOB_STATUSES = [
  "accepted",
  "scheduled",
  "in_progress",
];

export default function InstallersPage() {
  // Demo data — see features/installers/demoData.ts for why there is no
  // request here. Edits live for the session and reset on reload.
  const [
    installers,
    setInstallers,
  ] = useState<Installer[]>(SEED_INSTALLERS);
  const jobs = SEED_JOBS;

  const {
    confirm, confirmDialog,
  } = useConfirmAction();

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
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
  ] = useState<Installer | null>(null);
  const [
    selected,
    setSelected,
  ] = useState<Installer | null>(null);
  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const activeJobs = (id: string) =>
    jobs.filter(j => j.installerId === id && ACTIVE_JOB_STATUSES.includes(j.status)).length;

  const completedJobs = (id: string) =>
    jobs.filter(j => j.installerId === id && j.status === "completed").length;

  const availability = (i: Installer) => {
    if (i.status === "suspended")
      return "Unavailable";
    if (i.status === "pending_activation")
      return "Not yet onboarded";
    return activeJobs(i.id) >= 3 ? "At capacity" : "Available";
  };

  const setInstallerStatus = (id: string, next: InstallerStatus) =>
    setInstallers(list => list.map(i => (i.id === id
      ? {
          ...i, status: next,
        }
      : i)));

  const createInstaller = (installer: Installer) =>
    setInstallers(list => [
      ...list,
      installer,
    ]);

  const updateInstaller = (id: string, updates: Partial<Installer>) =>
    setInstallers(list => list.map(i => (i.id === id
      ? {
          ...i, ...updates,
        }
      : i)));

  const filtered = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      return installers.filter((i) => {
        const matchQ
          = !q
            || installerName(i).toLowerCase().includes(q)
            || i.id.toLowerCase().includes(q)
            || i.email.toLowerCase().includes(q)
            || i.serviceAreas.join(" ").toLowerCase().includes(q);
        const matchS = status === "all" || i.status === status;
        return matchQ && matchS;
      });
    },
    [
      installers,
      search,
      status,
    ],
  );

  const pages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  );
  const current = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const openProfile = (i: Installer) => {
    setSelected(i);
    setProfileOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Installers"
            value={installers.length}
            icon={HardHat}
          />
          <StatCard
            title="Active"
            value={installers.filter(i => i.status === "active").length}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Invitation Sent"
            value={installers.filter(i => i.status === "pending_activation").length}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Suspended"
            value={installers.filter(i => i.status === "suspended").length}
            icon={PauseCircle}
            variant="danger"
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2">
              Installer Pool
              <Badge
                variant="outline"
                className="text-[10px]"
              >
                Demo data
              </Badge>
            </CardTitle>
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
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search installers, ID, email or area"
                  className="pl-9"
                />
              </div>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_activation">Invitation Sent</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto rounded-2xl border">
              <Table>
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
                  {current.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{installerName(i)}</TableCell>
                      <TableCell className="text-muted-foreground">{i.id}</TableCell>
                      <TableCell>{i.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{i.email}</TableCell>
                      <TableCell>{i.serviceAreas.join(", ")}</TableCell>
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
                              {c}
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
                          variant="secondary"
                          className="rounded-full"
                        >
                          {availability(i)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <InstallerStatusBadge status={i.status} />
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {activeJobs(i.id)}
                        {" active "}
                        {activeJobs(i.id) === 1 ? "job" : "jobs"}
                      </TableCell>
                      <TableCell className="tabular-nums">{completedJobs(i.id)}</TableCell>
                      <TableCell>{fmt(i.dateAdded)}</TableCell>
                      <TableCell>{fmt(i.lastActivity)}</TableCell>
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
                            <DropdownMenuItem onClick={() => openProfile(i)}>
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
                                        onConfirm: () => {
                                          setInstallerStatus(
                                            i.id,
                                            "active",
                                          );
                                          toast.success(`${installerName(i)} reactivated.`);
                                        },
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
                                        onConfirm: () => {
                                          setInstallerStatus(
                                            i.id,
                                            "suspended",
                                          );
                                          toast.success(`${installerName(i)} suspended.`);
                                        },
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
                        colSpan={13}
                        className="py-12 text-center"
                      >
                        <p className="text-sm font-medium">No installers found</p>
                        <p className="text-xs text-muted-foreground">
                          Adjust your search or add an installer to the pool.
                        </p>
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
                {current.length}
                {" of "}
                {filtered.length}
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
        onCreate={createInstaller}
        onUpdate={updateInstaller}
      />
      <InstallerProfileDialog
        installer={selected}
        jobs={jobs}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onStartEdit={() => {
          setEditInstaller(selected);
          setProfileOpen(false);
          setAddOpen(true);
        }}
        onStatusChange={setInstallerStatus}
      />
      {confirmDialog}
    </>
  );
}
