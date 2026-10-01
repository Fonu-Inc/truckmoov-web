import {
  addDays, formatWithPattern, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
/**
 * Customer-facing billing data for the Enterprise portal.
 * Read-only: quotations, invoices and payments are produced by the platform,
 * the customer only views them here.
 */

/** Inlined from fleetflow `lib/m2mLicense` (per-device plan pricing only). */
// ponytail: platform price list, kept for currentPlan()'s renewal price; move to packages/api with the billing endpoints.
const M2M_LICENSE_PLANS = [
  {
    plan: "standard", yearOnePrice: 77000, renewalPrice: 75000,
  },
  {
    plan: "advance", yearOnePrice: 124000, renewalPrice: 80000,
  },
];

function findM2MPlan(plan: string) {
  return M2M_LICENSE_PLANS.find(p => p.plan === plan);
}

export type QuotationStatus
  = | "draft"
    | "sent"
    | "awaiting_decision"
    | "accepted"
    | "paid"
    | "expired"
    | "cancelled";

export type InvoiceStatus = "paid" | "pending" | "partially_paid" | "overdue";

export type PaymentStatus = "successful" | "pending" | "failed" | "refunded";

export type ChargeCategory
  = | "Hardware Devices"
    | "Licensing"
    | "Installation"
    | "Subscription & Services";

export type ChargeLine = {
  id: string;
  name: string;
  category: ChargeCategory;
  quantity: number;
  unitCharge: number;
  /** Set when the line is one of the M2M product plans. */
  isProduct?: boolean;
  validityDays?: number;
  components?: {
    label: string; amount: number;
  }[];
};

/** The plan line on a quotation or invoice, when one is present. */
export function planLineOf(lines: ChargeLine[]) {
  return lines.find(l => l.isProduct);
}

export type BillingActivity = {
  id: string;
  date: string;
  event: string;
  resource: string;
  impact: number | null;
};

export type Quotation = {
  id: string;
  number: string;
  date: string;
  description: string;
  purpose: string;
  category: "Onboarding" | "Vehicles" | "Devices" | "SIMs" | "Installation" | "Other Services";
  status: QuotationStatus;
  relatedRequest: string;
  operationalOutcome: string;
  lines: ChargeLine[];
  taxRate: number;
  paymentRef?: string;
  invoiceNumber?: string;
};

export type Invoice = {
  id: string;
  number: string;
  billingPeriod: string;
  invoiceDate: string;
  dueDate: string;
  amountPaid: number;
  status: InvoiceStatus;
  lines: ChargeLine[];
  taxRate: number;
  quotationNumber?: string;
  paymentRefs: string[];
};

export type Payment = {
  id: string;
  reference: string;
  date: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  paidFor: string;
  invoiceNumber?: string;
  quotationNumber?: string;
};

export const lineTotal = (l: ChargeLine) => l.quantity * l.unitCharge;
export function subtotalOf(lines: ChargeLine[]) {
  return lines.reduce(
    (s, l) => s + lineTotal(l),
    0,
  );
}
export const taxOf = (lines: ChargeLine[], rate: number) => Math.round(subtotalOf(lines) * rate);
export function totalOf(lines: ChargeLine[], rate: number) {
  return subtotalOf(lines) + taxOf(
    lines,
    rate,
  );
}

// ponytail: empty until the tenant billing endpoints exist in packages/api; wire these lists to them then.
export const billingActivity: BillingActivity[] = [];
export const quotations: Quotation[] = [];
export const invoices: Invoice[] = [];
export const payments: Payment[] = [];

export function invoiceTotal(inv: Invoice) {
  return totalOf(
    inv.lines,
    inv.taxRate,
  );
}
export function invoiceOutstanding(inv: Invoice) {
  return Math.max(
    invoiceTotal(inv) - inv.amountPaid,
    0,
  );
}

/* ------------------------------ current plan ------------------------------ */

/** Friendly tier label for each M2M product in the catalogue. */
export function planTierLabel(name: string) {
  const n = name.toUpperCase();
  if (n.includes("ADVANCE"))
    return "M2M Advance";
  if (n.includes("STANDARD"))
    return "M2M Standard ";
  return name;
}

/** Per-device pricing for the M2M tier a plan line belongs to. */
export function m2mTierPricing(name: string) {
  const advance = name.toUpperCase().includes("ADVANCE");
  const plan = findM2MPlan(advance ? "advance" : "standard")!;
  return {
    yearOne: plan.yearOnePrice, renewal: plan.renewalPrice,
  };
}

/** How many devices a quotation or invoice covers. */
export function deviceCountOf(lines: ChargeLine[]) {
  return planLineOf(lines)?.quantity ?? 0;
}

export type CurrentPlan = {
  line: ChargeLine;
  tier: string;
  isRenewal: boolean;
  deviceCount: number;
  pricePerDevice: number;
  renewalPricePerDevice: number;
  totalPaid: number;
  startDate: string;
  renewalDate: string;
  invoiceNumber: string;
  invoiceStatus: InvoiceStatus;
};

/** The licence plan the organization is currently running on. */
export function currentPlan(): CurrentPlan | undefined {
  const withPlan = [...invoices]
    .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate))
    .find(inv => planLineOf(inv.lines));
  if (!withPlan)
    return undefined;
  const line = planLineOf(withPlan.lines)!;
  const renewal = addDays(
    withPlan.invoiceDate,
    line.validityDays ?? 365,
  );
  const pricing = m2mTierPricing(line.name);
  return {
    line,
    tier: planTierLabel(line.name),
    isRenewal: line.name.toUpperCase().includes("RENEW"),
    deviceCount: line.quantity,
    pricePerDevice: line.unitCharge,
    renewalPricePerDevice: pricing.renewal,
    totalPaid: withPlan.amountPaid,
    startDate: withPlan.invoiceDate,
    renewalDate: toDateParam(renewal),
    invoiceNumber: withPlan.number,
    invoiceStatus: withPlan.status,
  };
}

export const QUOTATION_STATUS_LABEL: Record<QuotationStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  awaiting_decision: "Awaiting Decision",
  accepted: "Accepted",
  paid: "Paid",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  partially_paid: "Partially Paid",
  overdue: "Overdue",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  successful: "Successful",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};

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
