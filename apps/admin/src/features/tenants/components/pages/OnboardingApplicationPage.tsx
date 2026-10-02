import type {
  SystemOnboardingApplicationDetail,
  SystemOnboardingDocument,
  SystemOnboardingPaymentReview,
} from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemOnboardingApplicationQueryOptions,
  getSystemOnboardingApplicationTimelineQueryOptions,
  useApproveSystemOnboardingApplicationDocument,
  useRejectSystemOnboardingApplicationDocument,
} from "@truckmoov/api/auth";
import {
  formatDateTime,
  formatDayMonthTime,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Mail,
  PackageCheck,
  Send,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router";
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
import { Skeleton } from "@/components/shadcn/skeleton";
import { OnboardingReasonDialog } from "@/features/tenants/components/ui/OnboardingReasonDialog";
import { OnboardingStageStepper } from "@/features/tenants/components/ui/OnboardingStageStepper";
import { useOnboardingApplicationActions } from "@/features/tenants/hooks/useOnboardingApplicationActions";
import {
  APPLICANT_TYPE_LABELS,
  canDecide,
  DOCUMENT_STATUS_COLORS,
  DOCUMENT_TYPE_LABELS,
  errorMessage,
  formatFileSize,
  ONBOARDING_STATUS_COLORS,
  ONBOARDING_STATUS_LABELS,
  stageStatusColor,
  VERDICT_COLORS,
  VERDICT_LABELS,
  VERIFICATION_CHECK_LABELS,
} from "@/features/tenants/utils/onboarding";
import { formatCurrency } from "@/lib/currency";

/**
 * Onboarding application detail behind `/tenants/onboarding/:id` (TRU-FE-16).
 * No `sidebarNav` entry, so the back link is the page heading (docs/design.md, "One route, one name").
 */
export default function OnboardingApplicationPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detailQuery = useQuery(getSystemOnboardingApplicationQueryOptions(id));
  const timelineQuery = useQuery(getSystemOnboardingApplicationTimelineQueryOptions(id));
  const actions = useOnboardingApplicationActions();
  const app = detailQuery.data?.data;

  const backToQueue = (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 gap-2"
      onClick={() => navigate("/tenants?tab=kyc-review")}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to onboarding
    </Button>
  );

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6">
        {backToQueue}
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="space-y-6">
        {backToQueue}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {detailQuery.isError ? errorMessage(
              detailQuery.error,
              "Unable to load this application.",
            ) : "Application not found."}
            {detailQuery.isError && (
              <Button
                variant="link"
                onClick={() => detailQuery.refetch()}
              >
                Retry
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const decidable = canDecide(app.status);

  return (
    <div className="space-y-6">
      {backToQueue}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{app.organizationName}</h1>
            <Badge
              variant="outline"
              className={ONBOARDING_STATUS_COLORS[app.status]}
            >
              {ONBOARDING_STATUS_LABELS[app.status]}
            </Badge>
            <Badge
              variant="outline"
              className={stageStatusColor(app.stageStatus)}
            >
              {app.stageStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {app.reference}
            {" · "}
            {APPLICANT_TYPE_LABELS[app.applicantType]}
            {" · Applied "}
            {formatDayMonthTime(app.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {decidable && (
            <>
              <Button
                variant="success"
                loading={actions.approvePending}
                disabled={actions.isPending}
                onClick={() => actions.approve(app)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => actions.openRequestChanges(app)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Request Changes
              </Button>
              <Button
                variant="destructive"
                onClick={() => actions.openReject(app)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {app.stage === "provisioning" && (
            <Button
              loading={actions.provisionedPending}
              disabled={actions.isPending}
              onClick={() => actions.markProvisioned(app)}
            >
              <PackageCheck className="mr-2 h-4 w-4" />
              Mark provisioned
            </Button>
          )}
          {app.status === "changes_requested" && (
            <Button
              variant="outline"
              loading={actions.resendChangesPending}
              disabled={actions.isPending}
              onClick={() => actions.resendChangesLink(app)}
            >
              <Send className="mr-2 h-4 w-4" />
              Resend changes-requested link
            </Button>
          )}
          {app.status === "approved" && app.stage === "payment" && (
            <Button
              variant="outline"
              loading={actions.resendPaymentPending}
              disabled={actions.isPending}
              onClick={() => actions.resendPaymentLink(app)}
            >
              <Send className="mr-2 h-4 w-4" />
              Resend payment link
            </Button>
          )}
          {app.status === "approved" && (
            <Button
              variant="outline"
              loading={actions.resendPending}
              disabled={actions.isPending}
              onClick={() => actions.resendSetupLink(app)}
            >
              <Send className="mr-2 h-4 w-4" />
              Resend setup link
            </Button>
          )}
        </div>
      </div>

      {app.decisionReason && (
        <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="font-medium">Why this needs a person</p>
            <p className="text-muted-foreground">{app.decisionReason}</p>
          </div>
        </div>
      )}
      {app.stage === "provisioning" && (
        <p className="text-sm text-muted-foreground">
          Waiting for device stock. Payment opens by itself once enough devices are available, or you can open it now — if stock is still short, you will be asked for a reason.
        </p>
      )}
      {app.paymentReviews.map(review => (
        <PaymentReviewNotice
          key={review.paymentId}
          review={review}
          onResolved={() => actions.openPaymentResolved(app, review.paymentId)}
          onRefund={() => actions.openPaymentRefund(app, review.paymentId)}
          onIssueRefund={() => actions.openIssueRefund(app, review.paymentId)}
        />
      ))}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <VerificationsCard verifications={app.verifications} />
          <DocumentsCard
            app={app}
            onRefresh={() => detailQuery.refetch()}
          />
          <FleetCard app={app} />
        </div>
        <div className="space-y-6">
          <Section title="Onboarding Progress">
            <OnboardingStageStepper progress={app.progress} />
          </Section>
          <Section title="Applicant">
            <dl className="space-y-3 text-sm">
              <DetailItem
                label="Contact"
                value={app.contactRole ? `${app.contactFullName} (${app.contactRole})` : app.contactFullName}
              />
              <DetailItem
                label="Business email"
                value={<Verified ok={app.emailVerified}>{app.businessEmail}</Verified>}
              />
              <DetailItem
                label="Phone"
                value={<Verified ok={app.phoneVerified}>{app.organizationPhone}</Verified>}
              />
              <DetailItem
                label="Address"
                value={app.address}
              />
              <DetailItem
                label="Submitted"
                value={formatDateTime(app.submittedAt)}
              />
              <DetailItem
                label="Reviewed"
                value={app.reviewedAt ? formatDateTime(app.reviewedAt) : "Not yet"}
              />
              <DetailItem
                label="Setup link"
                value={app.setupLink.status
                  ? `${app.setupLink.status === "sent" ? "Sent" : "Failed"} ${formatDateTime(app.setupLink.sentAt)} · ${app.setupLink.attempts} attempt(s)${app.setupLink.error ? ` · ${app.setupLink.error}` : ""}`
                  : "Not sent yet"}
              />
            </dl>
          </Section>
          <Section title="Activity Timeline">
            {timelineQuery.isLoading
              ? <Skeleton className="h-24 w-full" />
              : (timelineQuery.data?.data.entries.length ?? 0) === 0
                  ? <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                  : (
                      <ol className="space-y-3">
                        {timelineQuery.data?.data.entries.map(entry => (
                          <li
                            key={`${entry.at}-${entry.action}`}
                            className="flex gap-3 text-sm"
                          >
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            <div>
                              <p className="font-medium">{entry.summary}</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.actor}
                                {" · "}
                                {formatDateTime(entry.at)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
          </Section>
        </div>
      </div>

      {actions.reasonDialog}
    </div>
  );
}

function PaymentReviewNotice({
  review,
  onResolved,
  onRefund,
  onIssueRefund,
}: {
  review: SystemOnboardingPaymentReview; onResolved: () => void; onRefund: () => void; onIssueRefund: () => void;
}) {
  if (review.status === "refunded") {
    return (
      <div className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">{`Refunded: payment ${review.reference} was sent back to the customer`}</p>
          <p className="text-muted-foreground">
            {review.refundedAt ? formatDateTime(review.refundedAt) : ""}
            {review.reviewNote ? ` · ${review.reviewNote}` : ""}
          </p>
        </div>
      </div>
    );
  }
  const refundPending = review.reviewOutcome === "refund_needed";
  const paid = review.paidNgn === null
    ? "an unknown amount"
    : review.currency && review.currency !== "NGN"
      ? `${review.paidNgn} ${review.currency}`
      : formatCurrency(review.paidNgn);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div>
          <p className="font-medium">
            {`Amount mismatch: expected ${formatCurrency(review.expectedNgn)}, paid ${paid}, reference ${review.reference}`}
          </p>
          {review.refundProcessing && (
            <p className="text-muted-foreground">Refund accepted by the payment provider. It completes on its own and the applicant is emailed then.</p>
          )}
          {review.refundError && (
            <p className="text-destructive">{`The last refund attempt failed: ${review.refundError}`}</p>
          )}
          {review.reviewOutcome
            ? (
                <p className="text-muted-foreground">
                  {review.reviewOutcome === "resolved" ? "Marked resolved" : "Refund needed"}
                  {review.reviewedAt ? ` · ${formatDateTime(review.reviewedAt)}` : ""}
                  {review.reviewNote ? ` · ${review.reviewNote}` : ""}
                </p>
              )
            : (
                <p className="text-muted-foreground">
                  The applicant was told to contact support or pay again. Review it and record what you decided.
                </p>
              )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {refundPending && !review.refundProcessing && (
          <Button
            size="sm"
            onClick={onIssueRefund}
          >
            Issue refund
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onResolved}
        >
          Mark resolved
        </Button>
        {!refundPending && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefund}
          >
            Refund needed
          </Button>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string; description?: string; children: ReactNode;
}) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string; value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
    </div>
  );
}

function Verified({
  ok,
  children,
}: {
  ok: boolean; children: ReactNode;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {children}
      <Badge
        variant="outline"
        className={ok ? DOCUMENT_STATUS_COLORS.approved : DOCUMENT_STATUS_COLORS.pending}
      >
        {ok ? "Verified" : "Unverified"}
      </Badge>
    </span>
  );
}

/** Why a person is looking: which registry check could not settle the application, per provider. */
function VerificationsCard({ verifications }: { verifications: SystemOnboardingApplicationDetail["verifications"] }) {
  return (
    <Section
      title="Registry Verifications"
      description="Automated checks against the registries. Anything other than a match is why this application needs review."
    >
      {verifications.length === 0
        ? <p className="text-sm text-muted-foreground">No registry checks have run for this application.</p>
        : (
            <div className="space-y-4">
              {verifications.map(v => (
                <div
                  key={`${v.check}-${v.checkedAt}`}
                  className="rounded-lg border border-border/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{VERIFICATION_CHECK_LABELS[v.check] ?? v.check}</p>
                    <Badge
                      variant="outline"
                      className={VERDICT_COLORS[v.verdict]}
                    >
                      {VERDICT_LABELS[v.verdict] ?? v.verdict}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{v.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {v.provider}
                    {" · "}
                    {formatDateTime(v.checkedAt)}
                  </p>
                  {v.fields.length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-left text-muted-foreground">
                          <tr>
                            <th className="py-1 pr-3 font-medium">Field</th>
                            <th className="py-1 pr-3 font-medium">Submitted</th>
                            <th className="py-1 pr-3 font-medium">Registry</th>
                            <th className="py-1 font-medium">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {v.fields.map(f => (
                            <tr
                              key={f.name}
                              className="border-t border-border/50"
                            >
                              <td className="py-1 pr-3">{f.name}</td>
                              <td className="py-1 pr-3 font-mono">{f.expected ?? "-"}</td>
                              <td className="py-1 pr-3 font-mono">{f.actual ?? "-"}</td>
                              <td className={f.matched ? "py-1 text-success" : "py-1 text-destructive"}>
                                {f.matched ? "Matched" : "Differs"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
    </Section>
  );
}

function DocumentsCard({
  app,
  onRefresh,
}: {
  app: SystemOnboardingApplicationDetail; onRefresh: () => Promise<{ data?: { data?: SystemOnboardingApplicationDetail } }>;
}) {
  const approveDoc = useApproveSystemOnboardingApplicationDocument();
  const rejectDoc = useRejectSystemOnboardingApplicationDocument();
  const [
    rejecting,
    setRejecting,
  ] = useState<SystemOnboardingDocument | null>(null);
  const [
    downloadingId,
    setDownloadingId,
  ] = useState<string | null>(null);
  const reviewable = canDecide(app.status);

  // Links expire after five minutes: fetch a fresh one on every click.
  const download = async (doc: SystemOnboardingDocument) => {
    setDownloadingId(doc.id);
    try {
      const fresh = await onRefresh();
      const url = fresh.data?.data?.documents.find(d => d.id === doc.id)?.downloadUrl;
      if (url) {
        window.open(
          url,
          "_blank",
          "noopener",
        );
      }
      else {
        toast.error("No download link is available for this document");
      }
    }
    finally {
      setDownloadingId(null);
    }
  };

  const approve = async (doc: SystemOnboardingDocument) => {
    try {
      await approveDoc.mutateAsync({
        id: app.id,
        documentId: doc.id,
      });
      toast.success(`${DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentName} approved`);
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Could not approve the document",
      ));
    }
  };

  const reject = async (reason: string) => {
    if (!rejecting)
      return;
    try {
      await rejectDoc.mutateAsync({
        id: app.id,
        documentId: rejecting.id,
        data: { reason },
      });
      toast.success("Document rejected — use Request Changes to send the application back");
      setRejecting(null);
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Could not reject the document",
      ));
    }
  };

  return (
    <Section
      title={`Documents (${app.documents.length})`}
      description={reviewable ? "Approve or reject each document. Approval is refused while any document is rejected or missing." : undefined}
    >
      {app.documents.length === 0
        ? <p className="text-sm text-muted-foreground">No documents uploaded.</p>
        : (
            <ul className="divide-y divide-border/50">
              {app.documents.map(doc => (
                <li
                  key={doc.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {doc.documentName}
                        {" · "}
                        {formatFileSize(doc.fileSize)}
                        {" · "}
                        {formatDayMonthTime(doc.uploadedAt)}
                      </p>
                      {doc.rejectionReason && (
                        <p className="mt-1 text-xs text-destructive">{doc.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={DOCUMENT_STATUS_COLORS[doc.status]}
                    >
                      {doc.status === "pending" ? "Pending" : doc.status === "approved" ? "Approved" : "Rejected"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Download document"
                      loading={downloadingId === doc.id}
                      onClick={() => download(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {reviewable && doc.status !== "approved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={approveDoc.isPending}
                        onClick={() => approve(doc)}
                      >
                        Approve
                      </Button>
                    )}
                    {reviewable && doc.status !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setRejecting(doc)}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
      <OnboardingReasonDialog
        open={!!rejecting}
        title="Reject document"
        description={`${rejecting ? DOCUMENT_TYPE_LABELS[rejecting.documentType] ?? rejecting.documentName : ""} — the applicant sees this reason when changes are requested.`}
        submitLabel="Reject document"
        destructive
        loading={rejectDoc.isPending}
        onOpenChange={open => !open && setRejecting(null)}
        onSubmit={reject}
      />
    </Section>
  );
}

function FleetCard({ app }: { app: SystemOnboardingApplicationDetail }) {
  return (
    <Section
      title="Fleet"
      description={`${app.vehicleCount} vehicle(s) · ${app.deviceCount} device(s) requested`}
    >
      {app.vehicles.length === 0
        ? <p className="text-sm text-muted-foreground">No vehicles on this application.</p>
        : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Registration</th>
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Make</th>
                    <th className="py-2 font-medium">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {app.vehicles.map(v => (
                    <tr
                      key={v.id}
                      className="border-t border-border/50"
                    >
                      <td className="py-2 pr-3 font-medium">{v.registrationNumber}</td>
                      <td className="py-2 pr-3 capitalize">{v.vehicleType}</td>
                      <td className="py-2 pr-3">{v.make}</td>
                      <td className="py-2">{v.model}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      {app.deviceRequests.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Device requests</p>
          {app.deviceRequests.map(r => (
            <div
              key={r.id}
              className="flex justify-between gap-4 rounded-md border border-border/50 px-3 py-2 text-sm"
            >
              <span>{r.useCase}</span>
              <span className="shrink-0 font-medium">{`× ${r.quantity}`}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
