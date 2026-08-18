import {
  useQuery, useQueryClient,
} from "@tanstack/react-query";
import {
  formatDate, formatDayMonth,
} from "@truckmoov/app-core/utils/time-utils";
import {
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
  Card, CardContent, CardDescription, CardHeader, CardTitle,
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
import { useAuthStore } from "@/stores/authStore";

export function OrgUpgradeQueue() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [
    reviewingId,
    setReviewingId,
  ] = useState<string | null>(null);
  const [
    reviewNotes,
    setReviewNotes,
  ] = useState("");
  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const {
    data: requests = [], isLoading,
  } = useQuery({
    queryKey: ["org-upgrade-requests"],
    queryFn: async () => {
      const DEMO_REQUESTS = [
        {
          id: "dur-1", org_id: "demo-oo-1", orgName: "Tunde Adebayo Logistics", orgType: "OWNER_OPERATOR", status: "pending", reason: "Fleet has grown to 9 vehicles — exceeded Owner-Operator cap.", current_vehicle_count: 9, current_driver_count: 11, target_org_type: "FLEET_PROVIDER", requested_by_name: "Tunde Adebayo", created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), reviewed_at: null, review_notes: null,
        },
        {
          id: "dur-2", org_id: "demo-oo-2", orgName: "Cisse Brothers Haulage", orgType: "OWNER_OPERATOR", status: "pending", reason: "Adding a fleet manager and 4 new trucks for Kano corridor.", current_vehicle_count: 8, current_driver_count: 8, target_org_type: "FLEET_PROVIDER", requested_by_name: "Aminata Cissé", created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), reviewed_at: null, review_notes: null,
        },
        {
          id: "dur-3", org_id: "demo-oo-3", orgName: "Mensah Cargo Express", orgType: "OWNER_OPERATOR", status: "pending", reason: "Won enterprise contract — needs dispatcher seat and multi-driver.", current_vehicle_count: 7, current_driver_count: 9, target_org_type: "FLEET_PROVIDER", requested_by_name: "Kwame Mensah", created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), reviewed_at: null, review_notes: null,
        },
        {
          id: "dur-4", org_id: "demo-oo-4", orgName: "Dlamini Transport", orgType: "OWNER_OPERATOR", status: "approved", reason: "Acquired competitor — now operating 14 trucks.", current_vehicle_count: 14, current_driver_count: 16, target_org_type: "FLEET_PROVIDER", requested_by_name: "Zanele Dlamini", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), review_notes: "Approved — KYC docs and bank statements verified.",
        },
        {
          id: "dur-5", org_id: "demo-oo-5", orgName: "Bello & Sons Logistics", orgType: "OWNER_OPERATOR", status: "rejected", reason: "Want to add manager seat.", current_vehicle_count: 3, current_driver_count: 3, target_org_type: "FLEET_PROVIDER", requested_by_name: "Ibrahim Bello", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), review_notes: "Below threshold — Owner-Operator plan still appropriate. Consider Standard tier add-on.",
        },
      ];
      return DEMO_REQUESTS;
    },
  });

  const pendingRequests = requests.filter((r: any) => r.status === "pending");
  const processedRequests = requests.filter((r: any) => r.status !== "pending");

  const handleApprove = async (_requestId: string) => {
    toast.info("Coming soon");
  };

  const handleReject = async (_requestId: string) => {
    toast.info("Coming soon");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-300 bg-amber-50"
          >
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="default"
            className="bg-emerald-600"
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
                    {pendingRequests.map((req: any) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Truck className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{req.orgName}</p>
                            <p className="text-xs text-muted-foreground">
                              {req.current_vehicle_count}
                              {" "}
                              vehicles • Requested
                              {" "}
                              {formatDate(req.created_at)}
                            </p>
                            {req.reason && (
                              <p className="text-xs text-muted-foreground mt-1 italic truncate">
                                "
                                {req.reason}
                                "
                              </p>
                            )}
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
              ).map((req: any) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{req.orgName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(req.status)}
                    <span className="text-xs text-muted-foreground">
                      {formatDayMonth(req.reviewed_at || req.created_at)}
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
