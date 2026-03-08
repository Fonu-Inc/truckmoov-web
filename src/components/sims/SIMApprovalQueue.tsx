import { useState, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ClipboardCheck, MoreHorizontal, Eye, ThumbsUp, ThumbsDown,
  Loader2, Wifi, ShieldAlert, AlertTriangle, Smartphone,
} from "lucide-react";
import { useSIMProvisioningRequests, SIMProvisioningRequest } from "@/hooks/useFonuSIM";
import { format } from "date-fns";
import { toast } from "sonner";
import { SIMRequestDetailsDialog } from "./SIMRequestDetailsDialog";
import { KYCRequestDialog } from "./KYCRequestDialog";
import { useTenantKYCCache } from "@/hooks/useTenantKYCCache";
import { KYCBadge, RequestStatusBadge, PriorityBadge } from "./SIMStatusBadges";
import { SIMApprovalSummaryCards } from "./SIMApprovalSummaryCards";

export function SIMApprovalQueue() {
  const { user } = useAuthStore();
  const { requests, loading, approveRequest, rejectRequest, refetch } = useSIMProvisioningRequests();
  const [selectedRequest, setSelectedRequest] = useState<SIMProvisioningRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isKYCRequestOpen, setIsKYCRequestOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const tenantIds = useMemo(() => requests.map((r) => r.tenant_id), [requests]);
  const tenantKYCCache = useTenantKYCCache(tenantIds);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const handleApprove = async (request: SIMProvisioningRequest, overrideJustification?: string) => {
    const tenantKYC = tenantKYCCache[request.tenant_id];
    if (!tenantKYC?.isVerified) {
      toast.error("Cannot Approve - KYC Not Verified", {
        description: `${request.tenant_name || "Tenant"} has not completed KYC verification. Status: ${tenantKYC?.status || "Not submitted"}`,
      });
      return;
    }
    setProcessing(true);
    try {
      await approveRequest(request.id, user?.name || "Platform Admin", user?.id, overrideJustification);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    setProcessing(true);
    try {
      await rejectRequest(selectedRequest.id, rejectReason, user?.name || "Platform Admin", user?.id);
      setIsRejectOpen(false);
      setRejectReason("");
      setSelectedRequest(null);
    } finally {
      setProcessing(false);
    }
  };

  const hasRiskFlags = (request: SIMProvisioningRequest) => {
    const tenantKYC = tenantKYCCache[request.tenant_id];
    return (
      (request.number_of_sims && request.number_of_sims > 20) ||
      !tenantKYC?.isVerified ||
      (request.requested_data_limit_mb && request.requested_data_limit_mb > 10240)
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
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            SIM Provisioning Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No provisioning requests yet</p>
              <p className="text-sm">Requests will appear here when tenants request SIM activations</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>SIMs</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Use Case</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const tenantKYC = tenantKYCCache[request.tenant_id];
                  const canApprove = tenantKYC?.isVerified;
                  const showRiskIndicator = hasRiskFlags(request);

                  return (
                    <TableRow key={request.id} className={showRiskIndicator && request.status === "pending" ? "bg-warning/5" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.tenant_name || request.tenant_id.slice(0, 8)}</p>
                          {showRiskIndicator && request.status === "pending" && (
                            <span className="text-xs text-warning flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Risk flags
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{request.number_of_sims || 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{request.preferred_operator || "Any"}</TableCell>
                      <TableCell className="text-sm capitalize">{request.use_case?.replace(/_/g, " ") || "-"}</TableCell>
                      <TableCell><KYCBadge status={tenantKYCCache[request.tenant_id]?.status ?? null} /></TableCell>
                      <TableCell><PriorityBadge priority={request.priority} /></TableCell>
                      <TableCell><RequestStatusBadge status={request.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedRequest(request); setIsDetailsOpen(true); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {request.status === "pending" && (
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
                                  onClick={() => { setSelectedRequest(request); setIsRejectOpen(true); }}
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
          )}
        </CardContent>
      </Card>

      <SIMRequestDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        request={selectedRequest}
        kycStatus={selectedRequest ? tenantKYCCache[selectedRequest.tenant_id]?.status : null}
        kycVerified={selectedRequest ? tenantKYCCache[selectedRequest.tenant_id]?.isVerified || false : false}
        onApprove={(overrideJustification) => {
          if (selectedRequest) {
            handleApprove(selectedRequest, overrideJustification);
            setIsDetailsOpen(false);
          }
        }}
        onReject={() => { setIsDetailsOpen(false); setIsRejectOpen(true); }}
        onRequestKYC={() => { setIsDetailsOpen(false); setIsKYCRequestOpen(true); }}
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

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this provisioning request</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsRejectOpen(false); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
