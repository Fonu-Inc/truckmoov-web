import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingBusinessInfoQueryOptions,
  getOnboardingKycDocumentsQueryOptions,
  getOnboardingStatusQueryOptions,
  useDeleteOnboardingKycDocument,
  useUpdateOnboardingBusinessInfo,
  useUploadOnboardingKycDocument,
  type OnboardingBusinessInfo,
  type OnboardingKycDocument,
} from "@truckmoov/api/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Progress } from "@/components/shadcn/progress";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Shield,
  UploadCloud,
  FileText,
  Trash2,
  Info,
  MapPin,
  Phone as PhoneIcon,
} from "lucide-react";

/**
 * Stakeholder-specific label + field configuration. Same DB columns are reused
 * — only the labels and which fields are shown change per stakeholder.
 */
interface StakeholderKYCConfig {
  audience: string;
  orgNameLabel: string;
  orgNamePlaceholder: string;
  registrationLabel: string;
  taxIdLabel: string;
  industryLabel: string;
  employeesLabel: string;
  showBusinessType: boolean;
  showYearEstablished: boolean;
  showEmployees: boolean;
  showWebsite: boolean;
  documents: { value: string; label: string; required: boolean }[];
}


const FLEET_PROVIDER_KYC_CONFIG: StakeholderKYCConfig = {
  audience: "Fleet Provider",
  orgNameLabel: "Fleet Provider Name *",
  orgNamePlaceholder: "e.g. Sahara Transport Services",
  registrationLabel: "Registration Number *",
  taxIdLabel: "Tax Identification Number (TIN) *",
  industryLabel: "Primary Vehicle Type",
  employeesLabel: "Fleet Size (number of vehicles)",
  showBusinessType: true,
  showYearEstablished: true,
  showEmployees: true,
  showWebsite: true,
  documents: [
    { value: "certificate_of_incorporation", label: "Certificate of Incorporation", required: true },
    { value: "tax_clearance", label: "Tax Clearance Certificate", required: true },
    { value: "business_license", label: "Operating Permit / FRSC Licence", required: true },
    { value: "insurance_certificate", label: "Fleet Insurance Certificate", required: true },
    { value: "vat_certificate", label: "Fleet Roadworthiness Certificates", required: true },
    { value: "proof_of_address", label: "Proof of Business Address", required: true },
    { value: "director_id", label: "Director / Owner ID", required: true },
    { value: "other", label: "Other Document", required: false },
  ],
};

const DOCUMENT_TYPES = [
  { value: "certificate_of_incorporation", label: "Certificate of Incorporation", required: true },
  { value: "memorandum_of_association", label: "Memorandum of Association", required: true },
  { value: "tax_clearance", label: "Tax Clearance Certificate", required: true },
  { value: "vat_certificate", label: "VAT Registration Certificate", required: false },
  { value: "business_license", label: "Business License / Permit", required: true },
  { value: "insurance_certificate", label: "Insurance Certificate", required: false },
  { value: "proof_of_address", label: "Proof of Business Address", required: true },
  { value: "director_id", label: "Director ID / Passport", required: true },
  { value: "other", label: "Other Document", required: false },
];

const REQUIRED_DOCUMENTS = DOCUMENT_TYPES.filter((d) => d.required);

const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Limited Liability Company (LLC)",
  "Corporation",
  "Public Limited Company",
  "Non-Profit",
  "Other",
];

function statusBadge(status: string) {
  switch (status) {
    case "completed":
    case "verified":
    case "approved":
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> {status === "completed" ? "Completed" : "Verified"}
        </Badge>
      );
    case "in_progress":
    case "under_review":
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" /> {status === "in_progress" ? "In Progress" : "Under Review"}
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" /> Rejected
        </Badge>
      );
    default:
      return (
        <Badge className="bg-muted text-muted-foreground">
          <AlertCircle className="w-3 h-3 mr-1" /> Pending
        </Badge>
      );
  }
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function formatUploadDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type EditableBusinessInfo = Omit<OnboardingBusinessInfo, "updatedAt">;

const emptyBusinessInfo = (tenantId: string): EditableBusinessInfo => ({
  tenantId,
  companyName: "",
  registrationNumber: null,
  taxId: null,
  businessType: null,
  industry: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  country: null,
  phone: null,
  email: null,
  billingEmail: null,
  website: null,
  yearEstablished: null,
  numberOfEmployees: null,
  verificationStatus: "pending",
});

