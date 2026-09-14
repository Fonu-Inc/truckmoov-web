import type { ColumnDef } from "@tanstack/react-table";
import type {
  ComplianceDocument, ComplianceDocumentStatus,
} from "@truckmoov/api/fleet";
import { uploadMedia } from "@truckmoov/api/auth";
import {

  exportComplianceDocs,
  useComplianceDocs,
  useComplianceSummary,
  useCreateComplianceDoc,
  useDeleteComplianceDoc,
  useRenewComplianceDoc,
  useSendComplianceReminders,
  useSetComplianceDocFileUrl,
  useVehiclesByTab,
} from "@truckmoov/api/fleet";
import {
  daysUntil, formatDate, formatDayMonth, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, Bell, CalendarIcon, CheckCircle, Clock, Download, Eye, File, FileText, Loader2, Mail, MoreHorizontal, Plus, Search, Shield, SlidersHorizontal, Trash2, Truck, Upload, X,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Calendar } from "@/components/shadcn/calendar";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
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
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";

import { cn } from "@/lib/utils";
import { TabSummaryStrip } from "@/features/fleet/components/ui/TabSummaryStrip";

const statusColors: Record<string, string> = {
  valid: "bg-success/20 text-success border-success/30",
  expiring: "bg-warning/20 text-warning border-warning/30",
  expired: "bg-destructive/20 text-destructive border-destructive/30",
};

type UploadedDocumentMetadata = {
  fileUrl: string;
  fileSize: number;
};

