import {
  formatDate,
  formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  Loader2,
  Shield,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
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
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { TableToolbar } from "@/components/shadcn/table-toolbar";

type BusinessInfo = {
  id?: string;
  tenant_id: string;
  company_name: string;
  registration_number: string;
  tax_id: string;
  business_type: string;
  industry: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  billing_email?: string | null;
  website: string;
  year_established: number | null;
  number_of_employees: string;
  annual_revenue: string;
  verification_status: string;
};

type KYCDocument = {
  id: string;
  tenant_id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: string;
  rejection_reason: string | null;
  expires_at: string | null;
  created_at: string;
};

const DOCUMENT_TYPES = [
  {
    value: "certificate_of_incorporation",
    label: "Certificate of Incorporation",
    required: true,
  },
  {
    value: "memorandum_of_association",
    label: "Memorandum of Association",
    required: true,
  },
  {
    value: "tax_clearance",
    label: "Tax Clearance Certificate",
    required: true,
  },
  {
    value: "vat_certificate",
    label: "VAT Registration Certificate",
    required: false,
  },
  {
    value: "business_license",
    label: "Business License/Permit",
    required: true,
  },
  {
    value: "insurance_certificate",
    label: "Insurance Certificate",
    required: false,
  },
  {
    value: "proof_of_address",
    label: "Proof of Business Address",
    required: true,
  },
  {
    value: "director_id",
    label: "Director ID/Passport",
    required: true,
  },
  {
    value: "other",
    label: "Other Document",
    required: false,
  },
];

const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Limited Liability Company (LLC)",
  "Private Limited Company",
  "Public Limited Company",
  "Cooperative",
  "Non-Profit Organization",
];

const INDUSTRIES = [
  "Logistics & Transportation",
  "Freight & Cargo",
  "Supply Chain Management",
  "E-commerce Delivery",
  "Construction & Heavy Equipment",
  "Oil & Gas Transportation",
  "Food & Beverage Distribution",
  "Pharmaceutical Distribution",
  "Agriculture & Farming",
  "Mining & Extraction",
  "Other",
];

