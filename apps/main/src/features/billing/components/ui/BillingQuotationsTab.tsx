import type { TenantQuotationStatus } from "@truckmoov/api/billing";
import {
  getTenantQuotationQueryOptions, useTenantQuotation, useTenantQuotations,
} from "@truckmoov/api/billing";
import { queryClient } from "@truckmoov/api/lib/query-client";
import {
  Download, Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
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
import { useDebouncedValue } from "@/features/data-bundle/utils/dataBundle";
import { FleetTablePager } from "@/features/fleet/components/ui/FleetTablePager";
import { quotationDocument } from "../../utils/billingDocuments";
import {
  formatDate, formatLongDate, ngn, QUOTATION_STATUS_LABEL, toneForStatus,
} from "../../utils/billingHelpers";
import {
  BILLING_CARD, BILLING_CARD_SUBTITLE, BILLING_CARD_TITLE, BILLING_PAGE_SIZE, ChargeBreakdown, DialogSkeleton, LabelValue, PlanSummary, RowActions, SectionError, StatusPill, TableStateRows,
} from "../../utils/billingShared";
import { useBillingDownload } from "../../utils/useBillingDownload";

function QuotationStatus({ status }: { status: TenantQuotationStatus }) {
  return (
    <StatusPill
      label={QUOTATION_STATUS_LABEL[status]}
      tone={toneForStatus(status)}
    />
  );
}

function QuotationDialog({
  id, onClose, onDownload,
}: {
  id: string | null; onClose: () => void; onDownload: (id: string) => void;
}) {
  const query = useTenantQuotation(id ?? "");
  const quotation = query.data?.data;

  return (
    <Dialog
      open={!!id}
      onOpenChange={o => !o && onClose()}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-w-3xl max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{quotation ? `Quotation ${quotation.number}` : "Quotation"}</DialogTitle>
        </DialogHeader>
        {query.isLoading && <DialogSkeleton />}
        {query.isError && (
          <SectionError
            message="Could not load this quotation."
            onRetry={() => query.refetch()}
          />
        )}
        {quotation && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <LabelValue
                label="Date"
                value={formatLongDate(quotation.date)}
              />
              <LabelValue
                label="Purpose"
                value={quotation.purpose}
              />
              <LabelValue
                label="Status"
                value={<QuotationStatus status={quotation.status} />}
              />
              <LabelValue
                label="Related request"
                value={quotation.relatedRequest ?? "-"}
              />
              <LabelValue
                label="Related payment"
                value={quotation.paymentRef ?? "Not paid yet"}
              />
              <LabelValue
                label="Related invoice"
                value={quotation.invoiceNumber ?? "Not invoiced"}
              />
            </div>
            <PlanSummary lines={quotation.lines} />
            <div>
              <p className="text-sm font-medium mb-2">Charge breakdown</p>
              <ChargeBreakdown
                lines={quotation.lines}
                totals={quotation}
              />
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Related operational activity</p>
              <p className="text-sm mt-1">{quotation.operationalOutcome}</p>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => onDownload(quotation.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download quotation
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const COLUMNS = 9;

export function BillingQuotationsTab() {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(null);
  const q = useDebouncedValue(search.trim());

  const quotations = useTenantQuotations({
    params: {
      status: status === "all" ? undefined : status as TenantQuotationStatus,
      q: q || undefined,
      page,
      pageSize: BILLING_PAGE_SIZE,
    },
  });
  const {
    download, busyId,
  } = useBillingDownload(
    id => queryClient.fetchQuery(getTenantQuotationQueryOptions(id)).then(r => r.data),
    quotationDocument,
  );
  const list = quotations.data?.data;
  const rows = list?.items ?? [];

  return (
    <div className={BILLING_CARD}>
      <div className="flex flex-col p-6 pb-4 space-y-4">
        <div>
          <h3 className={BILLING_CARD_TITLE}>Quotation History</h3>
          <p className="text-sm text-muted-foreground mt-1.5">{BILLING_CARD_SUBTITLE}</p>
          <p className="text-sm text-muted-foreground mt-1">Every quotation issued to your organization, including your original onboarding quotation.</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search quotation number, purpose or request"
              className="pl-9 rounded-xl"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3.5 w-full lg:w-48 rounded-xl">
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
      </div>
      <div className="p-6 pt-0">
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
              <TableStateRows
                colSpan={COLUMNS}
                isLoading={quotations.isLoading}
                isError={quotations.isError}
                errorMessage="Could not load your quotations."
                onRetry={() => quotations.refetch()}
                isEmpty={rows.length === 0}
                emptyMessage="No quotations match your filters."
              />
              {!quotations.isLoading && !quotations.isError && rows.map(qt => (
                <TableRow key={qt.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {qt.number}
                    <div className="text-xs text-muted-foreground">{qt.category}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(qt.date)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {qt.planName
                      ? (
                          <StatusPill
                            label={qt.planName}
                            tone="info"
                          />
                        )
                      : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{qt.deviceCount || "-"}</TableCell>
                  <TableCell className="max-w-[280px] text-muted-foreground">{qt.description}</TableCell>
                  <TableCell className="text-right tabular-nums">{ngn(qt.totalNgn)}</TableCell>
                  <TableCell>
                    <QuotationStatus status={qt.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{qt.relatedRequest ?? "-"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <RowActions
                      onView={() => setSelectedId(qt.id)}
                      onDownload={() => download(qt.id)}
                      downloadDisabled={busyId === qt.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {list && (
          <FleetTablePager
            page={page}
            pageSize={BILLING_PAGE_SIZE}
            total={list.total}
            onPageChange={setPage}
          />
        )}
      </div>

      <QuotationDialog
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onDownload={download}
      />
    </div>
  );
}
