import type {
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  QuotationStatus,
} from "@truckmoov/api/billing";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  TableCell, TableRow,
} from "@/components/shadcn/table";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const TIME_ZONE = "Africa/Lagos";

export function formatNgn(amount: number) {
  return formatCurrency(
    amount,
    "NGN",
  );
}

// Billing tabs mirror the design app's markup class-for-class, so the card shell
// and badges below are plain elements: the shared Card/Badge carry other bases.

export function BillingCard({ children }: { children: ReactNode }) {
  return <div className="surface-sleek text-card-foreground rounded-2xl">{children}</div>;
}

export function BillingCardHeader({
  icon: Icon,
  title,
  subtitle,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="p-6 pb-4 flex flex-row items-start justify-between gap-3 space-y-0">
      <div>
        <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function BillingCardBody({ children }: { children: ReactNode }) {
  return <div className="p-6 pt-0 space-y-4">{children}</div>;
}

/** Installation / Delivery price card: title, two muted lines, then the form. */
export function PriceCardFrame({
  icon: Icon, title, subtitle, description, children,
}: {
  icon: LucideIcon; title: string; subtitle: string; description: ReactNode; children: ReactNode;
}) {
  return (
    <BillingCard>
      <div className="flex flex-col p-6 pb-4 space-y-1">
        <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <BillingCardBody>{children}</BillingCardBody>
    </BillingCard>
  );
}

/** Shown in place of a value no endpoint returns yet. */
export const NO_ENDPOINT = "-";

/** Shown when the record exists but the field is empty (e.g. no linked quotation). */
export const NONE = "—";

/** Select trigger classes the design app uses (shared trigger is h-9 px-3). */
export const FILTER_TRIGGER = "h-10 px-3.5 rounded-xl";

type Tone = "success" | "warning" | "destructive" | "muted" | "info" | "primary";

const BADGE_BASE = "inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full px-2.5 py-0.5 text-xs font-medium";

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  muted: "bg-muted text-muted-foreground border-transparent",
  info: "bg-info/10 text-info border-info/20",
  primary: "bg-primary/10 text-primary border-primary/20",
};

type StatusMeta = {
  label: string; tone: Tone;
};

function StatusBadge({
  meta, className,
}: {
  meta: StatusMeta; className?: string;
}) {
  return (
    <div className={cn(
      BADGE_BASE,
      TONE_CLASS[meta.tone],
      className,
    )}
    >
      {meta.label}
    </div>
  );
}

export function ProductChip({ children }: { children: ReactNode }) {
  return (
    // whitespace-nowrap: the design app's chips hold short plan codes; ours get
    // the plan's full name from the API, which would otherwise wrap.
    <div className={cn(
      BADGE_BASE,
      TONE_CLASS.primary,
      "whitespace-nowrap",
    )}
    >
      {children}
    </div>
  );
}

export function PaymentCompleteBadge({ complete }: { complete: boolean }) {
  return (
    <StatusBadge
      meta={complete
        ? {
            label: "Payment Completed", tone: "success",
          }
        : {
            label: "Payment Incomplete", tone: "warning",
          }}
    />
  );
}

const PLAN_STATUS: Record<"active" | "inactive", StatusMeta> = {
  active: {
    label: "Active", tone: "success",
  },
  inactive: {
    label: "Inactive", tone: "muted",
  },
};

const QUOTATION_STATUS: Record<QuotationStatus, StatusMeta> = {
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

const INVOICE_STATUS: Record<InvoiceStatus, StatusMeta> = {
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

const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
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
  return (
    <StatusBadge meta={{
      label: "Renewal", tone: "info",
    }}
    />
  );
}

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

export function DueStateText({
  invoice, graceDays,
}: {
  invoice: {
    status: InvoiceStatus; dueDate: string; outstandingNgn: number;
  };
  graceDays: number | null;
}) {
  const state = dueStateText(
    invoice,
    graceDays,
  );
  if (!state)
    return null;
  return (
    <span className={cn(
      "text-xs",
      state.tone === "muted" ? "text-muted-foreground" : state.tone === "warning" ? "text-warning" : "text-destructive",
    )}
    >
      {state.text}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge meta={PAYMENT_STATUS[status]} />;
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

export function MethodLabel({ method }: { method: PaymentMethod | null }) {
  return <span>{methodLabel(method)}</span>;
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
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}

/**
 * Loading / error / empty body for a billing table. Renders nothing once rows
 * are in, so the tbody holds only real rows (the design app's tables have no
 * placeholder rows to copy).
 */
export function TableStateRows({
  colSpan,
  isLoading,
  isError,
  isEmpty,
  errorTitle,
  errorMessage,
  onRetry,
  emptyTitle,
}: {
  colSpan: number;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorTitle: string;
  errorMessage?: string;
  onRetry: () => void;
  emptyTitle: string;
}) {
  if (isLoading) {
    return Array.from(
      { length: 3 },
      (_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={colSpan}>
            <Skeleton className="h-6 w-full rounded-lg" />
          </TableCell>
        </TableRow>
      ),
    );
  }
  if (!isEmpty)
    return null;
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={colSpan}
        className="py-10 text-center"
      >
        {isError
          ? (
              <>
                <p className="text-sm font-medium text-destructive">{errorTitle}</p>
                {errorMessage && <p className="text-xs text-muted-foreground">{errorMessage}</p>}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={onRetry}
                >
                  Try again
                </Button>
              </>
            )
          : (
              <>
                <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
                <p className="text-xs text-muted-foreground">Adjust your search or filters.</p>
              </>
            )}
      </TableCell>
    </TableRow>
  );
}

/**
 * Server pages hold 10 rows. The design app has no pager, so this only appears
 * once a list outgrows one page; otherwise the table looks exactly like it.
 */
export function BillingPager({
  page, pageSize, total, onPageChange,
}: {
  page: number; pageSize: number; total: number; onPageChange: (page: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1)
    return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(
    page * pageSize,
    total,
  );
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-muted-foreground">
        Showing
        {" "}
        {from}
        –
        {to}
        {" "}
        of
        {" "}
        {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {`Page ${page} of ${pages}`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
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
