import type {
  SystemOnboardingApplicationDetail,
  SystemOnboardingDocument,
  SystemOnboardingPaymentReview,
} from "@truckmoov/api/auth";
import type {
  Decision, SectionKey,
} from "@/features/tenants/utils/onboarding";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemOnboardingApplicationDocumentLinkQueryOptions,
  getSystemOnboardingApplicationQueryOptions,
  useApproveSystemOnboardingApplicationDocument,
  useRejectSystemOnboardingApplicationDocument,
} from "@truckmoov/api/auth";
import {
  formatDateTime,
  formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  Eye,
  FileText,
  MessageSquareWarning,
  MoreHorizontal,
  PackageCheck,
  RotateCw,
  Send,
  X,
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
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Textarea } from "@/components/shadcn/textarea";
import { FleetRequirementsReview } from "@/features/tenants/components/ui/FleetRequirementsReview";
import { OnboardingReasonDialog } from "@/features/tenants/components/ui/OnboardingReasonDialog";
import { TenantHardwareAllocation } from "@/features/tenants/components/ui/TenantHardwareAllocation";
import { useOnboardingApplicationActions } from "@/features/tenants/hooks/useOnboardingApplicationActions";
import {
  canDecide,
  decisionLabel,
  DOCUMENT_STATUS_COLORS,
  errorMessage,
  isReturningApplication,
  organizationTypeOf,
  prettyDocumentType,
  prettyFileSize,
  SECTION_LABEL,
  toDecision,
} from "@/features/tenants/utils/onboarding";
import { formatCurrency } from "@/lib/currency";
import { PageTitle } from "@/shared/components/layout/PageTitle";

type DialogKind = Exclude<Decision, "pending">;

/** Fleetflow's applicationFormSections, filled from the live application. */
function applicationFormSections(app: SystemOnboardingApplicationDetail) {
  const address = app.address || "-";
  // ponytail: the application has one address line — no separate city / state for
  // "Business location" / "State" yet.
  const location = "-";
  if (app.applicantType === "owner_operator") {
    return [
      {
        title: "Owner-Operator details",
        rows: [
          [
            "Full name",
            app.contactFullName,
          ],
          [
            "Business name",
            app.organizationName,
          ],
          [
            "Email address",
            app.businessEmail,
          ],
          [
            "Phone number",
            app.organizationPhone,
          ],
          [
            "Business address",
            address,
          ],
          [
            "State",
            location,
          ],
        ] as Array<[string, string]>,
      },
    ];
  }
  return [
    {
      title: "Enterprise details",
      rows: [
        [
          "Company name",
          app.organizationName,
        ],
        [
          "Company email",
          app.businessEmail,
        ],
        [
          "Contact person's name",
          app.contactFullName,
        ],
        [
          "Contact person's role",
          app.contactRole || "-",
        ],
        [
          "Business phone number",
          app.organizationPhone,
        ],
        [
          "Business address",
          address,
        ],
        [
          "Business location",
          location,
        ],
        [
          "Telecom Master",
          app.telecomMaster?.numberType === "existing"
            ? `Existing MTN number +${app.telecomMaster.msisdn ?? ""}`
            : app.telecomMaster?.numberType === "new"
              ? "New Telecom Master SIM requested"
              : "-",
        ],
      ] as Array<[string, string]>,
    },
  ];
}

/**
 * Onboarding application review behind `/tenants/onboarding/:id` — fleetflow's ApplicationReview.
 * No `sidebarNav` entry, so it renders its own `<PageTitle>`. Approve / Request More Information /
 * Reject use the live onboarding endpoints; provisioning and resend actions sit in the heading's
 * overflow menu, and live document review stays on the Submitted Documents rows.
 */
