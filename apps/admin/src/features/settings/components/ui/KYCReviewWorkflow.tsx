import {
  formatDate,
  toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  Mail,
  Shield,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useState,
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
import { ExportButton } from "@/components/shadcn/export-button";

import { Separator } from "@/components/shadcn/separator";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shadcn/data-table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { Textarea } from "@/components/shadcn/textarea";
import { KYCNotificationHistory } from "./KYCNotificationHistory";

type BusinessInfo = {
  id: string;
  tenant_id: string;
  company_name: string;
  registration_number: string | null;
  tax_id: string | null;
  business_type: string | null;
  industry: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  verification_status: string;
  created_at: string;
};

type KYCDocument = {
  id: string;
  tenant_id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
  created_at: string;
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  certificate_of_incorporation: "Certificate of Incorporation",
  memorandum_of_association: "Memorandum of Association",
  tax_clearance: "Tax Clearance Certificate",
  vat_certificate: "VAT Registration Certificate",
  business_license: "Business License/Permit",
  insurance_certificate: "Insurance Certificate",
  proof_of_address: "Proof of Business Address",
  director_id: "Director ID/Passport",
  other: "Other Document",
};

export function KYCReviewWorkflow() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("pending");
  const [
    businessInfoList,
    setBusinessInfoList,
  ] = useState<BusinessInfo[]>([]);
  const [
    documents,
    setDocuments,
  ] = useState<KYCDocument[]>([]);
  const [
    loading,
    setLoading,
  ] = useState(true);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    tenantStatusFilter,
    setTenantStatusFilter,
  ] = useState("all");
  const [
    tenantFilters,
    setTenantFilters,
  ] = useState<import("@/components/ui/table-toolbar").FilterValues>({});
  const [
    docSearch,
    setDocSearch,
  ] = useState("");
  const [
    docStatusFilter,
    setDocStatusFilter,
  ] = useState("all");
  const [
    docFilters,
    setDocFilters,
  ] = useState<import("@/components/ui/table-toolbar").FilterValues>({});
  const [
    selectedTenant,
    setSelectedTenant,
  ] = useState<BusinessInfo | null>(null);
  const [
    selectedDocument,
    setSelectedDocument,
  ] = useState<KYCDocument | null>(null);
  const [
    reviewDialogOpen,
    setReviewDialogOpen,
  ] = useState(false);
  const [
    reviewComment,
    setReviewComment,
  ] = useState("");
  const [
    reviewAction,
    setReviewAction,
  ] = useState<"approve" | "reject">("approve");
  const [submitting] = useState(false);
  const [
    tenantDetailOpen,
    setTenantDetailOpen,
  ] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const realBusiness: BusinessInfo[] = [];
      const realDocs: KYCDocument[] = [];

      const DEMO_BUSINESS: BusinessInfo[] = [
        {
          id: "db-1",
          tenant_id: "demo-t1",
          company_name: "Lagos Express Logistics Ltd",
          registration_number: "RC-2841029",
          tax_id: "TIN-1029384756",
          business_type: "Limited Liability Company",
          industry: "Logistics & Haulage",
          address_line1: "12 Apapa Road",
          city: "Lagos",
          state: "Lagos",
          country: "Nigeria",
          phone: "+234 802 123 4567",
          email: "compliance@lagosexpress.ng",
          verification_status: "under_review",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
        },
        {
          id: "db-2",
          tenant_id: "demo-t4",
          company_name: "Cape Town Trucking (Pty) Ltd",
          registration_number: "2018/485102/07",
          tax_id: "VAT-4830127584",
          business_type: "Private Company",
          industry: "Freight Trucking",
          address_line1: "45 Voortrekker Road",
          city: "Cape Town",
          state: "Western Cape",
          country: "South Africa",
          phone: "+27 21 555 0142",
          email: "ops@capetowntruck.co.za",
          verification_status: "pending",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        },
        {
          id: "db-3",
          tenant_id: "demo-t6",
          company_name: "Abuja Haulage Co.",
          registration_number: "RC-3920184",
          tax_id: "TIN-2938401827",
          business_type: "Limited Liability Company",
          industry: "Heavy Haulage",
          address_line1: "Plot 88 Aminu Kano Cresc.",
          city: "Abuja",
          state: "FCT",
          country: "Nigeria",
          phone: "+234 805 998 1234",
          email: "admin@abujahaulage.ng",
          verification_status: "pending",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        },
        {
          id: "db-4",
          tenant_id: "demo-t3",
          company_name: "Nairobi Fleet Group",
          registration_number: "PVT-NRB-29481",
          tax_id: "KRA-A012938475X",
          business_type: "Private Company",
          industry: "Logistics",
          address_line1: "Mombasa Road, Industrial Area",
          city: "Nairobi",
          state: "Nairobi",
          country: "Kenya",
          phone: "+254 711 245 678",
          email: "compliance@nairobifleet.co.ke",
          verification_status: "verified",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
        },
        {
          id: "db-5",
          tenant_id: "demo-t2",
          company_name: "Accra Swift Cargo Ltd",
          registration_number: "GH-CS-204812",
          tax_id: "GRA-TIN-89241038",
          business_type: "Limited Liability Company",
          industry: "Cargo & Freight",
          address_line1: "Spintex Road",
          city: "Accra",
          state: "Greater Accra",
          country: "Ghana",
          phone: "+233 244 871 029",
          email: "info@accraswift.com.gh",
          verification_status: "verified",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        },
        {
          id: "db-6",
          tenant_id: "demo-t5",
          company_name: "Johannesburg Freight Services",
          registration_number: "2020/192847/07",
          tax_id: "VAT-7281938472",
          business_type: "Private Company",
          industry: "Freight & Logistics",
          address_line1: "32 Main Reef Rd",
          city: "Johannesburg",
          state: "Gauteng",
          country: "South Africa",
          phone: "+27 11 240 8812",
          email: "kyc@jhbfreight.co.za",
          verification_status: "rejected",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        },
      ];

      const DEMO_DOCS: KYCDocument[] = [
        {
          id: "dd-1",
          tenant_id: "demo-t1",
          document_type: "certificate_of_incorporation",
          document_name: "Lagos_Express_Cert_of_Incorporation.pdf",
          file_path: "demo/lex-cert.pdf",
          file_size: 482000,
          mime_type: "application/pdf",
          status: "pending",
          rejection_reason: null,
          reviewed_at: null,
          expires_at: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
        },
        {
          id: "dd-2",
          tenant_id: "demo-t1",
          document_type: "tax_clearance",
          document_name: "Lagos_Express_TCC_2025.pdf",
          file_path: "demo/lex-tcc.pdf",
          file_size: 318000,
          mime_type: "application/pdf",
          status: "pending",
          rejection_reason: null,
          reviewed_at: null,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
        },
        {
          id: "dd-3",
          tenant_id: "demo-t1",
          document_type: "director_id",
          document_name: "Director_Adebayo_Passport.pdf",
          file_path: "demo/lex-dir.pdf",
          file_size: 215000,
          mime_type: "application/pdf",
          status: "pending",
          rejection_reason: null,
          reviewed_at: null,
          expires_at: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 21).toISOString(),
        },
        {
          id: "dd-4",
          tenant_id: "demo-t4",
          document_type: "certificate_of_incorporation",
          document_name: "Cape_Town_Trucking_CIPC.pdf",
          file_path: "demo/ctt-cipc.pdf",
          file_size: 521000,
          mime_type: "application/pdf",
          status: "pending",
          rejection_reason: null,
          reviewed_at: null,
          expires_at: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        },
        {
          id: "dd-5",
          tenant_id: "demo-t4",
          document_type: "vat_certificate",
          document_name: "CTT_VAT_Reg.pdf",
          file_path: "demo/ctt-vat.pdf",
          file_size: 184000,
          mime_type: "application/pdf",
          status: "pending",
          rejection_reason: null,
          reviewed_at: null,
          expires_at: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        },
        {
          id: "dd-6",
          tenant_id: "demo-t6",
          document_type: "business_license",
          document_name: "Abuja_Haulage_Permit.pdf",
          file_path: "demo/abj-permit.pdf",
          file_size: 274000,
          mime_type: "application/pdf",
          status: "pending",
          rejection_reason: null,
          reviewed_at: null,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        },
        {
          id: "dd-7",
          tenant_id: "demo-t6",
          document_type: "insurance_certificate",
          document_name: "Abuja_Haulage_Insurance_2025.pdf",
          file_path: "demo/abj-ins.pdf",
          file_size: 412000,
          mime_type: "application/pdf",
          status: "pending",
          rejection_reason: null,
          reviewed_at: null,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 200).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        },
        {
          id: "dd-8",
          tenant_id: "demo-t3",
          document_type: "certificate_of_incorporation",
          document_name: "Nairobi_Fleet_Cert_Incorp.pdf",
          file_path: "demo/nbo-cert.pdf",
          file_size: 498000,
          mime_type: "application/pdf",
          status: "approved",
          rejection_reason: null,
          reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          expires_at: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
        },
        {
          id: "dd-9",
          tenant_id: "demo-t3",
          document_type: "tax_clearance",
          document_name: "Nairobi_Fleet_KRA_Compliance.pdf",
          file_path: "demo/nbo-kra.pdf",
          file_size: 302000,
          mime_type: "application/pdf",
          status: "approved",
          rejection_reason: null,
          reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 300).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
        },
        {
          id: "dd-10",
          tenant_id: "demo-t2",
          document_type: "business_license",
          document_name: "Accra_Swift_Operating_Permit.pdf",
          file_path: "demo/acc-permit.pdf",
          file_size: 268000,
          mime_type: "application/pdf",
          status: "approved",
          rejection_reason: null,
          reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 240).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        },
        {
          id: "dd-11",
          tenant_id: "demo-t2",
          document_type: "vat_certificate",
          document_name: "Accra_Swift_VAT_GRA.pdf",
          file_path: "demo/acc-vat.pdf",
          file_size: 192000,
          mime_type: "application/pdf",
          status: "approved",
          rejection_reason: null,
          reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
          expires_at: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        },
        {
          id: "dd-12",
          tenant_id: "demo-t5",
          document_type: "certificate_of_incorporation",
          document_name: "JHB_Freight_CIPC_doc.pdf",
          file_path: "demo/jhb-cipc.pdf",
          file_size: 388000,
          mime_type: "application/pdf",
          status: "rejected",
          rejection_reason: "Document is illegible — please re-upload a clearer scan.",
          reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          expires_at: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        },
        {
          id: "dd-13",
          tenant_id: "demo-t5",
          document_type: "tax_clearance",
          document_name: "JHB_Freight_TCC.pdf",
          file_path: "demo/jhb-tcc.pdf",
          file_size: 254000,
          mime_type: "application/pdf",
          status: "rejected",
          rejection_reason: "Document expired before submission.",
          reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          expires_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        },
      ];

      setBusinessInfoList(realBusiness.length > 0 ? realBusiness : DEMO_BUSINESS);
      setDocuments(realDocs.length > 0 ? realDocs : DEMO_DOCS);
    }
    catch (error) {
      console.error(
        "Error fetching KYC data:",
        error,
      );
      toast.error("Failed to load KYC data");
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(
    () => {
      fetchData();
    },
    [],
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
      case "approved":
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {" "}
            Approved
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            <Clock className="w-3 h-3 mr-1" />
            {" "}
            Under Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="w-3 h-3 mr-1" />
            {" "}
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground">
            <AlertCircle className="w-3 h-3 mr-1" />
            {" "}
            Pending
          </Badge>
        );
    }
  };

  const handleViewDocument = async (_doc: KYCDocument) => {
    toast.info("Coming soon");
  };

  const handleOpenReview = (doc: KYCDocument, action: "approve" | "reject") => {
    setSelectedDocument(doc);
    setReviewAction(action);
    setReviewComment("");
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    toast.info("Coming soon");
    setReviewDialogOpen(false);
  };

  const handleUpdateTenantStatus = async (_tenantId: string, _status: string) => {
    toast.info("Coming soon");
  };

  const pendingDocuments = documents.filter(d => d.status === "pending");
  const approvedDocuments = documents.filter(d => d.status === "approved");
  const rejectedDocuments = documents.filter(d => d.status === "rejected");

  const verifiedTenants = businessInfoList.filter(b => b.verification_status === "verified");

  const filteredBusinessInfo = businessInfoList.filter((b) => {
    const q = searchQuery.toLowerCase();
    if (q && !(b.company_name.toLowerCase().includes(q) || b.tenant_id.toLowerCase().includes(q))) {
      return false;
    }
    if (tenantStatusFilter !== "all" && b.verification_status !== tenantStatusFilter)
      return false;

    const companyVal = tenantFilters.company?.enabled ? tenantFilters.company.value?.toLowerCase() : undefined;
    if (companyVal && !b.company_name.toLowerCase().includes(companyVal))
      return false;

    const dateAfter = tenantFilters.date_submitted?.enabled && tenantFilters.date_submitted.from
      ? new Date(tenantFilters.date_submitted.from)
      : undefined;
    const dateBefore = tenantFilters.date_submitted?.enabled && tenantFilters.date_submitted.to
      ? new Date(tenantFilters.date_submitted.to)
      : undefined;
    const created = new Date(b.created_at);
    if (dateAfter && created < dateAfter)
      return false;
    if (dateBefore && created > dateBefore)
      return false;

    const docFilter = tenantFilters.documents?.enabled ? tenantFilters.documents.value : undefined;
    if (docFilter) {
      const tenantDocs = documents.filter(d => d.tenant_id === b.tenant_id);
      if (docFilter === "with" && tenantDocs.length === 0)
        return false;
      if (docFilter === "without" && tenantDocs.length > 0)
        return false;
      if (docFilter === "pending" && !tenantDocs.some(d => d.status === "pending"))
        return false;
    }
    return true;
  });

  const getTenantDocuments = (tenantId: string) => documents.filter(d => d.tenant_id === tenantId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{pendingDocuments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedDocuments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedDocuments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified Tenants</p>
                <p className="text-2xl font-bold">{verifiedTenants.length}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger
              value="pending"
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Pending (
              {pendingDocuments.length}
              )
            </TabsTrigger>
            <TabsTrigger
              value="tenants"
              className="flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Tenants (
              {businessInfoList.length}
              )
            </TabsTrigger>
            <TabsTrigger
              value="all-docs"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              All Documents
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Pending Documents Tab */}
        <TabsContent value="pending">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Documents Pending Review</CardTitle>
              <CardDescription>Review and approve or reject submitted KYC documents</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDocuments.length === 0
                ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No documents pending review</p>
                    </div>
                  )
                : (
                    <div className="space-y-4">
                      {pendingDocuments.map((doc) => {
                        const tenant = businessInfoList.find(b => b.tenant_id === doc.tenant_id);
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.document_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Tenant:
                                  {" "}
                                  {tenant?.company_name || doc.tenant_id}
                                  {" "}
                                  •
                                  Submitted:
                                  {" "}
                                  {formatDate(doc.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-success border-success/30 hover:bg-success/10"
                                onClick={() => handleOpenReview(
                                  doc,
                                  "approve",
                                )}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => handleOpenReview(
                                  doc,
                                  "reject",
                                )}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tenant Verification Status</CardTitle>
                  <CardDescription>View and manage tenant KYC verification</CardDescription>
                </div>
                <ExportButton
                  filename="tenant-verification-status"
                  rows={filteredBusinessInfo}
                  columns={[
                    {
                      header: "Company",
                      accessor: t => t.company_name,
                    },
                    {
                      header: "Email",
                      accessor: t => t.email || "",
                    },
                    {
                      header: "Registration",
                      accessor: t => t.registration_number || "",
                    },
                    {
                      header: "Tax ID",
                      accessor: t => t.tax_id || "",
                    },
                    {
                      header: "Status",
                      accessor: t => t.verification_status,
                    },
                    {
                      header: "Submitted",
                      accessor: t => toDateParam(t.created_at),
                    },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <TableToolbar
                search={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search tenants..."
                status={tenantStatusFilter}
                onStatusChange={setTenantStatusFilter}
                statusOptions={[
                  {
                    value: "pending",
                    label: "Pending",
                  },
                  {
                    value: "under_review",
                    label: "Under Review",
                  },
                  {
                    value: "verified",
                    label: "Verified",
                  },
                  {
                    value: "rejected",
                    label: "Rejected",
                  },
                ]}
                filterEntity="tenants"
                filterFields={[
                  {
                    type: "select",
                    key: "company",
                    label: "Company name contains",
                    options: Array.from(new Set(businessInfoList.map(b => b.company_name))).filter(Boolean).map(c => ({
                      value: c,
                      label: c,
                    })),
                  },
                  {
                    type: "date",
                    key: "date_submitted",
                    label: "Date submitted",
                  },
                  {
                    type: "select",
                    key: "documents",
                    label: "Documents",
                    options: [
                      {
                        value: "with",
                        label: "Has documents",
                      },
                      {
                        value: "without",
                        label: "No documents",
                      },
                      {
                        value: "pending",
                        label: "Has pending documents",
                      },
                    ],

                  },
                ]}
                filterValues={tenantFilters}
                onFiltersApply={setTenantFilters}
              />
              {filteredBusinessInfo.length === 0
                ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No tenant registrations found</p>
                    </div>
                  )
                : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Registration</TableHead>
                          <TableHead>Documents</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBusinessInfo.map((tenant) => {
                          const tenantDocs = getTenantDocuments(tenant.tenant_id);
                          const pendingCount = tenantDocs.filter(d => d.status === "pending").length;

                          return (
                            <TableRow key={tenant.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{tenant.company_name}</p>
                                  <p className="text-xs text-muted-foreground">{tenant.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{tenant.registration_number || "-"}</p>
                                  <p className="text-xs text-muted-foreground">{tenant.tax_id || "-"}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">
                                    {tenantDocs.length}
                                    {" "}
                                    docs
                                  </span>
                                  {pendingCount > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-warning border-warning/30"
                                    >
                                      {pendingCount}
                                      {" "}
                                      pending
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(tenant.verification_status)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(tenant.created_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTenant(tenant);
                                      setTenantDetailOpen(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Review
                                  </Button>
                                  {tenant.verification_status !== "verified" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-success"
                                      onClick={() => handleUpdateTenantStatus(
                                        tenant.tenant_id,
                                        "verified",
                                      )}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Verify
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Documents Tab */}
        <TabsContent value="all-docs">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>All KYC Documents</CardTitle>
                  <CardDescription>Complete history of all submitted documents</CardDescription>
                </div>
                <ExportButton
                  rows={documents.filter((doc) => {
                    const tenant = businessInfoList.find(b => b.tenant_id === doc.tenant_id);
                    const q = docSearch.trim().toLowerCase();
                    if (q && !(
                      doc.document_name.toLowerCase().includes(q)
                      || (DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type).toLowerCase().includes(q)
                      || (tenant?.company_name || "").toLowerCase().includes(q)
                    )) {
                      return false;
                    }
                    if (docStatusFilter !== "all" && doc.status !== docStatusFilter)
                      return false;
                    const typeF = docFilters.document_type;
                    if (typeF?.enabled && typeF.value && doc.document_type !== typeF.value)
                      return false;
                    const subF = docFilters.submitted;
                    if (subF?.enabled && subF.date && new Date(doc.created_at) < new Date(subF.date))
                      return false;
                    const revF = docFilters.reviewed;
                    if (revF?.enabled) {
                      if (revF.value === "yes" && !doc.reviewed_at)
                        return false;
                      if (revF.value === "no" && doc.reviewed_at)
                        return false;
                    }
                    return true;
                  })}
                  columns={[
                    {
                      header: "Document",
                      accessor: (d: KYCDocument) => d.document_name,
                    },
                    {
                      header: "Type",
                      accessor: (d: KYCDocument) => DOCUMENT_TYPE_LABELS[d.document_type] || d.document_type,
                    },
                    {
                      header: "Tenant",
                      accessor: (d: KYCDocument) => businessInfoList.find(b => b.tenant_id === d.tenant_id)?.company_name || d.tenant_id,
                    },
                    {
                      header: "Status",
                      accessor: (d: KYCDocument) => d.status,
                    },
                    {
                      header: "Submitted",
                      accessor: (d: KYCDocument) => toDateParam(d.created_at),
                    },
                    {
                      header: "Reviewed",
                      accessor: (d: KYCDocument) => d.reviewed_at ? toDateParam(d.reviewed_at) : "",
                    },
                  ]}
                  filename="kyc-documents"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <TableToolbar
                search={docSearch}
                onSearchChange={setDocSearch}
                searchPlaceholder="Search documents, types, tenants..."
                status={docStatusFilter}
                onStatusChange={setDocStatusFilter}
                statusOptions={[
                  {
                    value: "pending",
                    label: "Pending",
                  },
                  {
                    value: "approved",
                    label: "Approved",
                  },
                  {
                    value: "rejected",
                    label: "Rejected",
                  },
                ]}
                filterEntity="documents"
                filterFields={[
                  {
                    type: "select",
                    key: "document_type",
                    label: "Document type",
                    options: Object.entries(DOCUMENT_TYPE_LABELS).map(([
                      value,
                      label,
                    ]) => ({
                      value,
                      label,
                    })),

                  },
                  {
                    type: "date",
                    key: "submitted",
                    label: "Submitted on or after",
                  },
                  {
                    type: "select",
                    key: "reviewed",
                    label: "Reviewed",
                    options: [
                      {
                        value: "yes",
                        label: "Reviewed",
                      },
                      {
                        value: "no",
                        label: "Not reviewed",
                      },
                    ],

                  },
                ]}
                filterValues={docFilters}
                onFiltersApply={setDocFilters}
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Reviewed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents
                    .filter((doc) => {
                      const tenant = businessInfoList.find(b => b.tenant_id === doc.tenant_id);
                      const q = docSearch.trim().toLowerCase();
                      if (q && !(
                        doc.document_name.toLowerCase().includes(q)
                        || (DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type).toLowerCase().includes(q)
                        || (tenant?.company_name || "").toLowerCase().includes(q)
                      )) {
                        return false;
                      }
                      if (docStatusFilter !== "all" && doc.status !== docStatusFilter)
                        return false;
                      const typeF = docFilters.document_type;
                      if (typeF?.enabled && typeF.value && doc.document_type !== typeF.value)
                        return false;
                      const subF = docFilters.submitted;
                      if (subF?.enabled && subF.date && new Date(doc.created_at) < new Date(subF.date))
                        return false;
                      const revF = docFilters.reviewed;
                      if (revF?.enabled) {
                        if (revF.value === "yes" && !doc.reviewed_at)
                          return false;
                        if (revF.value === "no" && doc.reviewed_at)
                          return false;
                      }
                      return true;
                    })
                    .map((doc) => {
                      const tenant = businessInfoList.find(b => b.tenant_id === doc.tenant_id);
                      return (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{doc.document_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                          </TableCell>
                          <TableCell className="text-sm">
                            {tenant?.company_name || doc.tenant_id}
                          </TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(doc.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {doc.reviewed_at ? formatDate(doc.reviewed_at) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {doc.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-success"
                                    onClick={() => handleOpenReview(
                                      doc,
                                      "approve",
                                    )}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => handleOpenReview(
                                      doc,
                                      "reject",
                                    )}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <KYCNotificationHistory />
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === "approve"
                ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  )
                : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
              {reviewAction === "approve" ? "Approve Document" : "Reject Document"}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.document_name}
              {" "}
              -
              {DOCUMENT_TYPE_LABELS[selectedDocument?.document_type || ""] || selectedDocument?.document_type}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {reviewAction === "reject" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  placeholder="Please provide a reason for rejection..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={4}
                />
              </div>
            )}
            {reviewAction === "approve" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Comments (Optional)</label>
                <Textarea
                  placeholder="Add any notes..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedDocument && handleViewDocument(selectedDocument)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View Document
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting || (reviewAction === "reject" && !reviewComment.trim())}
              className={reviewAction === "approve" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {reviewAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenant Detail Dialog */}
      <Dialog
        open={tenantDetailOpen}
        onOpenChange={setTenantDetailOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              {selectedTenant?.company_name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {getStatusBadge(selectedTenant?.verification_status || "pending")}
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6">
              {/* Business Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-medium">{selectedTenant.registration_number || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tax ID</p>
                  <p className="font-medium">{selectedTenant.tax_id || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Business Type</p>
                  <p className="font-medium">{selectedTenant.business_type || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium">{selectedTenant.industry || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {[
                      selectedTenant.address_line1,
                      selectedTenant.city,
                      selectedTenant.state,
                      selectedTenant.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedTenant.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedTenant.phone}</p>
                </div>
              </div>

              <Separator />

              {/* Documents */}
              <div>
                <h4 className="font-medium mb-4">Submitted Documents</h4>
                <div className="space-y-3">
                  {getTenantDocuments(selectedTenant.tenant_id).map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.document_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                          </p>
                          {doc.rejection_reason && (
                            <p className="text-sm text-destructive mt-1">
                              Reason:
                              {" "}
                              {doc.rejection_reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {doc.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-success"
                              onClick={() => {
                                setTenantDetailOpen(false);
                                handleOpenReview(
                                  doc,
                                  "approve",
                                );
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                setTenantDetailOpen(false);
                                handleOpenReview(
                                  doc,
                                  "reject",
                                );
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {getTenantDocuments(selectedTenant.tenant_id).length === 0 && (
                    <p className="text-center py-4 text-muted-foreground">No documents submitted</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <div className="flex gap-2">
                  {selectedTenant.verification_status !== "verified" && (
                    <Button
                      className="bg-success hover:bg-success/90"
                      onClick={() => {
                        handleUpdateTenantStatus(
                          selectedTenant.tenant_id,
                          "verified",
                        );
                        setTenantDetailOpen(false);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Verify Tenant
                    </Button>
                  )}
                  {selectedTenant.verification_status !== "rejected" && (
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive/30"
                      onClick={() => {
                        handleUpdateTenantStatus(
                          selectedTenant.tenant_id,
                          "rejected",
                        );
                        setTenantDetailOpen(false);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
