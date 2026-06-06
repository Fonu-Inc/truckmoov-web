import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent } from "@/components/shadcn/card";
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Textarea } from "@/components/shadcn/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/shadcn/tabs";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shadcn/dialog";
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Building2,
  ArrowRight,
  AlertTriangle,
  Weight,
  CalendarClock,
  Wallet,
} from "lucide-react";
import { format as dateFormat } from "date-fns";
import { toast } from "sonner";
import { DUMMY_JOB_OFFERS } from "@/lib/ownerOperatorDummyData";

export function JobOffersInbox() {
  const isOwnerOperator = false;
  const eligible = true;
  const activeJobs = 0;
  const maxActiveJobs = 1;
  const reason: string | null = null;
  const { format: formatCurrency } = useCurrency();
  const [respondingOffer, setRespondingOffer] = useState<any | null>(null);
  const [responseAction, setResponseAction] = useState<"ACCEPTED" | "DECLINED" | null>(null);
  const [responseNote, setResponseNote] = useState("");

  const offers: any[] = [];
  const isLoading = false;

  const respondMutation = {
    mutate: (_args: { offerId: string; status: string; note: string }) => {
      toast.info("Coming soon");
      return;
    },
    isPending: false,
  };

  const sourceOffers = offers.length > 0 ? offers : (isLoading ? [] : DUMMY_JOB_OFFERS);
  const pendingOffers = sourceOffers.filter((o: any) => o.status?.toLowerCase() === "pending");
  const respondedOffers = sourceOffers.filter((o: any) => o.status?.toLowerCase() !== "pending");

  const openRespond = (offer: any, action: "ACCEPTED" | "DECLINED") => {
    setRespondingOffer(offer);
    setResponseAction(action);
    setResponseNote("");
  };

  const getOfferStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED": return <Badge className="bg-success/15 text-success border-success/30">Accepted</Badge>;
      case "DECLINED": return <Badge variant="destructive">Declined</Badge>;
      case "EXPIRED": return <Badge variant="secondary">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getJobStatusBadge = (status: string) => {
    const s = (status || "pending").toLowerCase();
    const map: Record<string, string> = {
      completed: "bg-success/15 text-success border-success/30",
      in_progress: "bg-primary/15 text-primary border-primary/30",
      assigned: "bg-accent/20 text-accent-foreground border-accent/30",
      pending: "bg-muted text-muted-foreground border-border",
      cancelled: "bg-destructive/15 text-destructive border-destructive/30",
    };
    return (
      <Badge variant="outline" className={map[s] || map.pending}>
        {s.replace(/_/g, " ")}
      </Badge>
    );
  };

  const renderOfferCard = (offer: any, showActions: boolean) => {
    const job = offer.jobs;
    const ownerOrg = offer.organizations;
    const isExpired = offer.expires_at && new Date(offer.expires_at) < new Date();

    return (
      <Card
        key={offer.id}
        className="flex flex-col h-full border-border transition-all hover:border-primary/40 hover:shadow-md"
      >
        <CardContent className="flex flex-col gap-3 p-4 flex-1">
          {/* Header: ref + status */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{job?.reference || "No ref"}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{ownerOrg?.name || "Unknown"}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {showActions ? (
                isExpired
                  ? <Badge variant="secondary">Expired</Badge>
                  : <Badge className="bg-accent/20 text-accent-foreground border-accent/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
              ) : getOfferStatusBadge(offer.status)}
              {job?.status && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Job: {getJobStatusBadge(job.status)}
                </span>
              )}
            </div>
          </div>

          {/* Route */}
          {job && (
            <div className="rounded-md bg-secondary/40 p-2.5 space-y-1.5">
              <div className="flex items-start gap-1.5 text-xs">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase text-muted-foreground">Pickup</p>
                  <p className="font-medium truncate">{job.pickup_address || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5 text-xs">
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase text-muted-foreground">Delivery</p>
                  <p className="font-medium truncate">{job.delivery_address || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-border p-2">
              <div className="flex items-center gap-1 text-muted-foreground text-[10px] uppercase">
                <Package className="h-3 w-3" /> Cargo
              </div>
              <p className="font-medium truncate mt-0.5">{job?.cargo_type || "—"}</p>
            </div>
            <div className="rounded-md border border-border p-2">
              <div className="flex items-center gap-1 text-muted-foreground text-[10px] uppercase">
                <Weight className="h-3 w-3" /> Weight
              </div>
              <p className="font-medium truncate mt-0.5">{job?.cargo_weight ? `${job.cargo_weight} kg` : "—"}</p>
            </div>
            <div className="rounded-md border border-border p-2">
              <div className="flex items-center gap-1 text-muted-foreground text-[10px] uppercase">
                <Wallet className="h-3 w-3" /> Offer
              </div>
              <p className="font-semibold truncate mt-0.5">
                {offer.offered_rate_ngn ? formatCurrency(offer.offered_rate_ngn) : "TBD"}
              </p>
            </div>
            <div className="rounded-md border border-border p-2">
              <div className="flex items-center gap-1 text-muted-foreground text-[10px] uppercase">
                <CalendarClock className="h-3 w-3" /> Deadline
              </div>
              <p className="font-medium truncate mt-0.5">
                {job?.deadline ? dateFormat(new Date(job.deadline), "MMM d, HH:mm") : "—"}
              </p>
            </div>
          </div>

          {/* Expires */}
          {offer.expires_at && showActions && (
            <p className="text-[10px] text-muted-foreground">
              Offer expires {dateFormat(new Date(offer.expires_at), "MMM d, HH:mm")}
            </p>
          )}

          {/* Response note */}
          {offer.response_note && !showActions && (
            <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
              {offer.response_note}
            </p>
          )}

          {/* Actions */}
          {showActions && !isExpired && (
            <div className="flex gap-2 pt-1 mt-auto">
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
        </CardContent>
      </Card>
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

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="incoming" className="gap-2">
            <Package className="h-4 w-4" />
            Incoming
            {pendingOffers.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingOffers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <Clock className="h-4 w-4" />
            Past Offers
            {respondedOffers.length > 0 && (
              <Badge variant="secondary" className="ml-1">{respondedOffers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-4 space-y-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Incoming Offers</h2>
            <p className="text-sm text-muted-foreground">New job offers awaiting your acceptance or decline.</p>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading offers...</p>
          ) : pendingOffers.length === 0 ? (
            <EmptyState icon={Package} title="No pending offers" description="Job offers from enterprises will appear here." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pendingOffers.map((offer) => renderOfferCard(offer, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Past Offers</h2>
            <p className="text-sm text-muted-foreground">Offers you've previously accepted, declined, or that have expired.</p>
          </div>
          {respondedOffers.length === 0 ? (
            <EmptyState icon={Clock} title="No past offers" description="Offers you've accepted, declined, or that have expired will appear here." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {respondedOffers.map((offer) => renderOfferCard(offer, false))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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



