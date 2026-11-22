import type {
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  QuotationStatus,
} from "@truckmoov/api/billing";
import { formatCurrency } from "@/lib/currency";

const TIME_ZONE = "Africa/Lagos";

export function formatNgn(amount: number) {
  return formatCurrency(
    amount,
    "NGN",
  );
}

/** Shown in place of a value no endpoint returns yet. */
export const NO_ENDPOINT = "-";

/** Shown when the record exists but the field is empty (e.g. no linked quotation). */
export const NONE = "—";

export type Tone = "success" | "warning" | "destructive" | "muted" | "info" | "primary";

export type StatusMeta = {
  label: string; tone: Tone;
};

export const QUOTATION_STATUS: Record<QuotationStatus, StatusMeta> = {
  draft: {
    label: "Draft", tone: "muted",
  },
  pending_review: {
    label: "Pending Review", tone: "warning",
  },
  sent: {
    label: "Sent", tone: "info",
  },
  accepted: {
    label: "Accepted", tone: "success",
  },
  expired: {
    label: "Expired", tone: "destructive",
  },
  cancelled: {
    label: "Cancelled", tone: "muted",
  },
};

export const INVOICE_STATUS: Record<InvoiceStatus, StatusMeta> = {
  draft: {
    label: "Draft", tone: "muted",
  },
  issued: {
    label: "Issued", tone: "info",
  },
  partially_paid: {
    label: "Partially Paid", tone: "warning",
  },
  paid: {
    label: "Paid", tone: "success",
  },
  overdue: {
    label: "Overdue", tone: "destructive",
  },
  cancelled: {
    label: "Cancelled", tone: "muted",
  },
};

export const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
  pending: {
    label: "Pending", tone: "warning",
  },
  successful: {
    label: "Successful", tone: "success",
  },
  failed: {
    label: "Failed", tone: "destructive",
  },
  refunded: {
    label: "Refunded", tone: "muted",
  },
  requires_review: {
    label: "Requires Review", tone: "warning",
  },
};

export const QUOTATION_STATUS_LABEL = Object.fromEntries(
  Object.entries(QUOTATION_STATUS).map(([
    k,
    v,
  ]) => [
    k,
    v.label,
  ]),
) as Record<QuotationStatus, string>;

export const INVOICE_STATUS_LABEL = Object.fromEntries(
  Object.entries(INVOICE_STATUS).map(([
    k,
    v,
  ]) => [
    k,
    v.label,
  ]),
) as Record<InvoiceStatus, string>;

export const PAYMENT_STATUS_LABEL = Object.fromEntries(
  Object.entries(PAYMENT_STATUS).map(([
    k,
    v,
  ]) => [
    k,
    v.label,
  ]),
) as Record<PaymentStatus, string>;

const DAY_MS = 86_400_000;

function lagosToday() {
  return new Date().toLocaleDateString(
    "en-CA",
    { timeZone: TIME_ZONE },
  );
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to.slice(
    0,
    10,
  )}T00:00:00Z`) - Date.parse(`${from.slice(
    0,
    10,
  )}T00:00:00Z`)) / DAY_MS);
}

export function dueStateText(
  invoice: {
    status: InvoiceStatus; dueDate: string; outstandingNgn: number;
  },
  graceDays: number | null,
) {
  if (invoice.status === "paid" || invoice.status === "cancelled" || invoice.status === "draft" || invoice.outstandingNgn <= 0)
    return null;
  const late = daysBetween(
    invoice.dueDate,
    lagosToday(),
  );
  if (late < 0) {
    const left = -late;
    return {
      tone: "muted" as const, text: left === 1 ? "Due tomorrow" : `Due in ${left} days`,
    };
  }
  if (late === 0) {
    return {
      tone: "warning" as const, text: "Due today",
    };
  }
  const overdue = `Overdue by ${late} ${late === 1 ? "day" : "days"}`;
  if (graceDays === null) {
    return {
      tone: "destructive" as const, text: overdue,
    };
  }
  const graceLeft = graceDays - late;
  if (graceLeft >= 0) {
    return {
      tone: "warning" as const, text: `${overdue}, in grace period (${graceLeft} ${graceLeft === 1 ? "day" : "days"} left)`,
    };
  }
  return {
    tone: "destructive" as const, text: `${overdue}, grace period ended`,
  };
}

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  card: "Card",
  bank_transfer: "Bank Transfer",
  mtn_momo: "MTN MoMo",
  other: "Other",
};

export function methodLabel(method: PaymentMethod | null) {
  return method ? METHOD_LABEL[method] : NONE;
}

function formatDateValue(date: Date, withTime: boolean) {
  if (Number.isNaN(date.getTime()))
    return "-";
  return date.toLocaleString(
    "en-NG",
    {
      timeZone: TIME_ZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime ? {
        hour: "2-digit", minute: "2-digit",
      } : {}),
    },
  );
}

export function formatIsoDate(iso: string | null | undefined) {
  return iso ? formatDateValue(
    new Date(iso),
    false,
  ) : "-";
}

export function formatIsoDateTime(iso: string | null | undefined) {
  return iso ? formatDateValue(
    new Date(iso),
    true,
  ) : "-";
}

export function formatDateOnly(date: string | null | undefined) {
  return date ? formatDateValue(
    new Date(`${date}T00:00:00+01:00`),
    false,
  ) : "-";
}

export function customerTypeLabel(type: string) {
  if (type === "fleet_provider")
    return "Enterprise";
  if (type === "owner_operator")
    return "Owner-Operator";
  return type
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function todayInLagos() {
  return new Intl.DateTimeFormat(
    "en-CA",
    { timeZone: TIME_ZONE },
  ).format(new Date());
}

export function formatTaxRate(rateBp: number) {
  return `${rateBp / 100}%`;
}
