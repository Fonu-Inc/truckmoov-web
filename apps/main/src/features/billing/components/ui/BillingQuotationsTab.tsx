import type { Quotation } from "@/features/billing/utils/enterpriseBillingData";
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
  lineTotal,
  planLineOf,
  QUOTATION_STATUS_LABEL,
  quotations,
  totalOf,
} from "@/features/billing/utils/enterpriseBillingData";
import {
  downloadDocument, toneForStatus,
} from "../../utils/billingHelpers";

export function BillingQuotationsTab() {
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
  ] = useState<Quotation | null>(null);

  const rows = quotations.filter((q) => {
    const matchesSearch
      = !search
        || `${q.number} ${q.description} ${q.purpose} ${q.relatedRequest}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === "all" || q.status === status);
  });

  const download = (q: Quotation) =>
    downloadDocument(
      `${q.number}.txt`,
      [
        `Quotation ${q.number}`,
        `Date: ${formatLongDate(q.date)}`,
        `Purpose: ${q.purpose}`,
        `Status: ${QUOTATION_STATUS_LABEL[q.status]}`,
        `Related request: ${q.relatedRequest}`,
        "",
        ...q.lines.map(l => `${l.name} — ${l.quantity} x ${format(l.unitCharge)} = ${format(lineTotal(l))}`),
        "",
        `Total: ${format(totalOf(
          q.lines,
          q.taxRate,
        ))}`,
      ],
    );

  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Quotation History</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Every quotation issued to your organization, including your original onboarding quotation.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search quotation number, purpose or request"
              className="pl-9 rounded-xl"
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
          >
            <SelectTrigger className="w-full lg:w-48 rounded-xl">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(QUOTATION_STATUS_LABEL).map(([
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
                <TableHead>Quotation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>M2M plan</TableHead>
                <TableHead className="text-right">Devices</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Related request</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(q => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {q.number}
                    <div className="text-xs text-muted-foreground">{q.category}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(q.date)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {planLineOf(q.lines) ? (
                      <StatusPill
                        label={planLineOf(q.lines)!.name}
                        tone="info"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {deviceCountOf(q.lines) || "—"}
                  </TableCell>
                  <TableCell className="max-w-[280px] text-muted-foreground">{q.description}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {format(totalOf(
                      q.lines,
                      q.taxRate,
                    ))}
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      label={QUOTATION_STATUS_LABEL[q.status]}
                      tone={toneForStatus(q.status)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{q.relatedRequest}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(q)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {" "}
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => download(q)}
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
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    No quotations match your filters.
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
                  Quotation
                  {selected.number}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <LabelValue
                    label="Date"
                    value={formatLongDate(selected.date)}
                  />
                  <LabelValue
                    label="Purpose"
                    value={selected.purpose}
                  />
                  <LabelValue
                    label="Status"
                    value={(
                      <StatusPill
                        label={QUOTATION_STATUS_LABEL[selected.status]}
                        tone={toneForStatus(selected.status)}
                      />
                    )}
                  />
                  <LabelValue
                    label="Related request"
                    value={selected.relatedRequest}
                  />
                  <LabelValue
                    label="Related payment"
                    value={selected.paymentRef ?? "Not paid yet"}
                  />
                  <LabelValue
                    label="Related invoice"
                    value={selected.invoiceNumber ?? "Not invoiced"}
                  />
                </div>
                <PlanSummary lines={selected.lines} />
                <div>
                  <p className="text-sm font-medium mb-2">Charge breakdown</p>
                  <ChargeBreakdown
                    lines={selected.lines}
                    taxRate={selected.taxRate}
                  />
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Related operational activity</p>
                  <p className="text-sm mt-1">{selected.operationalOutcome}</p>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => download(selected)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {" "}
                    Download quotation
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
