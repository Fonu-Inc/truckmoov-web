import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  FileText,
  Building2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  MessageSquare,
  Download,
  ExternalLink,
  ChevronRight,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { KYCNotificationHistory } from './KYCNotificationHistory';

interface BusinessInfo {
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
}

interface KYCDocument {
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
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  'certificate_of_incorporation': 'Certificate of Incorporation',
  'memorandum_of_association': 'Memorandum of Association',
  'tax_clearance': 'Tax Clearance Certificate',
  'vat_certificate': 'VAT Registration Certificate',
  'business_license': 'Business License/Permit',
  'insurance_certificate': 'Insurance Certificate',
  'proof_of_address': 'Proof of Business Address',
  'director_id': 'Director ID/Passport',
  'other': 'Other Document',
};

export function KYCReviewWorkflow() {
  const [activeTab, setActiveTab] = useState('pending');
  const [businessInfoList, setBusinessInfoList] = useState<BusinessInfo[]>([]);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<BusinessInfo | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [submitting, setSubmitting] = useState(false);
  const [tenantDetailOpen, setTenantDetailOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [businessRes, docsRes] = await Promise.all([
        supabase.from('tenant_business_info').select('*').order('created_at', { ascending: false }),
        supabase.from('tenant_kyc_documents').select('*').order('created_at', { ascending: false }),
      ]);

      if (businessRes.error) throw businessRes.error;
      if (docsRes.error) throw docsRes.error;

      setBusinessInfoList((businessRes.data || []) as BusinessInfo[]);
      setDocuments((docsRes.data || []) as KYCDocument[]);
    } catch (error) {
      console.error('Error fetching KYC data:', error);
      toast.error('Failed to load KYC data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Under Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const handleViewDocument = async (doc: KYCDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast.error('Failed to open document');
    }
  };

  const handleOpenReview = (doc: KYCDocument, action: 'approve' | 'reject') => {
    setSelectedDocument(doc);
    setReviewAction(action);
    setReviewComment('');
    setReviewDialogOpen(true);
  };

  const sendKYCNotification = async (
    tenantEmail: string,
    tenantName: string,
    tenantId: string,
    documentId: string,
    documentName: string,
    documentType: string,
    status: 'approved' | 'rejected',
    feedback?: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke('kyc-notification', {
        body: {
          tenantEmail,
          tenantName,
          tenantId,
          documentId,
          documentName,
          documentType,
          status,
          feedback,
        },
      });

      if (error) {
        console.error('Failed to send notification email:', error);
      } else {
        console.log('KYC notification email sent successfully');
      }
    } catch (err) {
      console.error('Error sending KYC notification:', err);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedDocument) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('tenant_kyc_documents')
        .update({
          status: reviewAction === 'approve' ? 'approved' : 'rejected',
          rejection_reason: reviewAction === 'reject' ? reviewComment : null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedDocument.id);

      if (error) throw error;

      // Get tenant info for email notification
      const tenant = businessInfoList.find(b => b.tenant_id === selectedDocument.tenant_id);
      
      // Send email notification
      if (tenant?.email) {
        await sendKYCNotification(
          tenant.email,
          tenant.company_name,
          selectedDocument.tenant_id,
          selectedDocument.id,
          selectedDocument.document_name,
          DOCUMENT_TYPE_LABELS[selectedDocument.document_type] || selectedDocument.document_type,
          reviewAction === 'approve' ? 'approved' : 'rejected',
          reviewAction === 'reject' ? reviewComment : undefined
        );
        toast.success(`Document ${reviewAction === 'approve' ? 'approved' : 'rejected'} and notification sent`);
      } else {
        toast.success(`Document ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
        if (!tenant?.email) {
          toast.warning('No email configured for tenant - notification not sent');
        }
      }

      // Check if all documents for this tenant are approved
      const tenantDocs = documents.filter(d => d.tenant_id === selectedDocument.tenant_id);
      const otherDocs = tenantDocs.filter(d => d.id !== selectedDocument.id);
      const allApproved = otherDocs.every(d => d.status === 'approved') && reviewAction === 'approve';

      if (allApproved && otherDocs.length > 0) {
        // Update business verification status
        await supabase
          .from('tenant_business_info')
          .update({ 
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
          })
          .eq('tenant_id', selectedDocument.tenant_id);
      }

      setReviewDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTenantStatus = async (tenantId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tenant_business_info')
        .update({ 
          verification_status: status,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
        })
        .eq('tenant_id', tenantId);

      if (error) throw error;
      toast.success(`Tenant verification status updated to ${status}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const pendingDocuments = documents.filter(d => d.status === 'pending');
  const approvedDocuments = documents.filter(d => d.status === 'approved');
  const rejectedDocuments = documents.filter(d => d.status === 'rejected');
  
  const pendingTenants = businessInfoList.filter(b => b.verification_status === 'pending' || b.verification_status === 'under_review');
  const verifiedTenants = businessInfoList.filter(b => b.verification_status === 'verified');

  const filteredBusinessInfo = businessInfoList.filter(b => 
    b.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.tenant_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
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
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
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
              <div className="p-3 rounded-full bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-500" />
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Tenants ({businessInfoList.length})
            </TabsTrigger>
            <TabsTrigger value="all-docs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              All Documents
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Pending Documents Tab */}
        <TabsContent value="pending">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Documents Pending Review</CardTitle>
              <CardDescription>Review and approve or reject submitted KYC documents</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDocuments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No documents pending review</p>
                </div>
              ) : (
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
                              Tenant: {tenant?.company_name || doc.tenant_id} • 
                              Submitted: {format(new Date(doc.created_at), 'MMM d, yyyy')}
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
                            className="text-green-500 border-green-500/30 hover:bg-green-500/10"
                            onClick={() => handleOpenReview(doc, 'approve')}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => handleOpenReview(doc, 'reject')}
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
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search tenants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredBusinessInfo.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tenant registrations found</p>
                </div>
              ) : (
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
                      const pendingCount = tenantDocs.filter(d => d.status === 'pending').length;
                      const approvedCount = tenantDocs.filter(d => d.status === 'approved').length;
                      
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
                              <p>{tenant.registration_number || '-'}</p>
                              <p className="text-xs text-muted-foreground">{tenant.tax_id || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{tenantDocs.length} docs</span>
                              {pendingCount > 0 && (
                                <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                                  {pendingCount} pending
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(tenant.verification_status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(tenant.created_at), 'MMM d, yyyy')}
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
                              {tenant.verification_status !== 'verified' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-green-500"
                                  onClick={() => handleUpdateTenantStatus(tenant.tenant_id, 'verified')}
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
              <CardTitle>All KYC Documents</CardTitle>
              <CardDescription>Complete history of all submitted documents</CardDescription>
            </CardHeader>
            <CardContent>
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
                  {documents.map((doc) => {
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
                          {format(new Date(doc.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.reviewed_at ? format(new Date(doc.reviewed_at), 'MMM d, yyyy') : '-'}
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
                            {doc.status === 'pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-green-500"
                                  onClick={() => handleOpenReview(doc, 'approve')}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-red-500"
                                  onClick={() => handleOpenReview(doc, 'reject')}
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
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              {reviewAction === 'approve' ? 'Approve Document' : 'Reject Document'}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.document_name} - {DOCUMENT_TYPE_LABELS[selectedDocument?.document_type || ''] || selectedDocument?.document_type}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {reviewAction === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  placeholder="Please provide a reason for rejection..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                />
              </div>
            )}
            {reviewAction === 'approve' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Comments (Optional)</label>
                <Textarea
                  placeholder="Add any notes..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
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
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={submitting || (reviewAction === 'reject' && !reviewComment.trim())}
              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenant Detail Dialog */}
      <Dialog open={tenantDetailOpen} onOpenChange={setTenantDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              {selectedTenant?.company_name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {getStatusBadge(selectedTenant?.verification_status || 'pending')}
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6">
              {/* Business Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-medium">{selectedTenant.registration_number || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tax ID</p>
                  <p className="font-medium">{selectedTenant.tax_id || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Business Type</p>
                  <p className="font-medium">{selectedTenant.business_type || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium">{selectedTenant.industry || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {[selectedTenant.address_line1, selectedTenant.city, selectedTenant.state, selectedTenant.country]
                      .filter(Boolean).join(', ') || '-'}
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
                  {getTenantDocuments(selectedTenant.tenant_id).map((doc) => (
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
                            <p className="text-sm text-red-400 mt-1">
                              Reason: {doc.rejection_reason}
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
                        {doc.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-green-500"
                              onClick={() => {
                                setTenantDetailOpen(false);
                                handleOpenReview(doc, 'approve');
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500"
                              onClick={() => {
                                setTenantDetailOpen(false);
                                handleOpenReview(doc, 'reject');
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
                  {selectedTenant.verification_status !== 'verified' && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleUpdateTenantStatus(selectedTenant.tenant_id, 'verified');
                        setTenantDetailOpen(false);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Verify Tenant
                    </Button>
                  )}
                  {selectedTenant.verification_status !== 'rejected' && (
                    <Button 
                      variant="outline"
                      className="text-red-500 border-red-500/30"
                      onClick={() => {
                        handleUpdateTenantStatus(selectedTenant.tenant_id, 'rejected');
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
