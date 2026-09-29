import type { Payment } from "@/features/billing/utils/enterpriseBillingData";
import {
  Download, Eye, Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  LabelValue,
  PlanSummary,
  StatusPill,
} from "@/features/billing/utils/billingShared";
import {
  deviceCountOf,
  formatDate,
  formatLongDate,
  invoiceOutstanding,
  invoices,
  invoiceTotal,
  PAYMENT_STATUS_LABEL,
  payments,
  planLineOf,
  quotations,
  totalOf,
} from "@/features/billing/utils/enterpriseBillingData";
import {
  downloadDocument, toneForStatus,
} from "../../utils/billingHelpers";

export function BillingPaymentsTab() {
  const { format } = useCurrency();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    selected,
    setSelected,
  ] = useState<Payment | null>(null);

  const rows = payments.filter((p) => {
    const matchesSearch
      = !search
        || `${p.reference} ${p.paidFor} ${p.invoiceNumber ?? ""} ${p.quotationNumber ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
    return matchesSearch && (status === "all" || p.status === status);
  });

  const receipt = (p: Payment) =>
    downloadDocument(
      `receipt-${p.reference}.txt`,
      [
        `Payment receipt ${p.reference}`,
        `Date: ${formatLongDate(p.date)}`,
        `Amount: ${format(p.amount)}`,
        `Method: ${p.method}`,
        `Status: ${PAYMENT_STATUS_LABEL[p.status]}`,
        `Paid for: ${p.paidFor}`,
        `Related invoice: ${p.invoiceNumber ?? "—"}`,
        `Related quotation: ${p.quotationNumber ?? "—"}`,
      ],
    );

  const relatedInvoice = selected ? invoices.find(i => i.number === selected.invoiceNumber) : undefined;
  const relatedQuotation = selected ? quotations.find(q => q.number === selected.quotationNumber) : undefined;

  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Payments History</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Every payment made by your organization and what it settled.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search payment reference, invoice or quotation"
              className="pl-9 rounded-xl"
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
          >
            <SelectTrigger className="w-full sm:w-48 rounded-xl">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(PAYMENT_STATUS_LABEL).map(([
                k,
                v,
              ]) => (
                <SelectItem
                  key={k}
                  value={k}
                >
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>M2M plan</TableHead>
                <TableHead className="text-right">Devices</TableHead>
                <TableHead className="text-right">Amount paid</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Related invoice / quotation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(p => (
                <TableRow key={p.id}>
                  {(() => {
                    const inv = invoices.find(i => i.number === p.invoiceNumber);
                    const qt = quotations.find(q => q.number === p.quotationNumber);
                    const lines = inv?.lines ?? qt?.lines ?? [];
                    const planName = planLineOf(lines)?.name;
                    const devices = deviceCountOf(lines);
                    return (
                      <>
                        <TableCell className="font-medium whitespace-nowrap">{p.reference}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(p.date)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {planName ? (
                            <StatusPill
                              label={planName}
                              tone="info"
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{devices || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{format(p.amount)}</TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {[
                            p.invoiceNumber,
                            p.quotationNumber,
                          ].filter(Boolean).join(" · ") || "—"}
                        </TableCell>
                      </>
                    );
                  })()}
                  <TableCell>
                    <StatusPill
                      label={PAYMENT_STATUS_LABEL[p.status]}
                      tone={toneForStatus(p.status)}
                    />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(p)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {" "}
                      View
                    </Button>
                    {p.status === "successful" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => receipt(p)}
                        aria-label="Download document"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    No payments match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog
        open={!!selected}
        onOpenChange={o => !o && setSelected(null)}
      >
        <DialogContent
          aria-describedby={undefined}
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
        >
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Payment
                  {selected.reference}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <LabelValue
                    label="Amount paid"
                    value={format(selected.amount)}
                  />
                  <LabelValue
                    label="Payment date"
                    value={formatLongDate(selected.date)}
                  />
                  <LabelValue
                    label="Method"
                    value={selected.method}
                  />
                  <LabelValue
                    label="Status"
                    value={(
                      <StatusPill
                        label={PAYMENT_STATUS_LABEL[selected.status]}
                        tone={toneForStatus(selected.status)}
                      />
                    )}
                  />
                  <LabelValue
                    label="What this payment was for"
                    value={selected.paidFor}
                  />
                </div>

                {relatedInvoice && (
                  <div className="rounded-2xl border border-border p-4 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Related invoice</p>
                    <p className="text-sm font-medium">
                      {relatedInvoice.number}
                      {" "}
                      ·
                      {" "}
                      {relatedInvoice.billingPeriod}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Invoice total
                      {" "}
                      {format(invoiceTotal(relatedInvoice))}
                      {" "}
                      · outstanding
                      {" "}
                      {format(invoiceOutstanding(relatedInvoice))}
                    </p>
                  </div>
                )}

                {relatedQuotation && (
                  <div className="rounded-2xl border border-border p-4 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Related quotation</p>
                    <p className="text-sm font-medium">
                      {relatedQuotation.number}
                      {" "}
                      ·
                      {" "}
                      {relatedQuotation.purpose}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Quoted
                      {" "}
                      {format(totalOf(
                        relatedQuotation.lines,
                        relatedQuotation.taxRate,
                      ))}
                      {" "}
                      ·
                      {" "}
                      {relatedQuotation.operationalOutcome}
                    </p>
                  </div>
                )}

                <PlanSummary lines={relatedInvoice?.lines ?? relatedQuotation?.lines ?? []} />

                {selected.status === "successful" && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => receipt(selected)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {" "}
                      Download receipt
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
