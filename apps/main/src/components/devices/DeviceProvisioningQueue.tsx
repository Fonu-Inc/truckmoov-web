import { useMemo, useState } from "react";
import { startDeviceProvisioningSimulation } from "@/lib/provisioningEngineSim";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Textarea } from "@/components/shadcn/textarea";
import { Skeleton } from "@/components/shadcn/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { ExportButton } from "@/components/shadcn/export-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Cpu,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  MoreHorizontal,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  PlatformFilterPopover,
  type FilterDraft,
} from "@/components/shadcn/platform-filter-popover";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { DeviceRequestDetailsDialog } from "./DeviceRequestDetailsDialog";

type DeviceReq = {
  id: string;
  tenant_id: string;
  requesting_org_id: string;
  requester_user_id: string;
  requester_name: string | null;
  manufacturer: string;
  model: string | null;
  imei: string;
  needs_sim: boolean;
  vehicle_name: string | null;
  priority: string | null;
  status: string;
  rejection_reason: string | null;
  configurator_notes: string | null;
  resulting_device_id: string | null;
  created_at: string;
  quantity?: number | null;
  use_case?: string | null;
  provisioning_checklist?: unknown;
  provisioning_started_at?: string | null;
  provisioning_completed_at?: string | null;
};

type ActionMode = null | {
  action: "approve" | "reject" | "fulfil";
  id: string;
  label: string;
};

/**
 * Map raw status → display label per spec:
 *   pending_review (incl. legacy assigned/awaiting_heartbeat) → Pending Review
 *   in_progress                                               → In Progress
 *   completed (incl. legacy active)                           → Completed
 *   rejected / cancelled                                      → as-is
 */
