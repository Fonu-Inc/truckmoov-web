import type { BillingLine } from "@truckmoov/api/billing";
import { AlertCircle } from "lucide-react";
import { Fragment } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  TableCell, TableRow,
} from "@/components/shadcn/table";
import { cn } from "@/lib/utils";
import {
  chargeCategory, ngn, planLineOf, taxRateLabel, TONE,
} from "./billingHelpers";

export function StatusPill({
  label, tone,
}: {
  label: string; tone: keyof typeof TONE;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium",
        TONE[tone],
      )}
    >
      {label}
    </Badge>
  );
}

export function LabelValue({
  label, value,
}: {
  label: string; value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function SectionError({
  message, onRetry,
}: {
  message: string; onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm"
    >
      <span className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" />
        {message}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}

export function SkeletonRows({
  rows = 5, cols,
}: {
  rows?: number; cols: number;
}) {
  return Array.from(
    { length: rows },
    (_, r) => (
      <TableRow key={r}>
        {Array.from(
          { length: cols },
          (_, c) => (
            <TableCell key={c}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ),
        )}
      </TableRow>
    ),
  );
}

export function EmptyRow({
  cols, text,
}: {
  cols: number; text: string;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={cols}
        className="text-center text-muted-foreground py-8"
      >
        {text}
      </TableCell>
    </TableRow>
  );
}

export function DialogSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function Pager({
  page, pageSize, total, onPage,
}: {
  page: number; pageSize: number; total: number; onPage: (page: number) => void;
}) {
  if (total <= pageSize)
    return null;
  const pages = Math.ceil(total / pageSize);
  return (
    <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
      <span>{`Page ${page} of ${pages} · ${total} records`}</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export type BreakdownTotals = {
  subtotalNgn: number;
  discountNgn?: number;
  taxNgn: number;
  taxRateBp: number;
  totalNgn: number;
  amountPaidNgn?: number;
  outstandingNgn?: number;
};

function FooterRow({
  label, value, className,
}: {
  label: string; value: string; className?: string;
}) {
  return (
    <tr className={className}>
      <td
        colSpan={3}
        className="px-4 py-2 text-right text-muted-foreground"
      >
        {label}
      </td>
      <td className="px-4 py-2 text-right tabular-nums">{value}</td>
    </tr>
  );
}

export function ChargeBreakdown({
  lines, totals,
}: {
  lines: BillingLine[]; totals: BreakdownTotals;
}) {
  const groups = lines.reduce<Record<string, BillingLine[]>>(
    (acc, l) => {
      (acc[chargeCategory(l)] ||= []).push(l);
      return acc;
    },
    {},
  );

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="text-left font-medium px-4 py-2.5">Item / Service</th>
            <th className="text-right font-medium px-4 py-2.5 whitespace-nowrap">Qty</th>
            <th className="text-right font-medium px-4 py-2.5 whitespace-nowrap">Unit charge</th>
            <th className="text-right font-medium px-4 py-2.5 whitespace-nowrap">Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groups).map(([
            category,
            rows,
          ]) => (
            <Fragment key={category}>
              <tr className="bg-muted/25">
                <td
                  colSpan={4}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {category}
                </td>
              </tr>
              {rows.map((l, i) => (
                <tr
                  key={`${l.name}-${i}`}
                  className="border-t border-border/60"
                >
                  <td className="px-4 py-3">{l.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{ngn(l.unitPriceNgn)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{ngn(l.lineTotalNgn)}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
        <tfoot className="border-t border-border bg-muted/30">
          <FooterRow
            label="Subtotal"
            value={ngn(totals.subtotalNgn)}
          />
          {!!totals.discountNgn && (
            <FooterRow
              label="Discount"
              value={`−${ngn(totals.discountNgn)}`}
            />
          )}
          <FooterRow
            label={`VAT (${taxRateLabel(totals.taxRateBp)}%)`}
            value={ngn(totals.taxNgn)}
          />
          <tr className="border-t border-border">
            <td
              colSpan={3}
              className="px-4 py-3 text-right font-semibold"
            >
              Total amount
            </td>
            <td className="px-4 py-3 text-right tabular-nums font-semibold text-base">{ngn(totals.totalNgn)}</td>
          </tr>
          {totals.amountPaidNgn !== undefined && (
            <FooterRow
              label="Amount paid"
              value={ngn(totals.amountPaidNgn)}
            />
          )}
          {totals.outstandingNgn !== undefined && (
            <tr>
              <td
                colSpan={3}
                className="px-4 py-2 text-right font-medium"
              >
                Outstanding
              </td>
              <td className="px-4 py-2 text-right tabular-nums font-medium">{ngn(totals.outstandingNgn)}</td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}

export function PlanSummary({ lines }: { lines: BillingLine[] }) {
  const plan = planLineOf(lines);
  if (!plan)
    return null;
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected M2M plan</p>
          <p className="text-base font-semibold">{plan.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Price per device</p>
          <p className="text-lg font-semibold tabular-nums">{ngn(plan.unitPriceNgn)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
        <p className="text-lg font-semibold tabular-nums">
          {`${plan.quantity} Devices × ${ngn(plan.unitPriceNgn)} = ${ngn(plan.lineTotalNgn)}`}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Your M2M plan is charged per device. The M2M device package includes the Fleet device,
        platform license, and data/SIM where selected.
      </p>
    </div>
  );
}