export function TenantKYCVerification({
  tenantId,
  readOnly = false,
}: {
  tenantId: string;
  readOnly?: boolean;
}) {
  const [_activeTab] = useState("business-info");
  const [
    businessInfo,
    setBusinessInfo,
  ] = useState<BusinessInfo>({
    tenant_id: tenantId,
    company_name: "",
    registration_number: "",
    tax_id: "",
    business_type: "",
    industry: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Nigeria",
    phone: "",
    email: "",
    billing_email: "",
    website: "",
    year_established: null,
    number_of_employees: "",
    annual_revenue: "",
    verification_status: "pending",
  });
  const [documents] = useState<KYCDocument[]>([]);
  const [
    loading,
    setLoading,
  ] = useState(true);
  const [saving] = useState(false);
  const [uploading] = useState(false);
  const [
    selectedDocType,
    setSelectedDocType,
  ] = useState("");
  const [
    isDropzoneDragging,
    setIsDropzoneDragging,
  ] = useState(false);
  const [
    docSearch,
    setDocSearch,
  ] = useState("");
  const [
    docStatusFilter,
    setDocStatusFilter,
  ] = useState("all");

  useEffect(
    () => {
      setLoading(false);
    },
    [tenantId],
  );

  const REQUIRED_BIZ_FIELDS: {
    key: keyof BusinessInfo;
    label: string;
  }[] = [
    {
      key: "company_name",
      label: "Company Name",
    },
    {
      key: "registration_number",
      label: "Registration Number",
    },
    {
      key: "tax_id",
      label: "Tax Identification Number (TIN)",
    },
    {
      key: "business_type",
      label: "Business Type",
    },
    {
      key: "address_line1",
      label: "Address Line 1",
    },
    {
      key: "city",
      label: "City",
    },
    {
      key: "state",
      label: "State",
    },
    {
      key: "phone",
      label: "Phone Number",
    },
    {
      key: "email",
      label: "Business Email",
    },
  ];

  const missingFields = useMemo(
    () => {
      const missing: string[] = [];
      REQUIRED_BIZ_FIELDS.forEach((f) => {
        const v = (businessInfo as any)[f.key];
        if (!v || String(v).trim() === "")
          missing.push(f.label);
      });
      DOCUMENT_TYPES.filter(d => d.required).forEach((d) => {
        if (!documents.some(doc => doc.document_type === d.value)) {
          missing.push(`Document: ${d.label}`);
        }
      });
      return missing;
    },
    [
      businessInfo,
      documents,
    ],
  );

  const isKycComplete = missingFields.length === 0;
  const isSubmittedStatus = [
    "under_review",
    "approved",
  ].includes(
    businessInfo.verification_status,
  );

  const handleSubmitKYC = async () => {
    toast.info("Coming soon");
  };

  const uploadKycFile = async (_file) => {
    toast.info("Coming soon");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file)
      return;
    await uploadKycFile(file);
  };

  const handleDeleteDocument = async (_doc) => {
    toast.info("Coming soon");
  };

  const handleViewDocument = async (_doc) => {
    toast.info("Coming soon");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {" "}
            Verified
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            {" "}
            Under Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
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

  const calculateCompletionProgress = () => {
    const requiredDocs = DOCUMENT_TYPES.filter(d => d.required);
    const uploadedRequiredDocs = requiredDocs.filter(
      d => documents.some(doc => doc.document_type === d.value),
    );
    const docProgress = (uploadedRequiredDocs.length / requiredDocs.length) * 50;

    const requiredFields = [
      "company_name",
      "registration_number",
      "tax_id",
      "business_type",
      "address_line1",
      "city",
      "state",
      "phone",
      "email",
    ];
    const filledFields = requiredFields.filter(
      field => businessInfo[field as keyof BusinessInfo],
    );
    const infoProgress = (filledFields.length / requiredFields.length) * 50;

    return Math.round(docProgress + infoProgress);
  };

  // Demo documents fallback when none uploaded
  const DEMO_DOCUMENTS: KYCDocument[] = useMemo(
    () => ([
      {
        id: "demo-1",
        tenant_id: tenantId,
        document_type: "certificate_of_incorporation",
        document_name: "Certificate_of_Incorporation_LEL_2015.pdf",
        file_path: "",
        file_size: 1248576,
        mime_type: "application/pdf",
        status: "approved",
        rejection_reason: null,
        expires_at: null,
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
      },
      {
        id: "demo-2",
        tenant_id: tenantId,
        document_type: "tax_clearance",
        document_name: "Tax_Clearance_Certificate_2024.pdf",
        file_path: "",
        file_size: 845120,
        mime_type: "application/pdf",
        status: "approved",
        rejection_reason: null,
        expires_at: null,
        created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
      {
        id: "demo-3",
        tenant_id: tenantId,
        document_type: "memorandum_of_association",
        document_name: "Memorandum_of_Association.pdf",
        file_path: "",
        file_size: 2340352,
        mime_type: "application/pdf",
        status: "under_review",
        rejection_reason: null,
        expires_at: null,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: "demo-4",
        tenant_id: tenantId,
        document_type: "business_license",
        document_name: "Business_Operating_License_Lagos.pdf",
        file_path: "",
        file_size: 612480,
        mime_type: "application/pdf",
        status: "approved",
        rejection_reason: null,
        expires_at: null,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: "demo-5",
        tenant_id: tenantId,
        document_type: "proof_of_address",
        document_name: "Utility_Bill_Ikeja_Office.jpg",
        file_path: "",
        file_size: 384256,
        mime_type: "image/jpeg",
        status: "pending",
        rejection_reason: null,
        expires_at: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "demo-6",
        tenant_id: tenantId,
        document_type: "director_id",
        document_name: "Director_Passport_Olumide_Adeyemi.pdf",
        file_path: "",
        file_size: 524288,
        mime_type: "application/pdf",
        status: "approved",
        rejection_reason: null,
        expires_at: null,
        created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
      },
      {
        id: "demo-7",
        tenant_id: tenantId,
        document_type: "insurance_certificate",
        document_name: "Fleet_Insurance_Cert_2024.pdf",
        file_path: "",
        file_size: 967680,
        mime_type: "application/pdf",
        status: "rejected",
        rejection_reason: "Document expired — please upload current cover",
        expires_at: null,
        created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
      },
      {
        id: "demo-8",
        tenant_id: tenantId,
        document_type: "vat_certificate",
        document_name: "VAT_Registration_FIRS.pdf",
        file_path: "",
        file_size: 287744,
        mime_type: "application/pdf",
        status: "approved",
        rejection_reason: null,
        expires_at: null,
        created_at: new Date(Date.now() - 86400000 * 22).toISOString(),
      },
    ]),
    [tenantId],
  );

  const usingDemoDocs = documents.length === 0;
  const displayDocuments = usingDemoDocs ? DEMO_DOCUMENTS : documents;

  const filteredDocuments = useMemo(
    () => {
      const q = docSearch.trim().toLowerCase();
      return displayDocuments.filter((d) => {
        if (docStatusFilter !== "all" && d.status !== docStatusFilter)
          return false;
        if (!q)
          return true;
        const typeLabel = DOCUMENT_TYPES.find(t => t.value === d.document_type)?.label ?? d.document_type;
        return (
          d.document_name.toLowerCase().includes(q)
          || typeLabel.toLowerCase().includes(q)
          || d.status.toLowerCase().includes(q)
        );
      });
    },
    [
      displayDocuments,
      docSearch,
      docStatusFilter,
    ],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Business Verification & KYC</CardTitle>
                <CardDescription>Complete your business profile and upload required documents</CardDescription>
              </div>
            </div>
            {getStatusBadge(businessInfo.verification_status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completion Progress</span>
              <span className="font-medium">
                {calculateCompletionProgress()}
                %
              </span>
            </div>
            <Progress
              value={calculateCompletionProgress()}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Company Information</CardTitle>
            <CardDescription>Basic details about your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={businessInfo.company_name}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    company_name: e.target.value,
                  })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number *</Label>
                <Input
                  id="registration_number"
                  value={businessInfo.registration_number || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    registration_number: e.target.value,
                  })}
                  placeholder="CAC registration number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax Identification Number (TIN) *</Label>
                <Input
                  id="tax_id"
                  value={businessInfo.tax_id || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    tax_id: e.target.value,
                  })}
                  placeholder="Enter TIN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type *</Label>
                <Select
                  value={businessInfo.business_type || ""}
                  onValueChange={value => setBusinessInfo({
                    ...businessInfo,
                    business_type: value,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map(type => (
                      <SelectItem
                        key={type}
                        value={type}
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={businessInfo.industry || ""}
                  onValueChange={value => setBusinessInfo({
                    ...businessInfo,
                    industry: value,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(industry => (
                      <SelectItem
                        key={industry}
                        value={industry}
                      >
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year_established">Year Established</Label>
                <Input
                  id="year_established"
                  type="number"
                  value={businessInfo.year_established || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    year_established: parseInt(e.target.value) || null,
                  })}
                  placeholder="e.g. 2015"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Business Address</CardTitle>
            <CardDescription>Registered business address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line1">Address Line 1 *</Label>
                <Input
                  id="address_line1"
                  value={businessInfo.address_line1 || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    address_line1: e.target.value,
                  })}
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  value={businessInfo.address_line2 || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    address_line2: e.target.value,
                  })}
                  placeholder="Apartment, suite, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={businessInfo.city || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    city: e.target.value,
                  })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={businessInfo.state || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    state: e.target.value,
                  })}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={businessInfo.postal_code || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    postal_code: e.target.value,
                  })}
                  placeholder="Postal code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={businessInfo.country || "Nigeria"}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    country: e.target.value,
                  })}
                  placeholder="Country"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
            <CardDescription>Business contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={businessInfo.phone || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    phone: e.target.value,
                  })}
                  placeholder="+234..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={businessInfo.email || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    email: e.target.value,
                  })}
                  placeholder="info@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_email">Billing Email *</Label>
                <Input
                  id="billing_email"
                  type="email"
                  value={(businessInfo as any).billing_email || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    billing_email: e.target.value,
                  } as any)}
                  placeholder="billing@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Invoices and payment receipts are sent to this address.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={businessInfo.website || ""}
                  onChange={e => setBusinessInfo({
                    ...businessInfo,
                    website: e.target.value,
                  })}
                  placeholder="https://www.company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number_of_employees">Number of Employees</Label>
                <Select
                  value={businessInfo.number_of_employees || ""}
                  onValueChange={value => setBusinessInfo({
                    ...businessInfo,
                    number_of_employees: value,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10</SelectItem>
                    <SelectItem value="11-50">11-50</SelectItem>
                    <SelectItem value="51-200">51-200</SelectItem>
                    <SelectItem value="201-500">201-500</SelectItem>
                    <SelectItem value="500+">500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section — hidden for platform admin (readOnly) */}
        {!readOnly && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Upload Documents</CardTitle>
              <CardDescription>Upload required verification documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select
                    value={selectedDocType}
                    onValueChange={setSelectedDocType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(type => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                          {" "}
                          {type.required && "*"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <label
                    htmlFor="kyc-settings-dropzone"
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (selectedDocType && !uploading)
                        setIsDropzoneDragging(true);
                    }}
                    onDragLeave={() => setIsDropzoneDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDropzoneDragging(false);
                      if (!selectedDocType) {
                        toast.error("Please select a document type first");
                        return;
                      }
                      const file = e.dataTransfer.files?.[0];
                      if (file)
                        void uploadKycFile(file);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                      !selectedDocType || uploading
                        ? "border-border bg-muted/20 cursor-not-allowed opacity-60"
                        : isDropzoneDragging
                          ? "border-primary bg-primary/5 cursor-pointer"
                          : "border-border hover:border-primary/50 hover:bg-muted/40 cursor-pointer"
                    }`}
                  >
                    <input
                      id="kyc-settings-dropzone"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={!selectedDocType || uploading}
                    />
                    {uploading
                      ? (
                          <>
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Uploading…</p>
                          </>
                        )
                      : (
                          <>
                            <div className="p-2 rounded-full bg-primary/10">
                              <UploadCloud className="w-5 h-5 text-primary" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              <span className="text-primary">Click to upload</span>
                              {" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF, JPG, PNG, DOC, DOCX (max 10MB)
                            </p>
                            {!selectedDocType && (
                              <p className="text-xs italic text-muted-foreground">
                                Select a document type first
                              </p>
                            )}
                          </>
                        )}
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Required Documents Checklist — hidden for platform admin */}
        {!readOnly && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Required Documents Checklist</CardTitle>
              <CardDescription>Documents needed for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {DOCUMENT_TYPES.filter(d => d.required).map((docType) => {
                  const uploaded = documents.find(d => d.document_type === docType.value);
                  return (
                    <div
                      key={docType.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        uploaded ? "bg-green-500/10 border-green-500/30" : "bg-muted/30 border-border"
                      }`}
                    >
                      {uploaded
                        ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )
                        : (
                            <AlertCircle className="w-5 h-5 text-muted-foreground" />
                          )}
                      <span className={uploaded ? "text-foreground" : "text-muted-foreground"}>
                        {docType.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Uploaded Documents */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Uploaded Documents
                  {usingDemoDocs && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      Demo data
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {readOnly ? "Receipt submitted verification documents" : "All uploaded verification documents"}
                </CardDescription>
              </div>
              {!readOnly && (
                <ExportButton
                  rows={filteredDocuments}
                  filename="uploaded_documents"
                  columns={[
                    {
                      header: "Document Name",
                      accessor: "document_name",
                    },
                    {
                      header: "Type",
                      accessor: d => DOCUMENT_TYPES.find(t => t.value === d.document_type)?.label || d.document_type,
                    },
                    {
                      header: "Status",
                      accessor: "status",
                    },
                    {
                      header: "File Size (KB)",
                      accessor: d => Math.round(d.file_size / 1024),
                    },
                    {
                      header: "Uploaded",
                      accessor: d => formatWithPattern(
                        d.created_at,
                        "yyyy-MM-dd HH:mm",
                      ),
                    },
                    {
                      header: "Rejection Reason",
                      accessor: d => d.rejection_reason ?? "",
                    },
                  ]}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!readOnly && (
              <TableToolbar
                search={docSearch}
                onSearchChange={setDocSearch}
                searchPlaceholder="Search documents by name, type or status..."
                status={docStatusFilter}
                onStatusChange={setDocStatusFilter}
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
                    value: "approved",
                    label: "Approved",
                  },
                  {
                    value: "rejected",
                    label: "Rejected",
                  },
                ]}
              />
            )}
            {(readOnly ? displayDocuments : filteredDocuments).length === 0
              ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{displayDocuments.length === 0 ? "No documents uploaded yet" : "No documents match your filters"}</p>
                  </div>
                )
              : (
                  <div className="space-y-3">
                    {(readOnly ? displayDocuments : filteredDocuments).map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileCheck className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.document_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                              {" • "}
                              {(doc.file_size / 1024).toFixed(0)}
                              {" "}
                              KB
                              {" • "}
                              {formatDate(doc.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(doc.status)}
                          {readOnly
                            ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDocument(doc)}
                                  disabled={usingDemoDocs}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              )
                            : (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewDocument(doc)}
                                    disabled={usingDemoDocs}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteDocument(doc)}
                                    disabled={usingDemoDocs}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
          </CardContent>
        </Card>

        {/* Submit KYC — hidden for platform admin */}
        {!readOnly && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              {missingFields.length > 0 && (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium mb-1">Complete the following before submitting:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {missingFields.map(m => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitKYC}
                  disabled={saving || !isKycComplete || isSubmittedStatus}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSubmittedStatus ? "KYC Submitted" : "Submit KYC"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
