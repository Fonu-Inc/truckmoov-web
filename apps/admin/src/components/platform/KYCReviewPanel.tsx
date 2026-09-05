import { format } from "date-fns";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import {
  useMemo, useState,
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
import { Separator } from "@/components/shadcn/separator";
import { Textarea } from "@/components/shadcn/textarea";

// ponytail: demo-only panel ported from fleetflow. Wire real KYC submissions
// via @truckmoov/api when the backend exposes tenant_business_info / kyc_documents.

type KycDoc = {
  id: string;
  document_type: string;
  document_name: string;
  file_size: number | null;
  created_at: string;
};

type KycApplication = {
  tenantId: string;
  companyName: string;
  contactName: string;
  businessEmail: string;
  phone: string;
  registrationNumber: string;
  taxId: string;
  businessType: string;
  industry: string;
  address: string;
  customerType: string;
  fleetSize: string;
  plan: string;
  billingModel: string;
  submittedAt: string;
  documents: KycDoc[];
};

type Decision = "pending" | "approved" | "rejected";

type ReviewState = {
  decision: Decision;
  reason?: string;
  linkSentAt?: string;
  linkType?: "setup" | "rejection";
  deliveryStatus?: "sent" | "failed";
  attempts?: number;
};

const DOC_LABELS: Record<string, string> = {
  certificate_of_incorporation: "Certificate of Incorporation",
  tax_identification: "Tax Identification (TIN)",
  tax_clearance: "Tax Clearance Certificate",
  utility_bill: "Proof of Business Address",
  directors_id: "Director ID / NIN",
  board_resolution: "Board Resolution",
  fleet_insurance: "Fleet Insurance Certificate",
  business_license: "Business License / Permit",
};

function prettyType(t: string) {
  return DOC_LABELS[t] || t.replace(
    /_/g,
    " ",
  ).replace(
    /\b\w/g,
    c => c.toUpperCase(),
  );
}

const prettySize = (b: number | null) => (b ? `${(b / 1024).toFixed(0)} KB` : "—");

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

const DEMO_APPLICATIONS: KycApplication[] = [
  {
    tenantId: "app-1",
    companyName: "Chidi Trucking",
    contactName: "Chidi Okafor",
    businessEmail: "chidi@chiditrucking.ng",
    phone: "+234 803 221 4499",
    registrationNumber: "RC-1928374",
    taxId: "TIN-98237465-0001",
    businessType: "Sole Proprietorship",
    industry: "Transport & Logistics",
    address: "22 Ojota Road, Ikeja, Lagos, Nigeria",
    customerType: "Owner-Operator (≤10 vehicles)",
    fleetSize: "6 vehicles",
    plan: "Starter",
    billingModel: "Prepaid",
    submittedAt: daysAgo(1),
    documents: [
      {
        id: "a1-d1", document_type: "certificate_of_incorporation", document_name: "CAC-Certificate.pdf", file_size: 421_000, created_at: daysAgo(1),
      },
      {
        id: "a1-d2", document_type: "tax_identification", document_name: "TIN-Certificate.pdf", file_size: 198_000, created_at: daysAgo(1),
      },
      {
        id: "a1-d3", document_type: "directors_id", document_name: "Owner-NIN-Slip.jpg", file_size: 88_000, created_at: daysAgo(1),
      },
      {
        id: "a1-d4", document_type: "utility_bill", document_name: "Utility-Bill.pdf", file_size: 144_000, created_at: daysAgo(1),
      },
    ],
  },
  {
    tenantId: "app-2",
    companyName: "Ada Haulage Services",
    contactName: "Adaeze Nwosu",
    businessEmail: "ada@adahaulage.ng",
    phone: "+234 811 550 7723",
    registrationNumber: "RC-2841930",
    taxId: "TIN-11223344-0001",
    businessType: "Limited Liability Company",
    industry: "Haulage",
    address: "9 Aba Road, Port Harcourt, Rivers, Nigeria",
    customerType: "Owner-Operator (≤10 vehicles)",
    fleetSize: "4 vehicles",
    plan: "Starter",
    billingModel: "Postpaid",
    submittedAt: daysAgo(3),
    documents: [
      {
        id: "a2-d1", document_type: "certificate_of_incorporation", document_name: "CAC-Cert-Ada.pdf", file_size: 388_000, created_at: daysAgo(3),
      },
      {
        id: "a2-d2", document_type: "tax_clearance", document_name: "Tax-Clearance-2026.pdf", file_size: 254_000, created_at: daysAgo(3),
      },
      {
        id: "a2-d3", document_type: "fleet_insurance", document_name: "Fleet-Insurance.pdf", file_size: 512_000, created_at: daysAgo(3),
      },
    ],
  },
  {
    tenantId: "app-3",
    companyName: "Kano Freight Movers",
    contactName: "Musa Ibrahim",
    businessEmail: "musa@kanofreight.ng",
    phone: "+234 706 118 2200",
    registrationNumber: "RC-3390182",
    taxId: "TIN-55667788-0001",
    businessType: "Sole Proprietorship",
    industry: "Freight & Cargo",
    address: "Zaria Road, Kano, Nigeria",
    customerType: "Owner-Operator (≤10 vehicles)",
    fleetSize: "8 vehicles",
    plan: "Starter",
    billingModel: "Prepaid",
    submittedAt: daysAgo(6),
    documents: [
      {
        id: "a3-d1", document_type: "certificate_of_incorporation", document_name: "CAC-Kano-Freight.pdf", file_size: 402_000, created_at: daysAgo(6),
      },
      {
        id: "a3-d2", document_type: "directors_id", document_name: "Owner-Passport.jpg", file_size: 121_000, created_at: daysAgo(6),
      },
      {
        id: "a3-d3", document_type: "utility_bill", document_name: "Office-Utility.pdf", file_size: 132_000, created_at: daysAgo(6),
      },
      {
        id: "a3-d4", document_type: "board_resolution", document_name: "Resolution-Signed.pdf", file_size: 287_000, created_at: daysAgo(6),
      },
      {
        id: "a3-d5", document_type: "business_license", document_name: "Operating-Permit.pdf", file_size: 175_000, created_at: daysAgo(6),
      },
    ],
  },
  {
    tenantId: "app-4",
    companyName: "Enugu Express Carriers",
    contactName: "Ngozi Eze",
    businessEmail: "ngozi@enuguexpress.ng",
    phone: "+234 902 334 8811",
    registrationNumber: "RC-4109283",
    taxId: "TIN-66778899-0001",
    businessType: "Limited Liability Company",
    industry: "Transport & Logistics",
    address: "14 Ogui Road, Enugu, Nigeria",
    customerType: "Owner-Operator (≤10 vehicles)",
    fleetSize: "9 vehicles",
    plan: "Growth",
    billingModel: "Prepaid",
    submittedAt: daysAgo(2),
    documents: [
      {
        id: "a4-d1", document_type: "certificate_of_incorporation", document_name: "CAC-Enugu-Express.pdf", file_size: 356_000, created_at: daysAgo(2),
      },
      {
        id: "a4-d2", document_type: "tax_identification", document_name: "TIN-Enugu.pdf", file_size: 187_000, created_at: daysAgo(2),
      },
      {
        id: "a4-d3", document_type: "tax_clearance", document_name: "Tax-Clearance-Enugu.pdf", file_size: 243_000, created_at: daysAgo(2),
      },
      {
        id: "a4-d4", document_type: "utility_bill", document_name: "PHCN-Bill-Enugu.pdf", file_size: 129_000, created_at: daysAgo(2),
      },
      {
        id: "a4-d5", document_type: "directors_id", document_name: "Director-NIN-Ngozi.jpg", file_size: 96_000, created_at: daysAgo(2),
      },
      {
        id: "a4-d6", document_type: "fleet_insurance", document_name: "Insurance-Cover-Note.pdf", file_size: 478_000, created_at: daysAgo(2),
      },
    ],
  },
  {
    tenantId: "app-5",
    companyName: "Ibadan City Movers",
    contactName: "Tunde Adebayo",
    businessEmail: "tunde@ibadancitymovers.ng",
    phone: "+234 805 990 1122",
    registrationNumber: "RC-5091734",
    taxId: "TIN-33445566-0001",
    businessType: "Sole Proprietorship",
    industry: "Last-Mile Delivery",
    address: "3 Ring Road, Ibadan, Oyo, Nigeria",
    customerType: "Owner-Operator (≤10 vehicles)",
    fleetSize: "5 vehicles",
    plan: "Starter",
    billingModel: "Prepaid",
    submittedAt: daysAgo(4),
    documents: [
      {
        id: "a5-d1", document_type: "certificate_of_incorporation", document_name: "CAC-Ibadan-City.pdf", file_size: 391_000, created_at: daysAgo(4),
      },
      {
        id: "a5-d2", document_type: "utility_bill", document_name: "Water-Corp-Bill.pdf", file_size: 118_000, created_at: daysAgo(4),
      },
      {
        id: "a5-d3", document_type: "directors_id", document_name: "Owner-Drivers-License.jpg", file_size: 104_000, created_at: daysAgo(4),
      },
    ],
  },
  {
    tenantId: "app-6",
    companyName: "Benin Royal Logistics",
    contactName: "Osaze Omoruyi",
    businessEmail: "osaze@beninroyal.ng",
    phone: "+234 701 445 6677",
    registrationNumber: "RC-6028834",
    taxId: "TIN-77889900-0001",
    businessType: "Limited Liability Company",
    industry: "Freight & Cargo",
    address: "41 Airport Road, Benin City, Edo, Nigeria",
    customerType: "Owner-Operator (≤10 vehicles)",
    fleetSize: "7 vehicles",
    plan: "Growth",
    billingModel: "Postpaid",
    submittedAt: daysAgo(8),
    documents: [
      {
        id: "a6-d1", document_type: "certificate_of_incorporation", document_name: "CAC-Benin-Royal.pdf", file_size: 412_000, created_at: daysAgo(8),
      },
      {
        id: "a6-d2", document_type: "tax_identification", document_name: "TIN-Benin.pdf", file_size: 203_000, created_at: daysAgo(8),
      },
      {
        id: "a6-d3", document_type: "board_resolution", document_name: "Board-Resolution.pdf", file_size: 298_000, created_at: daysAgo(8),
      },
      {
        id: "a6-d4", document_type: "business_license", document_name: "Haulage-Permit.pdf", file_size: 167_000, created_at: daysAgo(8),
      },
    ],
  },
  {
    tenantId: "app-7",
    companyName: "Aba Market Runners",
    contactName: "Uche Okonkwo",
    businessEmail: "uche@abamarket.ng",
    phone: "+234 810 223 5599",
    registrationNumber: "RC-7155261",
    taxId: "TIN-44556677-0001",
    businessType: "Sole Proprietorship",
    industry: "Trade Distribution",
    address: "7 Ariaria Market Road, Aba, Abia, Nigeria",
    customerType: "Owner-Operator (≤10 vehicles)",
    fleetSize: "3 vehicles",
    plan: "Starter",
    billingModel: "Prepaid",
    submittedAt: daysAgo(10),
    documents: [
      {
        id: "a7-d1", document_type: "certificate_of_incorporation", document_name: "CAC-Aba-Market.pdf", file_size: 364_000, created_at: daysAgo(10),
      },
      {
        id: "a7-d2", document_type: "utility_bill", document_name: "Shop-Utility-Bill.pdf", file_size: 141_000, created_at: daysAgo(10),
      },
    ],
  },
  {
    tenantId: "app-8",
    companyName: "Jos Highland Freight",
    contactName: "Pam Dung",
    businessEmail: "pam@joshighland.ng",
    phone: "+234 913 778 0044",
    registrationNumber: "RC-8201145",
    taxId: "TIN-88990011-0001",
    businessType: "Limited Liability Company",
    industry: "Transport & Logistics",
    address: "18 Bukuru Road, Jos, Plateau, Nigeria",
    customerType: "Owner-Operator (≤10 vehicles)",
    fleetSize: "10 vehicles",
    plan: "Growth",
    billingModel: "Prepaid",
    submittedAt: daysAgo(12),
    documents: [
      {
        id: "a8-d1", document_type: "certificate_of_incorporation", document_name: "CAC-Jos-Highland.pdf", file_size: 434_000, created_at: daysAgo(12),
      },
      {
        id: "a8-d2", document_type: "tax_clearance", document_name: "Tax-Clearance-Jos.pdf", file_size: 261_000, created_at: daysAgo(12),
      },
      {
        id: "a8-d3", document_type: "fleet_insurance", document_name: "Comprehensive-Fleet-Policy.pdf", file_size: 540_000, created_at: daysAgo(12),
      },
      {
        id: "a8-d4", document_type: "directors_id", document_name: "Director-Voters-Card.jpg", file_size: 91_000, created_at: daysAgo(12),
      },
      {
        id: "a8-d5", document_type: "utility_bill", document_name: "JED-Bill-Jos.pdf", file_size: 127_000, created_at: daysAgo(12),
      },
    ],
  },
];

const DEMO_REVIEWS: Record<string, ReviewState> = {
  "app-3": {
    decision: "approved", linkSentAt: daysAgo(4), linkType: "setup", deliveryStatus: "sent", attempts: 1,
  },
  "app-4": {
    decision: "approved", linkSentAt: daysAgo(1), linkType: "setup", deliveryStatus: "failed", attempts: 1,
  },
  "app-5": { decision: "approved" },
  "app-6": {
    decision: "rejected", reason: "Tax identification number could not be verified with FIRS records.", linkSentAt: daysAgo(6), linkType: "rejection", deliveryStatus: "sent", attempts: 1,
  },
  "app-7": {
    decision: "rejected", reason: "Proof of business address is older than 3 months. Please submit a current utility bill.",
  },
};

export function KYCReviewPanel() {
  const [
    reviews,
    setReviews,
  ] = useState<Record<string, ReviewState>>(DEMO_REVIEWS);
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    openId,
    setOpenId,
  ] = useState<string | null>(DEMO_APPLICATIONS[0]?.tenantId ?? null);
  const [
    rejectTarget,
    setRejectTarget,
  ] = useState<KycApplication | null>(null);
  const [
    rejectReason,
    setRejectReason,
  ] = useState("");
  const [
    sending,
    setSending,
  ] = useState<string | null>(null);

  const filtered = useMemo(
    () => {
      const q = search.toLowerCase();
      return DEMO_APPLICATIONS.filter(
        a =>
          !q
          || a.companyName.toLowerCase().includes(q)
          || a.businessEmail.toLowerCase().includes(q)
          || a.contactName.toLowerCase().includes(q),
      );
    },
    [search],
  );

  const stateOf = (id: string): ReviewState => reviews[id] ?? { decision: "pending" };

  const openDoc = () => {
    toast.info("Sample document — preview not available in demo data.");
  };

  const approve = (app: KycApplication) => {
    setReviews(p => ({
      ...p, [app.tenantId]: { decision: "approved" },
    }));
    toast.success(`${app.companyName} approved — send the setup link to complete activation.`);
  };

  const confirmReject = () => {
    if (!rejectTarget) {
      return;
    }
    if (!rejectReason.trim()) {
      toast.error("Provide a reason for the rejection");
      return;
    }
    setReviews(p => ({
      ...p,
      [rejectTarget.tenantId]: {
        decision: "rejected", reason: rejectReason.trim(),
      },
    }));
    toast.success(`${rejectTarget.companyName} rejected — send the rejection notice.`);
    setRejectTarget(null);
    setRejectReason("");
  };

  const sendLink = async (app: KycApplication, type: "setup" | "rejection") => {
    setSending(app.tenantId);
    await new Promise(r => setTimeout(
      r,
      700,
    ));
    const prev = stateOf(app.tenantId);
    const attempts = (prev.attempts ?? 0) + 1;
    const failed = attempts === 1 && app.tenantId.charCodeAt(app.tenantId.length - 1) % 3 === 0;
    setReviews(p => ({
      ...p,
      [app.tenantId]: {
        ...prev,
        linkSentAt: new Date().toISOString(),
        linkType: type,
        deliveryStatus: failed ? "failed" : "sent",
        attempts,
      },
    }));
    setSending(null);
    if (failed) {
      toast.error(`Delivery to ${app.businessEmail} failed — resend the email.`);
      return;
    }
    toast.success(
      type === "setup"
        ? `Setup link sent to ${app.businessEmail}`
        : `Rejection notice sent to ${app.businessEmail}`,
    );
  };

  const pendingCount = filtered.filter(a => stateOf(a.tenantId).decision === "pending").length;
  const approvedCount = filtered.filter(a => stateOf(a.tenantId).decision === "approved").length;
  const rejectedCount = filtered.filter(a => stateOf(a.tenantId).decision === "rejected").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
        {[
          {
            label: "Awaiting review", value: pendingCount, icon: Clock, tone: "text-warning bg-warning/10",
          },
          {
            label: "Approved", value: approvedCount, icon: CheckCircle2, tone: "text-success bg-success/10",
          },
          {
            label: "Rejected", value: rejectedCount, icon: XCircle, tone: "text-destructive bg-destructive/10",
          },
        ].map(({
          label, value, icon: Icon, tone,
        }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="truncate text-xl font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            KYC Review by Organization
          </CardTitle>
          <CardDescription>
            Each application is grouped by organization. Expand to review the submitted documents
            and application form, then approve or reject and send the outcome link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search organizations, contacts or emails..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0
            ? <p className="py-10 text-center text-sm text-muted-foreground">No applications found.</p>
            : filtered.map((app) => {
                const st = stateOf(app.tenantId);
                const isOpen = openId === app.tenantId;
                return (
                  <Collapsible
                    key={app.tenantId}
                    open={isOpen}
                    onOpenChange={o => setOpenId(o ? app.tenantId : null)}
                    className="rounded-2xl border border-border/60"
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 p-4 text-left"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{app.companyName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {app.contactName}
                              {" · "}
                              {app.businessEmail}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant="outline"
                            className="rounded-full"
                          >
                            {app.documents.length}
                            {" document"}
                            {app.documents.length === 1 ? "" : "s"}
                          </Badge>
                          {st.decision === "approved"
                            ? (
                                <Badge className="rounded-full border-success/30 bg-success/10 text-success">
                                  Approved
                                </Badge>
                              )
                            : st.decision === "rejected"
                              ? (
                                  <Badge
                                    variant="destructive"
                                    className="rounded-full"
                                  >
                                    Rejected
                                  </Badge>
                                )
                              : (
                                  <Badge className="rounded-full border-warning/30 bg-warning/10 text-warning">
                                    Pending review
                                  </Badge>
                                )}
                          {st.linkSentAt && (
                            <Badge
                              variant="outline"
                              className="rounded-full gap-1 text-xs"
                            >
                              <Mail className="h-3 w-3" />
                              {st.linkType === "setup" ? "Setup link sent" : "Rejection sent"}
                            </Badge>
                          )}
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-5 border-t border-border/60 p-4">
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-muted-foreground">Application</h4>
                        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                          {(
                            [
                              [
                                "Organization name",
                                app.companyName,
                              ],
                              [
                                "Contact name",
                                app.contactName,
                              ],
                              [
                                "Business email",
                                app.businessEmail,
                              ],
                              [
                                "Phone",
                                app.phone,
                              ],
                              [
                                "Customer type",
                                app.customerType,
                              ],
                              [
                                "Fleet size",
                                app.fleetSize,
                              ],
                              [
                                "Registration number",
                                app.registrationNumber,
                              ],
                              [
                                "Tax ID",
                                app.taxId,
                              ],
                              [
                                "Business type",
                                app.businessType,
                              ],
                              [
                                "Industry",
                                app.industry,
                              ],
                              [
                                "Plan requested",
                                app.plan,
                              ],
                              [
                                "Billing model",
                                app.billingModel,
                              ],
                              [
                                "Address",
                                app.address,
                              ],
                              [
                                "Submitted",
                                format(
                                  new Date(app.submittedAt),
                                  "MMM d, yyyy · HH:mm",
                                ),
                              ],
                            ] as Array<[string, string]>
                          ).map(([
                            label,
                            value,
                          ]) => (
                            <div
                              key={label}
                              className="space-y-0.5"
                            >
                              <dt className="text-xs text-muted-foreground">{label}</dt>
                              <dd className="text-sm font-medium">{value || "—"}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Submitted documents (
                          {app.documents.length}
                          )
                        </h4>
                        {app.documents.map(d => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{prettyType(d.document_type)}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {d.document_name}
                                  {" · "}
                                  {prettySize(d.file_size)}
                                  {" · "}
                                  {format(
                                    new Date(d.created_at),
                                    "MMM d, yyyy",
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={openDoc}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={openDoc}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        {st.decision === "pending"
                          ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  className="bg-success text-success-foreground hover:bg-success/90"
                                  onClick={() => approve(app)}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Approve application
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setRejectTarget(app);
                                    setRejectReason("");
                                  }}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject application
                                </Button>
                              </div>
                            )
                          : (
                              <div className="space-y-3 rounded-xl border border-border/60 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                      {st.decision === "approved" ? "Application approved" : "Application rejected"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {st.decision === "approved"
                                        ? `Send the activation setup link to ${app.businessEmail}.`
                                        : st.reason || "Rejection recorded."}
                                    </p>
                                  </div>
                                  <Button
                                    disabled={sending === app.tenantId}
                                    variant={st.decision === "approved" ? "default" : "outline"}
                                    onClick={() => sendLink(
                                      app,
                                      st.decision === "approved" ? "setup" : "rejection",
                                    )}
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    {sending === app.tenantId
                                      ? "Sending..."
                                      : st.decision === "approved"
                                        ? st.linkSentAt ? "Resend setup link" : "Send setup link"
                                        : st.linkSentAt ? "Resend rejection link" : "Send rejection link"}
                                  </Button>
                                </div>
                                {st.linkSentAt && st.deliveryStatus !== "failed" && (
                                  <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {st.linkType === "setup" ? "Setup link" : "Rejection notice"}
                                    {" successfully sent to "}
                                    {app.businessEmail}
                                    {" on "}
                                    {format(
                                      new Date(st.linkSentAt),
                                      "MMM d, yyyy · HH:mm",
                                    )}
                                  </div>
                                )}
                                {st.linkSentAt && st.deliveryStatus === "failed" && (
                                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                    <span className="flex items-center gap-2">
                                      <XCircle className="h-4 w-4" />
                                      {"Delivery of the "}
                                      {st.linkType === "setup" ? "setup link" : "rejection notice"}
                                      {" to "}
                                      {app.businessEmail}
                                      {" failed on "}
                                      {format(
                                        new Date(st.linkSentAt),
                                        "MMM d, yyyy · HH:mm",
                                      )}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={sending === app.tenantId}
                                      className="h-7 border-destructive/40 text-destructive hover:bg-destructive/10"
                                      onClick={() => sendLink(
                                        app,
                                        st.linkType ?? (st.decision === "approved" ? "setup" : "rejection"),
                                      )}
                                    >
                                      <Send className="mr-1.5 h-3.5 w-3.5" />
                                      {sending === app.tenantId ? "Resending..." : "Resend email"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
        </CardContent>
      </Card>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={o => !o && setRejectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              {rejectTarget?.companyName}
              {" will be notified with the reason you provide here."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (e.g. illegible certificate of incorporation)"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
            >
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
