import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SendInvoiceEmailDialog } from '@/components/invoices/SendInvoiceEmailDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useWaybillInvoice, type WaybillRecord, type WaybillInvoice, type PricingRule, type InvoiceShare } from '@/hooks/useWaybillInvoice';
import { useWaybillRealtimeEvents } from '@/hooks/useWaybillRealtimeEvents';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  FileText, Upload, Scan, Receipt, Plus, Eye, Send, Settings2, Loader2,
  CheckCircle2, XCircle, Clock, AlertTriangle, ImageIcon, Truck, MapPin,
  Calendar, Package, User, DollarSign, ArrowRight, RefreshCw, Pencil, Trash2,
  ToggleLeft, ToggleRight, Download, Mail, MessageSquare, Save,
} from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  received: { label: 'Received', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
  processing: { label: 'Processing', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Loader2 },
  extracted: { label: 'Extracted', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  extraction_failed: { label: 'Failed', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  needs_review: { label: 'Needs Review', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertTriangle },
  approved: { label: 'Approved', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: CheckCircle2 },
  invoice_generated: { label: 'Invoiced', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Receipt },
  invoiced: { label: 'Invoiced', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Receipt },
  rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground border-muted', icon: FileText },
};

const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground border-muted' },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  approved: { label: 'Approved', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  sent: { label: 'Sent', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  paid: { label: 'Paid', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  partially_paid: { label: 'Partially Paid', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  overdue: { label: 'Overdue', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground border-muted' },
  disputed: { label: 'Disputed', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function WaybillInvoices() {
  const {
    waybills, invoices, pricingRules, invoiceConfig,
    isLoading, fetchWaybills, fetchInvoices, fetchPricingRules,
    fetchInvoiceConfig, createWaybill, extractWaybill, updateWaybillFields,
    generateInvoice, updateInvoice, addPricingRule, updatePricingRule,
    deletePricingRule, updateInvoiceConfig, recordInvoiceShare, generateInvoicePDF, getInvoicePdfUrl,
  } = useWaybillInvoice();
  const { format: formatAmount } = useCurrency();

  const [activeTab, setActiveTab] = useState('waybills');
  const [selectedWaybill, setSelectedWaybill] = useState<WaybillRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<WaybillInvoice | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section 5 — Realtime WebSocket events
  useWaybillRealtimeEvents({
    onWaybillChange: fetchWaybills,
    onInvoiceChange: fetchInvoices,
    showToasts: true,
  });

  useEffect(() => {
    fetchWaybills();
    fetchInvoices();
    fetchPricingRules();
    fetchInvoiceConfig();
  }, [fetchWaybills, fetchInvoices, fetchPricingRules, fetchInvoiceConfig]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for AI processing
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const waybill = await createWaybill({
        source_type: 'upload',
        image_url: URL.createObjectURL(file),
      });
      if (waybill) {
        setExtracting(waybill.id);
        await extractWaybill(waybill.id, undefined, base64);
        setExtracting(null);
        setShowUploadDialog(false);
      }
    };
    reader.readAsDataURL(file);
  }, [createWaybill, extractWaybill]);

  const handleExtract = useCallback(async (waybill: WaybillRecord) => {
    setExtracting(waybill.id);
    await extractWaybill(waybill.id, waybill.image_url || undefined);
    setExtracting(null);
  }, [extractWaybill]);

  const handleGenerateInvoice = useCallback(async (waybillId: string) => {
    setGenerating(waybillId);
    const invoice = await generateInvoice(waybillId);
    if (invoice) {
      // Auto-generate PDF after invoice creation
      await generateInvoicePDF(invoice.id);
    }
    setGenerating(null);
  }, [generateInvoice, generateInvoicePDF]);

  const stats = {
    totalWaybills: waybills.length,
    pendingExtraction: waybills.filter(w => w.status === 'received').length,
    extracted: waybills.filter(w => w.status === 'extracted').length,
    invoiced: waybills.filter(w => w.status === 'invoice_generated').length,
    totalInvoiceValue: invoices.reduce((sum, inv) => sum + (inv.total_ngn || 0), 0),
    paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
    pendingInvoices: invoices.filter(inv => ['draft', 'sent', 'pending_review', 'approved'].includes(inv.status)).length,
  };

  return (
    <DashboardLayout title="Waybill & Invoicing">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Waybill & Invoicing</h1>
            <p className="text-muted-foreground">Convert waybills to invoices with AI-powered extraction</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { fetchWaybills(); fetchInvoices(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />Refresh
            </Button>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button><Upload className="h-4 w-4 mr-2" />Upload Waybill</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Waybill Image</DialogTitle>
                  <DialogDescription>Upload a photo of a waybill. AI will extract the key fields automatically.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">Click to upload waybill photo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total Waybills', value: stats.totalWaybills, icon: FileText },
            { label: 'Pending', value: stats.pendingExtraction, icon: Clock },
            { label: 'Extracted', value: stats.extracted, icon: CheckCircle2 },
            { label: 'Invoiced', value: stats.invoiced, icon: Receipt },
            { label: 'Invoice Value', value: formatAmount(stats.totalInvoiceValue), icon: DollarSign },
            { label: 'Paid', value: stats.paidInvoices, icon: CheckCircle2 },
            { label: 'Pending Payment', value: stats.pendingInvoices, icon: AlertTriangle },
          ].map((stat, i) => (
            <Card key={i} className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <stat.icon className="h-3.5 w-3.5" />
                {stat.label}
              </div>
              <div className="text-lg font-bold">{stat.value}</div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="waybills"><FileText className="h-4 w-4 mr-1.5" />Waybills</TabsTrigger>
            <TabsTrigger value="invoices"><Receipt className="h-4 w-4 mr-1.5" />Invoices</TabsTrigger>
            <TabsTrigger value="pricing"><DollarSign className="h-4 w-4 mr-1.5" />Pricing Rules</TabsTrigger>
            <TabsTrigger value="settings"><Settings2 className="h-4 w-4 mr-1.5" />Settings</TabsTrigger>
          </TabsList>

          {/* Waybills Tab */}
          <TabsContent value="waybills" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Waybill #</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waybills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">No waybills yet</p>
                          <p className="text-sm">Upload a waybill image or receive one via WhatsApp</p>
                        </TableCell>
                      </TableRow>
                    ) : waybills.map((wb) => {
                      const sc = statusConfig[wb.status] || statusConfig.received;
                      return (
                        <TableRow key={wb.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedWaybill(wb)}>
                          <TableCell>
                            <Badge variant="outline" className={sc.color}>
                              <sc.icon className="h-3 w-3 mr-1" />{sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {wb.image_url || wb.image_storage_path ? (
                                <div className="h-8 w-8 rounded border overflow-hidden bg-muted flex-shrink-0">
                                  <WaybillThumbnail waybill={wb} />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                              )}
                              <span className="capitalize">{wb.source_type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{wb.waybill_number || '—'}</TableCell>
                          <TableCell>{wb.destination || '—'}</TableCell>
                          <TableCell>{wb.vehicle_number || '—'}</TableCell>
                          <TableCell>{wb.customer_name || '—'}</TableCell>
                          <TableCell>{wb.calculated_price_ngn ? formatAmount(wb.calculated_price_ngn) : '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(wb.created_at), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1 justify-end">
                              {['received', 'extraction_failed'].includes(wb.status) && (
                                <Button size="sm" variant="outline" disabled={extracting === wb.id} onClick={() => handleExtract(wb)}>
                                  {extracting === wb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scan className="h-3.5 w-3.5" />}
                                </Button>
                              )}
                              {['extracted', 'needs_review', 'approved'].includes(wb.status) && (
                                <Button size="sm" disabled={generating === wb.id} onClick={() => handleGenerateInvoice(wb.id)}>
                                  {generating === wb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Receipt className="h-3.5 w-3.5 mr-1" />}
                                  Invoice
                                </Button>
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

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">No invoices yet</p>
                          <p className="text-sm">Generate invoices from extracted waybills</p>
                        </TableCell>
                      </TableRow>
                    ) : invoices.map((inv) => {
                      const ic = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
                      return (
                        <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedInvoice(inv)}>
                          <TableCell className="font-mono font-medium">{inv.invoice_number}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={ic.color}>{ic.label}</Badge>
                          </TableCell>
                          <TableCell>{inv.customer_name}</TableCell>
                          <TableCell className="text-sm">
                            {inv.origin && inv.destination ? (
                              <span className="flex items-center gap-1">
                                {inv.origin} <ArrowRight className="h-3 w-3" /> {inv.destination}
                              </span>
                            ) : inv.destination || '—'}
                          </TableCell>
                          <TableCell>{inv.vehicle_number || '—'}</TableCell>
                          <TableCell className="text-right font-medium">{formatAmount(inv.total_ngn)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : '—'}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(inv)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {inv.status === 'draft' && (
                                <Button size="sm" variant="outline" onClick={() => updateInvoice(inv.id, { status: 'approved' } as Partial<WaybillInvoice>)}>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve
                                </Button>
                              )}
                              {['approved', 'sent'].includes(inv.status) && (
                                <Button size="sm" onClick={() => toast.info('Share functionality coming soon')}>
                                  <Send className="h-3.5 w-3.5 mr-1" />Share
                                </Button>
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

          {/* Pricing Rules Tab */}
          <TabsContent value="pricing" className="mt-4">
            <PricingRulesPanel
              rules={pricingRules}
              onAdd={addPricingRule}
              onUpdate={updatePricingRule}
              onDelete={deletePricingRule}
              formatAmount={formatAmount}
              showDialog={showPricingDialog}
              setShowDialog={setShowPricingDialog}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <InvoiceSettingsPanel config={invoiceConfig} onSave={updateInvoiceConfig} />
          </TabsContent>
        </Tabs>

        {/* Waybill Detail Sheet */}
        <Sheet open={!!selectedWaybill} onOpenChange={(open) => !open && setSelectedWaybill(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedWaybill && (
              <WaybillDetailView
                waybill={selectedWaybill}
                onExtract={() => handleExtract(selectedWaybill)}
                onGenerateInvoice={() => handleGenerateInvoice(selectedWaybill.id)}
                onApprove={async () => {
                  const updated = await updateWaybillFields(selectedWaybill.id, { status: 'approved' });
                  if (updated) setSelectedWaybill(updated);
                }}
                onUpdateFields={async (updates) => {
                  const updated = await updateWaybillFields(selectedWaybill.id, updates);
                  if (updated) setSelectedWaybill(updated);
                }}
                extracting={extracting === selectedWaybill.id}
                generating={generating === selectedWaybill.id}
                formatAmount={formatAmount}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Invoice Detail Sheet */}
        <Sheet open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedInvoice && (
              <InvoiceDetailView
                invoice={selectedInvoice}
                config={invoiceConfig}
                formatAmount={formatAmount}
                onUpdate={(updates) => updateInvoice(selectedInvoice.id, updates)}
                onRecordShare={(channel, recipient) => recordInvoiceShare(selectedInvoice.id, channel, recipient)}
                onGeneratePDF={() => generateInvoicePDF(selectedInvoice.id)}
                onGetPdfUrl={(path) => getInvoicePdfUrl(path)}
                onSendEmail={async (invoiceId, data) => {
                  try {
                    const { data: result, error } = await supabase.functions.invoke('send-invoice-email', {
                      body: { invoiceId, ...data },
                    });
                    if (error) throw error;
                    if (result?.success) {
                      toast.success(result.message || 'Invoice sent!');
                      fetchInvoices();
                      return true;
                    } else {
                      toast.error(result?.error || 'Failed to send invoice');
                      return false;
                    }
                  } catch (err) {
                    console.error('Send invoice email error:', err);
                    toast.error('Failed to send invoice email');
                    return false;
                  }
                }}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────

function WaybillThumbnail({ waybill }: { waybill: WaybillRecord }) {
  const [url, setUrl] = useState<string | null>(waybill.image_url || null);
  useEffect(() => {
    if (!waybill.image_url && waybill.image_storage_path) {
      supabase.storage
        .from('waybill-images')
        .createSignedUrl(waybill.image_storage_path, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setUrl(data.signedUrl);
        });
    }
  }, [waybill.image_url, waybill.image_storage_path]);
  if (!url) return <ImageIcon className="h-4 w-4 text-muted-foreground/50 m-auto" />;
  return <img src={url} alt="Waybill" className="h-full w-full object-cover" />;
}

function WaybillDetailView({ waybill, onExtract, onGenerateInvoice, onApprove, onUpdateFields, extracting, generating, formatAmount }: {
  waybill: WaybillRecord;
  onExtract: () => void;
  onGenerateInvoice: () => void;
  onApprove: () => void;
  onUpdateFields: (updates: Record<string, unknown>) => Promise<void>;
  extracting: boolean;
  generating: boolean;
  formatAmount: (n: number) => string;
}) {
  const sc = statusConfig[waybill.status] || statusConfig.received;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    origin: waybill.origin || '',
    destination: waybill.destination || '',
    vehicle_number: waybill.vehicle_number || '',
    waybill_number: waybill.waybill_number || '',
    customer_name: waybill.customer_name || '',
    waybill_date: waybill.waybill_date || '',
    quantity: waybill.quantity?.toString() || '',
    quantity_unit: waybill.quantity_unit || '',
    weight_kg: waybill.weight_kg?.toString() || '',
    driver_name: waybill.driver_name || '',
  });

  const handleSaveFields = async () => {
    setSaving(true);
    await onUpdateFields({
      ...editForm,
      quantity: editForm.quantity ? Number(editForm.quantity) : null,
      weight_kg: editForm.weight_kg ? Number(editForm.weight_kg) : null,
    });
    setSaving(false);
    setEditing(false);
  };

  // Get image preview URL from storage if available
  const [previewUrl, setPreviewUrl] = useState<string | null>(waybill.image_url);
  useEffect(() => {
    if (waybill.image_storage_path && !waybill.image_url) {
      supabase.storage
        .from('waybill-images')
        .createSignedUrl(waybill.image_storage_path, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setPreviewUrl(data.signedUrl);
        });
    }
  }, [waybill.image_storage_path, waybill.image_url]);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Waybill {waybill.waybill_number || waybill.id.slice(0, 8)}
        </SheetTitle>
        <SheetDescription>
          <Badge variant="outline" className={sc.color}><sc.icon className="h-3 w-3 mr-1" />{sc.label}</Badge>
          {waybill.source_type === 'whatsapp' && (
            <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-600 border-green-500/20">
              <MessageSquare className="h-3 w-3 mr-1" />WhatsApp
            </Badge>
          )}
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-6 mt-6">
        {previewUrl && (
          <div className="rounded-lg border overflow-hidden">
            <img src={previewUrl} alt="Waybill" className="w-full object-contain max-h-64" />
          </div>
        )}

        {/* Editable Fields */}
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Origin</Label><Input value={editForm.origin} onChange={(e) => setEditForm(f => ({ ...f, origin: e.target.value }))} /></div>
              <div><Label className="text-xs">Destination</Label><Input value={editForm.destination} onChange={(e) => setEditForm(f => ({ ...f, destination: e.target.value }))} /></div>
              <div><Label className="text-xs">Vehicle #</Label><Input value={editForm.vehicle_number} onChange={(e) => setEditForm(f => ({ ...f, vehicle_number: e.target.value }))} /></div>
              <div><Label className="text-xs">Waybill #</Label><Input value={editForm.waybill_number} onChange={(e) => setEditForm(f => ({ ...f, waybill_number: e.target.value }))} /></div>
              <div><Label className="text-xs">Customer</Label><Input value={editForm.customer_name} onChange={(e) => setEditForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Date</Label><Input type="date" value={editForm.waybill_date} onChange={(e) => setEditForm(f => ({ ...f, waybill_date: e.target.value }))} /></div>
              <div><Label className="text-xs">Quantity</Label><Input type="number" value={editForm.quantity} onChange={(e) => setEditForm(f => ({ ...f, quantity: e.target.value }))} /></div>
              <div><Label className="text-xs">Unit</Label><Input value={editForm.quantity_unit} onChange={(e) => setEditForm(f => ({ ...f, quantity_unit: e.target.value }))} /></div>
              <div><Label className="text-xs">Weight (kg)</Label><Input type="number" value={editForm.weight_kg} onChange={(e) => setEditForm(f => ({ ...f, weight_kg: e.target.value }))} /></div>
              <div><Label className="text-xs">Driver</Label><Input value={editForm.driver_name} onChange={(e) => setEditForm(f => ({ ...f, driver_name: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveFields} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: MapPin, label: 'Origin', value: waybill.origin, fieldKey: 'origin' },
                { icon: MapPin, label: 'Destination', value: waybill.destination, fieldKey: 'destination' },
                { icon: Truck, label: 'Vehicle', value: waybill.vehicle_number, fieldKey: 'vehicle_number' },
                { icon: FileText, label: 'Waybill #', value: waybill.waybill_number, fieldKey: 'waybill_number' },
                { icon: User, label: 'Customer', value: waybill.customer_name, fieldKey: 'customer_name' },
                { icon: Calendar, label: 'Date', value: waybill.waybill_date, fieldKey: 'waybill_date' },
                { icon: Package, label: 'Quantity', value: waybill.quantity ? `${waybill.quantity} ${waybill.quantity_unit || ''}` : null, fieldKey: 'quantity' },
                { icon: DollarSign, label: 'Price', value: waybill.calculated_price_ngn ? formatAmount(waybill.calculated_price_ngn) : null, fieldKey: null },
              ].map((field, i) => {
                const fieldConf = field.fieldKey && waybill.confidence_per_field
                  ? (waybill.confidence_per_field as Record<string, number>)[field.fieldKey]
                  : null;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <field.icon className="h-3 w-3" />{field.label}
                      {fieldConf != null && (
                        <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          fieldConf >= 0.8 ? 'bg-green-500/10 text-green-600' :
                          fieldConf >= 0.5 ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {Math.round(fieldConf * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{field.value || '—'}</p>
                  </div>
                );
              })}
            </div>
            {['extracted', 'needs_review'].includes(waybill.status) && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit Extracted Fields
              </Button>
            )}
          </>
        )}

        {waybill.ai_confidence_score != null && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            AI Confidence: <span className="font-medium">{Math.round(waybill.ai_confidence_score * 100)}%</span>
            <span className="text-muted-foreground/60">({waybill.ai_model_used})</span>
          </div>
        )}

        {waybill.source_phone && (
          <div className="text-xs text-muted-foreground">
            Source: {waybill.source_phone} {waybill.driver_name && `(${waybill.driver_name})`}
          </div>
        )}

        {waybill.extraction_error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
            <strong>Error:</strong> {waybill.extraction_error}
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          {['received', 'extraction_failed'].includes(waybill.status) && (
            <Button onClick={onExtract} disabled={extracting} className="flex-1">
              {extracting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scan className="h-4 w-4 mr-2" />}
              {extracting ? 'Extracting...' : 'Extract with AI'}
            </Button>
          )}
          {['extracted', 'needs_review'].includes(waybill.status) && (
            <Button variant="outline" onClick={onApprove} className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />Approve
            </Button>
          )}
          {['extracted', 'needs_review', 'approved'].includes(waybill.status) && (
            <Button onClick={onGenerateInvoice} disabled={generating} className="flex-1">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Receipt className="h-4 w-4 mr-2" />}
              {generating ? 'Generating...' : 'Generate Invoice'}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function InvoiceDetailView({ invoice, config, formatAmount, onUpdate, onRecordShare, onGeneratePDF, onGetPdfUrl, onSendEmail }: {
  invoice: WaybillInvoice;
  config: ReturnType<typeof useWaybillInvoice>['invoiceConfig'];
  formatAmount: (n: number) => string;
  onUpdate: (updates: Partial<WaybillInvoice>) => void;
  onRecordShare: (channel: 'WHATSAPP' | 'EMAIL' | 'LINK', recipient: string) => void;
  onGeneratePDF: () => Promise<{ storage_path: string } | null>;
  onGetPdfUrl: (storagePath: string) => Promise<string | null>;
  onSendEmail: (invoiceId: string, data: { recipientEmail: string; recipientName: string; subject: string; message: string }) => Promise<boolean>;
}) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const ic = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.draft;

  const isDraft = invoice.status === 'draft';

  // Edit form state — only used for draft invoices
  const [editForm, setEditForm] = useState({
    customer_name: invoice.customer_name,
    customer_phone: invoice.customer_phone || '',
    customer_email: invoice.customer_email || '',
    origin: invoice.origin || '',
    destination: invoice.destination || '',
    vehicle_number: invoice.vehicle_number || '',
    waybill_number: invoice.waybill_number || '',
    quantity: invoice.quantity ?? 0,
    quantity_unit: invoice.quantity_unit || '',
    notes: invoice.notes || '',
    subtotal_ngn: invoice.subtotal_ngn,
    discount_ngn: invoice.discount_ngn ?? 0,
  });

  const handleSaveEdit = () => {
    const taxRate = invoice.tax_rate_percent ?? 0;
    const subtotal = editForm.subtotal_ngn;
    const taxAmount = taxRate > 0 ? (subtotal * taxRate) / 100 : 0;
    const total = subtotal + taxAmount - (editForm.discount_ngn || 0);

    onUpdate({
      customer_name: editForm.customer_name,
      customer_phone: editForm.customer_phone || null,
      customer_email: editForm.customer_email || null,
      origin: editForm.origin || null,
      destination: editForm.destination || null,
      vehicle_number: editForm.vehicle_number || null,
      waybill_number: editForm.waybill_number || null,
      quantity: editForm.quantity || null,
      quantity_unit: editForm.quantity_unit || null,
      notes: editForm.notes || null,
      subtotal_ngn: subtotal,
      tax_amount_ngn: taxAmount,
      discount_ngn: editForm.discount_ngn || null,
      total_ngn: total,
      line_items: [{ description: `Transport: ${editForm.origin || '—'} → ${editForm.destination || '—'}`, total: subtotal }],
    } as Partial<WaybillInvoice>);
    setEditing(false);
    toast.success('Invoice updated');
  };

  const handleCancelEdit = () => {
    setEditForm({
      customer_name: invoice.customer_name,
      customer_phone: invoice.customer_phone || '',
      customer_email: invoice.customer_email || '',
      origin: invoice.origin || '',
      destination: invoice.destination || '',
      vehicle_number: invoice.vehicle_number || '',
      waybill_number: invoice.waybill_number || '',
      quantity: invoice.quantity ?? 0,
      quantity_unit: invoice.quantity_unit || '',
      notes: invoice.notes || '',
      subtotal_ngn: invoice.subtotal_ngn,
      discount_ngn: invoice.discount_ngn ?? 0,
    });
    setEditing(false);
  };

  const handleDownloadPdf = () => {
    const lineItemsHtml = (invoice.line_items as Array<{ description: string; total: number }>)
      ?.map(item => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.description}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatAmount(item.total)}</td></tr>`)
      .join('') || '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice.invoice_number}</title>
    <style>body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#333}.header{display:flex;justify-content:space-between;margin-bottom:30px}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f5f5f5;padding:10px 8px;text-align:left;font-size:12px;text-transform:uppercase}.totals{margin-left:auto;width:300px}.totals td{padding:6px 8px}.total-row{font-weight:bold;font-size:16px;border-top:2px solid #333}.bank-details{background:#f9f9f9;padding:16px;border-radius:8px;margin-top:20px}</style></head><body>
    <div class="header"><div><div style="font-size:18px;font-weight:bold">${config?.company_name || ''}</div>
    <div style="font-size:13px;color:#666">${config?.company_address || ''}</div></div>
    <div style="text-align:right"><div style="font-size:24px;font-weight:bold">INVOICE</div>
    <div style="margin-top:8px"><strong>${invoice.invoice_number}</strong></div>
    <div style="font-size:13px;color:#666">Date: ${invoice.invoice_date} | Due: ${invoice.due_date || 'On receipt'}</div></div></div>
    <div style="margin-bottom:20px"><div style="font-size:12px;text-transform:uppercase;color:#999">Bill To</div><div style="font-weight:bold">${invoice.customer_name}</div></div>
    <div style="background:#f5f5f5;padding:12px;border-radius:6px;margin-bottom:20px;font-size:13px"><strong>Route:</strong> ${invoice.origin||''} → ${invoice.destination||''} | <strong>Vehicle:</strong> ${invoice.vehicle_number||'—'} | <strong>Waybill:</strong> ${invoice.waybill_number||'—'}</div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>${lineItemsHtml}</tbody></table>
    <table class="totals"><tbody><tr><td>Subtotal</td><td style="text-align:right">${formatAmount(invoice.subtotal_ngn)}</td></tr>
    ${(invoice.tax_amount_ngn||0)>0?`<tr><td>Tax (${invoice.tax_rate_percent}%)</td><td style="text-align:right">${formatAmount(invoice.tax_amount_ngn||0)}</td></tr>`:''}
    <tr class="total-row"><td>Total</td><td style="text-align:right">${formatAmount(invoice.total_ngn)}</td></tr></tbody></table>
    ${config?.bank_name?`<div class="bank-details"><div style="font-size:12px;text-transform:uppercase;color:#999;margin-bottom:8px">Payment Details</div><div>Bank: ${config.bank_name}</div><div>Account: ${config.bank_account_name}</div><div>Number: ${config.bank_account_number}</div></div>`:''}
    ${invoice.notes?`<div style="margin-top:16px;padding:12px;background:#fffef0;border-radius:6px;font-size:13px">${invoice.notes}</div>`:''}
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
    toast.success('Invoice opened for printing/PDF');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Invoice ${invoice.invoice_number}\nCustomer: ${invoice.customer_name}\nRoute: ${invoice.origin||''} → ${invoice.destination||''}\nAmount: ${formatAmount(invoice.total_ngn)}\nDue: ${invoice.due_date||'On receipt'}${config?.bank_name?`\n\nPay to:\nBank: ${config.bank_name}\nAccount: ${config.bank_account_name}\nNumber: ${config.bank_account_number}`:''}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onUpdate({ status: 'sent', sent_via: 'whatsapp', sent_at: new Date().toISOString() } as Partial<WaybillInvoice>);
    onRecordShare('WHATSAPP', invoice.customer_phone || 'unknown');
  };

  const handleShareEmail = () => {
    setShowEmailDialog(true);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoice {invoice.invoice_number}
        </SheetTitle>
        <SheetDescription className="flex items-center gap-2">
          <Badge variant="outline" className={ic.color}>{ic.label}</Badge>
          {isDraft && !editing && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="ml-auto">
              <Pencil className="h-3.5 w-3.5 mr-1" />Edit
            </Button>
          )}
        </SheetDescription>
      </SheetHeader>

      {/* ---- EDIT MODE (draft only) ---- */}
      {editing && isDraft ? (
        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Customer Name</Label>
              <Input value={editForm.customer_name} onChange={(e) => setEditForm(f => ({ ...f, customer_name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input value={editForm.customer_phone} onChange={(e) => setEditForm(f => ({ ...f, customer_phone: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={editForm.customer_email} onChange={(e) => setEditForm(f => ({ ...f, customer_email: e.target.value }))} />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Origin</Label>
              <Input value={editForm.origin} onChange={(e) => setEditForm(f => ({ ...f, origin: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Destination</Label>
              <Input value={editForm.destination} onChange={(e) => setEditForm(f => ({ ...f, destination: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Vehicle #</Label>
              <Input value={editForm.vehicle_number} onChange={(e) => setEditForm(f => ({ ...f, vehicle_number: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Waybill #</Label>
              <Input value={editForm.waybill_number} onChange={(e) => setEditForm(f => ({ ...f, waybill_number: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Quantity</Label>
              <Input type="number" value={editForm.quantity} onChange={(e) => setEditForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Unit</Label>
              <Input value={editForm.quantity_unit} onChange={(e) => setEditForm(f => ({ ...f, quantity_unit: e.target.value }))} />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Subtotal</Label>
              <Input type="number" value={editForm.subtotal_ngn} onChange={(e) => setEditForm(f => ({ ...f, subtotal_ngn: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Discount</Label>
              <Input type="number" value={editForm.discount_ngn} onChange={(e) => setEditForm(f => ({ ...f, discount_ngn: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea value={editForm.notes} onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSaveEdit} className="flex-1">Save Changes</Button>
            <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
          </div>
        </div>
      ) : (
        /* ---- VIEW MODE ---- */
        <div className="space-y-6 mt-6">
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            {config?.company_name && <p className="font-bold text-lg">{config.company_name}</p>}
            {config?.company_address && <p className="text-sm text-muted-foreground">{config.company_address}</p>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Invoice Date:</span> <span className="font-medium">{invoice.invoice_date}</span></div>
              <div><span className="text-muted-foreground">Due Date:</span> <span className="font-medium">{invoice.due_date || '—'}</span></div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Bill To</h3>
            <p className="font-medium">{invoice.customer_name}</p>
            {invoice.customer_phone && <p className="text-sm text-muted-foreground">{invoice.customer_phone}</p>}
            {invoice.customer_email && <p className="text-sm text-muted-foreground">{invoice.customer_email}</p>}
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Transport Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Route:</span> {invoice.origin} → {invoice.destination}</div>
              <div><span className="text-muted-foreground">Vehicle:</span> {invoice.vehicle_number || '—'}</div>
              <div><span className="text-muted-foreground">Waybill #:</span> {invoice.waybill_number || '—'}</div>
              <div><span className="text-muted-foreground">Quantity:</span> {invoice.quantity} {invoice.quantity_unit}</div>
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2">Line Items</h3>
            <Table>
              <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {(invoice.line_items as Array<{ description: string; total: number }>)?.map((item, i) => (
                  <TableRow key={i}><TableCell className="text-sm">{item.description}</TableCell><TableCell className="text-right">{formatAmount(item.total)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatAmount(invoice.subtotal_ngn)}</span></div>
            {(invoice.tax_amount_ngn || 0) > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Tax ({invoice.tax_rate_percent}%)</span><span>{formatAmount(invoice.tax_amount_ngn || 0)}</span></div>
            )}
            {(invoice.discount_ngn || 0) > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatAmount(invoice.discount_ngn || 0)}</span></div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatAmount(invoice.total_ngn)}</span></div>
          </div>
          {invoice.notes && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm"><p className="text-muted-foreground text-xs mb-1">Notes</p><p>{invoice.notes}</p></div>
          )}
          {config?.bank_name && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
              <p className="text-muted-foreground text-xs mb-1">Payment Details</p>
              <p><span className="text-muted-foreground">Bank:</span> {config.bank_name}</p>
              <p><span className="text-muted-foreground">Account:</span> {config.bank_account_name}</p>
              <p><span className="text-muted-foreground">Number:</span> {config.bank_account_number}</p>
            </div>
          )}
          <Separator />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {isDraft && (
                <Button onClick={() => onUpdate({ status: 'approved' } as Partial<WaybillInvoice>)} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />Approve
                </Button>
              )}
              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <Button variant="outline" onClick={() => onUpdate({ status: 'paid' } as Partial<WaybillInvoice>)}>Mark Paid</Button>
              )}
            </div>
            <div className="flex gap-2">
              {!invoice.pdf_storage_path ? (
                <Button variant="outline" onClick={async () => { setGeneratingPdf(true); await onGeneratePDF(); setGeneratingPdf(false); }} disabled={generatingPdf} className="flex-1">
                  {generatingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  {generatingPdf ? 'Generating…' : 'Generate PDF'}
                </Button>
              ) : (
                <Button variant="outline" className="flex-1" onClick={async () => {
                  const url = await onGetPdfUrl(invoice.pdf_storage_path!);
                  if (url) window.open(url, '_blank');
                  else toast.error('Could not load PDF');
                }}>
                  <Download className="h-4 w-4 mr-2" />View PDF
                </Button>
              )}
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" />Print
              </Button>
              {['approved', 'sent', 'paid'].includes(invoice.status) && (
                <>
                  <Button variant="outline" onClick={handleShareWhatsApp}><MessageSquare className="h-4 w-4 mr-2" />WhatsApp</Button>
                  <Button variant="outline" onClick={handleShareEmail}><Mail className="h-4 w-4 mr-2" />Email</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <SendInvoiceEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        invoiceNumber={invoice.invoice_number}
        customerName={invoice.customer_name}
        customerEmail={invoice.customer_email}
        totalAmount={formatAmount(invoice.total_ngn)}
        hasPdf={!!invoice.pdf_storage_path}
        onSend={(data) => onSendEmail(invoice.id, data)}
      />
    </>
  );
}

function PricingRulesPanel({ rules, onAdd, onUpdate, onDelete, formatAmount, showDialog, setShowDialog }: {
  rules: PricingRule[];
  onAdd: (rule: Partial<PricingRule>) => void;
  onUpdate: (ruleId: string, updates: Partial<PricingRule>) => void;
  onDelete: (ruleId: string) => void;
  formatAmount: (n: number) => string;
  showDialog: boolean;
  setShowDialog: (v: boolean) => void;
}) {
  const emptyForm: Partial<PricingRule> = { rule_name: '', destination: '', price_ngn: 0, origin: '', vehicle_type: '', customer_name: '', notes: '', price_per_unit_ngn: null, unit_type: '', pricing_mode: 'FLAT', currency: 'NGN', minimum_charge: null, destination_aliases: [] };
  const [form, setForm] = useState<Partial<PricingRule>>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openEdit = (rule: PricingRule) => {
    setForm({
      rule_name: rule.rule_name,
      destination: rule.destination,
      origin: rule.origin || '',
      price_ngn: rule.price_ngn,
      price_per_unit_ngn: rule.price_per_unit_ngn,
      unit_type: rule.unit_type || '',
      vehicle_type: rule.vehicle_type || '',
      customer_name: rule.customer_name || '',
      notes: rule.notes || '',
      effective_from: rule.effective_from,
      effective_to: rule.effective_to || '',
      pricing_mode: rule.pricing_mode || 'FLAT',
      currency: rule.currency || 'NGN',
      minimum_charge: rule.minimum_charge,
      destination_aliases: rule.destination_aliases || [],
    });
    setEditingId(rule.id);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingId) {
      onUpdate(editingId, form);
    } else {
      onAdd(form);
    }
    setShowDialog(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleClose = () => {
    setShowDialog(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Destination Pricing Rules</h2>
          <p className="text-sm text-muted-foreground">Configure agreed prices per destination, customer, or vehicle type</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(v) => { if (!v) handleClose(); else setShowDialog(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Pricing Rule' : 'Add Pricing Rule'}</DialogTitle>
              <DialogDescription>Define a pricing agreement for a route or customer</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div><Label>Rule Name *</Label><Input value={form.rule_name} onChange={(e) => setForm(f => ({ ...f, rule_name: e.target.value }))} placeholder="e.g. Lagos→Abuja Dangote Cement" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Origin</Label><Input value={form.origin || ''} onChange={(e) => setForm(f => ({ ...f, origin: e.target.value }))} placeholder="e.g. Lagos" /></div>
                <div><Label>Destination *</Label><Input value={form.destination} onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="e.g. Abuja" /></div>
              </div>
              <div><Label>Destination Aliases (comma-separated)</Label><Input value={(form.destination_aliases as string[] || []).join(', ')} onChange={(e) => setForm(f => ({ ...f, destination_aliases: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="e.g. FCT, Abuja Central" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Pricing Mode</Label>
                  <Select value={form.pricing_mode || 'FLAT'} onValueChange={(v) => setForm(f => ({ ...f, pricing_mode: v as PricingRule['pricing_mode'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">Flat Rate</SelectItem>
                      <SelectItem value="PER_WEIGHT">Per Weight (ton/kg)</SelectItem>
                      <SelectItem value="PER_DISTANCE">Per Distance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={form.currency || 'NGN'} onValueChange={(v) => setForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Flat Price (₦)</Label><Input type="number" value={form.price_ngn || ''} onChange={(e) => setForm(f => ({ ...f, price_ngn: Number(e.target.value) }))} placeholder="Total trip price" /></div>
                <div><Label>Vehicle Type</Label><Input value={form.vehicle_type || ''} onChange={(e) => setForm(f => ({ ...f, vehicle_type: e.target.value }))} placeholder="e.g. 30-ton trailer" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Price Per Unit (₦)</Label><Input type="number" value={form.price_per_unit_ngn ?? ''} onChange={(e) => setForm(f => ({ ...f, price_per_unit_ngn: e.target.value ? Number(e.target.value) : null }))} placeholder="Optional per-unit rate" /></div>
                <div><Label>Unit Type</Label><Input value={form.unit_type || ''} onChange={(e) => setForm(f => ({ ...f, unit_type: e.target.value }))} placeholder="e.g. ton, bag, trip" /></div>
                <div><Label>Minimum Charge (₦)</Label><Input type="number" value={form.minimum_charge ?? ''} onChange={(e) => setForm(f => ({ ...f, minimum_charge: e.target.value ? Number(e.target.value) : null }))} placeholder="Optional" /></div>
              </div>
              <div><Label>Customer Name</Label><Input value={form.customer_name || ''} onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Specific customer (optional)" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Effective From</Label><Input type="date" value={form.effective_from || ''} onChange={(e) => setForm(f => ({ ...f, effective_from: e.target.value }))} /></div>
                <div><Label>Effective To</Label><Input type="date" value={(form.effective_to as string) || ''} onChange={(e) => setForm(f => ({ ...f, effective_to: e.target.value || null }))} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Agreement details, special conditions..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.rule_name || !form.destination}>
                {editingId ? 'Update Rule' : 'Save Rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Flat Price</TableHead>
                <TableHead className="text-right">Per Unit</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No pricing rules configured</p>
                    <p className="text-sm">Add destination pricing agreements to auto-calculate invoice amounts</p>
                  </TableCell>
                </TableRow>
              ) : rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.rule_name}</TableCell>
                  <TableCell className="text-sm">
                    {rule.origin ? <span className="flex items-center gap-1">{rule.origin} <ArrowRight className="h-3 w-3" /> {rule.destination}</span> : rule.destination}
                  </TableCell>
                  <TableCell>{rule.vehicle_type || '—'}</TableCell>
                  <TableCell>{rule.customer_name || <span className="text-muted-foreground">Any</span>}</TableCell>
                  <TableCell className="text-right font-medium">{formatAmount(rule.price_ngn)}</TableCell>
                  <TableCell className="text-right text-sm">
                    {rule.price_per_unit_ngn ? `${formatAmount(rule.price_per_unit_ngn)}/${rule.unit_type || 'unit'}` : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {rule.effective_from ? format(new Date(rule.effective_from), 'dd MMM yy') : '—'}
                    {rule.effective_to ? ` → ${format(new Date(rule.effective_to), 'dd MMM yy')}` : ''}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={rule.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted text-muted-foreground'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => onUpdate(rule.id, { is_active: !rule.is_active } as Partial<PricingRule>)} title={rule.is_active ? 'Deactivate' : 'Activate'}>
                        {rule.is_active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {deleteConfirm === rule.id ? (
                        <Button size="sm" variant="destructive" onClick={() => { onDelete(rule.id); setDeleteConfirm(null); }}>
                          Confirm
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(rule.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceSettingsPanel({ config, onSave }: {
  config: ReturnType<typeof useWaybillInvoice>['invoiceConfig'];
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    tax_enabled: config?.tax_enabled || false,
    tax_rate_percent: config?.tax_rate_percent || 7.5,
    tax_label: config?.tax_label || 'VAT',
    invoice_prefix: config?.invoice_prefix || 'INV',
    company_name: config?.company_name || '',
    company_address: config?.company_address || '',
    company_phone: config?.company_phone || '',
    company_email: config?.company_email || '',
    bank_name: config?.bank_name || '',
    bank_account_name: config?.bank_account_name || '',
    bank_account_number: config?.bank_account_number || '',
    payment_terms_days: config?.payment_terms_days || 30,
    notes_template: config?.notes_template || '',
  });

  useEffect(() => {
    if (config) {
      setForm({
        tax_enabled: config.tax_enabled,
        tax_rate_percent: config.tax_rate_percent,
        tax_label: config.tax_label,
        invoice_prefix: config.invoice_prefix,
        company_name: config.company_name || '',
        company_address: config.company_address || '',
        company_phone: config.company_phone || '',
        company_email: config.company_email || '',
        bank_name: config.bank_name || '',
        bank_account_name: config.bank_account_name || '',
        bank_account_number: config.bank_account_number || '',
        payment_terms_days: config.payment_terms_days,
        notes_template: config.notes_template || '',
      });
    }
  }, [config]);

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>These appear on generated invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Company Name</Label><Input value={form.company_name} onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
          <div><Label>Address</Label><Textarea value={form.company_address} onChange={(e) => setForm(f => ({ ...f, company_address: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={form.company_phone} onChange={(e) => setForm(f => ({ ...f, company_phone: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={form.company_email} onChange={(e) => setForm(f => ({ ...f, company_email: e.target.value }))} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Tax</Label>
            <Switch checked={form.tax_enabled} onCheckedChange={(v) => setForm(f => ({ ...f, tax_enabled: v }))} />
          </div>
          {form.tax_enabled && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tax Label</Label><Input value={form.tax_label} onChange={(e) => setForm(f => ({ ...f, tax_label: e.target.value }))} /></div>
              <div><Label>Tax Rate (%)</Label><Input type="number" step="0.1" value={form.tax_rate_percent} onChange={(e) => setForm(f => ({ ...f, tax_rate_percent: Number(e.target.value) }))} /></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Bank details shown on invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Bank Name</Label><Input value={form.bank_name} onChange={(e) => setForm(f => ({ ...f, bank_name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Account Name</Label><Input value={form.bank_account_name} onChange={(e) => setForm(f => ({ ...f, bank_account_name: e.target.value }))} /></div>
            <div><Label>Account Number</Label><Input value={form.bank_account_number} onChange={(e) => setForm(f => ({ ...f, bank_account_number: e.target.value }))} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Invoice Prefix</Label><Input value={form.invoice_prefix} onChange={(e) => setForm(f => ({ ...f, invoice_prefix: e.target.value }))} /></div>
            <div><Label>Payment Terms (days)</Label><Input type="number" value={form.payment_terms_days} onChange={(e) => setForm(f => ({ ...f, payment_terms_days: Number(e.target.value) }))} /></div>
          </div>
          <div><Label>Default Notes</Label><Textarea value={form.notes_template} onChange={(e) => setForm(f => ({ ...f, notes_template: e.target.value }))} placeholder="e.g. Payment is due within 30 days..." /></div>
        </CardContent>
      </Card>

      <Button onClick={() => onSave(form)} className="w-full">Save Invoice Settings</Button>
    </div>
  );
}
