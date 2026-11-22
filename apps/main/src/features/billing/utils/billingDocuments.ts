import type {
  BillingLine, TenantInvoiceDetail, TenantPayment, TenantQuotationDetail,
} from "@truckmoov/api/billing";
import type { ReceiptData } from "@/lib/receiptPdf";
import { getOrganizationSettingsQueryOptions } from "@truckmoov/api/auth";
import { queryClient } from "@truckmoov/api/lib/query-client";
import {
  formatLongDate, INVOICE_STATUS_LABEL, invoiceStatusKey, methodLabel, PAYMENT_STATUS_LABEL,
  QUOTATION_STATUS_LABEL, taxRateLabel,
} from "./billingHelpers";

function items(lines: BillingLine[]) {
  return lines.map(l => ({
    description: l.name,
    quantity: l.quantity,
    unitPrice: l.unitPriceNgn,
    total: l.lineTotalNgn,
  }));
}

// The sidebar keeps the organisation settings cached, so this needs no request of its own.
function tenantName() {
  return queryClient.getQueryData(getOrganizationSettingsQueryOptions().queryKey)?.data?.branding?.organizationName
    ?? "Your organisation";
}

export function invoiceDocument(i: TenantInvoiceDetail): ReceiptData {
  return {
    filename: `${i.number}.pdf`,
    title: "INVOICE",
    stamp: INVOICE_STATUS_LABEL[invoiceStatusKey(i.status)].toUpperCase(),
    invoiceNumber: i.number,
    tenantName: tenantName(),
    plan: i.planName ?? "",
    period: i.billingPeriod,
    issueDate: formatLongDate(i.issueDate),
    dueDate: formatLongDate(i.dueDate),
    items: items(i.lines),
    subtotal: i.subtotalNgn,
    discount: i.discountNgn,
    tax: i.taxNgn,
    taxRate: taxRateLabel(i.taxRateBp),
    amount: i.totalNgn,
    totalLabel: "TOTAL",
    afterTotal: [
      {
        label: "Paid", amount: i.amountPaidNgn,
      },
      {
        label: "Outstanding", amount: i.outstandingNgn,
      },
    ],
    currency: "NGN",
  };
}

export function quotationDocument(q: TenantQuotationDetail): ReceiptData {
  return {
    filename: `${q.number}.pdf`,
    title: "QUOTATION",
    stamp: QUOTATION_STATUS_LABEL[q.status].toUpperCase(),
    invoiceNumber: q.number,
    tenantName: tenantName(),
    plan: q.planName,
    period: q.purpose,
    issueDate: formatLongDate(q.date),
    dueDate: formatLongDate(q.validUntil),
    items: items(q.lines),
    subtotal: q.subtotalNgn,
    discount: q.discountNgn,
    tax: q.taxNgn,
    taxRate: taxRateLabel(q.taxRateBp),
    amount: q.totalNgn,
    totalLabel: "TOTAL",
    currency: "NGN",
  };
}

export function receiptDocument(p: TenantPayment): ReceiptData {
  return {
    filename: `receipt-${p.reference}.pdf`,
    stamp: PAYMENT_STATUS_LABEL[p.status].toUpperCase(),
    invoiceNumber: p.reference,
    tenantName: tenantName(),
    plan: p.planName,
    period: p.paidFor,
    issueDate: formatLongDate(p.date),
    paidDate: formatLongDate(p.date),
    paymentMethod: methodLabel(p.method),
    items: [
      {
        description: p.paidFor, quantity: 1, unitPrice: p.amountNgn, total: p.amountNgn,
      },
    ],
    subtotal: p.amountNgn,
    amount: p.amountNgn,
    currency: "NGN",
  };
}
