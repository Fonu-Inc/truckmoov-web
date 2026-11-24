import type {
  BillingLine, TenantInvoiceStatus, TenantPaymentMethod, TenantPaymentStatus, TenantQuotationStatus,
} from "@truckmoov/api/billing";
import type { ReceiptData } from "@/lib/receiptPdf";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import { formatCurrency } from "@/lib/currency";

export const TONE: Record<string, string> = {
  positive: "bg-emerald-500/12 text-emerald-600 border-emerald-500/25",
  warning: "bg-amber-500/12 text-amber-600 border-amber-500/25",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-primary/12 text-primary border-primary/25",
};

export type InvoiceStatusKey = "paid" | "pending" | "partially_paid" | "overdue";

export const QUOTATION_STATUS_LABEL: Record<TenantQuotationStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  awaiting_decision: "Awaiting Decision",
  accepted: "Accepted",
  paid: "Paid",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatusKey, string> = {
  paid: "Paid",
  pending: "Pending",
  partially_paid: "Partially Paid",
  overdue: "Overdue",
};

export const PAYMENT_STATUS_LABEL: Record<TenantPaymentStatus, string> = {
  successful: "Successful",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};

const METHOD_LABEL: Record<TenantPaymentMethod, string> = {
  card: "Card",
  bank_transfer: "Bank Transfer",
  mtn_momo: "MTN MoMo",
  wallet: "Wallet",
  other: "Other",
};

export function methodLabel(method: TenantPaymentMethod | null) {
  return method ? METHOD_LABEL[method] : "-";
}

export function invoiceStatusKey(status: TenantInvoiceStatus): InvoiceStatusKey {
  return status === "issued" ? "pending" : status;
}

export function toneForStatus(status: string): keyof typeof TONE {
  switch (status) {
    case "paid":
    case "successful":
    case "accepted":
      return "positive";
    case "pending":
    case "partially_paid":
    case "awaiting_decision":
    case "sent":
      return "warning";
    case "overdue":
    case "failed":
      return "danger";
    case "refunded":
      return "info";
    default:
      return "neutral";
  }
}

export function ngn(amount: number) {
  return formatCurrency(
    amount,
    "NGN",
  );
}

export function formatDate(iso: string) {
  return formatWithPattern(
    iso,
    "d MMM yyyy",
  );
}

export function formatLongDate(iso: string) {
  return formatWithPattern(
    iso,
    "d MMMM yyyy",
  );
}

export function monthLabel(iso: string) {
  return formatWithPattern(
    iso,
    "MMM yy",
  );
}

export function chargeCategory(line: BillingLine) {
  return line.kind === "plan" ? "Licensing" : "Installation";
}

export function planLineOf(lines: BillingLine[]) {
  return lines.find(l => l.kind === "plan");
}

export function taxRateLabel(taxRateBp: number) {
  return (taxRateBp / 100).toFixed(1);
}

export async function downloadDocument(data: ReceiptData) {
  const { downloadReceiptPDF } = await import("@/lib/receiptPdf");
  downloadReceiptPDF(data);
}
