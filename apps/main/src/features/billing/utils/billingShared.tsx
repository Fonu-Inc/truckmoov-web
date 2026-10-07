import type { ColumnDef } from "@tanstack/react-table";
import type { BillingLine } from "@truckmoov/api/billing";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { DataTable } from "@/components/shadcn/data-table";
import { Skeleton } from "@/components/shadcn/skeleton";
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

export function DialogSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
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

type BreakdownRow = BillingLine & {
  category: string; firstInCategory: boolean;
};

const breakdownColumns: ColumnDef<BreakdownRow>[] = [
  {
    id: "name",
    header: "Item / Service",
    enableSorting: false,
    cell: ({ row }) => (
      <>
        {row.original.firstInCategory && (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {row.original.category}
          </p>
        )}
        {row.original.name}
      </>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    enableSorting: false,
    meta: { className: "text-right tabular-nums" },
  },
  {
    id: "unit",
    header: "Unit charge",
    enableSorting: false,
    meta: { className: "text-right tabular-nums" },
    cell: ({ row }) => ngn(row.original.unitPriceNgn),
  },
  {
    id: "total",
    header: "Total",
    enableSorting: false,
    meta: { className: "text-right tabular-nums font-medium" },
    cell: ({ row }) => ngn(row.original.lineTotalNgn),
  },
];

function TotalRow({
  label, value, className,
}: {
  label: string; value: string; className?: string;
}) {
  return (
    <div className={cn(
      "flex justify-end gap-6 px-4 py-2",
      className,
    )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-28 text-right tabular-nums">{value}</span>
    </div>
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
  // ponytail: category header rows aren't expressible in DataTable, so the
  // category label sits above the first line of each group instead.
  const rows: BreakdownRow[] = Object.entries(groups).flatMap(([
    category,
    group,
  ]) => group.map((l, i) => ({
    ...l, category, firstInCategory: i === 0,
  })));

  return (
    <div className="rounded-2xl border border-border overflow-hidden text-sm">
      <DataTable
        columns={breakdownColumns}
        data={rows}
        emptyState="No charges."
      />
      <div className="border-t border-border bg-muted/30">
        <TotalRow
          label="Subtotal"
          value={ngn(totals.subtotalNgn)}
        />
        {!!totals.discountNgn && (
          <TotalRow
            label="Discount"
            value={`−${ngn(totals.discountNgn)}`}
          />
        )}
        <TotalRow
          label={`VAT (${taxRateLabel(totals.taxRateBp)}%)`}
          value={ngn(totals.taxNgn)}
        />
        <TotalRow
          label="Total amount"
          value={ngn(totals.totalNgn)}
          className="border-t border-border py-3 font-semibold [&>span:last-child]:text-base [&>span]:text-foreground"
        />
        {totals.amountPaidNgn !== undefined && (
          <TotalRow
            label="Amount paid"
            value={ngn(totals.amountPaidNgn)}
          />
        )}
        {totals.outstandingNgn !== undefined && (
          <TotalRow
            label="Outstanding"
            value={ngn(totals.outstandingNgn)}
            className="font-medium [&>span]:text-foreground"
          />
        )}
      </div>
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
