import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,

} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,

} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,

} from "@/components/shadcn/table";
import { Textarea } from "@/components/shadcn/textarea";

type SenderIdStatus = "pending" | "whitelisting" | "approved" | "rejected";
type TenantSenderId = {
  id: string;
  sender_id: string;
  sender_type: string;
  status: SenderIdStatus;
  requested_at: string;
  tenant_id: string;
  tenant_name?: string | null;
  request_notes?: string | null;
  request_letter_url?: string | null;
  telecom_reference?: string | null;
  telecom_provider?: string | null;
  admin_notes?: string | null;
  rejection_reason?: string | null;
};

const statusConfig: Record<SenderIdStatus, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
}> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  whitelisting: {
    label: "Whitelisting",
    variant: "outline",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  approved: {
    label: "Approved",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },

};

export function SenderIdApprovalQueue() {
  const requests: TenantSenderId[] = [];
  const pendingCount = 0;
  const whitelistingCount = 0;
  const loading = false;
  const refetch = () => {};
  void refetch;
  const updateStatus = async (_id: string, _status: SenderIdStatus, _data?: any) => {};
  const deleteRequest = (_id: string) => {};
  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState<TenantSenderId | null>(null);
  const [
    actionType,
    setActionType,
  ] = useState<"approve" | "reject" | "whitelist" | null>(null);
  const [
    formData,
    setFormData,
  ] = useState({
    telecom_reference: "",
    telecom_provider: "",
    admin_notes: "",
    rejection_reason: "",

  });
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const handleAction = async () => {
    if (!selectedRequest || !actionType)
      return;

    setIsSubmitting(true);
    try {
      if (actionType === "approve") {
        await updateStatus(
          selectedRequest.id,
          "approved",
          {
            telecom_reference: formData.telecom_reference || undefined,
            telecom_provider: formData.telecom_provider || undefined,
            admin_notes: formData.admin_notes || undefined,

          },
        );
      }
      else if (actionType === "reject") {
        await updateStatus(
          selectedRequest.id,
          "rejected",
          {
            rejection_reason: formData.rejection_reason,
            admin_notes: formData.admin_notes || undefined,

          },
        );
      }
      else if (actionType === "whitelist") {
        await updateStatus(
          selectedRequest.id,
          "whitelisting",
          {
            telecom_provider: formData.telecom_provider || undefined,
            admin_notes: formData.admin_notes || undefined,

          },
        );
      }
      closeDialog();
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setFormData({
      telecom_reference: "",
      telecom_provider: "",
      admin_notes: "",
      rejection_reason: "",
    });
  };

  const openActionDialog = (request: TenantSenderId, action: "approve" | "reject" | "whitelist") => {
    setSelectedRequest(request);
    setActionType(action);
    setFormData({
      telecom_reference: request.telecom_reference || "",
      telecom_provider: request.telecom_provider || "",
      admin_notes: request.admin_notes || "",
      rejection_reason: "",

    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Sender ID Approvals
                {(pendingCount > 0 || whitelistingCount > 0) && (
                  <Badge
                    variant="secondary"
                    className="ml-2"
                  >
                    {pendingCount + whitelistingCount}
                    {" "}
                    pending
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Review and approve tenant sender ID requests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0
            ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No sender ID requests</p>
                  <p className="text-sm mt-1">
                    Tenant requests will appear here for review
                  </p>
                </div>
              )
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sender ID</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Letter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => {
                      const config = statusConfig[request.status];
                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {request.sender_type === "voice"
                                ? (
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                  )
                                : (
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                  )}
                              <span className="font-mono font-medium">{request.sender_id}</span>
                            </div>
                          </TableCell>
                          <TableCell>{request.tenant_name || request.tenant_id}</TableCell>
                          <TableCell className="capitalize">
                            {request.sender_type === "both" ? "SMS & Voice" : request.sender_type}
                          </TableCell>
                          <TableCell>
                            {request.request_letter_url
                              ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1 text-xs"
                                    onClick={() => {
                                      toast.info("Coming soon");
                                    }}
                                  >
                                    <FileText className="h-3 w-3" />
                                    View
                                  </Button>
                                )
                              : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={config.variant}
                              className="gap-1"
                            >
                              {config.icon}
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatRelative(request.requested_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {request.status === "pending" && (
                                  <>
                                    <DropdownMenuItem onClick={() => openActionDialog(
                                      request,
                                      "whitelist",
                                    )}
                                    >
                                      <Loader2 className="h-4 w-4 mr-2" />
                                      Mark as Whitelisting
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openActionDialog(
                                      request,
                                      "approve",
                                    )}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openActionDialog(
                                      request,
                                      "reject",
                                    )}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {request.status === "whitelisting" && (
                                  <>
                                    <DropdownMenuItem onClick={() => openActionDialog(
                                      request,
                                      "approve",
                                    )}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Approve (Whitelisting Complete)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openActionDialog(
                                      request,
                                      "reject",
                                    )}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteRequest(request.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
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

      {/* Action Dialog */}
      <Dialog
        open={!!selectedRequest && !!actionType}
        onOpenChange={() => closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Sender ID"}
              {actionType === "reject" && "Reject Sender ID"}
              {actionType === "whitelist" && "Mark as Whitelisting"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && "Confirm that this sender ID has been whitelisted and is ready for use."}
              {actionType === "reject" && "Provide a reason for rejecting this sender ID request."}
              {actionType === "whitelist" && "Mark this request as in progress with the telecom provider."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">
                  Sender ID:
                  <span className="font-mono">{selectedRequest.sender_id}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Tenant:
                  {selectedRequest.tenant_name || selectedRequest.tenant_id}
                </p>
                {selectedRequest.request_notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Notes:
                    {selectedRequest.request_notes}
                  </p>
                )}
              </div>

              {(actionType === "approve" || actionType === "whitelist") && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telecom Provider</label>
                    <Input
                      placeholder="e.g., MTN, Airtel, Glo..."
                      value={formData.telecom_provider}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        telecom_provider: e.target.value,
                      }))}
                    />
                  </div>
                  {actionType === "approve" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Whitelisting Reference</label>
                      <Input
                        placeholder="Reference number from provider"
                        value={formData.telecom_reference}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          telecom_reference: e.target.value,
                        }))}
                      />
                    </div>
                  )}
                </>
              )}

              {actionType === "reject" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rejection Reason *</label>
                  <Textarea
                    placeholder="Explain why this request is being rejected..."
                    value={formData.rejection_reason}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      rejection_reason: e.target.value,
                    }))}
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes (optional)</label>
                <Textarea
                  placeholder="Internal notes..."
                  value={formData.admin_notes}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    admin_notes: e.target.value,
                  }))}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isSubmitting || (actionType === "reject" && !formData.rejection_reason.trim())}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {isSubmitting
                ? "Processing..."
                : (
                    actionType === "approve"
                      ? "Approve"
                      : actionType === "reject"
                        ? "Reject"
                        : "Mark as Whitelisting"
                  )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