const deviceStatusDisplay = (s: string): { label: string; className: string } => {
  if (["pending_review", "assigned", "awaiting_heartbeat"].includes(s))
    return { label: "Pending Review", className: "bg-warning/10 text-warning border-warning/30" };
  if (s === "in_progress")
    return { label: "In Progress", className: "bg-info/10 text-info border-info/30" };
  if (["completed", "active"].includes(s))
    return { label: "Completed", className: "bg-success/10 text-success border-success/30" };
  if (s === "rejected")
    return { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/30" };
  return { label: s.replace(/_/g, " "), className: "bg-muted text-muted-foreground border-border" };
};

const KycCell = ({ status }: { status: string | null }) => {
  if (status === "verified")
    return (
      <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
        <ShieldCheck className="h-3 w-3" /> Verified
      </Badge>
    );
  if (status === "pending" || status === "submitted")
    return (
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1">
        <ShieldAlert className="h-3 w-3" /> Pending
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
        <ShieldAlert className="h-3 w-3" /> Rejected
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1">
      <ShieldQuestion className="h-3 w-3" /> Not submitted
    </Badge>
  );
};

export function DeviceProvisioningQueue() {
  const { user } = useAuthStore();
  const [reqs] = useState<DeviceReq[]>([]);
  const [loading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterDraft, setFilterDraft] = useState<FilterDraft>({
    priority: { enabled: false },
    organisation: { enabled: false },
    manufacturer: { enabled: false },
  });
  const [action, setAction] = useState<ActionMode>(null);
  const [actionNote, setActionNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsReq, setDetailsReq] = useState<DeviceReq | null>(null);

  const tenantNameMap: Record<string, string> = {};
  const tenantEmailMap: Record<string, string> = {};

  const tenantName = (id: string) => tenantNameMap[id] || id?.slice(0, 8) || "—";
  const tenantEmail = (id: string) => tenantEmailMap[id] || "—";

  const kycCache: Record<string, { status: string | null }> = {};

  const pending = reqs.filter((r) =>
    ["pending_review", "assigned", "awaiting_heartbeat"].includes(r.status),
  ).length;
  const approved = reqs.filter((r) =>
    ["in_progress", "active", "completed"].includes(r.status),
  ).length;
  const rejected = reqs.filter((r) => r.status === "rejected").length;
  const totalRequested = reqs.length;

  // ─── Filters ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const priorityF = filterDraft.priority;
    const orgF = filterDraft.organisation;
    const mfgF = filterDraft.manufacturer;
    return reqs.filter((r) => {
      if (statusFilter !== "all") {
        // Map legacy raw statuses to the 4 displayed buckets
        const bucket =
          ["pending_review", "assigned", "awaiting_heartbeat"].includes(r.status) ? "pending_review" :
          r.status === "in_progress" ? "in_progress" :
          ["completed", "active"].includes(r.status) ? "completed" :
          r.status;
        if (bucket !== statusFilter) return false;
      }
      if (priorityF?.enabled && priorityF.value && (r.priority || "normal").toLowerCase() !== priorityF.value)
        return false;
      if (orgF?.enabled && orgF.value && tenantName(r.tenant_id) !== orgF.value) return false;
      if (mfgF?.enabled && mfgF.value && r.manufacturer !== mfgF.value) return false;
      if (!q) return true;
      const hay = `${tenantName(r.tenant_id)} ${tenantEmail(r.tenant_id)} ${r.manufacturer} ${r.model || ""} ${r.imei} ${r.vehicle_name || ""} ${r.requester_name || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [reqs, search, statusFilter, filterDraft, tenantNameMap, tenantEmailMap]);

  // ─── Actions ─────────────────────────────────────────────────
  const openAction = (a: ActionMode) => {
    setAction(a);
    setActionNote("");
  };

  const approveDirect = async (id: string) => {
    toast.info('Coming soon');
    return;
  };

  const runAction = async () => {
    if (!action || !user) return;
    toast.info('Coming soon');
    setAction(null);
    setActionNote("");
  };

  const statusOptions = [
    { v: "all", l: "All statuses" },
    { v: "pending_review", l: "Pending Review" },
    { v: "in_progress", l: "In Progress" },
    { v: "completed", l: "Completed" },
    { v: "rejected", l: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Approval" value={pending} icon={Clock} variant="warning" />
        <StatCard title="Approved Requests" value={approved} icon={CheckCircle2} variant="success" />
        <StatCard title="Rejected Requests" value={rejected} icon={XCircle} variant="danger" />
        <StatCard title="Total Devices Requested" value={totalRequested} icon={Cpu} />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Device Requests
              </CardTitle>
              <CardDescription>Tenant-submitted device provisioning requests awaiting platform review and fulfilment</CardDescription>
            </div>
            <ExportButton
              filename="device-provisioning-queue"
              rows={filtered}
              columns={[
                { header: "Organisation", accessor: (r) => tenantName(r.tenant_id) },
                { header: "Email", accessor: (r) => tenantEmail(r.tenant_id) },
                { header: "Manufacturer", accessor: (r) => r.manufacturer },
                { header: "Devices", accessor: () => 1 },
                { header: "KYC Status", accessor: (r) => kycCache[r.tenant_id]?.status || "not_submitted" },
                { header: "Priority", accessor: (r) => r.priority || "normal" },
                { header: "Status", accessor: (r) => r.status },
                { header: "Requested", accessor: (r) => format(new Date(r.created_at), "yyyy-MM-dd HH:mm") },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organisation, email, manufacturer, IMEI…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PlatformFilterPopover
              entity="Requests"
              fields={[
                {
                  key: "priority",
                  label: "Priority",
                  type: "select",
                  options: [
                    { value: "urgent", label: "Urgent" },
                    { value: "high", label: "High" },
                    { value: "normal", label: "Normal" },
                    { value: "low", label: "Low" },
                  ],
                },
                {
                  key: "organisation",
                  label: "Organisation",
                  type: "select",
                  options: Array.from(
                    new Set(reqs.map((r) => tenantName(r.tenant_id))),
                  )
                    .filter((n) => n && n !== "—")
                    .map((n) => ({ value: n, label: n })),
                },
                {
                  key: "manufacturer",
                  label: "Manufacturer",
                  type: "select",
                  options: Array.from(new Set(reqs.map((r) => r.manufacturer)))
                    .filter(Boolean)
                    .map((m) => ({ value: m, label: m })),
                },
              ]}
              value={filterDraft}
              onApply={setFilterDraft}
              onReset={() =>
                setFilterDraft({
                  priority: { enabled: false },
                  organisation: { enabled: false },
                  manufacturer: { enabled: false },
                })
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No device provisioning requests found</p>
              <p className="text-xs">Adjust filters or wait for tenants to request devices</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Request Email</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const sd = deviceStatusDisplay(r.status);
                    const isPending = ["pending_review", "assigned", "awaiting_heartbeat"].includes(r.status);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">{tenantName(r.tenant_id)}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tenantEmail(r.tenant_id)}
                        </TableCell>
                        <TableCell className="font-medium">{r.manufacturer}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.model || "—"}
                        </TableCell>
                        <TableCell>{r.quantity ?? 1}</TableCell>
                        <TableCell>
                          <KycCell status={kycCache[r.tenant_id]?.status ?? null} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={sd.className}>
                            {sd.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          <div>{format(new Date(r.created_at), "MMM d, yyyy")}</div>
                          <div className="text-xs opacity-70">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setDetailsReq(r);
                                  setDetailsOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {isPending && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => approveDirect(r.id)}
                                  >
                                    <ThumbsUp className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openAction({ action: "reject", id: r.id, label: r.imei })}
                                    className="text-destructive"
                                  >
                                    <ThumbsDown className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!action}
        onOpenChange={(o) => {
          if (!o) {
            setAction(null);
            setActionNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action?.action === "approve" && "Approve request"}
              {action?.action === "reject" && "Reject request"}
              {action?.action === "fulfil" && "Mark as fulfilled"}
            </DialogTitle>
            <DialogDescription>Device request · {action?.label}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {action?.action === "reject" ? "Reason (required)" : "Notes (optional)"}
            </label>
            <Textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder={
                action?.action === "reject"
                  ? "Tell the tenant why this request is being rejected…"
                  : "Internal note for traceability"
              }
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setAction(null);
                setActionNote("");
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={runAction} disabled={busy}>
              {busy ? "Working…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeviceRequestDetailsDialog
        open={detailsOpen}
        onOpenChange={(o) => {
          setDetailsOpen(o);
          if (!o) setDetailsReq(null);
        }}
        request={detailsReq as unknown as Parameters<typeof DeviceRequestDetailsDialog>[0]["request"]}
        tenantName={detailsReq ? tenantName(detailsReq.tenant_id) : ""}
        tenantEmail={detailsReq ? tenantEmail(detailsReq.tenant_id) : ""}
        kycStatus={detailsReq ? kycCache[detailsReq.tenant_id]?.status ?? null : null}
        onApprove={() => {
          if (detailsReq) {
            const id = detailsReq.id;
            setDetailsOpen(false);
            void approveDirect(id);
          }
        }}
        onReject={() => {
          if (detailsReq) {
            openAction({ action: "reject", id: detailsReq.id, label: detailsReq.imei });
            setDetailsOpen(false);
          }
        }}
      />
    </div>
  );
}