export function ComplianceTab() {
  // ponytail: page-shell tabbed summary from GET /fleet/vehicles.
  // Payload rendered via TabSummaryStrip; strip is neutral until BE ships concrete fields.
  const tabSummaryQuery = useVehiclesByTab("compliance");
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    docTypeFilter,
    setDocTypeFilter,
  ] = useState("all");

  useEffect(
    () => {
      const t = setTimeout(
        () => setDebouncedSearch(searchQuery.trim()),
        300,
      );
      return () => clearTimeout(t);
    },
    [searchQuery],
  );

  const [
    issueFrom,
    setIssueFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    issueTo,
    setIssueTo,
  ] = useState<Date | undefined>(undefined);
  const [
    expiryFrom,
    setExpiryFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    expiryTo,
    setExpiryTo,
  ] = useState<Date | undefined>(undefined);

  const docsQuery = useComplianceDocs({
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? (statusFilter as ComplianceDocumentStatus) : undefined,
    documentType: docTypeFilter !== "all" ? docTypeFilter : undefined,
    issuedFrom: issueFrom ? issueFrom.toISOString() : undefined,
    issuedTo: issueTo ? issueTo.toISOString() : undefined,
    expiringFrom: expiryFrom ? expiryFrom.toISOString() : undefined,
    expiringTo: expiryTo ? expiryTo.toISOString() : undefined,
  });
  const summaryQuery = useComplianceSummary();
  const documents = docsQuery.data?.data ?? [];
  const isLoading = docsQuery.isLoading && !docsQuery.data;
  const isFetching = docsQuery.isFetching;
  const summary = summaryQuery.data?.data;

  const createMutation = useCreateComplianceDoc();
  const deleteMutation = useDeleteComplianceDoc();
  const setFileUrlMutation = useSetComplianceDocFileUrl();
  const renewMutation = useRenewComplianceDoc();
  const sendRemindersMutation = useSendComplianceReminders();
  const isSending = sendRemindersMutation.isPending;
  const [
    isFilterOpen,
    setIsFilterOpen,
  ] = useState(false);
  const [
    draftStatus,
    setDraftStatus,
  ] = useState("all");
  const [
    draftDocTypeEnabled,
    setDraftDocTypeEnabled,
  ] = useState(false);
  const [
    draftDocType,
    setDraftDocType,
  ] = useState("all");
  const [
    draftEnableIssue,
    setDraftEnableIssue,
  ] = useState(false);
  const [
    draftIssueFrom,
    setDraftIssueFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    draftIssueTo,
    setDraftIssueTo,
  ] = useState<Date | undefined>(undefined);
  const [
    draftEnableExpiry,
    setDraftEnableExpiry,
  ] = useState(false);
  const [
    draftExpiryFrom,
    setDraftExpiryFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    draftExpiryTo,
    setDraftExpiryTo,
  ] = useState<Date | undefined>(undefined);
  const [
    isAddDialogOpen,
    setIsAddDialogOpen,
  ] = useState(false);
  const [
    isViewDialogOpen,
    setIsViewDialogOpen,
  ] = useState(false);
  const [
    isRenewalDialogOpen,
    setIsRenewalDialogOpen,
  ] = useState(false);
  const [
    isReminderDialogOpen,
    setIsReminderDialogOpen,
  ] = useState(false);
  const [
    isSendRemindersDialogOpen,
    setIsSendRemindersDialogOpen,
  ] = useState(false);
  const [
    selectedDocument,
    setSelectedDocument,
  ] = useState<ComplianceDocument | null>(null);
  const [
    documentPendingDelete,
    setDocumentPendingDelete,
  ] = useState<ComplianceDocument | null>(null);
  const [
    reminderDaysValue,
    setReminderDaysValue,
  ] = useState("30");
  const [
    recipientEmail,
    setRecipientEmail,
  ] = useState("");
  const [
    reminderDaysBefore,
    setReminderDaysBefore,
  ] = useState("30");
  const [
    isUploading,
    setIsUploading,
  ] = useState(false);
  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(null);
  const [
    renewalFile,
    setRenewalFile,
  ] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renewalFileInputRef = useRef<HTMLInputElement>(null);

  const [
    newDocument,
    setNewDocument,
  ] = useState({
    entityType: "vehicle" as "vehicle" | "driver",
    entityName: "",
    documentType: "",
    issueDate: "",
    expiryDate: "",
  });
  const [
    isCustomDocType,
    setIsCustomDocType,
  ] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const issueDate = doc.issueDate ? new Date(doc.issueDate) : null;
    const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null;
    const matchesIssue
      = (!issueFrom || (issueDate && issueDate >= issueFrom))
        && (!issueTo || (issueDate && issueDate <= issueTo));
    const matchesExpiry
      = (!expiryFrom || (expiryDate && expiryDate >= expiryFrom))
        && (!expiryTo || (expiryDate && expiryDate <= expiryTo));
    return matchesIssue && matchesExpiry;
  });

  const stats = {
    total: summary?.total ?? 0,
    valid: summary?.valid ?? 0,
    expiring: summary?.expiringSoon ?? 0,
    expired: summary?.expired ?? 0,
    complianceRate: summary?.complianceRatePercent ?? 0,
  };

  const hasActiveComplianceFilters
    = !!debouncedSearch
      || statusFilter !== "all"
      || docTypeFilter !== "all"
      || !!issueFrom
      || !!issueTo
      || !!expiryFrom
      || !!expiryTo;

  const complianceColumns: ColumnDef<ComplianceDocument>[] = [
    {
      id: "entity",
      header: "Entity",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{row.original.documentName || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">Vehicle</p>
          </div>
        </div>
      ),
    },
    {
      id: "docType", header: "Document Type", cell: ({ row }) => row.original.documentType,
    },
    {
      id: "docNumber", header: "Document Number", meta: { className: "text-muted-foreground" }, cell: () => "-",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status] || statusColors.valid}>{row.original.status}</Badge>
      ),
    },
    {
      id: "expiry", header: "Expiry Date", cell: ({ row }) => row.original.expiryDate ? formatDate(row.original.expiryDate) : "-",
    },
    {
      id: "daysLeft",
      header: "Days Left",
      cell: ({ row }) => {
        const daysLeft = row.original.expiryDate ? daysUntil(row.original.expiryDate) ?? 0 : 0;
        return (
          <span className={cn(
            "font-medium",
            daysLeft < 0 ? "text-destructive" : daysLeft <= 30 ? "text-warning" : "text-success",
          )}
          >
            {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[60px]" },
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-popover border-border"
            >
              <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                <Eye className="h-4 w-4 mr-2" />
                View Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUploadRenewal(doc)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Renewal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetReminder(doc)}>
                <Bell className="h-4 w-4 mr-2" />
                Set Reminder
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDocumentPendingDelete(doc)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleExportData = async () => {
    try {
      const blob = await exportComplianceDocs();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-documents-${toDateParam(new Date())}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Exported compliance documents");
    }
    catch {
      toast.error("Failed to export documents");
    }
  };

  const documentTypes = useMemo(
    () => Array.from(new Set(documents.map(d => d.documentType))).filter(Boolean),
    [documents],
  );

  const handleViewDocument = (doc: ComplianceDocument) => {
    setSelectedDocument(doc);
    setIsViewDialogOpen(true);
  };

  const handleUploadRenewal = (doc: ComplianceDocument) => {
    setSelectedDocument(doc);
    setIsRenewalDialogOpen(true);
  };

  const handleSetReminder = (doc: ComplianceDocument) => {
    setSelectedDocument(doc);
    setReminderDaysValue(doc.reminderDays?.toString() || "30");
    setIsReminderDialogOpen(true);
  };

  const handleDownload = (doc: ComplianceDocument) => {
    if (doc.fileUrl) {
      window.open(
        doc.fileUrl,
        "_blank",
      );
    }
    else {
      toast.info("No file attached to this document");
    }
  };

  const uploadComplianceFile = async (file: File): Promise<UploadedDocumentMetadata> => {
    const mediaRes = await uploadMedia(file);
    const uploadedMedia = mediaRes.data;

    return {
      fileUrl: uploadedMedia.url,
      fileSize: uploadedMedia.size ?? file.size,
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRenewalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setRenewalFile(file);
    }
  };

  const handleAddDocument = async () => {
    if (!selectedFile) {
      toast.error("Upload a document before adding it");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFile = await uploadComplianceFile(selectedFile);
      await createMutation.mutateAsync({
        documentName: newDocument.entityName,
        documentType: newDocument.documentType,
        issueDate: newDocument.issueDate || null,
        expiryDate: newDocument.expiryDate || null,
        fileUrl: uploadedFile.fileUrl,
        fileSize: uploadedFile.fileSize,
      });

      setIsAddDialogOpen(false);
      setNewDocument({
        entityType: "vehicle", entityName: "", documentType: "", issueDate: "", expiryDate: "",
      });
      setIsCustomDocType(false);
      setSelectedFile(null);
      toast.success("Document added");
    }
    catch {
      toast.error("Failed to add document");
    }
    finally {
      setIsUploading(false);
    }
  };

  const handleRenewalSubmit = async () => {
    if (!selectedDocument)
      return;
    if (!renewalFile) {
      toast.error("Upload the renewed document before renewing");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFile = await uploadComplianceFile(renewalFile);
      await setFileUrlMutation.mutateAsync({
        id: selectedDocument.id,
        fileUrl: uploadedFile.fileUrl,
        fileSize: uploadedFile.fileSize,
      });
      await renewMutation.mutateAsync({ id: selectedDocument.id });
      setIsRenewalDialogOpen(false);
      setRenewalFile(null);
      setSelectedDocument(null);
      toast.success("Document renewed");
    }
    catch {
      toast.error("Failed to renew document");
    }
    finally {
      setIsUploading(false);
    }
  };

  const handleReminderSubmit = async () => {
    if (!selectedDocument)
      return;
    if (!recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }

    try {
      await sendRemindersMutation.mutateAsync();
      setIsReminderDialogOpen(false);
      setSelectedDocument(null);
      setRecipientEmail("");
      toast.success("Reminders queued");
    }
    catch {
      toast.error("Failed to send reminder");
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentPendingDelete)
      return;

    try {
      await deleteMutation.mutateAsync(documentPendingDelete.id);
      setDocumentPendingDelete(null);
      toast.success("Document deleted");
    }
    catch {
      toast.error("Failed to delete document");
    }
  };

  const handleSendReminders = async () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }
    try {
      await sendRemindersMutation.mutateAsync();
      setIsSendRemindersDialogOpen(false);
      setRecipientEmail("");
      toast.success("Reminders queued");
    }
    catch {
      toast.error("Failed to send reminders");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
          {[...Array.from({ length: 5 })].map((_, i) => (
            <Card
              key={i}
              className="bg-card/50 border-border/50"
            >
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TabSummaryStrip query={tabSummaryQuery} />
      {/* Top-right Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setIsSendRemindersDialogOpen(true)}
          disabled={isSending}
        >
          <Mail className="h-4 w-4 mr-2" />
          Send Reminders
        </Button>
        <Button
          variant="gradient"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-success shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Valid</p>
              <p className="text-2xl font-bold text-success">{stats.valid}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold text-warning">{stats.expiring}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Compliance Rate</p>
              <p className="text-2xl font-bold">
                {stats.complianceRate}
                %
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Alerts Banner */}
      {stats.expired > 0 && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {stats.expired}
                  {" "}
                  document(s) have expired
                </p>
                <p className="text-sm text-muted-foreground">
                  Immediate action required to maintain compliance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Compliance Documents (
                {filteredDocuments.length}
                )
              </CardTitle>
              <CardDescription className="mt-1">Vehicle and driver documents — expiry dates, renewal status, and regulatory categories.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by entity, document type, number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-card/50 border-border/50"
              />
              {isFetching && !isLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            <Select
              value={statusFilter}
              onValueChange={v => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-[160px] bg-card/50 border-border/50">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Popover
              open={isFilterOpen}
              onOpenChange={setIsFilterOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                  {(statusFilter !== "all" || docTypeFilter !== "all" || issueFrom || issueTo || expiryFrom || expiryTo) && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-1.5"
                    >
                      {[
                        statusFilter !== "all",
                        docTypeFilter !== "all",
                        !!(issueFrom || issueTo),
                        !!(expiryFrom || expiryTo),
                      ].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 space-y-4 max-h-[70vh] overflow-y-auto"
              >
                <Label className="text-sm font-semibold">Show Documents</Label>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={draftStatus}
                    onValueChange={setDraftStatus}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="expiring">Expiring</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Type */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cmp-flt-type"
                      checked={draftDocTypeEnabled}
                      onCheckedChange={c => setDraftDocTypeEnabled(c === true)}
                    />
                    <Label
                      htmlFor="cmp-flt-type"
                      className="text-xs cursor-pointer"
                    >
                      Document Type
                    </Label>
                  </div>
                  <Select
                    value={draftDocType}
                    onValueChange={setDraftDocType}
                    disabled={!draftDocTypeEnabled}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {documentTypes.map(t => (
                        <SelectItem
                          key={t}
                          value={t}
                        >
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Issue Date Range */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cmp-flt-issue"
                      checked={draftEnableIssue}
                      onCheckedChange={c => setDraftEnableIssue(c === true)}
                    />
                    <Label
                      htmlFor="cmp-flt-issue"
                      className="text-xs cursor-pointer"
                    >
                      Issue Date
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!draftEnableIssue}
                          className={cn(
                            "h-9 flex-1 justify-start text-left font-normal",
                            !draftIssueFrom && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {draftIssueFrom ? formatDayMonth(draftIssueFrom) : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={draftIssueFrom}
                          onSelect={setDraftIssueFrom}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-xs text-muted-foreground">to</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!draftEnableIssue}
                          className={cn(
                            "h-9 flex-1 justify-start text-left font-normal",
                            !draftIssueTo && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {draftIssueTo ? formatDayMonth(draftIssueTo) : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={draftIssueTo}
                          onSelect={setDraftIssueTo}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Expiry Date Range */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cmp-flt-expiry"
                      checked={draftEnableExpiry}
                      onCheckedChange={c => setDraftEnableExpiry(c === true)}
                    />
                    <Label
                      htmlFor="cmp-flt-expiry"
                      className="text-xs cursor-pointer"
                    >
                      Expiry Date
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!draftEnableExpiry}
                          className={cn(
                            "h-9 flex-1 justify-start text-left font-normal",
                            !draftExpiryFrom && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {draftExpiryFrom ? formatDayMonth(draftExpiryFrom) : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={draftExpiryFrom}
                          onSelect={setDraftExpiryFrom}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-xs text-muted-foreground">to</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!draftEnableExpiry}
                          className={cn(
                            "h-9 flex-1 justify-start text-left font-normal",
                            !draftExpiryTo && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {draftExpiryTo ? formatDayMonth(draftExpiryTo) : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={draftExpiryTo}
                          onSelect={setDraftExpiryTo}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setStatusFilter(draftStatus);
                      setDocTypeFilter(draftDocTypeEnabled && draftDocType ? draftDocType : "all");
                      setIssueFrom(draftEnableIssue ? draftIssueFrom : undefined);
                      setIssueTo(draftEnableIssue ? draftIssueTo : undefined);
                      setExpiryFrom(draftEnableExpiry ? draftExpiryFrom : undefined);
                      setExpiryTo(draftEnableExpiry ? draftExpiryTo : undefined);
                      setIsFilterOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStatusFilter("all");
                      setDocTypeFilter("all");
                      setIssueFrom(undefined);
                      setIssueTo(undefined);
                      setExpiryFrom(undefined);
                      setExpiryTo(undefined);
                      setDraftStatus("all");
                      setDraftDocTypeEnabled(false);
                      setDraftDocType("all");
                      setDraftEnableIssue(false);
                      setDraftIssueFrom(undefined);
                      setDraftIssueTo(undefined);
                      setDraftEnableExpiry(false);
                      setDraftExpiryFrom(undefined);
                      setDraftExpiryTo(undefined);
                    }}
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="relative overflow-x-auto p-0">
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <DataTable
            columns={complianceColumns}
            data={filteredDocuments}
            isLoading={isLoading}
            hasActiveFilters={hasActiveComplianceFilters}
            emptyState="No documents found. Add your first compliance document."
            filteredEmptyState={
              (issueFrom || issueTo || expiryFrom || expiryTo)
                ? "No documents match. Note: documents with no date in the filtered field are excluded — an unknown date can't be placed inside a date window."
                : "No compliance documents match your filters."
            }
          />
          {(issueFrom || issueTo || expiryFrom || expiryTo) && (
            <p className="px-4 pb-3 text-[11px] text-muted-foreground">
              Documents without a date in the filtered field are excluded — an unknown date can&apos;t be placed inside a date window.
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!documentPendingDelete}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDocumentPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete compliance document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the compliance document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              loading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDeleteDocument()}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Document Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Add Compliance Document</DialogTitle>
            <DialogDescription>Track a new license, permit, or certificate</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Entity Name</Label>
              <Input
                placeholder="e.g., LAG-234-XY or Driver Name"
                value={newDocument.entityName}
                onChange={e => setNewDocument({
                  ...newDocument, entityName: e.target.value,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              {(() => {
                const presetTypes = [
                  "Vehicle License",
                  "Insurance",
                  "Roadworthiness Certificate",
                  "Hackney Permit",
                  "Driver's License",
                  "Medical Certificate",
                ];
                const isCustom
                  = isCustomDocType
                    || (!!newDocument.documentType && !presetTypes.includes(newDocument.documentType));
                return (
                  <>
                    <Select
                      value={isCustom ? "__custom__" : newDocument.documentType}
                      onValueChange={(v) => {
                        if (v === "__custom__") {
                          setIsCustomDocType(true);
                          setNewDocument({
                            ...newDocument, documentType: "",
                          });
                        }
                        else {
                          setIsCustomDocType(false);
                          setNewDocument({
                            ...newDocument, documentType: v,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {presetTypes.map(t => (
                          <SelectItem
                            key={t}
                            value={t}
                          >
                            {t}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {isCustom && (
                      <div className="space-y-2 pt-2">
                        <Label>Custom Document Type</Label>
                        <Input
                          placeholder="Enter custom document type"
                          value={newDocument.documentType}
                          onChange={e =>
                            setNewDocument({
                              ...newDocument, documentType: e.target.value,
                            })}
                        />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={newDocument.issueDate}
                  onChange={e => setNewDocument({
                    ...newDocument, issueDate: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={newDocument.expiryDate}
                  onChange={e => setNewDocument({
                    ...newDocument, expiryDate: e.target.value,
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload Document</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile
                  ? (
                      <div className="flex items-center justify-center gap-2">
                        <File className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Drag & drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, JPG, or PNG up to 10MB
                        </p>
                      </>
                    )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleAddDocument}
              disabled={!newDocument.entityName || !newDocument.documentType || !newDocument.expiryDate || !selectedFile || isUploading}
            >
              {isUploading
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  )
                : (
                    "Add Document"
                  )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              {selectedDocument?.documentType}
              {" "}
              for
              {selectedDocument?.documentName}
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Entity Name</Label>
                  <p className="font-medium">{selectedDocument.documentName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Document Type</Label>
                  <p className="font-medium">{selectedDocument.documentType}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <div className="mt-1">
                  <Badge className={statusColors[selectedDocument.status]}>{selectedDocument.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Issue Date</Label>
                  <p className="font-medium">
                    {selectedDocument.issueDate
                      ? formatDate(selectedDocument.issueDate)
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Expiry Date</Label>
                  <p className="font-medium">{selectedDocument.expiryDate ? formatDate(selectedDocument.expiryDate) : "—"}</p>
                </div>
              </div>
              {selectedDocument.fileUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleDownload(selectedDocument)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Renewal Dialog */}
      <Dialog
        open={isRenewalDialogOpen}
        onOpenChange={setIsRenewalDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Renew Document</DialogTitle>
            <DialogDescription>
              Upload a renewed
              {" "}
              {selectedDocument?.documentType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input
              type="file"
              ref={renewalFileInputRef}
              onChange={handleRenewalFileSelect}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => renewalFileInputRef.current?.click()}
            >
              {renewalFile
                ? (
                    <div className="flex items-center justify-center gap-2">
                      <File className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{renewalFile.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenewalFile(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Upload the renewed document
                      </p>
                    </>
                  )}
            </div>
            <p className="text-sm text-muted-foreground">
              This will extend the expiry date by 1 year from today.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenewalDialogOpen(false);
                setRenewalFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleRenewalSubmit}
              disabled={isUploading || !renewalFile}
            >
              {isUploading
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  )
                : (
                    "Renew Document"
                  )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Reminder Dialog */}
      <Dialog
        open={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
            <DialogDescription>
              Get notified before this document expires
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remind me before</Label>
              <Select
                value={reminderDaysValue}
                onValueChange={setReminderDaysValue}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={sendRemindersMutation.isPending}
              onClick={() => setIsReminderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              loading={sendRemindersMutation.isPending}
              disabled={sendRemindersMutation.isPending || !recipientEmail}
              onClick={handleReminderSubmit}
            >
              Save Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminders Dialog */}
      <Dialog
        open={isSendRemindersDialogOpen}
        onOpenChange={setIsSendRemindersDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Compliance Reminders</DialogTitle>
            <DialogDescription>
              Send email reminders for expiring and expired documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                placeholder="admin@company.com"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remind me before</Label>
              <Select
                value={reminderDaysBefore}
                onValueChange={setReminderDaysBefore}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This will send a summary of:</p>
              <ul className="list-disc list-inside mt-1">
                <li>
                  {stats.expired}
                  {" "}
                  expired document(s)
                </li>
                <li>
                  {stats.expiring}
                  {" "}
                  document(s) expiring soon
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSendRemindersDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleSendReminders}
              disabled={isSending}
            >
              {isSending
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  )
                : (
                    "Send Reminders"
                  )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
