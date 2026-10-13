import type { ColumnDef } from "@tanstack/react-table";
import type { InvoiceConfig } from "@/features/payouts-invoicing/hooks/useWaybillInvoice";
import type { WaybillInvoice } from "@/features/payouts-invoicing/types";
import {
  CheckCircle2, FileText, Loader2, Mail, MessageSquare, Pencil, Receipt,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SendInvoiceEmailDialog } from "@/components/invoices/SendInvoiceEmailDialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import {
  SheetDescription, SheetHeader, SheetTitle,
} from "@/components/shadcn/sheet";
import { Textarea } from "@/components/shadcn/textarea";
import { invoiceStatusConfig } from "@/features/payouts-invoicing/utils/statusConfig";

type LineItem = {
  description: string; total: number;
};

export function InvoiceDetailView({
  invoice, config, formatAmount, onUpdate, onRecordShare, onGeneratePDF, onGetPdfUrl, onSendEmail,
}: {
  invoice: WaybillInvoice;
  config: InvoiceConfig | null;
  formatAmount: (n: number) => string;
  onUpdate: (updates: Partial<WaybillInvoice>) => void;
  onRecordShare: (channel: "WHATSAPP" | "EMAIL" | "LINK", recipient: string) => void;
  onGeneratePDF: () => Promise<{ storage_path: string } | null>;
  onGetPdfUrl: (storagePath: string) => Promise<string | null>;
  onSendEmail: (invoiceId: string, data: {
    recipientEmail: string; recipientName: string; subject: string; message: string;
  }) => Promise<boolean>;
}) {
  const [
    generatingPdf,
    setGeneratingPdf,
  ] = useState(false);
  const [
    showEmailDialog,
    setShowEmailDialog,
  ] = useState(false);
  const [
    editing,
    setEditing,
  ] = useState(false);
  const ic = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.draft;

  const isDraft = invoice.status === "draft";

  const [
    editForm,
    setEditForm,
  ] = useState({
    customer_name: invoice.customer_name,
    customer_phone: invoice.customer_phone || "",
    customer_email: invoice.customer_email || "",
    origin: invoice.origin || "",
    destination: invoice.destination || "",
    vehicle_number: invoice.vehicle_number || "",
    waybill_number: invoice.waybill_number || "",
    quantity: invoice.quantity ?? 0,
    quantity_unit: invoice.quantity_unit || "",
    notes: invoice.notes || "",
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
      line_items: [
        {
          description: `Transport: ${editForm.origin || "—"} → ${editForm.destination || "—"}`, total: subtotal,
        },
      ],
    } as Partial<WaybillInvoice>);
    setEditing(false);
    toast.success("Invoice updated");
  };

  const handleCancelEdit = () => {
    setEditForm({
      customer_name: invoice.customer_name,
      customer_phone: invoice.customer_phone || "",
      customer_email: invoice.customer_email || "",
      origin: invoice.origin || "",
      destination: invoice.destination || "",
      vehicle_number: invoice.vehicle_number || "",
      waybill_number: invoice.waybill_number || "",
      quantity: invoice.quantity ?? 0,
      quantity_unit: invoice.quantity_unit || "",
      notes: invoice.notes || "",
      subtotal_ngn: invoice.subtotal_ngn,
      discount_ngn: invoice.discount_ngn ?? 0,
    });
    setEditing(false);
  };

  const handleDownloadPdf = () => {
    const lineItemsHtml = (invoice.line_items as Array<{
      description: string; total: number;
    }>)
      ?.map(item => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.description}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatAmount(item.total)}</td></tr>`)
      .join("") || "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice.invoice_number}</title>
    <style>body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#333}.header{display:flex;justify-content:space-between;margin-bottom:30px}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f5f5f5;padding:10px 8px;text-align:left;font-size:12px;text-transform:uppercase}.totals{margin-left:auto;width:300px}.totals td{padding:6px 8px}.total-row{font-weight:bold;font-size:16px;border-top:2px solid #333}.bank-details{background:#f9f9f9;padding:16px;border-radius:8px;margin-top:20px}</style></head><body>
    <div class="header"><div><div style="font-size:18px;font-weight:bold">${config?.company_name || ""}</div>
    <div style="font-size:13px;color:#666">${config?.company_address || ""}</div></div>
    <div style="text-align:right"><div style="font-size:24px;font-weight:bold">INVOICE</div>
    <div style="margin-top:8px"><strong>${invoice.invoice_number}</strong></div>
    <div style="font-size:13px;color:#666">Date: ${invoice.invoice_date} | Due: ${invoice.due_date || "On receipt"}</div></div></div>
    <div style="margin-bottom:20px"><div style="font-size:12px;text-transform:uppercase;color:#999">Bill To</div><div style="font-weight:bold">${invoice.customer_name}</div></div>
    <div style="background:#f5f5f5;padding:12px;border-radius:6px;margin-bottom:20px;font-size:13px"><strong>Route:</strong> ${invoice.origin || ""} → ${invoice.destination || ""} | <strong>Vehicle:</strong> ${invoice.vehicle_number || "—"} | <strong>Waybill:</strong> ${invoice.waybill_number || "—"}</div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>${lineItemsHtml}</tbody></table>
    <table class="totals"><tbody><tr><td>Subtotal</td><td style="text-align:right">${formatAmount(invoice.subtotal_ngn)}</td></tr>
    ${(invoice.tax_amount_ngn || 0) > 0 ? `<tr><td>Tax (${invoice.tax_rate_percent}%)</td><td style="text-align:right">${formatAmount(invoice.tax_amount_ngn || 0)}</td></tr>` : ""}
    <tr class="total-row"><td>Total</td><td style="text-align:right">${formatAmount(invoice.total_ngn)}</td></tr></tbody></table>
    ${config?.bank_name ? `<div class="bank-details"><div style="font-size:12px;text-transform:uppercase;color:#999;margin-bottom:8px">Payment Details</div><div>Bank: ${config.bank_name}</div><div>Account: ${config.bank_account_name}</div><div>Number: ${config.bank_account_number}</div></div>` : ""}
    ${invoice.notes ? `<div style="margin-top:16px;padding:12px;background:#fffef0;border-radius:6px;font-size:13px">${invoice.notes}</div>` : ""}
    </body></html>`;
    const w = window.open(
      "",
      "_blank",
    );
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(
        () => w.print(),
        500,
      );
    }
    toast.success("Invoice opened for printing/PDF");
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Invoice ${invoice.invoice_number}\nCustomer: ${invoice.customer_name}\nRoute: ${invoice.origin || ""} → ${invoice.destination || ""}\nAmount: ${formatAmount(invoice.total_ngn)}\nDue: ${invoice.due_date || "On receipt"}${config?.bank_name ? `\n\nPay to:\nBank: ${config.bank_name}\nAccount: ${config.bank_account_name}\nNumber: ${config.bank_account_number}` : ""}`);
    window.open(
      `https://wa.me/?text=${text}`,
      "_blank",
    );
    onUpdate({
      status: "sent", sent_via: "whatsapp", sent_at: new Date().toISOString(),
    } as Partial<WaybillInvoice>);
    onRecordShare(
      "WHATSAPP",
      invoice.customer_phone || "unknown",
    );
  };

  const handleShareEmail = () => {
    setShowEmailDialog(true);
  };

  const lineItemColumns: ColumnDef<LineItem>[] = [
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: false,
      meta: { className: "whitespace-normal text-sm" },
    },
    {
      accessorKey: "total",
      header: "Amount",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => formatAmount(row.original.total),
    },
  ];

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoice
          {" "}
          {invoice.invoice_number}
        </SheetTitle>
        <SheetDescription className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={ic.color}
          >
            {ic.label}
          </Badge>
          {isDraft && !editing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              className="ml-auto"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </SheetDescription>
      </SheetHeader>

      {editing && isDraft
        ? (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Customer Name</Label>
                  <Input
                    value={editForm.customer_name}
                    onChange={e => setEditForm(f => ({
                      ...f, customer_name: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input
                    value={editForm.customer_phone}
                    onChange={e => setEditForm(f => ({
                      ...f, customer_phone: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    value={editForm.customer_email}
                    onChange={e => setEditForm(f => ({
                      ...f, customer_email: e.target.value,
                    }))}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Origin</Label>
                  <Input
                    value={editForm.origin}
                    onChange={e => setEditForm(f => ({
                      ...f, origin: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Destination</Label>
                  <Input
                    value={editForm.destination}
                    onChange={e => setEditForm(f => ({
                      ...f, destination: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vehicle #</Label>
                  <Input
                    value={editForm.vehicle_number}
                    onChange={e => setEditForm(f => ({
                      ...f, vehicle_number: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Waybill #</Label>
                  <Input
                    value={editForm.waybill_number}
                    onChange={e => setEditForm(f => ({
                      ...f, waybill_number: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                  <Input
                    type="number"
                    value={editForm.quantity}
                    onChange={e => setEditForm(f => ({
                      ...f, quantity: Number(e.target.value),
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                  <Input
                    value={editForm.quantity_unit}
                    onChange={e => setEditForm(f => ({
                      ...f, quantity_unit: e.target.value,
                    }))}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Subtotal</Label>
                  <Input
                    type="number"
                    value={editForm.subtotal_ngn}
                    onChange={e => setEditForm(f => ({
                      ...f, subtotal_ngn: Number(e.target.value),
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Discount</Label>
                  <Input
                    type="number"
                    value={editForm.discount_ngn}
                    onChange={e => setEditForm(f => ({
                      ...f, discount_ngn: Number(e.target.value),
                    }))}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({
                    ...f, notes: e.target.value,
                  }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )
        : (
            <div className="space-y-6 mt-6">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {config?.company_name && <p className="font-bold text-lg">{config.company_name}</p>}
                {config?.company_address && <p className="text-sm text-muted-foreground">{config.company_address}</p>}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Invoice Date:</span>
                    {" "}
                    <span className="font-medium">{invoice.invoice_date}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    {" "}
                    <span className="font-medium">{invoice.due_date || "—"}</span>
                  </div>
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
                  <div>
                    <span className="text-muted-foreground">Route:</span>
                    {" "}
                    {invoice.origin}
                    {" "}
                    →
                    {" "}
                    {invoice.destination}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vehicle:</span>
                    {" "}
                    {invoice.vehicle_number || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Waybill #:</span>
                    {" "}
                    {invoice.waybill_number || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    {" "}
                    {invoice.quantity}
                    {" "}
                    {invoice.quantity_unit}
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">Line Items</h3>
                <DataTable
                  columns={lineItemColumns}
                  data={(invoice.line_items as LineItem[] | null) ?? []}
                />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatAmount(invoice.subtotal_ngn)}</span>
                </div>
                {(invoice.tax_amount_ngn || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tax (
                      {invoice.tax_rate_percent}
                      %)
                    </span>
                    <span>{formatAmount(invoice.tax_amount_ngn || 0)}</span>
                  </div>
                )}
                {(invoice.discount_ngn || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>
                      -
                      {formatAmount(invoice.discount_ngn || 0)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatAmount(invoice.total_ngn)}</span>
                </div>
              </div>
              {invoice.notes && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground text-xs mb-1">Notes</p>
                  <p>{invoice.notes}</p>
                </div>
              )}
              {config?.bank_name && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                  <p className="text-muted-foreground text-xs mb-1">Payment Details</p>
                  <p>
                    <span className="text-muted-foreground">Bank:</span>
                    {" "}
                    {config.bank_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Account:</span>
                    {" "}
                    {config.bank_account_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Number:</span>
                    {" "}
                    {config.bank_account_number}
                  </p>
                </div>
              )}
              <Separator />
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {isDraft && (
                    <Button
                      onClick={() => onUpdate({ status: "approved" } as Partial<WaybillInvoice>)}
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      onClick={() => onUpdate({ status: "paid" } as Partial<WaybillInvoice>)}
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {!invoice.pdf_storage_path
                    ? (
                        <Button
                          variant="outline"
                          onClick={async () => {
                            setGeneratingPdf(true);
                            await onGeneratePDF();
                            setGeneratingPdf(false);
                          }}
                          disabled={generatingPdf}
                          className="flex-1"
                        >
                          {generatingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                          {generatingPdf ? "Generating…" : "Generate PDF"}
                        </Button>
                      )
                    : (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={async () => {
                            const url = await onGetPdfUrl(invoice.pdf_storage_path!);
                            if (url) {
                              window.open(
                                url,
                                "_blank",
                              );
                            }
                            else {
                              toast.error("Could not load PDF");
                            }
                          }}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          View PDF
                        </Button>
                      )}
                  <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  {[
                    "approved",
                    "sent",
                    "paid",
                  ].includes(invoice.status) && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleShareWhatsApp}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShareEmail}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
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
        onSend={data => onSendEmail(
          invoice.id,
          data,
        )}
      />
    </>
  );
}
