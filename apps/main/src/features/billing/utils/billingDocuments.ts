import type {
  BillingLine, TenantInvoiceDetail, TenantPayment, TenantQuotationDetail,
} from "@truckmoov/api/billing";
import {
  formatLongDate, INVOICE_STATUS_LABEL, invoiceStatusKey, methodLabel, ngn, PAYMENT_STATUS_LABEL,
  QUOTATION_STATUS_LABEL,
} from "./billingHelpers";

const lineText = (l: BillingLine) => `${l.name} — ${l.quantity} x ${ngn(l.unitPriceNgn)} = ${ngn(l.lineTotalNgn)}`;

export function invoiceDocument(i: TenantInvoiceDetail) {
  return {
    filename: `${i.number}.txt`,
    lines: [
      `Invoice ${i.number}`,
      `Billing period: ${i.billingPeriod}`,
      `Invoice date: ${formatLongDate(i.issueDate)}`,
      `Due date: ${formatLongDate(i.dueDate)}`,
      `Status: ${INVOICE_STATUS_LABEL[invoiceStatusKey(i.status)]}`,
      "",
      ...i.lines.map(lineText),
      "",
      `Total: ${ngn(i.totalNgn)}`,
      `Paid: ${ngn(i.amountPaidNgn)}`,
      `Outstanding: ${ngn(i.outstandingNgn)}`,
    ],
  };
}

export function quotationDocument(q: TenantQuotationDetail) {
  return {
    filename: `${q.number}.txt`,
    lines: [
      `Quotation ${q.number}`,
      `Date: ${formatLongDate(q.date)}`,
      `Purpose: ${q.purpose}`,
      `Status: ${QUOTATION_STATUS_LABEL[q.status]}`,
      `Related request: ${q.relatedRequest ?? "—"}`,
      "",
      ...q.lines.map(lineText),
      "",
      `Total: ${ngn(q.totalNgn)}`,
    ],
  };
}

export function receiptDocument(p: TenantPayment) {
  return {
    filename: `receipt-${p.reference}.txt`,
    lines: [
      `Payment receipt ${p.reference}`,
      `Date: ${formatLongDate(p.date)}`,
      `Amount: ${ngn(p.amountNgn)}`,
      `Method: ${methodLabel(p.method)}`,
      `Status: ${PAYMENT_STATUS_LABEL[p.status]}`,
      `Paid for: ${p.paidFor}`,
      `Related invoice: ${p.invoiceNumber ?? "—"}`,
      `Related quotation: ${p.quotationNumber ?? "—"}`,
    ],
  };
}