export default function OnboardingApplicationPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detailQuery = useQuery(getSystemOnboardingApplicationQueryOptions(id));
  const actions = useOnboardingApplicationActions();
  const app = detailQuery.data?.data;
  const [
    dialog,
    setDialog,
  ] = useState<DialogKind | null>(null);
  const [
    section,
    setSection,
  ] = useState<SectionKey>("business");
  const [
    message,
    setMessage,
  ] = useState("");
  const [
    saving,
    setSaving,
  ] = useState(false);
  const [
    viewingDocument,
    setViewingDocument,
  ] = useState<SystemOnboardingDocument | null>(null);

  const back = () => navigate("/tenants?tab=kyc-review");

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-5">
        <Button
          variant="ghost"
          onClick={back}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to applications
        </Button>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!app) {
    return (
      <>
        <Button
          variant="ghost"
          onClick={back}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to applications
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          {detailQuery.isError
            ? errorMessage(
                detailQuery.error,
                "Unable to load this application.",
              )
            : "Application not found."}
          {detailQuery.isError && (
            <Button
              variant="link"
              onClick={() => detailQuery.refetch()}
            >
              Retry
            </Button>
          )}
        </p>
      </>
    );
  }

  const decision = toDecision(app.status);
  // The live API only takes a decision while the application is in review.
  const decidable = canDecide(app.status);
  const returning = isReturningApplication(app.documents);

  const submit = async () => {
    if (!dialog)
      return;
    setSaving(true);
    try {
      const ok = dialog === "approved"
        ? await actions.approve(app)
        : dialog === "rejected"
          ? await actions.reject(
              app,
              message.trim(),
            )
          // ponytail: no "area" field on the request-changes endpoint — the area leads the reason.
          : await actions.requestChanges(
              app,
              `${SECTION_LABEL[section]}: ${message.trim()}`,
            );
      if (ok) {
        setDialog(null);
        setMessage("");
      }
    }
    finally {
      setSaving(false);
    }
  };

  // The viewer asks for a fresh short-lived link when it opens; nothing is cached.
  const viewDocument = (doc: SystemOnboardingDocument) => {
    setViewingDocument(doc);
  };

  const showProvision = app.stage === "provisioning";
  const showResendChanges = app.status === "changes_requested";
  const showResendPayment = app.status === "approved" && app.stage === "payment";
  const showResendSetup = app.status === "approved";
  const hasMore = showProvision || showResendChanges || showResendPayment || showResendSetup;

  // Rejected documents are the reviewer's notes on the Submitted documents area.
  const reviewNotes = [
    ...(decision === "pending" && app.decisionReason ? [app.decisionReason] : []),
    ...app.documents
      .filter(d => d.status === "rejected" && d.rejectionReason)
      .map(d => `${SECTION_LABEL.documents}: ${prettyDocumentType(d.documentType)}: ${d.rejectionReason}`),
  ];

  return (
    <>
      <div className="space-y-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={back}
          className="-ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to applications
        </Button>
        <PageTitle
          title={app.organizationName}
          description={organizationTypeOf(app.applicantType)}
          primaryActions={(
            <div className="flex flex-wrap justify-end gap-2">
              {hasMore && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="More application actions"
                      disabled={actions.isPending}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {showProvision && (
                      <DropdownMenuItem onClick={() => actions.markProvisioned(app)}>
                        <PackageCheck className="mr-2 h-4 w-4" />
                        Mark provisioned
                      </DropdownMenuItem>
                    )}
                    {showResendChanges && (
                      <DropdownMenuItem onClick={() => actions.resendChangesLink(app)}>
                        <Send className="mr-2 h-4 w-4" />
                        Resend changes-requested link
                      </DropdownMenuItem>
                    )}
                    {showResendPayment && (
                      <DropdownMenuItem onClick={() => actions.resendPaymentLink(app)}>
                        <Send className="mr-2 h-4 w-4" />
                        Resend payment link
                      </DropdownMenuItem>
                    )}
                    {showResendSetup && (
                      <DropdownMenuItem onClick={() => actions.resendSetupLink(app)}>
                        <Send className="mr-2 h-4 w-4" />
                        Resend setup link
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {decidable && (
                <>
                  <Button onClick={() => {
                    setMessage("");
                    setDialog("approved");
                  }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve Application
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMessage("");
                      setDialog("more_info");
                    }}
                  >
                    <MessageSquareWarning className="mr-2 h-4 w-4" />
                    Request More Information
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setMessage("");
                      setDialog("rejected");
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject Application
                  </Button>
                </>
              )}
            </div>
          )}
        />
        <div className="flex flex-wrap items-center gap-3">
          {returning && (
            <Badge
              variant="secondary"
              className="rounded-full"
            >
              Returning customer
            </Badge>
          )}
          <Badge variant={decision === "rejected" ? "destructive" : "outline"}>{decisionLabel(decision)}</Badge>
          <p className="text-xs text-muted-foreground">
            {`Submitted ${formatWithPattern(
              app.submittedAt ?? app.createdAt,
              "dd MMM yyyy, HH:mm",
            )}`}
          </p>
        </div>
        {app.stage === "provisioning" && (
          <p className="text-sm text-muted-foreground">
            Waiting for device stock. Payment opens by itself once enough devices are available, or you can open it now from the actions menu. If stock is still short, you will be asked for a reason.
          </p>
        )}
        {app.paymentReviews.map(review => (
          <PaymentReviewNotice
            key={review.paymentId}
            review={review}
            onResolved={() => actions.openPaymentResolved(
              app,
              review.paymentId,
            )}
            onRefund={() => actions.openPaymentRefund(
              app,
              review.paymentId,
            )}
            onIssueRefund={() => actions.openIssueRefund(
              app,
              review.paymentId,
            )}
          />
        ))}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Business Details</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {applicationFormSections(app).map(group => (
              <div
                key={group.title}
                className="border-b border-border pb-4"
              >
                <h3 className="mb-3 font-medium">{group.title}</h3>
                <dl className="space-y-3">
                  {group.rows.map(([
                    label,
                    value,
                  ]) => (
                    <div
                      key={label}
                      className="grid grid-cols-2 gap-3 text-sm"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="break-words font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Fleet Requirements</h2>
          <FleetRequirementsReview
            vehicles={app.vehicles}
            deviceRequests={app.deviceRequests}
          />
        </section>
        <SubmittedDocumentsCard
          app={app}
          onView={viewDocument}
        />
        {app.decisionReason && decision !== "pending" && (
          <section className="border-l-2 border-border pl-4">
            <h2 className="font-medium">{decision === "rejected" ? "Rejection Reason" : "Information Requested"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{app.decisionReason}</p>
          </section>
        )}
        {reviewNotes.length > 0 && (
          <section>
            <h2 className="mb-2 font-medium">Review Notes</h2>
            {reviewNotes.map(note => (
              <p
                key={note}
                className="mb-2 text-sm text-muted-foreground"
              >
                {note}
              </p>
            ))}
          </section>
        )}
        {decision === "approved" && <TenantHardwareAllocation application={app} />}
        {app.reviewedAt && (
          <p className="text-xs text-muted-foreground">
            {`Decision recorded ${formatWithPattern(
              app.reviewedAt,
              "dd MMM yyyy, HH:mm",
            )}`}
          </p>
        )}
      </div>
      <Dialog
        open={!!dialog}
        onOpenChange={open => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "approved" ? "Approve Application" : dialog === "rejected" ? "Reject Application" : "Request More Information"}</DialogTitle>
            <DialogDescription>{dialog === "approved" ? `Approve ${app.organizationName}? Devices are allocated automatically from platform stock. SIMs must still be allocated separately.` : "Record the reason for this decision."}</DialogDescription>
          </DialogHeader>
          {dialog === "more_info" && (
            <div className="space-y-2">
              <Label>Area</Label>
              <Select
                value={section}
                onValueChange={value => setSection(value as SectionKey)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SECTION_LABEL).map(([
                    key,
                    label,
                  ]) => (
                    <SelectItem
                      key={key}
                      value={key}
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {dialog !== "approved" && (
            <div className="space-y-2">
              <Label required>Reason</Label>
              <Textarea
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={saving || (dialog !== "approved" && !message.trim())}
              onClick={submit}
            >
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DocumentViewerDialog
        applicationId={app.id}
        document={viewingDocument}
        open={!!viewingDocument}
        onOpenChange={open => !open && setViewingDocument(null)}
      />
      {actions.reasonDialog}
    </>
  );
}

/**
 * Fleetflow's Submitted Documents card. The Approve / Reject buttons are truckmoov's live
 * document review (approval is refused while any document is rejected or missing), shown
 * only while the application is in review.
 */
function DocumentViewerDialog({
  applicationId,
  document,
  open,
  onOpenChange,
}: {
  applicationId: string;
  document: SystemOnboardingDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const linkQuery = useQuery({
    ...getSystemOnboardingApplicationDocumentLinkQueryOptions(
      applicationId,
      document?.id ?? "",
    ),
    enabled: open && Boolean(document),
  });
  const link = linkQuery.data?.data;
  const mimeType = (link?.mimeType ?? document?.mimeType ?? "").toLowerCase();
  const documentName = link?.documentName ?? document?.documentName ?? "";
  const isPdf = mimeType.includes("pdf") || /\.pdf$/i.test(documentName);
  const isImage = mimeType.startsWith("image/");
  const error = linkQuery.isError
    ? errorMessage(
        linkQuery.error,
        "Could not load this document.",
      )
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {document ? prettyDocumentType(document.documentType) : "Document"}
          </DialogTitle>
          <DialogDescription>
            {documentName}
            {document ? ` · ${prettyFileSize(document.fileSize)}` : ""}
            {link ? ` · Link valid for ${Math.max(
              1,
              Math.round(link.expiresInSeconds / 60),
            )} min` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={linkQuery.isFetching}
            onClick={() => linkQuery.refetch()}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Refresh link
          </Button>
          {link && (
            <>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={link.downloadUrl}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </>
          )}
        </div>

        <div className="min-h-[60vh] overflow-hidden rounded-lg border bg-muted/20">
          {linkQuery.isLoading
            ? <Skeleton className="h-[60vh] w-full" />
            : error || !link
              ? (
                  <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                    <FileText className="h-8 w-8 opacity-50" />
                    <p>{error ?? "No file is available for this document."}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => linkQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </div>
                )
              : isPdf
                ? (
                    <iframe
                      title={documentName}
                      src={link.url}
                      className="h-[70vh] w-full"
                    />
                  )
                : isImage
                  ? (
                      <div className="flex h-[70vh] items-center justify-center overflow-auto p-4">
                        <img
                          src={link.url}
                          alt={documentName}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )
                  : (
                      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                        <FileText className="h-8 w-8 opacity-50" />
                        <p>This file type can't be previewed here.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in new tab
                          </a>
                        </Button>
                      </div>
                    )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SubmittedDocumentsCard({
  app,
  onView,
}: {
  app: SystemOnboardingApplicationDetail;
  onView: (doc: SystemOnboardingDocument) => void;
}) {
  const approveDoc = useApproveSystemOnboardingApplicationDocument();
  const rejectDoc = useRejectSystemOnboardingApplicationDocument();
  const [
    rejecting,
    setRejecting,
  ] = useState<SystemOnboardingDocument | null>(null);
  const reviewable = canDecide(app.status);

  const approve = async (doc: SystemOnboardingDocument) => {
    try {
      await approveDoc.mutateAsync({
        id: app.id,
        documentId: doc.id,
      });
      toast.success(`${prettyDocumentType(doc.documentType)} approved`);
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
      toast.success("Document rejected. Use Request More Information to send the application back");
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
    <Card>
      <CardHeader>
        <CardTitle>Submitted Documents</CardTitle>
        {/* Fleetflow's card header fills this in from its heading-description table. */}
        <CardDescription className="mt-1.5">Submitted documents, validity dates, and related records.</CardDescription>
      </CardHeader>
      <CardContent>
        {app.documents.length === 0
          ? <p className="text-sm text-muted-foreground">No documents submitted.</p>
          : app.documents.map(doc => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{prettyDocumentType(doc.documentType)}</p>
                  <p className="text-xs text-muted-foreground">{doc.documentName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {doc.status !== "pending" && (
                    <Badge
                      variant="outline"
                      className={DOCUMENT_STATUS_COLORS[doc.status]}
                    >
                      {doc.status === "approved" ? "Approved" : "Rejected"}
                    </Badge>
                  )}
                  {reviewable && doc.status !== "approved" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={approveDoc.isPending}
                      onClick={() => approve(doc)}
                    >
                      Approve
                    </Button>
                  )}
                  {reviewable && doc.status !== "rejected" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setRejecting(doc)}
                    >
                      Reject
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(doc)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Documents
                  </Button>
                </div>
              </div>
            ))}
      </CardContent>
      <OnboardingReasonDialog
        open={!!rejecting}
        title="Reject document"
        description={`${rejecting ? prettyDocumentType(rejecting.documentType) : ""}: the applicant sees this reason when more information is requested.`}
        submitLabel="Reject document"
        destructive
        loading={rejectDoc.isPending}
        onOpenChange={open => !open && setRejecting(null)}
        onSubmit={reject}
      />
    </Card>
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
