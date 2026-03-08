import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Trash2,
  Eye,
  Download,
  Shield,
  FileCheck,
  Loader2
} from 'lucide-react';

interface BusinessInfo {
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
  website: string;
  year_established: number | null;
  number_of_employees: string;
  annual_revenue: string;
  verification_status: string;
}

interface KYCDocument {
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
}

const DOCUMENT_TYPES = [
  { value: 'certificate_of_incorporation', label: 'Certificate of Incorporation', required: true },
  { value: 'memorandum_of_association', label: 'Memorandum of Association', required: true },
  { value: 'tax_clearance', label: 'Tax Clearance Certificate', required: true },
  { value: 'vat_certificate', label: 'VAT Registration Certificate', required: false },
  { value: 'business_license', label: 'Business License/Permit', required: true },
  { value: 'insurance_certificate', label: 'Insurance Certificate', required: false },
  { value: 'proof_of_address', label: 'Proof of Business Address', required: true },
  { value: 'director_id', label: 'Director ID/Passport', required: true },
  { value: 'other', label: 'Other Document', required: false },
];

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'Limited Liability Company (LLC)',
  'Private Limited Company',
  'Public Limited Company',
  'Cooperative',
  'Non-Profit Organization',
];

const INDUSTRIES = [
  'Logistics & Transportation',
  'Freight & Cargo',
  'Supply Chain Management',
  'E-commerce Delivery',
  'Construction & Heavy Equipment',
  'Oil & Gas Transportation',
  'Food & Beverage Distribution',
  'Pharmaceutical Distribution',
  'Agriculture & Farming',
  'Mining & Extraction',
  'Other',
];

export function TenantKYCVerification({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState('business-info');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    tenant_id: tenantId,
    company_name: '',
    registration_number: '',
    tax_id: '',
    business_type: '',
    industry: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Nigeria',
    phone: '',
    email: '',
    website: '',
    year_established: null,
    number_of_employees: '',
    annual_revenue: '',
    verification_status: 'pending',
  });
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');

  useEffect(() => {
    fetchBusinessInfo();
    fetchDocuments();
  }, [tenantId]);

  const fetchBusinessInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_business_info')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setBusinessInfo(data as BusinessInfo);
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_kyc_documents')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as KYCDocument[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleSaveBusinessInfo = async () => {
    setSaving(true);
    try {
      const { error } = businessInfo.id
        ? await supabase
            .from('tenant_business_info')
            .update(businessInfo)
            .eq('id', businessInfo.id)
        : await supabase
            .from('tenant_business_info')
            .insert(businessInfo);

      if (error) throw error;
      toast.success('Business information saved successfully');
      fetchBusinessInfo();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save business information');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDocType) {
      toast.error('Please select a document type first');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/${selectedDocType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('tenant_kyc_documents')
        .insert({
          tenant_id: tenantId,
          document_type: selectedDocType,
          document_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
        });

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully');
      setSelectedDocType('');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: KYCDocument) => {
    try {
      await supabase.storage.from('kyc-documents').remove([doc.file_path]);
      
      const { error } = await supabase
        .from('tenant_kyc_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Under Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const calculateCompletionProgress = () => {
    const requiredDocs = DOCUMENT_TYPES.filter(d => d.required);
    const uploadedRequiredDocs = requiredDocs.filter(
      d => documents.some(doc => doc.document_type === d.value)
    );
    const docProgress = (uploadedRequiredDocs.length / requiredDocs.length) * 50;

    const requiredFields = ['company_name', 'registration_number', 'tax_id', 'business_type', 'address_line1', 'city', 'state', 'phone', 'email'];
    const filledFields = requiredFields.filter(
      field => businessInfo[field as keyof BusinessInfo]
    );
    const infoProgress = (filledFields.length / requiredFields.length) * 50;

    return Math.round(docProgress + infoProgress);
  };

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Business Verification & KYC</CardTitle>
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
              <span className="font-medium">{calculateCompletionProgress()}%</span>
            </div>
            <Progress value={calculateCompletionProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="business-info" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Business Info
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-info" className="space-y-6 mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Company Information</CardTitle>
              <CardDescription>Basic details about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={businessInfo.company_name}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, company_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registration Number *</Label>
                  <Input
                    id="registration_number"
                    value={businessInfo.registration_number || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, registration_number: e.target.value })}
                    placeholder="CAC registration number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_id">Tax Identification Number (TIN) *</Label>
                  <Input
                    id="tax_id"
                    value={businessInfo.tax_id || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, tax_id: e.target.value })}
                    placeholder="Enter TIN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type *</Label>
                  <Select
                    value={businessInfo.business_type || ''}
                    onValueChange={(value) => setBusinessInfo({ ...businessInfo, business_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={businessInfo.industry || ''}
                    onValueChange={(value) => setBusinessInfo({ ...businessInfo, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year_established">Year Established</Label>
                  <Input
                    id="year_established"
                    type="number"
                    value={businessInfo.year_established || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, year_established: parseInt(e.target.value) || null })}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address_line1">Address Line 1 *</Label>
                  <Input
                    id="address_line1"
                    value={businessInfo.address_line1 || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address_line1: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={businessInfo.address_line2 || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address_line2: e.target.value })}
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={businessInfo.city || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={businessInfo.state || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={businessInfo.postal_code || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, postal_code: e.target.value })}
                    placeholder="Postal code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={businessInfo.country || 'Nigeria'}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, country: e.target.value })}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={businessInfo.phone || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                    placeholder="+234..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessInfo.email || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={businessInfo.website || ''}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                    placeholder="https://www.company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number_of_employees">Number of Employees</Label>
                  <Select
                    value={businessInfo.number_of_employees || ''}
                    onValueChange={(value) => setBusinessInfo({ ...businessInfo, number_of_employees: value })}
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

          <div className="flex justify-end">
            <Button onClick={handleSaveBusinessInfo} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Business Information
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6 mt-6">
          {/* Upload Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Upload Documents</CardTitle>
              <CardDescription>Upload required verification documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} {type.required && '*'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={!selectedDocType || uploading}
                      className="flex-1"
                    />
                    {uploading && <Loader2 className="w-5 h-5 animate-spin self-center" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Required Documents Checklist */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Required Documents Checklist</CardTitle>
              <CardDescription>Documents needed for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DOCUMENT_TYPES.filter(d => d.required).map((docType) => {
                  const uploaded = documents.find(d => d.document_type === docType.value);
                  return (
                    <div 
                      key={docType.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        uploaded ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/30 border-border'
                      }`}
                    >
                      {uploaded ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={uploaded ? 'text-foreground' : 'text-muted-foreground'}>
                        {docType.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Documents */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Uploaded Documents</CardTitle>
              <CardDescription>All uploaded verification documents</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
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
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(doc.status)}
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteDocument(doc)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
