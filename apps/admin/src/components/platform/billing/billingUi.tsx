import type {
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  QuotationStatus,
} from "@truckmoov/api/billing";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const TIME_ZONE = "Africa/Lagos";

export function formatNgn(amount: number) {
  return formatCurrency(amount, "NGN");
}

type Tone = "success" | "warning" | "destructive" | "muted" | "info";

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
  info: "bg-info/10 text-info",
};

type StatusMeta = { label: string; tone: Tone };

function StatusBadge({ meta, className }: { meta: StatusMeta; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border-transparent", TONE_CLASS[meta.tone], className)}
    >
      {meta.label}
    </Badge>
  );
}

const PLAN_STATUS: Record<"active" | "inactive", StatusMeta> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "muted" },
};

const QUOTATION_STATUS: Record<QuotationStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "muted" },
  pending_review: { label: "Pending review", tone: "warning" },
  sent: { label: "Sent", tone: "info" },
  accepted: { label: "Accepted", tone: "success" },
  expired: { label: "Expired", tone: "destructive" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

const INVOICE_STATUS: Record<InvoiceStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "muted" },
  issued: { label: "Issued", tone: "info" },
  partially_paid: { label: "Partially paid", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  overdue: { label: "Overdue", tone: "destructive" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
  pending: { label: "Pending", tone: "warning" },
  successful: { label: "Successful", tone: "success" },
  failed: { label: "Failed", tone: "destructive" },
  requires_review: { label: "Requires review", tone: "warning" },
  refunded: { label: "Refunded", tone: "info" },
};

export const QUOTATION_STATUS_LABEL = Object.fromEntries(
  Object.entries(QUOTATION_STATUS).map(([k, v]) => [k, v.label]),
) as Record<QuotationStatus, string>;

export const INVOICE_STATUS_LABEL = Object.fromEntries(
  Object.entries(INVOICE_STATUS).map(([k, v]) => [k, v.label]),
) as Record<InvoiceStatus, string>;

export const PAYMENT_STATUS_LABEL = Object.fromEntries(
  Object.entries(PAYMENT_STATUS).map(([k, v]) => [k, v.label]),
) as Record<PaymentStatus, string>;

export function PlanStatusBadge({ isActive }: { isActive: boolean }) {
  return <StatusBadge meta={PLAN_STATUS[isActive ? "active" : "inactive"]} />;
}

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return <StatusBadge meta={QUOTATION_STATUS[status]} />;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <StatusBadge meta={INVOICE_STATUS[status]} />;
}

export function RenewalBadge() {
  return <StatusBadge meta={{ label: "Renewal", tone: "info" }} />;
}

const DAY_MS = 86_400_000;

function lagosToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / DAY_MS);
}

export function dueStateText(
  invoice: { status: InvoiceStatus; dueDate: string; outstandingNgn: number },
  graceDays: number | null,
) {
  if (invoice.status === "paid" || invoice.status === "cancelled" || invoice.status === "draft" || invoice.outstandingNgn <= 0)
    return null;
  const late = daysBetween(invoice.dueDate, lagosToday());
  if (late < 0) {
    const left = -late;
    return { tone: "muted" as const, text: left === 1 ? "Due tomorrow" : `Due in ${left} days` };
  }
  if (late === 0) return { tone: "warning" as const, text: "Due today" };
  const overdue = `Overdue by ${late} ${late === 1 ? "day" : "days"}`;
  if (graceDays === null) return { tone: "destructive" as const, text: overdue };
  const graceLeft = graceDays - late;
  if (graceLeft >= 0)
    return { tone: "warning" as const, text: `${overdue}, in grace period (${graceLeft} ${graceLeft === 1 ? "day" : "days"} left)` };
  return { tone: "destructive" as const, text: `${overdue}, grace period ended` };
}

export function DueStateText({ invoice, graceDays }: {
  invoice: { status: InvoiceStatus; dueDate: string; outstandingNgn: number };
  graceDays: number | null;
}) {
  const state = dueStateText(invoice, graceDays);
  if (!state) return null;
  return <span className={cn("text-xs", state.tone === "muted" ? "text-muted-foreground" : state.tone === "warning" ? "text-warning" : "text-destructive")}>{state.text}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge meta={PAYMENT_STATUS[status]} />;
}

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  mtn_momo: "MTN MoMo",
  other: "Other",
};

export function methodLabel(method: PaymentMethod | null) {
  return method ? METHOD_LABEL[method] : "-";
}

export function MethodLabel({ method }: { method: PaymentMethod | null }) {
  return <span>{methodLabel(method)}</span>;
}

function formatDateValue(date: Date, withTime: boolean) {
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-NG", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function formatIsoDate(iso: string | null | undefined) {
  return iso ? formatDateValue(new Date(iso), false) : "-";
}

export function formatIsoDateTime(iso: string | null | undefined) {
  return iso ? formatDateValue(new Date(iso), true) : "-";
}

export function formatDateOnly(date: string | null | undefined) {
  return date ? formatDateValue(new Date(`${date}T00:00:00+01:00`), false) : "-";
}

export function customerTypeLabel(type: string) {
  if (type === "fleet_provider") return "Enterprise";
  if (type === "owner_operator") return "Owner-Operator";
  return type
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ListErrorBanner({
  title,
  message,
  onRetry,
}: {
  title: string;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
      <div>
        <p className="font-medium text-destructive">{title}</p>
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function todayInLagos() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

export function formatTaxRate(rateBp: number) {
  return `${rateBp / 100}%`;
}
