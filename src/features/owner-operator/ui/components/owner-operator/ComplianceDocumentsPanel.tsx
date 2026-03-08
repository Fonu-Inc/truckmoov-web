import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format as dateFormat, differenceInDays, isBefore, addDays } from "date-fns";

const DOCUMENT_TYPES = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "vehicle_registration", label: "Vehicle Registration" },
  { value: "insurance", label: "Insurance Certificate" },
  { value: "roadworthiness", label: "Roadworthiness Certificate" },
] as const;

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_documents")
        .select("*")
        .eq("org_id", orgId)
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!docType || !docName || !expiryDate) {
        throw new Error("Please fill in all required fields");
      }

      setUploading(true);
      let filePath: string | null = null;

      // Upload file if provided
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${orgId}/${docType}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("compliance-documents")
          .upload(path, file);
        if (uploadError) throw uploadError;
        filePath = path;
      }

      const { error } = await supabase.from("compliance_documents").insert({
        org_id: orgId,
        tenant_id: tenantId || "default",
        document_type: docType,
        document_name: docName,
        document_number: docNumber || null,
        expiry_date: expiryDate,
        issue_date: issueDate || null,
        file_path: filePath,
        status: "valid",
        verification_status: "pending",
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
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
    const daysLeft = differenceInDays(expiry, now);
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
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Compliance Documents
          </CardTitle>
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
        ) : docs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents uploaded"
            description="Upload your driver's license, insurance, vehicle registration, and roadworthiness certificate."
          />
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="font-medium text-sm">{doc.document_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getDocTypeLabel(doc.document_type)}
                    {doc.document_number && ` · ${doc.document_number}`}
                    {doc.expiry_date && ` · Expires ${dateFormat(new Date(doc.expiry_date), "MMM d, yyyy")}`}
                  </p>
                </div>
                {getStatusBadge(doc)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
