import {
  addDays, formatWithPattern, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
// ponytail: mock data from fleetflow parity port — wire to packages/api
/**
 * Customer-facing billing data for the Enterprise portal.
 * Read-only: quotations, invoices and payments are produced by the platform,
 * the customer only views them here.
 */

/** Inlined from fleetflow `stores/commercialBillingStore` (M2M product seeds). */
// ponytail: reference demo data; replace with tenant billing endpoints when available.
const M2M_PRODUCTS: {
  id: string;
  name: string;
  unitPrice: number;
  validityDays?: number;
  components?: {
    label: string; amount: number;
  }[];
}[] = [
  {
    id: "ci-m2m-standard-1y",
    name: "M2M_STANDARD_Yr1",
    unitPrice: 77000,
    validityDays: 365,
    components: [
      {
        label: "Hardware device (tracking unit)", amount: 0,
      },
      {
        label: "M2M data plan (12 months)", amount: 0,
      },
      {
        label: "Platform license (use of the device on Fleet Pro)", amount: 0,
      },
    ],
  },
  {
    id: "ci-m2m-advance-1y",
    name: "M2M_ADVANCE_Yr1",
    unitPrice: 124000,
    validityDays: 365,
    components: [
      {
        label: "Hardware device (advanced tracking unit)", amount: 0,
      },
      {
        label: "M2M data plan (12 months)", amount: 0,
      },
      {
        label: "Platform license (use of the device on Fleet Pro)", amount: 0,
      },
    ],
  },
  {
    id: "ci-m2m-standard-renewal",
    name: "M2M_STANDARD_RENEW",
    unitPrice: 75000,
    validityDays: 365,
    components: [
      {
        label: "M2M data plan (12 months)", amount: 0,
      },
      {
        label: "Platform license (use of the device on Fleet Pro)", amount: 0,
      },
    ],
  },
  {
    id: "ci-m2m-advance-renewal",
    name: "M2M_ADVANCE_RENEW",
    unitPrice: 80000,
    validityDays: 365,
    components: [
      {
        label: "M2M data plan (12 months)", amount: 0,
      },
      {
        label: "Platform license (use of the device on Fleet Pro)", amount: 0,
      },
    ],
  },
];

function m2mProduct(id: string) {
  return M2M_PRODUCTS.find(p => p.id === id);
}

/** Inlined from fleetflow `lib/m2mLicense` (per-device plan pricing only). */
// ponytail: reference demo data; replace with tenant billing endpoints when available.
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

/** Builds a charge line from an M2M product plan in the platform catalogue. */
export function planLine(id: string, productId: string, quantity: number): ChargeLine {
  const p = m2mProduct(productId);
  return {
    id,
    name: p?.name ?? productId,
    category: "Licensing",
    quantity,
    unitCharge: p?.unitPrice ?? 0,
    isProduct: true,
    validityDays: p?.validityDays,
    components: p?.components,
  };
}

/** The plan line on a quotation or invoice, when one is present. */
export function planLineOf(lines: ChargeLine[]) {
  return lines.find(l => l.isProduct);
}

export type BillingChange = {
  id: string;
  title: string;
  date: string;
  description: string;
  direction: "increase" | "decrease" | "neutral";
  impact: number;
};

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

const VAT = 0.075;

/**
 * Owner-operators run a handful of vehicles, enterprises run fleets, so the
 * same billing records are scaled to a believable number of devices.
 */
// ponytail: fleetflow read the demo stakeholder from sessionStorage; fixed to the
// enterprise (fleet-sized) default until billing comes from packages/api.
const IS_OWNER_OPERATOR = false as boolean;
/** Device count for a record: fleet-sized vs owner-operator sized. */
const dev = (fleet: number, operator: number) => (IS_OWNER_OPERATOR ? operator : fleet);
/** Amount settled in full for a set of charge lines. */
const paidFull = (lines: ChargeLine[]) => subtotalOf(lines);

/* ---------------------------------- current period --------------------------------- */

export const CURRENT_PERIOD = "1 – 30 September 2026";
export const CURRENT_DUE_DATE = "2026-09-15";

// ponytail: reference demo data; replace with tenant billing endpoints when available.
export const currentCharges: ChargeLine[] = [
  planLine(
    "c1",
    "ci-m2m-standard-1y",
    dev(
      20,
      2,
    ),
  ),
];

export const currentTaxRate = 0;

export const previousPeriodTotal = dev(
  5,
  1,
) * findM2MPlan("advance")!.yearOnePrice;

// ponytail: reference demo data; replace with tenant billing endpoints when available.
export const billingChanges: BillingChange[] = [
  {
    id: "ch1",
    title: "5 Vehicles Added",
    date: "2026-08-14",
    description: "These vehicles were added to your fleet and are billed for the current period.",
    direction: "increase",
    impact: 62500,
  },
  {
    id: "ch2",
    title: "5 Additional Devices Activated",
    date: "2026-08-16",
    description: "Tracking devices approved from request DR-2088 and installed on the new vehicles.",
    direction: "increase",
    impact: 22500,
  },
  {
    id: "ch3",
    title: "5 Additional SIMs Activated",
    date: "2026-08-16",
    description: "IoT SIMs allocated and activated for the new tracking devices.",
    direction: "increase",
    impact: 12500,
  },
  {
    id: "ch4",
    title: "Installation Service Added",
    date: "2026-08-20",
    description: "One-off installation work order completed for 5 vehicles.",
    direction: "increase",
    impact: 75000,
  },
  {
    id: "ch5",
    title: "2 Fuel Sensors Decommissioned",
    date: "2026-08-28",
    description: "Sensors removed from retired vehicles, reducing monitoring charges.",
    direction: "decrease",
    impact: -6000,
  },
];

const STANDARD_Y1 = findM2MPlan("standard")!.yearOnePrice;
const STANDARD_RENEWAL = findM2MPlan("standard")!.renewalPrice;
const ADVANCE_Y1 = findM2MPlan("advance")!.yearOnePrice;

// ponytail: reference demo data; replace with tenant billing endpoints when available.
export const billingActivity: BillingActivity[] = [
  {
    id: "a1", date: "2026-09-02", event: "Invoice Issued", resource: "INV-2026-0912", impact: dev(
      20,
      2,
    ) * STANDARD_Y1,
  },
  {
    id: "a2", date: "2026-08-30", event: "Payment Received", resource: "PMT-90341 · INV-2026-0811", impact: -(dev(
      5,
      1,
    ) * ADVANCE_Y1),
  },
  {
    id: "a3", date: "2026-08-28", event: "Service Removed", resource: "2 × Fuel sensor", impact: null,
  },
  {
    id: "a4", date: "2026-08-20", event: "Installation Completed", resource: `Work order WO-4471 (${dev(
      5,
      2,
    )} vehicles)`, impact: null,
  },
  {
    id: "a5", date: "2026-08-16", event: "SIMs Added", resource: `${dev(
      5,
      2,
    )} × MTN IoT SIM`, impact: null,
  },
  {
    id: "a6", date: "2026-08-16", event: "Devices Added", resource: `${dev(
      5,
      2,
    )} × Teltonika tracker`, impact: null,
  },
  {
    id: "a7", date: "2026-08-15", event: "Quotation Accepted", resource: "QT-1024", impact: dev(
      10,
      1,
    ) * STANDARD_Y1,
  },
  {
    id: "a8", date: "2026-08-14", event: "Vehicles Added", resource: `${dev(
      5,
      2,
    )} × Truck`, impact: null,
  },
  {
    id: "a9", date: "2026-08-10", event: "New Device Requested", resource: `Request DR-2088 (${dev(
      5,
      2,
    )} devices)`, impact: null,
  },
  {
    id: "a10", date: "2026-07-31", event: "Payment Received", resource: "PMT-88120 · INV-2026-0711", impact: -(dev(
      5,
      2,
    ) * STANDARD_RENEWAL),
  },
];

/* ---------------------------------- quotations --------------------------------- */

// ponytail: reference demo data; replace with tenant billing endpoints when available.
export const quotations: Quotation[] = [
  {
    id: "q1",
    number: "QT-1024",
    date: "2026-08-12",
    description: "5 additional tracking devices, SIMs and installation",
    purpose: "10 Additional Tracking Devices",
    category: "Devices",
    status: "paid",
    relatedRequest: "Device request DR-2088",
    operationalOutcome: "Devices added to fleet and installed on 5 vehicles",
    taxRate: 0,
    paymentRef: "PMT-90112",
    invoiceNumber: "INV-2026-0855",
    lines: [
      planLine(
        "q1l1",
        "ci-m2m-standard-1y",
        dev(
          10,
          1,
        ),
      ),
    ],
  },
  {
    id: "q2",
    number: "QT-0987",
    date: "2026-07-04",
    description: "5 additional vehicles onboarded to fleet management",
    purpose: "5 Additional Vehicles",
    category: "Vehicles",
    status: "accepted",
    relatedRequest: "Fleet expansion FR-311",
    operationalOutcome: "Vehicles registered, awaiting device installation",
    taxRate: 0,
    invoiceNumber: "INV-2026-0811",
    lines: [
      planLine(
        "q2l1",
        "ci-m2m-advance-1y",
        dev(
          5,
          1,
        ),
      ),
    ],
  },
  {
    id: "q3",
    number: "QT-0902",
    date: "2026-06-18",
    description: "Additional IoT SIM activation for spare devices",
    purpose: "8 Additional IoT SIMs",
    category: "SIMs",
    status: "awaiting_decision",
    relatedRequest: "SIM request SR-1140",
    operationalOutcome: "Pending your acceptance",
    taxRate: 0,
    lines: [
      planLine(
        "q3l1",
        "ci-m2m-standard-renewal",
        dev(
          8,
          2,
        ),
      ),
    ],
  },
  {
    id: "q4",
    number: "QT-0774",
    date: "2026-05-02",
    description: "Extended maintenance analytics add-on",
    purpose: "Additional Service",
    category: "Other Services",
    status: "expired",
    relatedRequest: "Service request SV-208",
    operationalOutcome: "Not activated — quotation expired",
    taxRate: VAT,
    lines: [
      {
        id: "q4l1", name: "Maintenance analytics add-on", category: "Subscription & Services", quantity: 1, unitCharge: 120000,
      },
    ],
  },
  {
    id: "q5",
    number: "QT-0001",
    date: "2026-02-10",
    description: "Onboarding: initial devices, SIMs and installation",
    purpose: "Onboarding",
    category: "Onboarding",
    status: "paid",
    relatedRequest: "Application ACT-2026-0043",
    operationalOutcome: "Fleet activated — 25 vehicles live on the platform",
    taxRate: 0,
    paymentRef: "PMT-70001",
    invoiceNumber: "INV-2026-0201",
    lines: [
      planLine(
        "q5l1",
        "ci-m2m-standard-1y",
        dev(
          20,
          2,
        ),
      ),
    ],
  },
];

/* ---------------------------------- invoices --------------------------------- */

const i3Lines = [
  planLine(
    "i3l1",
    "ci-m2m-advance-1y",
    dev(
      5,
      1,
    ),
  ),
];
const i4Lines = [
  planLine(
    "i4l1",
    "ci-m2m-standard-renewal",
    dev(
      5,
      2,
    ),
  ),
];

// ponytail: reference demo data; replace with tenant billing endpoints when available.
export const invoices: Invoice[] = [
  {
    id: "i1",
    number: "INV-2026-0912",
    billingPeriod: CURRENT_PERIOD,
    invoiceDate: "2026-09-02",
    dueDate: "2026-09-15",
    amountPaid: paidFull(currentCharges),
    status: "paid",
    lines: currentCharges,
    taxRate: 0,
    paymentRefs: ["PMT-91055"],
  },
  {
    id: "i2",
    number: "INV-2026-0855",
    billingPeriod: "Additional devices (August 2026)",
    invoiceDate: "2026-08-15",
    dueDate: "2026-08-22",
    amountPaid: paidFull(quotations[0].lines),
    status: "paid",
    lines: quotations[0].lines,
    taxRate: 0,
    quotationNumber: "QT-1024",
    paymentRefs: ["PMT-90112"],
  },
  {
    id: "i3",
    number: "INV-2026-0811",
    billingPeriod: "1 – 31 August 2026",
    invoiceDate: "2026-08-01",
    dueDate: "2026-08-15",
    amountPaid: paidFull(i3Lines),
    status: "paid",
    lines: i3Lines,
    taxRate: 0,
    paymentRefs: ["PMT-90341"],
  },
  {
    id: "i4",
    number: "INV-2026-0711",
    billingPeriod: "1 – 31 July 2026",
    invoiceDate: "2026-07-01",
    dueDate: "2026-07-15",
    amountPaid: paidFull(i4Lines),
    status: "paid",
    lines: i4Lines,
    taxRate: 0,
    paymentRefs: ["PMT-88120"],
  },
  {
    id: "i5",
    number: "INV-2026-0201",
    billingPeriod: "Onboarding (February 2026)",
    invoiceDate: "2026-02-11",
    dueDate: "2026-02-18",
    amountPaid: paidFull(quotations[4].lines),
    status: "paid",
    lines: quotations[4].lines,
    taxRate: 0,
    quotationNumber: "QT-0001",
    paymentRefs: ["PMT-70001"],
  },
];

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

/* ---------------------------------- payments --------------------------------- */

const invoiceByNumber = (num: string) => invoices.find(i => i.number === num)!;
/** Amount settled for an invoice. */
const settled = (num: string) => invoiceByNumber(num).amountPaid;
/** "M2M Standard — 2 devices (year one)" style description. */
function paidLabel(num: string, suffix: string) {
  const line = planLineOf(invoiceByNumber(num).lines)!;
  return `${planTierLabel(line.name)} — ${line.quantity} device${line.quantity === 1 ? "" : "s"} ${suffix}`;
}

// ponytail: reference demo data; replace with tenant billing endpoints when available.
export const payments: Payment[] = [
  {
    id: "p1",
    reference: "PMT-91055",
    date: "2026-09-05",
    amount: settled("INV-2026-0912"),
    method: "Bank Transfer",
    status: "successful",
    paidFor: paidLabel(
      "INV-2026-0912",
      "(year one)",
    ),
    invoiceNumber: "INV-2026-0912",
  },
  {
    id: "p2",
    reference: "PMT-90341",
    date: "2026-08-30",
    amount: settled("INV-2026-0811"),
    method: "Bank Transfer",
    status: "successful",
    paidFor: paidLabel(
      "INV-2026-0811",
      "(year one)",
    ),
    invoiceNumber: "INV-2026-0811",
    quotationNumber: "QT-0987",
  },
  {
    id: "p3",
    reference: "PMT-90112",
    date: "2026-08-15",
    amount: settled("INV-2026-0855"),
    method: "Card",
    status: "successful",
    paidFor: paidLabel(
      "INV-2026-0855",
      "(year one)",
    ),
    invoiceNumber: "INV-2026-0855",
    quotationNumber: "QT-1024",
  },
  {
    id: "p4",
    reference: "PMT-88120",
    date: "2026-07-31",
    amount: settled("INV-2026-0711"),
    method: "MTN MoMo",
    status: "successful",
    paidFor: paidLabel(
      "INV-2026-0711",
      "(renewal)",
    ),
    invoiceNumber: "INV-2026-0711",
  },
  {
    id: "p5",
    reference: "PMT-87004",
    date: "2026-07-12",
    amount: 120000,
    method: "Card",
    status: "failed",
    paidFor: "Maintenance analytics add-on",
    quotationNumber: "QT-0774",
  },
  {
    id: "p6",
    reference: "PMT-70001",
    date: "2026-02-11",
    amount: settled("INV-2026-0201"),
    method: "Bank Transfer",
    status: "successful",
    paidFor: `Onboarding — ${paidLabel(
      "INV-2026-0201",
      "(year one)",
    )}`,
    invoiceNumber: "INV-2026-0201",
    quotationNumber: "QT-0001",
  },
];

/* ---------------------------------- summary --------------------------------- */

export const currentTotal = totalOf(
  currentCharges,
  currentTaxRate,
);
export const currentInvoice = invoices[0];
export const amountDue = invoiceOutstanding(currentInvoice);
export const outstandingBalance = invoices.reduce(
  (s, i) => s + invoiceOutstanding(i),
  0,
);
export const mostRecentPayment = payments[0];

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
