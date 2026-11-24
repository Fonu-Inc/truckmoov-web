import type {
  ComplianceDocument, ComplianceDocumentStatus,
} from "@truckmoov/api/fleet";
import { uploadMedia } from "@truckmoov/api/auth";
import {

  exportComplianceDocs,
  useComplianceDocs,
  useComplianceSummary,
  useDeleteComplianceDoc,
  useRenewComplianceDoc,
  useSetComplianceDocFileUrl,
  useSetComplianceDocReminder,
} from "@truckmoov/api/fleet";
import {
  daysUntil, formatDate, formatDayMonth, formatWithPattern, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, Bell, CalendarIcon, CheckCircle, Clock, Download, Eye, File, FileText, Loader2, MoreHorizontal, Search, Shield, SlidersHorizontal, Trash2, Truck, Upload, X,
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

import { Checkbox } from "@/components/shadcn/checkbox";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/shared/components/layout/PageHeader";

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

  // Calendar dates, not toISOString() — local midnight in UTC+1 is the previous day in UTC.
  const docsParams = {
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? (statusFilter as ComplianceDocumentStatus) : undefined,
    documentType: docTypeFilter !== "all" ? docTypeFilter : undefined,
    issuedFrom: issueFrom ? toDateParam(issueFrom) : undefined,
    issuedTo: issueTo ? toDateParam(issueTo) : undefined,
    expiringFrom: expiryFrom ? toDateParam(expiryFrom) : undefined,
    expiringTo: expiryTo ? toDateParam(expiryTo) : undefined,
  };
  const hasDateFilter = !!(issueFrom || issueTo || expiryFrom || expiryTo);
  const docsQuery = useComplianceDocs(docsParams);
  const summaryQuery = useComplianceSummary();
  const documents = docsQuery.data?.data ?? [];
  const isLoading = docsQuery.isLoading && !docsQuery.data;
  const summary = summaryQuery.data?.data;
  const isSummaryLoading = summaryQuery.isLoading && !summaryQuery.data;

  const deleteMutation = useDeleteComplianceDoc();
  const setFileUrlMutation = useSetComplianceDocFileUrl();
  const renewMutation = useRenewComplianceDoc();
  const setReminderMutation = useSetComplianceDocReminder();
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
    isUploading,
    setIsUploading,
  ] = useState(false);
  const [
    renewalFile,
    setRenewalFile,
  ] = useState<File | null>(null);
  const renewalFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportData = async () => {
    try {
      const blob = await exportComplianceDocs({ params: docsParams });
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

  // PATCH /fleet/compliance/documents/:id/reminder stores reminderDays only.
  // ponytail: the recipient email field is kept for parity with the design, but the
  // endpoint has no recipient — reminders go to the tenant's configured contacts.
  const handleReminderSubmit = async () => {
    if (!selectedDocument)
      return;

    try {
      await setReminderMutation.mutateAsync({
        id: selectedDocument.id,
        reminderDays: Number(reminderDaysValue),
      });
      setIsReminderDialogOpen(false);
      setSelectedDocument(null);
      setRecipientEmail("");
      toast.success("Reminder saved");
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

  const kpiCardClass = "rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50";

  return (
    <>
      <PageHeader
        title="Vehicle Compliance"
        description="Details and current information your vehicle compliance."
      />
      <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className={kpiCardClass}>
              <div className="p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Vehicle Licences</p>
                  <p className="text-2xl font-bold">{isSummaryLoading ? "-" : stats.total}</p>
                </div>
              </div>
            </div>
            <div className={kpiCardClass}>
              <div className="p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Valid</p>
                  <p className="text-2xl font-bold text-success">{isSummaryLoading ? "-" : stats.valid}</p>
                </div>
              </div>
            </div>
            <div className={kpiCardClass}>
              <div className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold text-warning">{isSummaryLoading ? "-" : stats.expiring}</p>
                </div>
              </div>
            </div>
            <div className={kpiCardClass}>
              <div className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold text-destructive">{isSummaryLoading ? "-" : stats.expired}</p>
                </div>
              </div>
            </div>
            <div className={kpiCardClass}>
              <div className="p-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Compliance Rate</p>
                  <p className="text-2xl font-bold">{isSummaryLoading ? "-" : `${stats.complianceRate}%`}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Alerts Banner */}
          {stats.expired > 0 && (
            <div className="rounded-2xl surface-sleek text-card-foreground bg-destructive/10 border-destructive/30">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">{`${stats.expired} vehicle licence(s) have expired`}</p>
                    <p className="text-sm text-muted-foreground">Immediate action required to maintain compliance</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Licences Table */}
          <div className={kpiCardClass}>
            <div className="flex flex-col p-6 pb-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {`Vehicle Licences (${filteredDocuments.length})`}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Vehicle licence validity and expiry dates.</p>
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
                    placeholder="Search by vehicle or licence number..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card/50 border-border/50"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={v => setStatusFilter(v as typeof statusFilter)}
                >
                  <SelectTrigger className="h-10 rounded-xl px-3.5 w-full sm:w-[170px] bg-card/50 border-border/50">
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
            </div>
            <div className="p-6 pt-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Licence Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow
                          key={`skeleton-${i}`}
                          className="border-border/50"
                        >
                          <TableCell colSpan={6}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    : filteredDocuments.length === 0
                      ? (
                          <TableRow className="border-border/50 hover:bg-transparent">
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                              {hasActiveComplianceFilters
                                ? (hasDateFilter
                                    ? "No vehicle licences match. Note: licences with no date in the filtered field are excluded, since an unknown date can't be placed inside a date window."
                                    : "No vehicle licences match your filters.")
                                : "No vehicle licences found."}
                            </TableCell>
                          </TableRow>
                        )
                      : filteredDocuments.map((doc) => {
                          const daysLeft = doc.expiryDate ? daysUntil(doc.expiryDate) : null;
                          return (
                            <TableRow
                              key={doc.id}
                              className="border-border/50"
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{doc.documentName || "-"}</p>
                                  </div>
                                </div>
                              </TableCell>
                              {/* ComplianceDocument has no licence-number field yet. */}
                              <TableCell className="font-mono text-sm">-</TableCell>
                              <TableCell>
                                <div className={cn(
                                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm hover:bg-primary/90",
                                  statusColors[doc.status] || statusColors.valid,
                                )}
                                >
                                  {doc.status}
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatWithPattern(
                                  doc.expiryDate,
                                  "MMM dd, yyyy",
                                )}
                              </TableCell>
                              <TableCell>
                                {daysLeft === null
                                  ? "-"
                                  : (
                                      <span className={cn(
                                        "font-medium",
                                        daysLeft < 0 ? "text-destructive" : daysLeft <= 30 ? "text-warning" : "text-success",
                                      )}
                                      >
                                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                                      </span>
                                    )}
                              </TableCell>
                              <TableCell>
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
                              </TableCell>
                            </TableRow>
                          );
                        })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

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
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Expiry Date</Label>
                  <p className="font-medium">{selectedDocument.expiryDate ? formatDate(selectedDocument.expiryDate) : "-"}</p>
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
              disabled={setReminderMutation.isPending}
              onClick={() => setIsReminderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              loading={setReminderMutation.isPending}
              disabled={setReminderMutation.isPending}
              onClick={handleReminderSubmit}
            >
              Save Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
