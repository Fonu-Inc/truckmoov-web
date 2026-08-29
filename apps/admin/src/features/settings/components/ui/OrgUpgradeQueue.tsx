import {
  getOrganisationUpgradeQueueQueryOptions,
  useApproveOrganisationUpgrade,
  useRejectOrganisationUpgrade,
} from "@truckmoov/api/auth";
import {
  formatDate,
  formatDayMonth,
} from "@truckmoov/app-core/utils/time-utils";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpCircle,
  Check,
  Clock,
  Loader2,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/EmptyState";
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
import { Textarea } from "@/components/shadcn/textarea";

function humaniseOrgType(t: string) {
  return t.split("_").map(w => w[0]?.toUpperCase() + w.slice(1)).join("-");
}

function formatOrgTypeChange(from: string, to: string) {
  return `${humaniseOrgType(from)} → ${humaniseOrgType(to)}`;
}

export function OrgUpgradeQueue() {
  const [
    reviewingId,
    setReviewingId,
  ] = useState<string | null>(null);
  const [
    reviewNotes,
    setReviewNotes,
  ] = useState("");

  const queueQuery = useQuery(getOrganisationUpgradeQueueQueryOptions());
  const pendingRequests = queueQuery.data?.data.pending ?? [];
  const processedRequests = queueQuery.data?.data.history ?? [];
  const isLoading = queueQuery.isLoading;

  const approveMut = useApproveOrganisationUpgrade();
  const rejectMut = useRejectOrganisationUpgrade();
  const isProcessing = approveMut.isPending || rejectMut.isPending;

  const handleApprove = (id: string) => {
    approveMut.mutate(
      { id, data: reviewNotes ? { notes: reviewNotes } : {} },
      {
        onSuccess: () => {
          toast.success("Upgrade approved");
          setReviewingId(null);
          setReviewNotes("");
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleReject = (id: string) => {
    rejectMut.mutate(
      { id, data: reviewNotes ? { notes: reviewNotes } : {} },
      {
        onSuccess: () => {
          toast.info("Upgrade rejected");
          setReviewingId(null);
          setReviewNotes("");
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-warning border-warning/30 bg-warning/10"
          >
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="default"
            className="bg-success"
          >
            Approved
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            Pending Upgrade Requests
            {pendingRequests.length > 0 && (
              <Badge variant="secondary">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Owner-Operator organisations requesting promotion to Fleet Provider tier</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading
            ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : queueQuery.isError
              ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="Couldn't load upgrade requests"
                    description={queueQuery.error?.message ?? "Please try again."}
                  />
                )
            : pendingRequests.length === 0
              ? (
                  <EmptyState
                    icon={Clock}
                    title="No pending requests"
                    description="Owner-Operator upgrade requests will appear here for review."
                  />
                )
              : (
                  <div className="space-y-3">
                    {pendingRequests.map(req => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Truck className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {req.reason || "No reason given"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatOrgTypeChange(req.fromOrganisationType, req.toOrganisationType)}
                              {" • "}
                              {(req.currentVehicleCount ?? req.statedVehicleCount) ?? 0}
                              {" vehicles • Requested "}
                              {formatDate(req.requestedAt)}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">
                              tenant
                              {" "}
                              {req.tenantId.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewingId(req.id);
                              setReviewNotes("");
                            }}
                          >
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
        </CardContent>
      </Card>

      {/* History */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request History</CardTitle>
            <CardDescription>Recently approved or rejected upgrade decisions with reviewer notes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedRequests.slice(
                0,
                10,
              ).map(req => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{req.reason || "No reason given"}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(req.status)}
                    <span className="text-xs text-muted-foreground">
                      {formatDayMonth(req.reviewedAt || req.requestedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog
        open={!!reviewingId}
        onOpenChange={o => !o && setReviewingId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Upgrade Request</DialogTitle>
            <DialogDescription>
              Approving will convert this Owner-Operator to a Fleet Provider — removing the vehicle cap, granting Fleet Admin roles to all members, and unlocking the full dashboard. All vehicles, drivers, jobs, and settlements are preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Review notes (optional)"
              rows={3}
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
            />
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={() => reviewingId && handleReject(reviewingId)}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-1.5 h-4 w-4" />}
              Reject
            </Button>
            <Button
              onClick={() => reviewingId && handleApprove(reviewingId)}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
              Approve Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
