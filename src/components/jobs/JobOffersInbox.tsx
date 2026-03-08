import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useOwnerOperatorJobLimit } from "@/hooks/useOwnerOperatorJobLimit";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Building2,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { format as dateFormat } from "date-fns";
import { toast } from "sonner";

export function JobOffersInbox() {
  const { orgIds } = useOrgContext();
  const { isOwnerOperator, eligible, activeJobs, maxActiveJobs, reason } = useOwnerOperatorJobLimit();
  const { format: formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [respondingOffer, setRespondingOffer] = useState<any | null>(null);
  const [responseAction, setResponseAction] = useState<"ACCEPTED" | "DECLINED" | null>(null);
  const [responseNote, setResponseNote] = useState("");

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["job-offers-inbox", orgIds],
    queryFn: async () => {
      if (orgIds.length === 0) return [];
      const { data, error } = await supabase
        .from("job_offers")
        .select(`
          *,
          jobs!job_offers_job_id_fkey (
            id, reference, status, pickup_address, delivery_address,
            cargo_type, cargo_weight, amount_ngn, deadline, created_at
          ),
          organizations!job_offers_job_owner_org_id_fkey (
            id, name
          )
        `)
        .in("target_org_id", orgIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: orgIds.length > 0,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ offerId, status, note }: { offerId: string; status: string; note: string }) => {
      const { error } = await supabase
        .from("job_offers")
        .update({
          status,
          responded_at: new Date().toISOString(),
          response_note: note || null,
        })
        .eq("id", offerId);
      if (error) throw error;

      // If accepted, update the job's executing_org_id
      if (status === "ACCEPTED" && respondingOffer) {
        const offer = offers.find((o) => o.id === offerId);
        if (offer) {
          await supabase
            .from("jobs")
            .update({
              executing_org_id: offer.target_org_id,
              status: "assigned",
            })
            .eq("id", offer.job_id);
        }
      }
    },
    onSuccess: () => {
      toast.success(responseAction === "ACCEPTED" ? "Offer accepted" : "Offer declined");
      queryClient.invalidateQueries({ queryKey: ["job-offers-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["enterprise-jobs"] });
      setRespondingOffer(null);
      setResponseAction(null);
      setResponseNote("");
    },
    onError: (err: any) => {
      toast.error("Failed to respond: " + err.message);
    },
  });

  const pendingOffers = offers.filter((o) => o.status?.toLowerCase() === "pending");
  const respondedOffers = offers.filter((o) => o.status?.toLowerCase() !== "pending");

  const openRespond = (offer: any, action: "ACCEPTED" | "DECLINED") => {
    setRespondingOffer(offer);
    setResponseAction(action);
    setResponseNote("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED": return <Badge className="bg-primary/20 text-primary border-primary/30">Accepted</Badge>;
      case "DECLINED": return <Badge variant="destructive">Declined</Badge>;
      case "EXPIRED": return <Badge variant="secondary">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderOfferCard = (offer: any, showActions: boolean) => {
    const job = offer.jobs;
    const ownerOrg = offer.organizations;
    const isExpired = offer.expires_at && new Date(offer.expires_at) < new Date();

    return (
      <div key={offer.id} className="rounded-lg border border-border p-4 space-y-3 transition-colors hover:bg-secondary/20">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{job?.reference || "No ref"}</span>
              {showActions ? (
                isExpired ? <Badge variant="secondary">Expired</Badge> : <Badge className="bg-accent/20 text-accent-foreground border-accent/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
              ) : getStatusBadge(offer.status)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span>From: {ownerOrg?.name || "Unknown"}</span>
            </div>
            {job && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {job.pickup_address?.split(",")[0] || "Pickup"}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {job.delivery_address?.split(",")[0] || "Delivery"}
                </span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            {offer.offered_rate_ngn && (
              <p className="font-semibold text-sm">{formatCurrency(offer.offered_rate_ngn)}</p>
            )}
            {offer.expires_at && (
              <p className="text-[10px] text-muted-foreground">
                Expires {dateFormat(new Date(offer.expires_at), "MMM d, HH:mm")}
              </p>
            )}
          </div>
        </div>

        {showActions && !isExpired && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1" onClick={() => openRespond(offer, "ACCEPTED")} disabled={isOwnerOperator && !eligible}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Accept
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => openRespond(offer, "DECLINED")}>
              <XCircle className="h-4 w-4 mr-1.5" />
              Decline
            </Button>
          </div>
        )}

        {offer.response_note && !showActions && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
            {offer.response_note}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isOwnerOperator && !eligible && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {reason || `You have ${activeJobs} active job(s). Maximum allowed: ${maxActiveJobs}. Complete your current job to accept new offers.`}
          </AlertDescription>
        </Alert>
      )}

      {isOwnerOperator && eligible && activeJobs > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Active jobs: {activeJobs}/{maxActiveJobs}. You can accept {maxActiveJobs - activeJobs} more offer(s).
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Incoming Job Offers
            {pendingOffers.length > 0 && (
              <Badge className="ml-2">{pendingOffers.length} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading offers...</p>
          ) : pendingOffers.length === 0 ? (
            <EmptyState icon={Package} title="No pending offers" description="Job offers from enterprises will appear here." />
          ) : (
            <div className="space-y-3">
              {pendingOffers.map((offer) => renderOfferCard(offer, true))}
            </div>
          )}
        </CardContent>
      </Card>

      {respondedOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Past Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {respondedOffers.slice(0, 10).map((offer) => renderOfferCard(offer, false))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Dialog */}
      <Dialog open={!!respondingOffer} onOpenChange={() => { setRespondingOffer(null); setResponseAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === "ACCEPTED" ? "Accept Job Offer" : "Decline Job Offer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {responseAction === "ACCEPTED"
                ? "You're accepting this job offer. The job will be assigned to your organization."
                : "You're declining this job offer. The enterprise will be notified."}
            </p>
            <Textarea
              placeholder="Add a note (optional)..."
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRespondingOffer(null); setResponseAction(null); }}>
              Cancel
            </Button>
            <Button
              variant={responseAction === "ACCEPTED" ? "default" : "destructive"}
              onClick={() => {
                if (respondingOffer && responseAction) {
                  respondMutation.mutate({
                    offerId: respondingOffer.id,
                    status: responseAction,
                    note: responseNote,
                  });
                }
              }}
              disabled={respondMutation.isPending}
            >
              {respondMutation.isPending ? "Processing..." : responseAction === "ACCEPTED" ? "Confirm Accept" : "Confirm Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
