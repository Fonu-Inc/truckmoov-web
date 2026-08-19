import type { FilterDraft } from "@/components/shadcn/platform-filter-popover";
import {
  formatDate, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, ClipboardCheck, Eye, Loader2, MoreHorizontal,
  Search, ShieldAlert, Smartphone, ThumbsDown, ThumbsUp, Wifi,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { PlatformFilterPopover } from "@/components/shadcn/platform-filter-popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { Textarea } from "@/components/shadcn/textarea";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { startSIMProvisioningSimulation } from "@/lib/provisioningEngineSim";
import { useAuthStore } from "@/stores/authStore";
import { KYCRequestDialog } from "./KYCRequestDialog";
import { SIMApprovalSummaryCards } from "./SIMApprovalSummaryCards";
import { SIMRequestDetailsDialog } from "./SIMRequestDetailsDialog";
import {
  KYCBadge, RequestStatusBadge,
} from "./SIMStatusBadges";
// Local type aliases (hooks deleted)
type SIMProvisioningRequest = {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  status: string;
  priority: string | null;
  number_of_sims: number | null;
  requested_data_limit_mb: number | null;
  preferred_operator: string | null;
  use_case: string | null;
  created_at: string;
  fonu_request_id: string | null;
  [key: string]: any;
};
type TenantKYCInfo = {
  status: string | null; isVerified: boolean;
};
type TenantKYCCache = Record<string, TenantKYCInfo>;

export function SIMApprovalQueue() {
  const { user } = useAuthStore();
  // Hooks removed — inline defaults until data source is wired up
  const requests: SIMProvisioningRequest[] = [];
  const loading = false;
  const approveRequest = async (_id: string, _approvedBy: string, _userId?: string, _justification?: string) => {};
  const rejectRequest = async (_id: string, _reason: string, _rejectedBy: string, _userId?: string) => {};
  const refetch = () => {};
  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState<SIMProvisioningRequest | null>(null);
  const [
    isDetailsOpen,
    setIsDetailsOpen,
  ] = useState(false);
  const [
    isRejectOpen,
    setIsRejectOpen,
  ] = useState(false);
  const [
    isKYCRequestOpen,
    setIsKYCRequestOpen,
  ] = useState(false);
  const [
    rejectReason,
    setRejectReason,
  ] = useState("");
  const [
    processing,
    setProcessing,
  ] = useState(false);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    filterDraft,
    setFilterDraft,
  ] = useState<FilterDraft>({
    priority: { enabled: false },
    organisation: { enabled: false },
    carrier: { enabled: false },
    useCase: { enabled: false },
  });

  // useTenantKYCCache removed — empty cache until data source is wired up
  const tenantKYCCache: TenantKYCCache = {};
  const tenantEmailMap: Record<string, string> = {};
  const tenantEmail = (id: string) => tenantEmailMap[id] || "—";

  const filteredRequests = useMemo(
    () => {
      const q = searchQuery.toLowerCase();
      const priorityF = filterDraft.priority;
      const orgF = filterDraft.organisation;
      const carrierF = filterDraft.carrier;
      const useCaseF = filterDraft.useCase;
      return requests.filter((r) => {
        const matchesSearch = !q || [
          r.tenant_name,
          r.tenant_id,
          tenantEmailMap[r.tenant_id],
          r.preferred_operator,
          r.use_case,
        ]
          .some(v => v?.toLowerCase().includes(q));
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        const matchesPriority = !priorityF?.enabled || !priorityF.value || (r.priority || "").toLowerCase() === priorityF.value;
        const matchesOrg = !orgF?.enabled || !orgF.value || (r.tenant_name || r.tenant_id) === orgF.value;
        const matchesCarrier = !carrierF?.enabled || !carrierF.value || (r.preferred_operator || "Any") === carrierF.value;
        const matchesUseCase = !useCaseF?.enabled || !useCaseF.value || r.use_case === useCaseF.value;
        return matchesSearch && matchesStatus && matchesPriority && matchesOrg && matchesCarrier && matchesUseCase;
      });
    },
    [
      requests,
      searchQuery,
      statusFilter,
      filterDraft,
    ],
  );

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  const handleApprove = async (request: SIMProvisioningRequest, overrideJustification?: string) => {
    const tenantKYC = tenantKYCCache[request.tenant_id];
    if (!tenantKYC?.isVerified) {
      toast.error(
        "Cannot Approve - KYC Not Verified",
        { description: `${request.tenant_name || "Tenant"} has not completed KYC verification. Status: ${tenantKYC?.status || "Not submitted"}` },
      );
      return;
    }
    setProcessing(true);
    try {
      await approveRequest(
        request.id,
        user?.name || "Platform Admin",
        user?.id,
        overrideJustification,
      );
      // Kick off simulated External Provisioning Engine
      startSIMProvisioningSimulation(request.id).catch(e =>
        console.warn(
          "Provisioning sim failed (non-blocking):",
          e,
        ));
    }
    finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim())
      return;
    setProcessing(true);
    try {
      await rejectRequest(
        selectedRequest.id,
        rejectReason,
        user?.name || "Platform Admin",
        user?.id,
      );
      setIsRejectOpen(false);
      setRejectReason("");
      setSelectedRequest(null);
    }
    finally {
      setProcessing(false);
    }
  };

  const hasRiskFlags = (request: SIMProvisioningRequest) => {
    const tenantKYC = tenantKYCCache[request.tenant_id];
    return (
      (request.number_of_sims && request.number_of_sims > 20)
      || !tenantKYC?.isVerified
      || (request.requested_data_limit_mb && request.requested_data_limit_mb > 10240)
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SIMApprovalSummaryCards
        pendingCount={pendingRequests.length}
        approvedCount={approvedRequests.length}
        rejectedCount={rejectedRequests.length}
        totalRequested={requests.length}
      />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                SIM Requests
              </CardTitle>
              <CardDescription>
                Tenant submissions for new SIM provisioning awaiting review, approval, or fulfilment.
              </CardDescription>
            </div>
            <ExportButton
              filename="sim-provisioning-queue"
              rows={filteredRequests}
              columns={[
                {
                  header: "Organisation", accessor: r => r.tenant_name || r.tenant_id,
                },
                {
                  header: "Email", accessor: r => tenantEmail(r.tenant_id),
                },
                {
                  header: "SIMs", accessor: r => r.number_of_sims ?? 1,
                },
                {
                  header: "Carrier", accessor: r => r.preferred_operator || "Any",
                },
                {
                  header: "Use Case", accessor: r => r.use_case || "",
                },
                {
                  header: "Priority", accessor: r => r.priority || "",
                },
                {
                  header: "Status", accessor: r => r.status,
                },
                {
                  header: "Requested", accessor: r => formatWithPattern(
                    r.created_at,
                    "yyyy-MM-dd HH:mm",
                  ),
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by organisation, email, carrier, use case..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                    {
                      value: "urgent", label: "Urgent",
                    },
                    {
                      value: "high", label: "High",
                    },
                    {
                      value: "normal", label: "Normal",
                    },
                    {
                      value: "low", label: "Low",
                    },
                  ],
                },
                {
                  key: "organisation",
                  label: "Organisation",
                  type: "select",
                  options: Array.from(
                    new Set(requests.map(r => r.tenant_name || r.tenant_id)),
                  )
                    .filter(Boolean)
                    .map(n => ({
                      value: n, label: n,
                    })),
                },
                {
                  key: "carrier",
                  label: "Carrier",
                  type: "select",
                  options: Array.from(
                    new Set(requests.map(r => r.preferred_operator || "Any")),
                  )
                    .filter(Boolean)
                    .map(c => ({
                      value: c, label: c,
                    })),
                },
                {
                  key: "useCase",
                  label: "Use Case",
                  type: "select",
                  options: Array.from(
                    new Set(requests.map(r => r.use_case).filter(Boolean) as string[]),
                  ).map(u => ({
                    value: u, label: u.replace(
                      /_/g,
                      " ",
                    ),
                  })),
                },
              ]}
              value={filterDraft}
              onApply={setFilterDraft}
              onReset={() =>
                setFilterDraft({
                  priority: { enabled: false },
                  organisation: { enabled: false },
                  carrier: { enabled: false },
                  useCase: { enabled: false },
                })}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0
            ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No provisioning requests found</p>
                  <p className="text-sm">Adjust filters or wait for tenants to request SIM activations</p>
                </div>
              )
            : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-6 whitespace-nowrap">Organisation</TableHead>
                        <TableHead className="px-6 whitespace-nowrap">Request Email</TableHead>
                        <TableHead className="px-6 whitespace-nowrap">Carrier</TableHead>
                        <TableHead className="px-6 whitespace-nowrap">Data Limit / SIM</TableHead>
                        <TableHead className="px-6 whitespace-nowrap">Quantity</TableHead>
                        <TableHead className="px-6 whitespace-nowrap">KYC Status</TableHead>
                        <TableHead className="px-6 whitespace-nowrap">Status</TableHead>
                        <TableHead className="px-6 whitespace-nowrap">Date Requested</TableHead>
                        <TableHead className="px-6 text-right whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => {
                        const tenantKYC = tenantKYCCache[request.tenant_id];
                        const canApprove = tenantKYC?.isVerified;
                        const showRiskIndicator = hasRiskFlags(request);
                        const isPending = [
                          "pending",
                          "pending_review",
                        ].includes(request.status);
                        const dataLimit = request.requested_data_limit_mb
                          ? request.requested_data_limit_mb >= 1024
                            ? `${(request.requested_data_limit_mb / 1024).toFixed(1)} GB`
                            : `${request.requested_data_limit_mb} MB`
                          : "Standard";

                        return (
                          <TableRow
                            key={request.id}
                            className={showRiskIndicator && isPending ? "bg-warning/5" : ""}
                          >
                            <TableCell className="px-6">
                              <div>
                                <p className="font-medium whitespace-nowrap">
                                  {request.tenant_name || request.tenant_id.slice(
                                    0,
                                    8,
                                  )}
                                </p>
                                {showRiskIndicator && isPending && (
                                  <span className="text-xs text-warning flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {" "}
                                    Risk flags
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 text-sm text-muted-foreground whitespace-nowrap">
                              {tenantEmail(request.tenant_id)}
                            </TableCell>
                            <TableCell className="px-6 text-sm whitespace-nowrap">{request.preferred_operator || "Any"}</TableCell>
                            <TableCell className="px-6 text-sm whitespace-nowrap">{dataLimit}</TableCell>
                            <TableCell className="px-6">
                              <div className="flex items-center gap-1">
                                <Smartphone className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{request.number_of_sims || 1}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6"><KYCBadge status={tenantKYCCache[request.tenant_id]?.status ?? null} /></TableCell>
                            <TableCell className="px-6"><RequestStatusBadge status={request.status} /></TableCell>
                            <TableCell className="px-6 text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(request.created_at)}
                            </TableCell>
                            <TableCell className="px-6 text-right">
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
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedRequest(request);
                                    setIsDetailsOpen(true);
                                  }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {isPending && (
                                    <>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div>
                                              <DropdownMenuItem
                                                onClick={() => handleApprove(request)}
                                                disabled={processing || !canApprove}
                                                className={!canApprove ? "opacity-50 cursor-not-allowed" : ""}
                                              >
                                                <ThumbsUp className="h-4 w-4 mr-2" />
                                                Approve
                                                {!canApprove && <ShieldAlert className="h-3 w-3 ml-1 text-warning" />}
                                              </DropdownMenuItem>
                                            </div>
                                          </TooltipTrigger>
                                          {!canApprove && (
                                            <TooltipContent>
                                              <p>Tenant KYC not verified</p>
                                            </TooltipContent>
                                          )}
                                        </Tooltip>
                                      </TooltipProvider>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedRequest(request);
                                          setIsRejectOpen(true);
                                        }}
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

      <SIMRequestDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        request={selectedRequest}
        tenantEmail={selectedRequest ? tenantEmail(selectedRequest.tenant_id) : ""}
        kycStatus={selectedRequest ? tenantKYCCache[selectedRequest.tenant_id]?.status : null}
        kycVerified={selectedRequest ? tenantKYCCache[selectedRequest.tenant_id]?.isVerified || false : false}
        onApprove={(overrideJustification) => {
          if (selectedRequest) {
            handleApprove(
              selectedRequest,
              overrideJustification,
            );
            setIsDetailsOpen(false);
          }
        }}
        onReject={() => {
          setIsDetailsOpen(false);
          setIsRejectOpen(true);
        }}
        onRequestKYC={() => {
          setIsDetailsOpen(false);
          setIsKYCRequestOpen(true);
        }}
      />

      {selectedRequest && (
        <KYCRequestDialog
          open={isKYCRequestOpen}
          onOpenChange={setIsKYCRequestOpen}
          tenantId={selectedRequest.tenant_id}
          tenantName={selectedRequest.tenant_name}
          requestId={selectedRequest.id}
          onComplete={refetch}
        />
      )}

      <Dialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this provisioning request</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectOpen(false);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