export function OnboardingKYCStep({ tenantId, onContinue, onSkip }: { tenantId: string; onContinue?: () => void; onSkip?: () => void }) {
  const { user } = useAuthStore();
  const cfg = FLEET_PROVIDER_KYC_CONFIG;
  const requiredDocs = useMemo(() => cfg.documents.filter((d) => d.required), [cfg.documents]);

  const { data: businessInfoResponse, isLoading: isBusinessInfoLoading } = useQuery(getOnboardingBusinessInfoQueryOptions());
  const { data: kycDocumentsResponse, isLoading: isDocumentsLoading } = useQuery(getOnboardingKycDocumentsQueryOptions());
  const { data: onboardingStatusResponse } = useQuery(getOnboardingStatusQueryOptions());
  const updateBusinessInfoMutation = useUpdateOnboardingBusinessInfo();
  const uploadDocumentMutation = useUploadOnboardingKycDocument();
  const deleteDocumentMutation = useDeleteOnboardingKycDocument();

  const [businessInfo, setBusinessInfo] = useState<EditableBusinessInfo>(() => {
    const base = emptyBusinessInfo(tenantId);
    return {
      ...base,
      email: user?.email || null,
      billingEmail: user?.email || null,
    };
  });
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [isDropzoneDragging, setIsDropzoneDragging] = useState(false);

  const documents = useMemo(
    () => kycDocumentsResponse?.data.documents ?? [],
    [kycDocumentsResponse?.data.documents],
  );
  const isSavingBusinessInfo = updateBusinessInfoMutation.isPending;
  const isUploadingDocument = uploadDocumentMutation.isPending;
  const isDeletingDocument = deleteDocumentMutation.isPending;
  const isMutatingDocument = isUploadingDocument || isDeletingDocument;
  const documentTypeLabels = useMemo(
    () => new Map(cfg.documents.map((doc) => [doc.value, doc.label])),
    [cfg.documents],
  );
  const onboardingStatus = onboardingStatusResponse?.data.onboardingStatus ?? "pending";

  useEffect(() => {
    const remoteBusinessInfo = businessInfoResponse?.data;
    if (!remoteBusinessInfo) return;

    setBusinessInfo({
      tenantId: remoteBusinessInfo.tenantId,
      companyName: remoteBusinessInfo.companyName ?? "",
      registrationNumber: remoteBusinessInfo.registrationNumber,
      taxId: remoteBusinessInfo.taxId,
      businessType: remoteBusinessInfo.businessType,
      industry: remoteBusinessInfo.industry,
      addressLine1: remoteBusinessInfo.addressLine1,
      addressLine2: remoteBusinessInfo.addressLine2,
      city: remoteBusinessInfo.city,
      state: remoteBusinessInfo.state,
      postalCode: remoteBusinessInfo.postalCode,
      country: remoteBusinessInfo.country,
      phone: remoteBusinessInfo.phone,
      email: remoteBusinessInfo.email || user?.email || null,
      billingEmail: remoteBusinessInfo.billingEmail || user?.email || null,
      website: remoteBusinessInfo.website,
      yearEstablished: remoteBusinessInfo.yearEstablished,
      numberOfEmployees: remoteBusinessInfo.numberOfEmployees,
      verificationStatus: remoteBusinessInfo.verificationStatus,
    });
  }, [businessInfoResponse?.data, user?.email]);

  const updateField = <K extends keyof EditableBusinessInfo>(key: K, value: EditableBusinessInfo[K]) => {
    setBusinessInfo((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveBusinessInfo = async () => {
    updateBusinessInfoMutation.mutate(
      {
        data: {
          companyName: businessInfo.companyName,
          registrationNumber: businessInfo.registrationNumber,
          taxId: businessInfo.taxId,
          businessType: businessInfo.businessType,
          industry: businessInfo.industry,
          addressLine1: businessInfo.addressLine1,
          addressLine2: businessInfo.addressLine2,
          city: businessInfo.city,
          state: businessInfo.state,
          postalCode: businessInfo.postalCode,
          country: businessInfo.country,
          phone: businessInfo.phone,
          email: businessInfo.email,
          billingEmail: businessInfo.billingEmail,
          website: businessInfo.website,
          yearEstablished: businessInfo.yearEstablished,
          numberOfEmployees: businessInfo.numberOfEmployees,
        },
      },
      {
        onSuccess: () => {
          toast.success("Business info saved");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const uploadFile = async (documentType: string, file: File) => {
    try {
      await uploadDocumentMutation.mutateAsync({ documentType, file });
      toast.success("Document uploaded");
      setSelectedDocType("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Document upload failed");
    }
  };

  const removeDocument = async (doc: OnboardingKycDocument) => {
    deleteDocumentMutation.mutate(
      { id: doc.id },
      {
        onSuccess: () => {
          toast.success("Document removed");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const completion = useMemo(() => {
    if (!businessInfo) return 0;
    const fieldKeys: (keyof EditableBusinessInfo)[] = [
      "companyName",
      "registrationNumber",
      "taxId",
      "businessType",
      "addressLine1",
      "city",
      "state",
      "phone",
      "email",
      "billingEmail",
    ];
    const requiredItems = [
      ...fieldKeys.map((key) => Boolean(businessInfo[key])),
      ...requiredDocs.map((doc) => documents.some((uploaded) => uploaded.documentType === doc.value)),
    ];
    const completedItems = requiredItems.filter(Boolean).length;
    return Math.round((completedItems / Math.max(requiredItems.length, 1)) * 100);
  }, [businessInfo, documents, requiredDocs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Business Verification & KYC</CardTitle>
                <CardDescription>
                  Submit your business details and documents for verification.
                </CardDescription>
              </div>
            </div>
            {statusBadge(onboardingStatus)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completion progress</span>
              <span className="font-medium">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* 1. Company Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">
                  {cfg.audience === "Owner-Operator" ? "Operator Information" : "Company Information"}
                </CardTitle>
                <CardDescription>
                  Some details have been pre-filled from your sign-up — just complete the rest.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">{cfg.audience}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">{cfg.orgNameLabel}</Label>
              <Input
                id="companyName"
                value={businessInfo.companyName ?? ""}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder={cfg.orgNamePlaceholder}
                disabled={isBusinessInfoLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">{cfg.registrationLabel}</Label>
              <Input
                id="registrationNumber"
                value={businessInfo.registrationNumber ?? ""}
                onChange={(e) => updateField("registrationNumber", e.target.value || null)}
                placeholder=""
                disabled={isBusinessInfoLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">{cfg.taxIdLabel}</Label>
              <Input
                id="taxId"
                value={businessInfo.taxId ?? ""}
                onChange={(e) => updateField("taxId", e.target.value || null)}
                placeholder=""
                disabled={isBusinessInfoLoading}
              />
            </div>
            {cfg.showBusinessType && (
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Select
                  value={businessInfo.businessType ?? ""}
                  onValueChange={(v) => updateField("businessType", v)}
                  disabled={isBusinessInfoLoading}
                >
                  <SelectTrigger id="businessType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="industry">{cfg.industryLabel}</Label>
              <Input
                id="industry"
                value={businessInfo.industry ?? ""}
                onChange={(e) => updateField("industry", e.target.value || null)}
                placeholder=""
                disabled={isBusinessInfoLoading}
              />
            </div>
            {cfg.showYearEstablished && (
              <div className="space-y-2">
                <Label htmlFor="yearEstablished">Year Established</Label>
                <Input
                  id="yearEstablished"
                  type="number"
                  value={businessInfo.yearEstablished ?? ""}
                  onChange={(e) =>
                    updateField("yearEstablished", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder=""
                  disabled={isBusinessInfoLoading}
                />
              </div>
            )}
            {cfg.showEmployees && (
              <div className="space-y-2">
                <Label htmlFor="numberOfEmployees">{cfg.employeesLabel}</Label>
                <Input
                  id="numberOfEmployees"
                  type="number"
                  min={0}
                  value={businessInfo.numberOfEmployees ?? ""}
                  onChange={(e) =>
                    updateField("numberOfEmployees", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="0"
                  disabled={isBusinessInfoLoading}
                />
              </div>
            )}
            {cfg.showWebsite && (
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={businessInfo.website ?? ""}
                  onChange={(e) => updateField("website", e.target.value || null)}
                  placeholder="https://company.com"
                  disabled={isBusinessInfoLoading}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Business Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">
                {cfg.audience === "Owner-Operator" ? "Residential Address" : "Business Address"}
              </CardTitle>
              <CardDescription>
                Where {cfg.audience === "Owner-Operator" ? "you reside" : "your business operates"}.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressLine1">Street Address *</Label>
              <Input
                id="addressLine1"
                value={businessInfo.addressLine1 ?? ""}
                onChange={(e) => updateField("addressLine1", e.target.value || null)}
                placeholder="Street address"
                disabled={isBusinessInfoLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={businessInfo.city ?? ""}
                onChange={(e) => updateField("city", e.target.value || null)}
                placeholder="Lagos"
                disabled={isBusinessInfoLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Province *</Label>
              <Input
                id="state"
                value={businessInfo.state ?? ""}
                onChange={(e) => updateField("state", e.target.value || null)}
                placeholder="Lagos State"
                disabled={isBusinessInfoLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={businessInfo.postalCode ?? ""}
                onChange={(e) => updateField("postalCode", e.target.value || null)}
                placeholder="100001"
                disabled={isBusinessInfoLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={businessInfo.country ?? ""}
                onChange={(e) => updateField("country", e.target.value || null)}
                placeholder="Nigeria"
                disabled={isBusinessInfoLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PhoneIcon className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Contact Information</CardTitle>
              <CardDescription>How we'll reach you about verification & billing.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={businessInfo.phone ?? ""}
                onChange={(e) => updateField("phone", e.target.value || null)}
                placeholder="+234 800 000 0000"
                disabled={isBusinessInfoLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                {cfg.audience === "Owner-Operator" ? "Contact Email *" : "Business Email *"}
              </Label>
              <Input
                id="email"
                type="email"
                value={businessInfo.email ?? ""}
                onChange={(e) => updateField("email", e.target.value || null)}
                placeholder="contact@company.com"
                disabled={isBusinessInfoLoading}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="billingEmail">Billing Email *</Label>
              <Input
                id="billingEmail"
                type="email"
                value={businessInfo.billingEmail ?? ""}
                onChange={(e) => updateField("billingEmail", e.target.value || null)}
                placeholder="billing@company.com"
                disabled={isBusinessInfoLoading}
              />
              <p className="text-xs text-muted-foreground">
                Invoices and payment receipts will be sent here. You can use the same address as your business email.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={saveBusinessInfo}
              disabled={isBusinessInfoLoading}
              loading={isSavingBusinessInfo}
            >
              Save business info
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Uploaded Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Uploaded Documents</CardTitle>
              <CardDescription>
                Upload the verification documents required for {cfg.audience.toLowerCase()}s.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType} disabled={isMutatingDocument}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {cfg.documents.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} {type.required && "*"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upload File</Label>
              <label
                htmlFor="kyc-dropzone-input"
                onDragOver={(e) => {
                  e.preventDefault();
                  if (selectedDocType && !isMutatingDocument) setIsDropzoneDragging(true);
                }}
                onDragLeave={() => setIsDropzoneDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDropzoneDragging(false);
                  if (!selectedDocType) {
                    toast.error("Please select a document type first");
                    return;
                  }
                  if (isMutatingDocument) return;
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    void uploadFile(selectedDocType, file);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-4 text-center transition-colors h-full ${
                  !selectedDocType
                    ? "border-border bg-muted/20 cursor-not-allowed opacity-60"
                    : isMutatingDocument
                    ? "border-border bg-muted/20 cursor-wait opacity-60"
                    : isDropzoneDragging
                    ? "border-primary bg-primary/5 cursor-pointer"
                    : "border-border hover:border-primary/50 hover:bg-muted/40 cursor-pointer"
                }`}
              >
                <input
                  id="kyc-dropzone-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  disabled={!selectedDocType || isMutatingDocument}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && selectedDocType) {
                      void uploadFile(selectedDocType, file);
                    }
                    e.target.value = "";
                  }}
                />
                <>
                  <UploadCloud className="w-5 h-5 text-primary" />
                  <p className="text-xs font-medium text-foreground">
                    {isUploadingDocument ? "Uploading..." : <><span className="text-primary">Click to upload</span> or drag & drop</>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    PDF, JPG, PNG, DOC (max 10MB)
                  </p>
                </>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">All uploaded documents</p>
              <Badge variant="outline" className="text-xs">
                {documents.length} uploaded
              </Badge>
            </div>
            {isDocumentsLoading ? (
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Loading uploaded documents...
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-2 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {doc.documentName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span>{documentTypeLabels.get(doc.documentType) ?? doc.documentType}</span>
                          <span aria-hidden="true">&bull;</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span aria-hidden="true">&bull;</span>
                          <span>{formatUploadDate(doc.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      {statusBadge(doc.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => removeDocument(doc)}
                        disabled={isDeletingDocument}
                        aria-label={`Remove ${doc.documentName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0" />
                No documents uploaded yet.
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Required documents</p>
            {isDocumentsLoading && (
              <p className="mb-3 text-xs text-muted-foreground">Loading uploaded documents...</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requiredDocs.map((docType) => {
                const uploaded = documents.find((d) => d.documentType === docType.value);
                return (
                  <div
                    key={docType.value}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                      uploaded
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-muted/30 border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {uploaded ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            uploaded ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {docType.label}
                        </p>
                        {uploaded && (
                          <p className="text-xs text-muted-foreground truncate">
                            {uploaded.documentName}
                          </p>
                        )}
                      </div>
                    </div>
                    {uploaded && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => removeDocument(uploaded)}
                        disabled={isDeletingDocument}
                        aria-label="Remove document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>



      {(onContinue || onSkip) && (
        <div className="flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-primary" />
            You can also complete KYC later from the Settings page.
          </div>
          <div className="flex items-center gap-2">
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
            )}
            {onContinue && (
              <Button onClick={onContinue} size="lg" className="min-w-[180px]">
                Continue
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
