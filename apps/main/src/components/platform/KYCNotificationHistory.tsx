import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Search,
  RefreshCw,
  Loader2,
  Send,
  MailX,
  MailCheck
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationLog {
  id: string;
  tenant_id: string;
  tenant_email: string;
  tenant_name: string | null;
  document_name: string;
  document_type: string;
  notification_type: 'approved' | 'rejected';
  rejection_reason: string | null;
  email_subject: string | null;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  error_message: string | null;
  resend_message_id: string | null;
  sent_at: string;
  delivered_at: string | null;
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

export function KYCNotificationHistory() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kyc_notification_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      const real = (data || []) as NotificationLog[];
      const DEMO_LOGS: NotificationLog[] = [
        { id: "dn-1", tenant_id: "demo-t3", tenant_email: "compliance@nairobifleet.co.ke", tenant_name: "Nairobi Fleet Group", document_name: "Nairobi_Fleet_Cert_Incorp.pdf", document_type: "certificate_of_incorporation", notification_type: "approved", rejection_reason: null, email_subject: "Your KYC document has been approved", delivery_status: "delivered", error_message: null, resend_message_id: "msg_re_a8sk1", sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), delivered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 12).toISOString() },
        { id: "dn-2", tenant_id: "demo-t3", tenant_email: "compliance@nairobifleet.co.ke", tenant_name: "Nairobi Fleet Group", document_name: "Nairobi_Fleet_KRA_Compliance.pdf", document_type: "tax_clearance", notification_type: "approved", rejection_reason: null, email_subject: "Your KYC document has been approved", delivery_status: "delivered", error_message: null, resend_message_id: "msg_re_a8sk2", sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60).toISOString(), delivered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 70).toISOString() },
        { id: "dn-3", tenant_id: "demo-t2", tenant_email: "info@accraswift.com.gh", tenant_name: "Accra Swift Cargo", document_name: "Accra_Swift_Operating_Permit.pdf", document_type: "business_license", notification_type: "approved", rejection_reason: null, email_subject: "Your KYC document has been approved", delivery_status: "delivered", error_message: null, resend_message_id: "msg_re_b9k02", sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), delivered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12 + 1000 * 8).toISOString() },
        { id: "dn-4", tenant_id: "demo-t5", tenant_email: "kyc@jhbfreight.co.za", tenant_name: "Johannesburg Freight", document_name: "JHB_Freight_CIPC_doc.pdf", document_type: "certificate_of_incorporation", notification_type: "rejected", rejection_reason: "Document is illegible — please re-upload a clearer scan.", email_subject: "Action required: KYC document rejected", delivery_status: "delivered", error_message: null, resend_message_id: "msg_re_x12k4", sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), delivered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 14).toISOString() },
        { id: "dn-5", tenant_id: "demo-t5", tenant_email: "kyc@jhbfreight.co.za", tenant_name: "Johannesburg Freight", document_name: "JHB_Freight_TCC.pdf", document_type: "tax_clearance", notification_type: "rejected", rejection_reason: "Document expired before submission.", email_subject: "Action required: KYC document rejected", delivery_status: "delivered", error_message: null, resend_message_id: "msg_re_x12k5", sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60).toISOString(), delivered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 75).toISOString() },
        { id: "dn-6", tenant_id: "demo-t1", tenant_email: "compliance@lagosexpress.ng", tenant_name: "Lagos Express Logistics", document_name: "Lagos_Express_Cert_of_Incorporation.pdf", document_type: "certificate_of_incorporation", notification_type: "approved", rejection_reason: null, email_subject: "Your KYC document has been approved", delivery_status: "sent", error_message: null, resend_message_id: "msg_re_lex01", sent_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(), delivered_at: null },
        { id: "dn-7", tenant_id: "demo-t6", tenant_email: "admin@abujahaulage.ng", tenant_name: "Abuja Haulage Co.", document_name: "Abuja_Haulage_Permit.pdf", document_type: "business_license", notification_type: "approved", rejection_reason: null, email_subject: "Your KYC document has been approved", delivery_status: "pending", error_message: null, resend_message_id: null, sent_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(), delivered_at: null },
        { id: "dn-8", tenant_id: "demo-t4", tenant_email: "ops@capetowntruck.co.za", tenant_name: "Cape Town Trucking", document_name: "CTT_VAT_Reg.pdf", document_type: "vat_certificate", notification_type: "rejected", rejection_reason: "Wrong document type uploaded — please attach VAT certificate.", email_subject: "Action required: KYC document rejected", delivery_status: "bounced", error_message: "550 5.1.1 Mailbox does not exist", resend_message_id: "msg_re_ctt09", sent_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), delivered_at: null },
        { id: "dn-9", tenant_id: "demo-t6", tenant_email: "admin@abujahaulage.ng", tenant_name: "Abuja Haulage Co.", document_name: "Abuja_Haulage_Insurance_2025.pdf", document_type: "insurance_certificate", notification_type: "approved", rejection_reason: null, email_subject: "Your KYC document has been approved", delivery_status: "failed", error_message: "Resend API timeout", resend_message_id: null, sent_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), delivered_at: null },
      ];
      setLogs(real.length > 0 ? real : DEMO_LOGS);
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      toast.error('Failed to load notification history');
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <MailCheck className="w-3 h-3 mr-1" /> Sent
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <MailX className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      case 'bounced':
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" /> Bounced
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground">
            {status}
          </Badge>
        );
    }
  };

  const getNotificationTypeBadge = (type: string) => {
    return type === 'approved' ? (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
      </Badge>
    ) : (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </Badge>
    );
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.tenant_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      log.document_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.delivery_status === statusFilter;
    const matchesType = typeFilter === 'all' || log.notification_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.delivery_status === 'sent' || l.delivery_status === 'delivered').length,
    failed: logs.filter(l => l.delivery_status === 'failed' || l.delivery_status === 'bounced').length,
    pending: logs.filter(l => l.delivery_status === 'pending').length,
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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <MailCheck className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
              </div>
              <div className="p-3 rounded-full bg-red-500/10">
                <MailX className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>Track all KYC email notifications sent to tenants</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, company, or document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Delivery Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Notification Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notification logs found</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Recipient</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Delivery Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-border/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.tenant_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{log.tenant_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{log.document_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {DOCUMENT_TYPE_LABELS[log.document_type] || log.document_type}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getNotificationTypeBadge(log.notification_type)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getDeliveryStatusBadge(log.delivery_status)}
                          {log.error_message && (
                            <p className="text-xs text-red-400 max-w-[200px] truncate" title={log.error_message}>
                              {log.error_message}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(log.sent_at), 'MMM d, yyyy')}</p>
                          <p className="text-muted-foreground text-xs">
                            {format(new Date(log.sent_at), 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
