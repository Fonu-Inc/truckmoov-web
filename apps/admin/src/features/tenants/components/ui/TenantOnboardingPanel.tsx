import type {
  OnboardingApplication,
  OnboardingApplicationStatus,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemOnboardingApplicationsQueryOptions,
  useApproveSystemOnboardingApplication,
  useRejectSystemOnboardingApplication,
  useRequestChangesSystemOnboardingApplication,
  useResendSystemOnboardingApplicationSetupLink,
} from "@truckmoov/api/auth";
import { formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Mail,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
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

/**
 * Current Stage column.
 *
 * ponytail: the reference app (:8080) drives this from a 7-stage journey
 * (Application → … → Fleet Ready) held in hardcoded demo data. No endpoint
 * exposes a real stage, so it is derived from the application status instead.
 * Swap for the real field when provisioning/installation state is available.
 */
function stageLabel(status: OnboardingApplicationStatus): string {
  switch (status) {
    case "approved":
      return "Fleet Ready";
    case "rejected":
      return "Application";
    case "changes_requested":
      return "Application";
    case "under_review":
      return "Provisioning";
    default:
      return "Application";
  }
}

type DecisionDialog
  = | {
    kind: "reject" | "changes"; application: OnboardingApplication;
  }
  | null;

export function TenantOnboardingPanel() {
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

  // Client-side CSV of the rows currently in view, mirroring the reference app.
  const exportData = () => {
    if (applications.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const headers = [
      "Tenant",
      "Email",
      "Contact Person",
      "Organization Type",
      "Current Stage",
      "Status",
      "Date Applied",
    ];
    const escape = (v: string) => `"${v.replace(
      /"/g,
      "\"\"",
    )}"`;
    const rows = applications.map(app => [
      app.organizationName,
      app.businessEmail,
      app.contactFullName,
      app.applicantType === "owner_operator" ? "Owner Operator / Individual" : "Enterprise",
      stageLabel(app.applicationStatus),
      STATUS_LABELS[app.applicationStatus],
      app.createdAt,
    ].map(escape).join(","));
    const csv = [
      headers.join(","),
      ...rows,
    ].join("\n");
    const url = URL.createObjectURL(new Blob(
      [csv],
      { type: "text/csv;charset=utf-8;" },
    ));
    const link = document.createElement("a");
    link.href = url;
    link.download = "tenant-onboarding.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${applications.length} rows`);
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

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Tenant Onboarding</CardTitle>
                <CardDescription>
                  Monitor and supervise tenant onboarding from application submission through fleet activation.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
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

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Organization Type</TableHead>
                    <TableHead>Vehicles</TableHead>
                    <TableHead>Devices Requested</TableHead>
                    <TableHead>Current Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.isLoading
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="py-10 text-center text-sm text-muted-foreground"
                          >
                            Loading applications…
                          </TableCell>
                        </TableRow>
                      )
                    : applications.length === 0
                      ? (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="py-10 text-center text-sm text-muted-foreground"
                            >
                              No onboarding tenants found.
                            </TableCell>
                          </TableRow>
                        )
                      : (
                          applications.map(app => (
                            <TableRow key={app.id}>
                              <TableCell>
                                <p className="font-medium">{app.organizationName}</p>
                                <p className="text-xs text-muted-foreground">{app.businessEmail}</p>
                              </TableCell>
                              <TableCell className="text-sm">{app.contactFullName}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="rounded-full"
                                >
                                  {app.applicantType === "owner_operator"
                                    ? "Owner Operator / Individual"
                                    : "Enterprise"}
                                </Badge>
                              </TableCell>
                              {/* ponytail: OnboardingApplication carries no fleet counts —
                                  no vehicles/devices field on the DTO. Render em-dash until
                                  an endpoint exposes the requested fleet. */}
                              <TableCell className="whitespace-nowrap text-muted-foreground">—</TableCell>
                              <TableCell className="whitespace-nowrap text-muted-foreground">—</TableCell>
                              <TableCell className="font-medium">{stageLabel(app.applicationStatus)}</TableCell>
                              <TableCell>{statusBadge(app.applicationStatus)}</TableCell>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                {formatDayMonthTime(app.createdAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      {expandedId === app.id ? "Hide details" : "Show details"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleApprove(app)}
                                      className="text-success"
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setDecisionDialog({
                                        application: app,
                                        kind: "changes",
                                      })}
                                    >
                                      <Mail className="h-4 w-4 mr-2" />
                                      Request Changes
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setDecisionDialog({
                                        application: app,
                                        kind: "reject",
                                      })}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleResend(app)}
                                      disabled={resendMutation.isPending}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Resend setup link
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                </TableBody>
              </Table>
            </div>
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
