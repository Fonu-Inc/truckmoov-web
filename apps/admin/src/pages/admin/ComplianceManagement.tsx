import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import {Download, Shield, FileText, AlertTriangle, CheckCircle, Clock, Calendar, Truck, User, Upload, Search, MoreHorizontal, Eye, Bell, Plus, Mail, Loader2, File, X} from "lucide-react";
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

export default function ComplianceManagement() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  
  const { documents, isLoading, addDocument, updateDocument, deleteDocument, renewDocument, setReminderDays, getStats } = useComplianceDocuments(tenantId);
  const { sendReminders, isSending } = useFleetReminders(tenantId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isSendRemindersDialogOpen, setIsSendRemindersDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ComplianceDocument | null>(null);
  const [reminderDaysValue, setReminderDaysValue] = useState("30");
  const [recipientEmail, setRecipientEmail] = useState("");
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

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      (doc.vehicle_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.document_number?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = getStats();

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
      await sendReminders('compliance', recipientEmail);
      setIsSendRemindersDialogOpen(false);
      setRecipientEmail("");
    } catch (err) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Compliance & Documents"
        subtitle="Track licenses, permits, and regulatory compliance"
      >
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Compliance & Documents"
      subtitle="Track licenses, permits, and regulatory compliance"
    >
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-3 w-full sm:max-w-2xl">
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
              <SelectTrigger className="w-[170px] bg-card/50 border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSendRemindersDialogOpen(true)} disabled={isSending}>
              <Mail className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
            <Button variant="gradient" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>
        </div>

        {/* Urgent Alerts */}
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Compliance Documents ({filteredDocuments.length})
            </CardTitle>
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
      </div>

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
              <Select
                value={newDocument.documentType}
                onValueChange={(v) => setNewDocument({ ...newDocument, documentType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vehicle License">Vehicle License</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Roadworthiness Certificate">Roadworthiness Certificate</SelectItem>
                  <SelectItem value="Hackney Permit">Hackney Permit</SelectItem>
                  <SelectItem value="Driver's License">Driver's License</SelectItem>
                  <SelectItem value="Medical Certificate">Medical Certificate</SelectItem>
                </SelectContent>
              </Select>
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
                  <p className="font-medium font-mono">{selectedDocument.document_number || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="mt-1">
                    <Badge className={statusColors[selectedDocument.status]}>
                      {selectedDocument.status}
                    </Badge>
                  </div>
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
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {selectedDocument.file_path ? (
                  <>
                    <FileText className="h-12 w-12 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium">Document attached</p>
                    <p className="text-xs text-muted-foreground mb-2">{selectedDocument.file_path.split('/').pop()}</p>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(selectedDocument)}>
                      <Download className="h-4 w-4 mr-2" />
                      Receipt Document
                    </Button>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No file attached</p>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Renewal Dialog */}
      <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Renewal</DialogTitle>
            <DialogDescription>
              Upload a renewed {selectedDocument?.document_type} for {selectedDocument?.vehicle_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Upload Renewed Document</Label>
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
                      Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, or PNG up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This will extend the document validity by 1 year from today.
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
                  Uploading...
                </>
              ) : (
                'Submit Renewal'
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
              Get notified before {selectedDocument?.document_type} expires
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Remind me before expiry</Label>
              <Select value={reminderDaysValue} onValueChange={setReminderDaysValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days before</SelectItem>
                  <SelectItem value="14">14 days before</SelectItem>
                  <SelectItem value="30">30 days before</SelectItem>
                  <SelectItem value="60">60 days before</SelectItem>
                  <SelectItem value="90">90 days before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedDocument && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  Current expiry: <span className="font-medium text-foreground">{format(new Date(selectedDocument.expiry_date), "MMM dd, yyyy")}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Reminder date: <span className="font-medium text-foreground">
                    {format(addDays(new Date(selectedDocument.expiry_date), -parseInt(reminderDaysValue)), "MMM dd, yyyy")}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleReminderSubmit}>
              Set Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminders Dialog */}
      <Dialog open={isSendRemindersDialogOpen} onOpenChange={setIsSendRemindersDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Email Reminders</DialogTitle>
            <DialogDescription>
              Send reminder emails for expiring and expired documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                This will send reminders for all documents expiring within 30 days and expired documents.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendRemindersDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSendReminders} disabled={isSending || !recipientEmail}>
              {isSending ? "Sending..." : "Send Reminders"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}



