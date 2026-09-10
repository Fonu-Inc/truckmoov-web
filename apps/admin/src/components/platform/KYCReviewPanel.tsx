import type {
  OnboardingApplication,
  OnboardingApplicationSetupLink,
  OnboardingApplicationStatus,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemOnboardingApplicationsQueryOptions,
  getSystemOnboardingApplicationsSummaryQueryOptions,
  useApproveSystemOnboardingApplication,
  useRejectSystemOnboardingApplication,
  useRequestChangesSystemOnboardingApplication,
  useResendSystemOnboardingApplicationSetupLink,
} from "@truckmoov/api/auth";
import { formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Mail,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import {
  useEffect, useState,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";

const STATUS_LABELS: Record<OnboardingApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes Requested",
};

function statusBadge(status: OnboardingApplicationStatus) {
  switch (status) {
    case "approved":
      return <Badge className="bg-success/10 text-success border-success/30">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "changes_requested":
      return <Badge className="bg-warning/10 text-warning border-warning/30">Changes Requested</Badge>;
    case "under_review":
      return <Badge className="bg-primary/10 text-primary border-primary/30">Under Review</Badge>;
    case "submitted":
      return <Badge className="bg-primary/10 text-primary border-primary/30">Submitted</Badge>;
    default:
      return <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>;
  }
}

// ponytail: transport-accepted, not delivered. Spec §5 is explicit — never
// call this "delivered", there is no bounce feedback.
function SetupLinkPill({ link }: { link: OnboardingApplicationSetupLink | null | undefined }) {
  if (!link || link.status === null)
    return null;
  if (link.status === "sent") {
    return (
      <div className="flex items-center gap-2 text-xs text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>
          Setup link sent
          {link.sentAt ? ` · ${formatDayMonthTime(link.sentAt)}` : ""}
          {link.attempts > 1 ? ` · ${link.attempts} attempts` : ""}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5" />
      <span>
        Delivery failed
        {link.error ? ` — ${link.error}` : ""}
        {link.attempts > 1 ? ` · ${link.attempts} attempts` : ""}
      </span>
    </div>
  );
}

type DecisionDialog
  = | {
    kind: "reject" | "changes"; application: OnboardingApplication;
  }
  | null;

export function KYCReviewPanel() {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState<OnboardingApplicationStatus | "all">("all");
  const [
    expandedId,
    setExpandedId,
  ] = useState<string | null>(null);
  const [
    decisionDialog,
    setDecisionDialog,
  ] = useState<DecisionDialog>(null);
  const [
    reason,
    setReason,
  ] = useState("");

  useEffect(
    () => {
      const t = setTimeout(
        setDebouncedSearch,
        400,
        search,
      );
      return () => clearTimeout(t);
    },
    [search],
  );

  const summaryQuery = useQuery(getSystemOnboardingApplicationsSummaryQueryOptions());
  const summary = summaryQuery.data?.data;

  const listQuery = useQuery(getSystemOnboardingApplicationsQueryOptions({
    params: {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status !== "all" ? { status } : {}),
    },
  }));
  const applications: OnboardingApplication[] = listQuery.data?.data?.items ?? [];

  const approveMutation = useApproveSystemOnboardingApplication();
  const rejectMutation = useRejectSystemOnboardingApplication();
  const changesMutation = useRequestChangesSystemOnboardingApplication();
  const resendMutation = useResendSystemOnboardingApplicationSetupLink();

  const handleApprove = async (application: OnboardingApplication) => {
    try {
      const res = await approveMutation.mutateAsync({ id: application.id });
      // Approve response's `message` says whether the setup-link send succeeded.
      toast.success(res.message || `${application.organizationName} approved`);
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Approval failed";
      toast.error(message);
    }
  };

  const handleResend = async (application: OnboardingApplication) => {
    try {
      const res = await resendMutation.mutateAsync({ id: application.id });
      toast.success(res.message || "Setup link resend requested");
      listQuery.refetch();
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Resend failed";
      toast.error(message);
    }
  };

  const handleDecisionSubmit = async () => {
    if (!decisionDialog || reason.trim().length < 5) {
      toast.error("Reason must be at least 5 characters");
      return;
    }
    try {
      if (decisionDialog.kind === "reject") {
        await rejectMutation.mutateAsync({
          id: decisionDialog.application.id,
          data: { reason: reason.trim() },
        });
        toast.success("Application rejected");
      }
      else {
        await changesMutation.mutateAsync({
          id: decisionDialog.application.id,
          data: { reason: reason.trim() },
        });
        toast.success("Changes requested");
      }
      setDecisionDialog(null);
      setReason("");
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Action failed";
      toast.error(message);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="Total"
            value={summary?.total ?? "N/A"}
            icon={FileText}
            loading={summaryQuery.isPending}
          />
          <StatCard
            title="Pending Review"
            value={summary?.pendingReview ?? "N/A"}
            icon={Clock}
            variant="warning"
            loading={summaryQuery.isPending}
          />
          <StatCard
            title="Approved"
            value={summary?.approved ?? "N/A"}
            icon={CheckCircle2}
            variant="success"
            loading={summaryQuery.isPending}
          />
          <StatCard
            title="Rejected"
            value={summary?.rejected ?? "N/A"}
            icon={XCircle}
            variant="danger"
            loading={summaryQuery.isPending}
          />
          <StatCard
            title="Changes Requested"
            value={summary?.changesRequested ?? "N/A"}
            icon={Mail}
            loading={summaryQuery.isPending}
          />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Onboarding Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by organisation, email, or reference..."
                  className="pl-10"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={status}
                onValueChange={v => setStatus(v as OnboardingApplicationStatus | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="changes_requested">Changes Requested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {listQuery.isLoading
              ? <p className="text-sm text-muted-foreground py-8 text-center">Loading applications…</p>
              : applications.length === 0
                ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No applications match these filters.
                    </div>
                  )
                : (
                    <div className="space-y-2">
                      {applications.map(app => (
                        <Collapsible
                          key={app.id}
                          open={expandedId === app.id}
                          onOpenChange={o => setExpandedId(o ? app.id : null)}
                        >
                          <Card className="border-border/60">
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="w-full p-4 text-left hover:bg-muted/30 transition-colors rounded-lg"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-medium truncate">{app.organizationName}</p>
                                      {statusBadge(app.applicationStatus)}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {app.contactFullName}
                                      {" · "}
                                      {app.businessEmail}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                      <span className="inline-flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {app.documentCount ?? app.documents?.length ?? 0}
                                        {" documents"}
                                      </span>
                                      <span>
                                        Submitted
                                        {formatDayMonthTime(app.createdAt)}
                                      </span>
                                    </div>
                                    <div className="mt-2">
                                      <SetupLinkPill link={app.setupLink} />
                                    </div>
                                  </div>
                                  <ChevronDown
                                    className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === app.id ? "rotate-180" : ""}`}
                                  />
                                </div>
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="border-t border-border/60 p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <p className="text-muted-foreground">Contact</p>
                                    <p className="font-medium">
                                      {app.contactFullName}
                                      {" · "}
                                      {app.contactRole}
                                    </p>
                                    <p>{app.organizationPhone}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Address</p>
                                    <p>
                                      {app.streetAddress}
                                      ,
                                      {" "}
                                      {app.city}
                                      ,
                                      {" "}
                                      {app.state}
                                    </p>
                                  </div>
                                </div>

                                {app.documents?.length > 0 && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-2">Documents</p>
                                    <div className="space-y-1">
                                      {app.documents.map(doc => (
                                        <div
                                          key={doc.id}
                                          className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span className="truncate">{doc.fileName || doc.documentType}</span>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] shrink-0 capitalize"
                                          >
                                            {doc.reviewStatus ?? "pending"}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                                  {(app.applicationStatus === "submitted" || app.applicationStatus === "under_review") && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleApprove(app)}
                                        disabled={approveMutation.isPending}
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setReason("");
                                          setDecisionDialog({
                                            kind: "changes", application: app,
                                          });
                                        }}
                                      >
                                        Request Changes
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          setReason("");
                                          setDecisionDialog({
                                            kind: "reject", application: app,
                                          });
                                        }}
                                      >
                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {app.applicationStatus === "approved" && app.setupLink?.status === "failed" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleResend(app)}
                                      disabled={resendMutation.isPending}
                                    >
                                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                      Resend setup link
                                    </Button>
                                  )}
                                  {app.applicationStatus === "approved" && app.setupLink?.status === "sent" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleResend(app)}
                                      disabled={resendMutation.isPending}
                                    >
                                      <Send className="h-3.5 w-3.5 mr-1" />
                                      Resend
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </div>
                  )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!decisionDialog}
        onOpenChange={o => !o && setDecisionDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decisionDialog?.kind === "reject" ? "Reject application" : "Request changes"}
            </DialogTitle>
            <DialogDescription>
              {decisionDialog?.application.organizationName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason (shared with the applicant)"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">Minimum 5 characters.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDecisionDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant={decisionDialog?.kind === "reject" ? "destructive" : "default"}
              onClick={handleDecisionSubmit}
              disabled={rejectMutation.isPending || changesMutation.isPending || reason.trim().length < 5}
            >
              {decisionDialog?.kind === "reject" ? "Reject" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
