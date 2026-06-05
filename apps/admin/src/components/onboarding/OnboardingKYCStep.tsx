import { useEffect, useMemo, useRef, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Shield,
  Loader2,
  UploadCloud,
  FileText,
  Trash2,
  Save,
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

const DEFAULT_DOCS = [
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

function getStakeholderConfig(): StakeholderKYCConfig {
  return {
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
}

interface BusinessInfo {
  id?: string;
  tenant_id: string;
  company_name: string | null;
  registration_number: string | null;
  tax_id: string | null;
  business_type: string | null;
  industry: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  billing_email: string | null;
  website: string | null;
  year_established: number | null;
  number_of_employees: string | null;
  verification_status: string;
}

interface KYCDocument {
  id: string;
  document_type: string;
  document_name: string;
  file_size: number;
  status: string;
  created_at: string;
}

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

const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

function statusBadge(status: string) {
  switch (status) {
    case "verified":
    case "approved":
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
        </Badge>
      );
    case "under_review":
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" /> Under Review
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

const emptyBusinessInfo = (tenantId: string): BusinessInfo => ({
  tenant_id: tenantId,
  company_name: null,
  registration_number: null,
  tax_id: null,
  business_type: null,
  industry: null,
  address_line1: null,
  address_line2: null,
  city: null,
  state: null,
  postal_code: null,
  country: null,
  phone: null,
  email: null,
  billing_email: null,
  website: null,
  year_established: null,
  number_of_employees: null,
  verification_status: "pending",
});

export function OnboardingKYCStep({ tenantId, onContinue, onSkip }: { tenantId: string; onContinue?: () => void; onSkip?: () => void }) {
  const { user } = useAuthStore();
  const cfg = useMemo(() => getStakeholderConfig(), []);
  const requiredDocs = useMemo(() => cfg.documents.filter((d) => d.required), [cfg]);

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [dragOverType, setDragOverType] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [isDropzoneDragging, setIsDropzoneDragging] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: bi }, { data: docs }] = await Promise.all([
        supabase.from("tenant_business_info").select("*").eq("tenant_id", tenantId).maybeSingle(),
        supabase
          .from("tenant_kyc_documents")
          .select("id, document_type, document_name, file_size, status, created_at")
          .eq("tenant_id", tenantId),
      ]);
      const existing = (bi as BusinessInfo | null) ?? emptyBusinessInfo(tenantId);
      // Pre-fill from the user's signup so they don't re-enter known info.
      const derivedOrgName =
        existing.company_name ||
        (user?.name
          ? cfg.audience === "Owner-Operator"
            ? user.name
            : `${user.name.split(" ")[0]}'s ${cfg.audience === "Aggregator Admin" ? "Network" : "Fleet"}`
          : null);
      setBusinessInfo({
        ...existing,
        company_name: existing.company_name || derivedOrgName,
        email: existing.email || user?.email || null,
        billing_email: existing.billing_email || existing.email || user?.email || null,
        phone: existing.phone || user?.phone || null,
      });
      setDocuments((docs ?? []) as KYCDocument[]);
    } catch (err) {
      console.error("Failed to load KYC data", err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof BusinessInfo>(key: K, value: BusinessInfo[K]) => {
    setBusinessInfo((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveBusinessInfo = async () => {
    if (!businessInfo) return;
    setSaving(true);
    try {
      const payload = { ...businessInfo, tenant_id: tenantId };
      const { error } = await supabase
        .from("tenant_business_info")
        .upsert(payload, { onConflict: "tenant_id" });
      if (error) throw error;
      toast.success("Business information saved");
      void load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (docType: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Max file size is 10MB." });
      return;
    }
    setUploadingType(docType);
    try {
      const ext = file.name.split(".").pop();
      const path = `${tenantId}/${docType}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("kyc-documents").upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("tenant_kyc_documents").insert({
        tenant_id: tenantId,
        document_type: docType,
        document_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
        status: "pending",
      });
      if (dbErr) throw dbErr;
      toast.success("Document uploaded");
      void load();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploadingType(null);
    }
  };

  const removeDocument = async (doc: KYCDocument) => {
    try {
      const { error } = await supabase.from("tenant_kyc_documents").delete().eq("id", doc.id);
      if (error) throw error;
      toast.success("Document removed");
      void load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove");
    }
  };

  const completion = useMemo(() => {
    if (!businessInfo) return 0;
    const docPct =
      (requiredDocs.filter((d) => documents.some((x) => x.document_type === d.value)).length /
        Math.max(requiredDocs.length, 1)) *
      50;
    const fieldKeys: (keyof BusinessInfo)[] = [
      "company_name",
      "registration_number",
      "tax_id",
      "address_line1",
      "city",
      "state",
      "phone",
      "email",
    ];
    const filled = fieldKeys.filter((k) => Boolean(businessInfo[k])).length;
    return Math.round(docPct + (filled / fieldKeys.length) * 50);
  }, [businessInfo, documents, requiredDocs]);

  if (loading || !businessInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {statusBadge(businessInfo.verification_status)}
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
              <Label htmlFor="company_name">{cfg.orgNameLabel}</Label>
              <Input
                id="company_name"
                value={businessInfo.company_name ?? ""}
                onChange={(e) => updateField("company_name", e.target.value)}
                placeholder={cfg.orgNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_number">{cfg.registrationLabel}</Label>
              <Input
                id="registration_number"
                value={businessInfo.registration_number ?? ""}
                onChange={(e) => updateField("registration_number", e.target.value)}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_id">{cfg.taxIdLabel}</Label>
              <Input
                id="tax_id"
                value={businessInfo.tax_id ?? ""}
                onChange={(e) => updateField("tax_id", e.target.value)}
                placeholder=""
              />
            </div>
            {cfg.showBusinessType && (
              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type *</Label>
                <Select
                  value={businessInfo.business_type ?? ""}
                  onValueChange={(v) => updateField("business_type", v)}
                >
                  <SelectTrigger id="business_type">
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
                onChange={(e) => updateField("industry", e.target.value)}
                placeholder=""
              />
            </div>
            {cfg.showYearEstablished && (
              <div className="space-y-2">
                <Label htmlFor="year_established">Year Established</Label>
                <Input
                  id="year_established"
                  type="number"
                  value={businessInfo.year_established ?? ""}
                  onChange={(e) =>
                    updateField("year_established", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder=""
                />
              </div>
            )}
            {cfg.showEmployees && (
              <div className="space-y-2">
                <Label htmlFor="number_of_employees">{cfg.employeesLabel}</Label>
                <Select
                  value={businessInfo.number_of_employees ?? ""}
                  onValueChange={(v) => updateField("number_of_employees", v)}
                >
                  <SelectTrigger id="number_of_employees">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_RANGES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {cfg.showWebsite && (
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={businessInfo.website ?? ""}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://company.com"
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
              <Label htmlFor="address_line1">Street Address *</Label>
              <Input
                id="address_line1"
                value={businessInfo.address_line1 ?? ""}
                onChange={(e) => updateField("address_line1", e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={businessInfo.city ?? ""}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Lagos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Province *</Label>
              <Input
                id="state"
                value={businessInfo.state ?? ""}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="Lagos State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={businessInfo.postal_code ?? ""}
                onChange={(e) => updateField("postal_code", e.target.value)}
                placeholder="100001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={businessInfo.country ?? ""}
                onChange={(e) => updateField("country", e.target.value)}
                placeholder="Nigeria"
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
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+234 800 000 0000"
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
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="contact@company.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="billing_email">Billing Email *</Label>
              <Input
                id="billing_email"
                type="email"
                value={businessInfo.billing_email ?? ""}
                onChange={(e) => updateField("billing_email", e.target.value)}
                placeholder="billing@company.com"
              />
              <p className="text-xs text-muted-foreground">
                Invoices and payment receipts will be sent here. You can use the same address as your business email.
              </p>
            </div>
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
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
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
                  if (selectedDocType) setIsDropzoneDragging(true);
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
                  if (file) {
                    void uploadFile(selectedDocType, file).then(() => setSelectedDocType(""));
                  }
                }}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-4 text-center transition-colors h-full ${
                  !selectedDocType
                    ? "border-border bg-muted/20 cursor-not-allowed opacity-60"
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
                  disabled={!selectedDocType || uploadingType !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && selectedDocType) {
                      void uploadFile(selectedDocType, file).then(() => setSelectedDocType(""));
                    }
                    e.target.value = "";
                  }}
                />
                {uploadingType ? (
                  <>
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">Uploading…</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-primary" />
                    <p className="text-xs font-medium text-foreground">
                      <span className="text-primary">Click to upload</span> or drag & drop
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      PDF, JPG, PNG, DOC (max 10MB)
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Required documents</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requiredDocs.map((docType) => {
                const uploaded = documents.find((d) => d.document_type === docType.value);
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
                            {uploaded.document_name}
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



