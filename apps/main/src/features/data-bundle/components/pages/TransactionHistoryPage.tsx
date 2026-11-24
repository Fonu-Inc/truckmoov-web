import type { ColumnDef } from "@tanstack/react-table";
import type { DataBundleTransactionsQuery } from "@truckmoov/api/auth";
import {
  keepPreviousData, useQuery,
} from "@tanstack/react-query";
import {
  exportDataBundleTransactions,
  getDataBundleCarriersQueryOptions,
  getDataBundleTransactionsQueryOptions,
} from "@truckmoov/api/auth";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
import { useServerPagination } from "@truckmoov/reusables/hooks/useServerPagination";
import {
  Download, Search, SlidersHorizontal,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  bundleReceiptFilename, canDownloadReceipt, generateBundleTransactionReceipt,
} from "@/features/data-bundle/utils/bundleReceipt";
import {
  formatMobile,
  formatNgn,
  useDataBundleCatalog,
  useDebouncedValue,
} from "@/features/data-bundle/utils/dataBundle";

type TopupRow = {
  id: string; created_at: string; msisdn: string; bundle_code: string; status: string; amount_ngn?: number; payment_reference?: string | null; bundle?: {
    carrier?: string; name?: string;
  };
};

export function TransactionHistoryPage() {
  const { catalog } = useDataBundleCatalog();
  const carriersQuery = useQuery(getDataBundleCarriersQueryOptions());

  const [
    txSearch,
    setTxSearch,
  ] = useState("");
  const [
    txStatus,
    setTxStatus,
  ] = useState("all");
  const [
    txCarriers,
    setTxCarriers,
  ] = useState<string[]>([]);
  const [
    txDraftCarriers,
    setTxDraftCarriers,
  ] = useState<string[]>([]);

  const debouncedTransactionSearch = useDebouncedValue(txSearch.trim());
  const {
    page, pageSize, pagination,
  } = useServerPagination([
    debouncedTransactionSearch,
    txStatus,
    txCarriers,
  ]);
  // Filters only — the export takes every matching row, not the visible page.
  const transactionQueryPayload = useMemo<DataBundleTransactionsQuery>(
    () => ({
      params: {
        search: debouncedTransactionSearch || undefined,
        status: txStatus === "all" ? undefined : txStatus,
        carriers: txCarriers.length > 0 ? txCarriers : undefined,
      },
    }),
    [
      debouncedTransactionSearch,
      txStatus,
      txCarriers,
    ],
  );

  const transactionsQuery = useQuery({
    ...getDataBundleTransactionsQueryOptions({
      params: {
        ...transactionQueryPayload.params,
        page,
        limit: pageSize,
      },
    }),
    placeholderData: keepPreviousData,
  });
  const topups = useMemo(
    () => {
      return (transactionsQuery.data?.data.items ?? []).map(item => ({
        id: item.id,
        created_at: item.date,
        msisdn: item.mobileNumber,
        bundle_code: item.bundle.code || item.bundle.id,
        bundle: item.bundle,
        status: String(item.status).toUpperCase(),
        amount_ngn: item.amount,
        payment_reference: item.paymentReference,
        failure_reason: item.failureReason,
      }));
    },
    [transactionsQuery.data],
  );
  const filteredTopups = topups;

  const dataBundleCarriers = useMemo(
    () => {
      const liveCarriers = carriersQuery.data?.data.carriers ?? [];
      if (liveCarriers.length > 0) {
        return liveCarriers.filter(carrier => carrier.active).map(carrier => ({
          value: carrier.id,
          label: carrier.displayName || carrier.name,
        }));
      }
      return Array.from(new Map(catalog.map(b => [
        b.carrierId,
        b.carrier,
      ]))).map(([
        value,
        label,
      ]) => ({
        value, label,
      }));
    },
    [
      carriersQuery.data,
      catalog,
    ],
  );

  const applyTxFilter = () => {
    setTxCarriers(txDraftCarriers);
  };
  const clearTxFilter = () => {
    setTxDraftCarriers([]);
    setTxCarriers([]);
  };

  const exportTopupsCsv = () => {
    exportDataBundleTransactions(transactionQueryPayload)
      .then(blob => downloadBlob(
        blob,
        `transactions-${Date.now()}.csv`,
      ))
      .catch((error: Error) => toast.error(error.message));
  };

  const amountFor = (t: TopupRow) => Number(t.amount_ngn ?? catalog.find(c => c.code === t.bundle_code)?.price_ngn ?? 0);
  const transactionColumns: ColumnDef<TopupRow>[] = [
    {
      accessorKey: "created_at",
      header: "Date",
      meta: { className: "text-sm" },
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
    },
    {
      id: "msisdn",
      header: "Mobile Number",
      meta: { className: "text-sm" },
      cell: ({ row }) => formatMobile(row.original.msisdn),
    },
    {
      accessorKey: "bundle_code",
      header: "Bundle",
    },
    {
      id: "amount",
      header: "Amount",
      accessorFn: amountFor,
      cell: ({ row }) => formatNgn(amountFor(row.original)),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const { status } = row.original;
        return (
          <Badge variant={status === "SUCCESS" ? "default" : status === "FAILED" ? "destructive" : "secondary"}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "receipt",
      header: "Receipt",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => canDownloadReceipt(row.original) && (
        <Button
          variant="outline"
          size="sm"
          className="whitespace-nowrap"
          onClick={() => {
            try {
              downloadBlob(
                generateBundleTransactionReceipt(
                  row.original,
                  row.original.bundle?.name,
                ),
                bundleReceiptFilename(row.original.id),
              );
            }
            catch {
              toast.error("Unable to download this receipt. Please try again.");
            }
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          {" "}
          Download Receipt
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl surface-sleek bg-card/50 border-border/50">
        <CardHeader className="space-y-1.5 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Chronological log of every bundle top-up, useful for reconciling spend and tracking failed attempts.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportTopupsCsv}
            >
              <Download className="h-4 w-4 mr-2" />
              {" "}
              Export Data
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search mobile number or bundle..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
              />
            </div>
            <Select
              value={txStatus}
              onValueChange={setTxStatus}
            >
              <SelectTrigger className="h-10 rounded-xl px-3.5 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {" "}
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-3 rounded-xl space-y-3"
                align="end"
                sideOffset={8}
              >
                <h4 className="text-xs font-medium text-foreground px-0.5">Only show transactions by...</h4>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Carrier</p>
                  <div className="space-y-1.5 pl-0.5">
                    {dataBundleCarriers.map(carrier => (
                      <label
                        key={carrier.value}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={txDraftCarriers.includes(carrier.value)}
                          onCheckedChange={chk => setTxDraftCarriers(prev => chk
                            ? [
                                ...prev,
                                carrier.value,
                              ]
                            : prev.filter(x => x !== carrier.value))}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-xs">{carrier.label}</span>
                      </label>
                    ))}
                    {dataBundleCarriers.length === 0 && <p className="text-xs text-muted-foreground">No carriers</p>}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={applyTxFilter}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={clearTxFilter}
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <DataTable
            columns={transactionColumns}
            data={filteredTopups}
            isLoading={transactionsQuery.isLoading}
            isError={transactionsQuery.isError}
            errorMessage={transactionsQuery.error?.message}
            onRetry={() => transactionsQuery.refetch()}
            emptyState="No transactions match your filters"
            pagination={pagination(transactionsQuery.data?.data.total ?? 0)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default TransactionHistoryPage;
