import type { ColumnDef } from "@tanstack/react-table";
import type {
  TenantQuotation, TenantQuotationStatus,
} from "@truckmoov/api/billing";
import {
  getTenantQuotationQueryOptions, useTenantQuotation, useTenantQuotations,
} from "@truckmoov/api/billing";
import { queryClient } from "@truckmoov/api/lib/query-client";
import {
  Download, Eye, Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { useDebouncedValue } from "@/features/data-bundle/utils/dataBundle";
import { quotationDocument } from "../../utils/billingDocuments";
import {
  formatDate, formatLongDate, ngn, QUOTATION_STATUS_LABEL, toneForStatus,
} from "../../utils/billingHelpers";
import {
  ChargeBreakdown, DialogSkeleton, LabelValue, PlanSummary, SectionError, StatusPill,
} from "../../utils/billingShared";
import { useBillingDownload } from "../../utils/useBillingDownload";

const PAGE_SIZE = 20;

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
                value={quotation.relatedRequest ?? "—"}
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

function quotationColumns({
  onView, onDownload, busyId,
}: {
  onView: (id: string) => void; onDownload: (id: string) => void; busyId: string | null;
}): ColumnDef<TenantQuotation>[] {
  return [
    {
      id: "number",
      header: "Quotation",
      enableSorting: false,
      meta: { className: "font-medium whitespace-nowrap" },
      cell: ({ row }) => (
        <>
          {row.original.number}
          <div className="text-xs text-muted-foreground">{row.original.category}</div>
        </>
      ),
    },
    {
      id: "date",
      header: "Date",
      enableSorting: false,
      meta: { className: "whitespace-nowrap" },
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      id: "plan",
      header: "M2M plan",
      enableSorting: false,
      meta: { className: "whitespace-nowrap" },
      cell: ({ row }) => (row.original.planName
        ? (
            <StatusPill
              label={row.original.planName}
              tone="info"
            />
          )
        : <span className="text-muted-foreground">—</span>),
    },
    {
      id: "devices",
      header: "Devices",
      enableSorting: false,
      meta: { className: "text-right tabular-nums" },
      cell: ({ row }) => row.original.deviceCount || "—",
    },
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: false,
      meta: { className: "max-w-[280px] whitespace-normal text-muted-foreground" },
    },
    {
      id: "amount",
      header: "Amount",
      enableSorting: false,
      meta: { className: "text-right tabular-nums" },
      cell: ({ row }) => ngn(row.original.totalNgn),
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <QuotationStatus status={row.original.status} />,
    },
    {
      id: "relatedRequest",
      header: "Related request",
      enableSorting: false,
      meta: { className: "text-muted-foreground" },
      cell: ({ row }) => row.original.relatedRequest ?? "—",
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { className: "text-right whitespace-nowrap" },
      cell: ({ row }) => (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(row.original.id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {" "}
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busyId === row.original.id}
            onClick={() => onDownload(row.original.id)}
            aria-label="Download document"
          >
            <Download className="h-4 w-4" />
          </Button>
        </>
      ),
    },
  ];
}

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
      pageSize: PAGE_SIZE,
    },
  });
  const {
    download, busyId,
  } = useBillingDownload(
    id => queryClient.fetchQuery(getTenantQuotationQueryOptions(id)).then(r => r.data),
    quotationDocument,
  );
  const list = quotations.data?.data;

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
          <DataTable
            columns={quotationColumns({
              onView: setSelectedId,
              onDownload: download,
              busyId,
            })}
            data={list?.items ?? []}
            isLoading={quotations.isLoading}
            isError={quotations.isError}
            errorMessage="Could not load your quotations."
            onRetry={() => quotations.refetch()}
            emptyState="No quotations match your filters."
            pagination={list && {
              page,
              pageSize: PAGE_SIZE,
              total: list.total,
              onPageChange: setPage,
            }}
          />
        </div>
      </CardContent>

      <QuotationDialog
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onDownload={download}
      />
    </Card>
  );
}
