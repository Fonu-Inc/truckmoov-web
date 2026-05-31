import {Download,  AlertTriangle, Bell, CalendarIcon, CheckCircle, Clock, Eye, File, FileText, Loader2, Mail, MoreHorizontal, Plus, Search, Shield, SlidersHorizontal, Truck, Upload, X } from 'lucide-react';
import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays, addDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useComplianceDocuments, ComplianceDocument } from "@/hooks/useComplianceDocuments";
import { useFleetReminders } from "@/hooks/useFleetReminders";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";

const statusColors: Record<string, string> = {
  valid: "bg-success/20 text-success border-success/30",
  expiring: "bg-warning/20 text-warning border-warning/30",
  expired: "bg-destructive/20 text-destructive border-destructive/30" };

export function ComplianceTab() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  
  const { documents, isLoading, addDocument, updateDocument, deleteDocument, setReminderDays, getStats } = useComplianceDocuments(tenantId);
  const { sendReminders, isSending } = useFleetReminders(tenantId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [issueFrom, setIssueFrom] = useState<Date | undefined>(undefined);
  const [issueTo, setIssueTo] = useState<Date | undefined>(undefined);
  const [expiryFrom, setExpiryFrom] = useState<Date | undefined>(undefined);
  const [expiryTo, setExpiryTo] = useState<Date | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftDocTypeEnabled, setDraftDocTypeEnabled] = useState(false);
  const [draftDocType, setDraftDocType] = useState("all");
  const [draftEnableIssue, setDraftEnableIssue] = useState(false);
  const [draftIssueFrom, setDraftIssueFrom] = useState<Date | undefined>(undefined);
  const [draftIssueTo, setDraftIssueTo] = useState<Date | undefined>(undefined);
  const [draftEnableExpiry, setDraftEnableExpiry] = useState(false);
  const [draftExpiryFrom, setDraftExpiryFrom] = useState<Date | undefined>(undefined);
  const [draftExpiryTo, setDraftExpiryTo] = useState<Date | undefined>(undefined);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isSendRemindersDialogOpen, setIsSendRemindersDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ComplianceDocument | null>(null);
  const [reminderDaysValue, setReminderDaysValue] = useState("30");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState("30");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [renewalFile, setRenewalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renewalFileInputRef = useRef<HTMLInputElement>(null);
  
  const [newDocument, setNewDocument] = useState({
    entityType: "vehicle" as "vehicle" | "driver",
    entityName: "",
    documentType: "",
    documentNumber: "",
    issueDate: "",
    expiryDate: "" });
  const [isCustomDocType, setIsCustomDocType] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      (doc.vehicle_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.document_number?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesDocType = docTypeFilter === "all" || doc.document_type === docTypeFilter;
    const issueDate = doc.issue_date ? new Date(doc.issue_date) : null;
    const expiryDate = new Date(doc.expiry_date);
    const matchesIssue =
      (!issueFrom || (issueDate && issueDate >= issueFrom)) &&
      (!issueTo || (issueDate && issueDate <= issueTo));
    const matchesExpiry =
      (!expiryFrom || expiryDate >= expiryFrom) &&
      (!expiryTo || expiryDate <= expiryTo);
    return matchesSearch && matchesStatus && matchesDocType && matchesIssue && matchesExpiry;
  });

  const stats = getStats();

  const handleExportData = () => {
    if (filteredDocuments.length === 0) {
      toast.info("No documents to export");
      return;
    }
    const headers = ["Entity", "Document Type", "Document Number", "Status", "Issue Date", "Expiry Date"];
    const rows = filteredDocuments.map((d) => [
      d.vehicle_name || "",
      d.document_type,
      d.document_number || "",
      d.status,
      d.issue_date ? format(new Date(d.issue_date), "yyyy-MM-dd") : "",
      format(new Date(d.expiry_date), "yyyy-MM-dd"),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-documents-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Exported compliance documents");
  };
  const documentTypes = useMemo(
    () => Array.from(new Set(documents.map((d) => d.document_type))).filter(Boolean),
    [documents]
  );

  const getDaysUntilExpiry = (date: string) => {
    return differenceInDays(new Date(date), new Date());
  };

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
    setReminderDaysValue(doc.reminder_days?.toString() || "30");
    setIsReminderDialogOpen(true);
  };

  const handleDownload = async (doc: ComplianceDocument) => {
    if (doc.file_path) {
      try {
        const { data, error } = await supabase.storage
          .from('compliance-documents')
          .download(doc.file_path);
        
        if (error) throw error;
        
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_path.split('/').pop() || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Downloaded ${doc.document_type}`);
      } catch (err) {
        console.error('Receipt error:', err);
        toast.error('Failed to download document');
      }
    } else {
      toast.info('No file attached to this document');
    }
  };

  const uploadFile = async (file: File, docId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${docId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('compliance-documents')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }
    
    return fileName;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRenewalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setRenewalFile(file);
    }
  };

  const handleAddDocument = async () => {
    setIsUploading(true);
    try {
      const doc = await addDocument({
        vehicle_name: newDocument.entityName,
        document_type: newDocument.documentType,
        document_name: `${newDocument.documentType} - ${newDocument.entityName}`,
        document_number: newDocument.documentNumber,
        issue_date: newDocument.issueDate ? new Date(newDocument.issueDate).toISOString() : null,
        expiry_date: new Date(newDocument.expiryDate).toISOString() });

      if (selectedFile && doc) {
        const filePath = await uploadFile(selectedFile, doc.id);
        if (filePath) {
          await updateDocument(doc.id, { file_path: filePath });
        }
      }

      setIsAddDialogOpen(false);
      setNewDocument({
        entityType: "vehicle",
        entityName: "",
        documentType: "",
        documentNumber: "",
        issueDate: "",
        expiryDate: "" });
      setIsCustomDocType(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('Error adding document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRenewalSubmit = async () => {
    if (selectedDocument) {
      setIsUploading(true);
      try {
        let filePath = selectedDocument.file_path;
        
        if (renewalFile) {
          filePath = await uploadFile(renewalFile, selectedDocument.id);
        }

        await updateDocument(selectedDocument.id, {
          expiry_date: addDays(new Date(), 365).toISOString(),
          issue_date: new Date().toISOString(),
          file_path: filePath });
        
        toast.success('Document renewed successfully');
        setIsRenewalDialogOpen(false);
        setSelectedDocument(null);
        setRenewalFile(null);
      } catch (err) {
        console.error('Renewal error:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleReminderSubmit = async () => {
    if (selectedDocument) {
      try {
        await setReminderDays(selectedDocument.id, parseInt(reminderDaysValue));
        setIsReminderDialogOpen(false);
        setSelectedDocument(null);
      } catch (err) {
        // Error handled by hook
      }
    }
  };

  const handleSendReminders = async () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }
    try {
      await sendReminders('compliance', recipientEmail, [Number(reminderDaysBefore)]);
      setIsSendRemindersDialogOpen(false);
      setRecipientEmail("");
    } catch (err) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-card/50 border-border/50">
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
      {/* Top-right Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsSendRemindersDialogOpen(true)} disabled={isSending}>
          <Mail className="h-4 w-4 mr-2" />
          Send Reminders
        </Button>
        <Button variant="gradient" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Valid</p>
              <p className="text-2xl font-bold text-success">{stats.valid}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold text-warning">{stats.expiring}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Compliance Rate</p>
              <p className="text-2xl font-bold">{stats.complianceRate}%</p>
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
                  {stats.expired} document(s) have expired
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
                Compliance Documents ({filteredDocuments.length})
              </CardTitle>
              <CardDescription className="mt-1">Vehicle and driver documents — expiry dates, renewal status, and regulatory categories.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData}>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[170px] bg-card/50 border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                  {(docTypeFilter !== "all" || issueFrom || issueTo || expiryFrom || expiryTo) && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {[docTypeFilter !== "all", !!(issueFrom || issueTo), !!(expiryFrom || expiryTo)].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-4 max-h-[70vh] overflow-y-auto">
                <Label className="text-sm font-semibold">Show Documents</Label>

                {/* Document Type */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cmp-flt-type"
                      checked={draftDocTypeEnabled}
                      onCheckedChange={(c) => setDraftDocTypeEnabled(c === true)}
                    />
                    <Label htmlFor="cmp-flt-type" className="text-xs cursor-pointer">Document Type</Label>
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
                      {documentTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
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
                      onCheckedChange={(c) => setDraftEnableIssue(c === true)}
                    />
                    <Label htmlFor="cmp-flt-issue" className="text-xs cursor-pointer">Issue Date</Label>
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
                            !draftIssueFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {draftIssueFrom ? format(draftIssueFrom, "MMM d") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                            !draftIssueTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {draftIssueTo ? format(draftIssueTo, "MMM d") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                      onCheckedChange={(c) => setDraftEnableExpiry(c === true)}
                    />
                    <Label htmlFor="cmp-flt-expiry" className="text-xs cursor-pointer">Expiry Date</Label>
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
                            !draftExpiryFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {draftExpiryFrom ? format(draftExpiryFrom, "MMM d") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                            !draftExpiryTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {draftExpiryTo ? format(draftExpiryTo, "MMM d") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                      setDocTypeFilter("all");
                      setIssueFrom(undefined);
                      setIssueTo(undefined);
                      setExpiryFrom(undefined);
                      setExpiryTo(undefined);
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Entity</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Document Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No documents found. Add your first compliance document.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => {
                  const daysLeft = getDaysUntilExpiry(doc.expiry_date);
                  return (
                    <TableRow key={doc.id} className="border-border/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.vehicle_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">Vehicle</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{doc.document_type}</TableCell>
                      <TableCell className="font-mono text-sm">{doc.document_number || '—'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[doc.status] || statusColors.valid}>{doc.status}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(doc.expiry_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-medium",
                            daysLeft < 0
                              ? "text-destructive"
                              : daysLeft <= 30
                              ? "text-warning"
                              : "text-success"
                          )}
                        >
                          {daysLeft < 0
                            ? `${Math.abs(daysLeft)} days overdue`
                            : `${daysLeft} days`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
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
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Document Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                onChange={(e) => setNewDocument({ ...newDocument, entityName: e.target.value })}
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
                const isCustom =
                  isCustomDocType ||
                  (!!newDocument.documentType && !presetTypes.includes(newDocument.documentType));
                return (
                  <>
                    <Select
                      value={isCustom ? "__custom__" : newDocument.documentType}
                      onValueChange={(v) => {
                        if (v === "__custom__") {
                          setIsCustomDocType(true);
                          setNewDocument({ ...newDocument, documentType: "" });
                        } else {
                          setIsCustomDocType(false);
                          setNewDocument({ ...newDocument, documentType: v });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {presetTypes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
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
                          onChange={(e) =>
                            setNewDocument({ ...newDocument, documentType: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="space-y-2">
              <Label>Document Number</Label>
              <Input 
                placeholder="Enter document number"
                value={newDocument.documentNumber}
                onChange={(e) => setNewDocument({ ...newDocument, documentNumber: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input 
                  type="date"
                  value={newDocument.issueDate}
                  onChange={(e) => setNewDocument({ ...newDocument, issueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input 
                  type="date"
                  value={newDocument.expiryDate}
                  onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload Document (Optional)</Label>
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
                {selectedFile ? (
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
                ) : (
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
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setSelectedFile(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleAddDocument}
              disabled={!newDocument.entityName || !newDocument.documentType || !newDocument.expiryDate || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Add Document'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              {selectedDocument?.document_type} for {selectedDocument?.vehicle_name}
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Entity Name</Label>
                  <p className="font-medium">{selectedDocument.vehicle_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Document Type</Label>
                  <p className="font-medium">{selectedDocument.document_type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Document Number</Label>
                  <p className="font-medium">{selectedDocument.document_number || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <Badge className={statusColors[selectedDocument.status]}>{selectedDocument.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Issue Date</Label>
                  <p className="font-medium">
                    {selectedDocument.issue_date 
                      ? format(new Date(selectedDocument.issue_date), "MMM dd, yyyy")
                      : '—'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Expiry Date</Label>
                  <p className="font-medium">{format(new Date(selectedDocument.expiry_date), "MMM dd, yyyy")}</p>
                </div>
              </div>
              {selectedDocument.file_path && (
                <Button variant="outline" className="w-full" onClick={() => handleDownload(selectedDocument)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Renewal Dialog */}
      <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Renew Document</DialogTitle>
            <DialogDescription>
              Upload a renewed {selectedDocument?.document_type}
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
              {renewalFile ? (
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
              ) : (
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
            <Button variant="outline" onClick={() => {
              setIsRenewalDialogOpen(false);
              setRenewalFile(null);
            }}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleRenewalSubmit} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Renew Document'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
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
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remind me before</Label>
              <Select value={reminderDaysValue} onValueChange={setReminderDaysValue}>
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
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleReminderSubmit}>
              Save Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminders Dialog */}
      <Dialog open={isSendRemindersDialogOpen} onOpenChange={setIsSendRemindersDialogOpen}>
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
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remind me before</Label>
              <Select value={reminderDaysBefore} onValueChange={setReminderDaysBefore}>
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
                <li>{stats.expired} expired document(s)</li>
                <li>{stats.expiring} document(s) expiring soon</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendRemindersDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSendReminders} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reminders'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


