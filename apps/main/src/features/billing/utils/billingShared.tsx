import type { ChargeLine } from "@/features/billing/utils/enterpriseBillingData";
import { Fragment } from "react";
import { Badge } from "@/components/shadcn/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  lineTotal,
  planLineOf,
  subtotalOf,
  taxOf,
  totalOf,
} from "@/features/billing/utils/enterpriseBillingData";

import { cn } from "@/lib/utils";
import { TONE } from "./billingHelpers";

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

/** Charge breakdown grouped by category, with subtotal / tax / total footer. */
export function ChargeBreakdown({
  lines,
  taxRate,
  amountPaid,
}: {
  lines: ChargeLine[];
  taxRate: number;
  amountPaid?: number;
}) {
  const { format } = useCurrency();
  const groups = lines.reduce<Record<string, ChargeLine[]>>(
    (acc, l) => {
      (acc[l.category] ||= []).push(l);
      return acc;
    },
    {},
  );
  const sub = subtotalOf(lines);
  const tax = taxOf(
    lines,
    taxRate,
  );
  const total = totalOf(
    lines,
    taxRate,
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
              <tr
                key={category}
                className="bg-muted/25"
              >
                <td
                  colSpan={4}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {category}
                </td>
              </tr>
              {rows.map(l => (
                <tr
                  key={l.id}
                  className="border-t border-border/60"
                >
                  <td className="px-4 py-3">{l.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{format(l.unitCharge)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{format(lineTotal(l))}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
        <tfoot className="border-t border-border bg-muted/30">
          <tr>
            <td
              colSpan={3}
              className="px-4 py-2 text-right text-muted-foreground"
            >
              Subtotal
            </td>
            <td className="px-4 py-2 text-right tabular-nums">{format(sub)}</td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="px-4 py-2 text-right text-muted-foreground"
            >
              VAT (
              {(taxRate * 100).toFixed(1)}
              %)
            </td>
            <td className="px-4 py-2 text-right tabular-nums">{format(tax)}</td>
          </tr>
          <tr className="border-t border-border">
            <td
              colSpan={3}
              className="px-4 py-3 text-right font-semibold"
            >
              Total amount
            </td>
            <td className="px-4 py-3 text-right tabular-nums font-semibold text-base">{format(total)}</td>
          </tr>
          {amountPaid !== undefined && (
            <>
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-2 text-right text-muted-foreground"
                >
                  Amount paid
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{format(amountPaid)}</td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-2 text-right font-medium"
                >
                  Outstanding
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">
                  {format(Math.max(
                    total - amountPaid,
                    0,
                  ))}
                </td>
              </tr>
            </>
          )}
        </tfoot>
      </table>
    </div>
  );
}

/** Simple client-side document download used for quotations, invoices and receipts. */

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

/** Shows the M2M plan a quotation or invoice covers, priced per device. */
export function PlanSummary({ lines }: { lines: ChargeLine[] }) {
  const { format } = useCurrency();
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
          <p className="text-lg font-semibold tabular-nums">{format(plan.unitCharge)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
        <p className="text-lg font-semibold tabular-nums">
          {plan.quantity}
          {" "}
          Devices ×
          {format(plan.unitCharge)}
          {" "}
          =
          {format(lineTotal(plan))}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Your M2M plan is charged per device. The M2M device package includes the Fleet device,
        platform license, and data/SIM where selected.
      </p>
    </div>
  );
}
