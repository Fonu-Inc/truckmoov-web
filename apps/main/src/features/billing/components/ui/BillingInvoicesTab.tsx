import type { Invoice } from "@/features/billing/utils/enterpriseBillingData";
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
  ChargeBreakdown,
  LabelValue,
  PlanSummary,
  StatusPill,
} from "@/features/billing/utils/billingShared";
import {
  deviceCountOf,
  formatDate,
  formatLongDate,
  INVOICE_STATUS_LABEL,
  invoiceOutstanding,
  invoices,
  invoiceTotal,
  lineTotal,
  payments,
  planLineOf,
} from "@/features/billing/utils/enterpriseBillingData";
import {
  downloadDocument, toneForStatus,
} from "../../utils/billingHelpers";

export function BillingInvoicesTab() {
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
  ] = useState<Invoice | null>(null);

  const rows = invoices.filter((i) => {
    const matchesSearch
      = !search || `${i.number} ${i.billingPeriod} ${i.quotationNumber ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === "all" || i.status === status);
  });

  const download = (i: Invoice) =>
    downloadDocument(
      `${i.number}.txt`,
      [
        `Invoice ${i.number}`,
        `Billing period: ${i.billingPeriod}`,
        `Invoice date: ${formatLongDate(i.invoiceDate)}`,
        `Due date: ${formatLongDate(i.dueDate)}`,
        `Status: ${INVOICE_STATUS_LABEL[i.status]}`,
        "",
        ...i.lines.map(l => `${l.name} — ${l.quantity} x ${format(l.unitCharge)} = ${format(lineTotal(l))}`),
        "",
        `Total: ${format(invoiceTotal(i))}`,
        `Paid: ${format(i.amountPaid)}`,
        `Outstanding: ${format(invoiceOutstanding(i))}`,
      ],
    );

  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Invoice History</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices are issued automatically by the platform for each billing period and approved request.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice number, billing period or quotation"
              className="pl-9 rounded-xl"
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
          >
            <SelectTrigger className="w-full sm:w-52 rounded-xl">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(INVOICE_STATUS_LABEL).map(([
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
                <TableHead>Invoice</TableHead>
                <TableHead>M2M plan</TableHead>
                <TableHead className="text-right">Devices</TableHead>
                <TableHead>Billing period</TableHead>
                <TableHead>Invoice date</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium whitespace-nowrap">{i.number}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {planLineOf(i.lines) ? (
                      <StatusPill
                        label={planLineOf(i.lines)!.name}
                        tone="info"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {deviceCountOf(i.lines) || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{i.billingPeriod}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(i.invoiceDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(i.dueDate)}</TableCell>
                  <TableCell className="text-right tabular-nums">{format(invoiceTotal(i))}</TableCell>
                  <TableCell className="text-right tabular-nums">{format(i.amountPaid)}</TableCell>
                  <TableCell className="text-right tabular-nums">{format(invoiceOutstanding(i))}</TableCell>
                  <TableCell>
                    <StatusPill
                      label={INVOICE_STATUS_LABEL[i.status]}
                      tone={toneForStatus(i.status)}
                    />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(i)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {" "}
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => download(i)}
                      aria-label="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center text-muted-foreground py-8"
                  >
                    No invoices match your filters.
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
          className="max-w-3xl max-h-[85vh] overflow-y-auto"
        >
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Invoice
                  {selected.number}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <LabelValue
                    label="Billing period"
                    value={selected.billingPeriod}
                  />
                  <LabelValue
                    label="Invoice date"
                    value={formatLongDate(selected.invoiceDate)}
                  />
                  <LabelValue
                    label="Due date"
                    value={formatLongDate(selected.dueDate)}
                  />
                  <LabelValue
                    label="Payment status"
                    value={(
                      <StatusPill
                        label={INVOICE_STATUS_LABEL[selected.status]}
                        tone={toneForStatus(selected.status)}
                      />
                    )}
                  />
                  <LabelValue
                    label="From quotation"
                    value={selected.quotationNumber ?? "Recurring service charges"}
                  />
                  <LabelValue
                    label="Outstanding"
                    value={format(invoiceOutstanding(selected))}
                  />
                </div>
                <PlanSummary lines={selected.lines} />
                <div>
                  <p className="text-sm font-medium mb-2">Charge breakdown</p>
                  <ChargeBreakdown
                    lines={selected.lines}
                    taxRate={selected.taxRate}
                    amountPaid={selected.amountPaid}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Payment Method</p>
                  <div className="rounded-2xl border border-border divide-y divide-border">
                    {payments
                      .filter(p => selected.paymentRefs.includes(p.reference))
                      .map(p => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-4 py-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">Bank Transfer</p>
                            <p className="text-xs text-muted-foreground">
                              5 Sept 2026&nbsp;
                            </p>
                          </div>
                          <p className="tabular-nums font-medium">{format(p.amount)}</p>
                        </div>
                      ))}
                    {selected.paymentRefs.length === 0 && (
                      <p className="px-4 py-4 text-sm text-muted-foreground">No payments recorded yet.</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => download(selected)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {" "}
                    Download invoice
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
