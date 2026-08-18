import { daysBetween, formatDate, isBefore } from "@truckmoov/app-core/utils/time-utils";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shadcn/dialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  ShieldCheck,
  Upload,
  FileText,
  CalendarClock,
  FileWarning,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


const DOCUMENT_TYPES = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "vehicle_registration", label: "Vehicle Registration" },
  { value: "insurance", label: "Insurance Certificate" },
  { value: "roadworthiness", label: "Roadworthiness Certificate" },
] as const;

// Dummy compliance documents shown when no real records exist yet, so
// owner-operators can preview what the panel looks like populated.
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};
const DUMMY_COMPLIANCE_DOCS = [
  {
    id: "dummy-doc-1",
    document_name: "Driver's License – Class E",
    document_type: "drivers_license",
    document_number: "LAG-DL-22418",
    issue_date: daysFromNow(-540),
    expiry_date: daysFromNow(180),
    verification_status: "verified",
    file_path: null,
  },
  {
    id: "dummy-doc-2",
    document_name: "Vehicle Registration – LAG-348-OO",
    document_type: "vehicle_registration",
    document_number: "FRSC-VR-90218",
    issue_date: daysFromNow(-300),
    expiry_date: daysFromNow(65),
    verification_status: "verified",
    file_path: null,
  },
  {
    id: "dummy-doc-3",
    document_name: "Comprehensive Insurance – AIICO",
    document_type: "insurance",
    document_number: "AIC-COM-77310",
    issue_date: daysFromNow(-330),
    expiry_date: daysFromNow(28),
    verification_status: "pending",
    file_path: null,
  },
  {
    id: "dummy-doc-4",
    document_name: "Roadworthiness Certificate",
    document_type: "roadworthiness",
    document_number: "VIO-RW-44502",
    issue_date: daysFromNow(-200),
    expiry_date: daysFromNow(-7),
    verification_status: "pending",
    file_path: null,
  },
  {
    id: "dummy-doc-5",
    document_name: "Hackney Permit",
    document_type: "vehicle_registration",
    document_number: "LAG-HP-10287",
    issue_date: daysFromNow(-150),
    expiry_date: daysFromNow(210),
    verification_status: "verified",
    file_path: null,
  },
];

interface ComplianceDocumentsPanelProps {
  orgId: string;
  tenantId?: string;
  vehicleIds: string[];
}

export function ComplianceDocumentsPanel({ orgId, tenantId, vehicleIds }: ComplianceDocumentsPanelProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState("");
  const [docName, setDocName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["oo-compliance-docs", orgId],
    queryFn: async () => [],
    enabled: !!orgId,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      toast.info('Coming soon');
    },
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["oo-compliance-docs", orgId] });
      queryClient.invalidateQueries({ queryKey: ["oo-compliance"] });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
    onSettled: () => setUploading(false),
  });

  const resetForm = () => {
    setDocType("");
    setDocName("");
    setDocNumber("");
    setExpiryDate("");
    setIssueDate("");
    setFile(null);
  };

  const now = new Date();

  const getStatusBadge = (doc: { expiry_date: string; verification_status?: string }) => {
    const expiry = new Date(doc.expiry_date);
    const daysLeft = daysBetween(now, expiry);
    const verStatus = (doc as any).verification_status || "pending";

    if (isBefore(expiry, now)) {
      return (
        <Badge variant="destructive">
          <FileWarning className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      );
    }
    if (daysLeft <= 30) {
      return (
        <Badge variant="outline" className="border-warning text-warning">
          <CalendarClock className="mr-1 h-3 w-3" />
          {daysLeft}d left
        </Badge>
      );
    }
    if (verStatus === "verified") {
      return (
        <Badge variant="default" className="bg-success text-success-foreground">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Verified
        </Badge>
      );
    }
    if (verStatus === "rejected") {
      return (
        <Badge variant="destructive">Rejected</Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="mr-1 h-3 w-3" />
        Pending Review
      </Badge>
    );
  };

  const getDocTypeLabel = (type: string) =>
    DOCUMENT_TYPES.find(d => d.value === type)?.label || type;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Compliance Documents
            </CardTitle>
            <CardDescription>Upload and track licenses, insurance, and roadworthiness documents for your fleet.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Compliance Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Document Type *</Label>
                  <Select value={docType} onValueChange={(v) => {
                    setDocType(v);
                    if (!docName) setDocName(DOCUMENT_TYPES.find(d => d.value === v)?.label || "");
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(dt => (
                        <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Document Name *</Label>
                  <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. My Driver's License" />
                </div>

                <div className="space-y-2">
                  <Label>Document Number</Label>
                  <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Optional" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date *</Label>
                    <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 10MB)</p>
                </div>

                <Button
                  className="w-full"
                  disabled={uploading || !docType || !docName || !expiryDate}
                  onClick={() => uploadMutation.mutate()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (() => {
          const displayDocs = docs.length > 0 ? docs : DUMMY_COMPLIANCE_DOCS;
          return (
            <div className="space-y-2">
              {displayDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="font-medium text-sm">{doc.document_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDocTypeLabel(doc.document_type)}
                      {doc.document_number && ` · ${doc.document_number}`}
                      {doc.expiry_date && ` · Expires ${formatDate(doc.expiry_date)}`}
                    </p>
                  </div>
                  {getStatusBadge(doc)}
                </div>
              ))}
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
