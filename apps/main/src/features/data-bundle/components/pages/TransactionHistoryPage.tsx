import type { DataBundleTransactionsQuery } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  exportDataBundleTransactions,
  getDataBundleCarriersQueryOptions,
  getDataBundleTransactionsQueryOptions,
} from "@truckmoov/api/auth";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
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
import { Input } from "@/components/shadcn/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  formatMobile,
  useDataBundleCatalog,
  useDebouncedValue,
} from "@/features/data-bundle/utils/dataBundle";

export function TransactionHistoryPage() {
  const { format: fmtCurrency } = useCurrency();
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
  const transactionQueryPayload = useMemo<DataBundleTransactionsQuery>(
    () => ({
      params: {
        search: debouncedTransactionSearch || undefined,
        status: txStatus === "all" ? undefined : txStatus,
        carriers: txCarriers.length > 0 ? txCarriers : undefined,
        page: 1,
        limit: 100,
      },
    }),
    [
      debouncedTransactionSearch,
      txStatus,
      txCarriers,
    ],
  );

  const transactionsQuery = useQuery(getDataBundleTransactionsQueryOptions(transactionQueryPayload));
  const topups = useMemo(
    () => {
      return (transactionsQuery.data?.data.items ?? []).map(item => ({
        id: item.id,
        created_at: item.date,
        msisdn: item.mobileNumber,
        bundle_code: item.bundle.code,
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
          value: carrier.name,
          label: carrier.displayName || carrier.name,
        }));
      }
      return Array.from(new Set(catalog.map(b => b.carrier))).map(carrier => ({
        value: carrier,
        label: carrier,
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

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl surface-sleek bg-card/50 border-border/50">
        <CardHeader className="space-y-1.5 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Chronological log of every bundle top-up — useful for reconciling spend and tracking failed attempts.</CardDescription>
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
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsQuery.isError ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6"
                  >
                    <p role="alert">{transactionsQuery.error.message}</p>
                    <Button
                      variant="link"
                      onClick={() => transactionsQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </TableCell>
                </TableRow>
              ) : transactionsQuery.isLoading
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  )
                : filteredTopups.length === 0
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No transactions match your filters
                        </TableCell>
                      </TableRow>
                    )
                  : filteredTopups.slice(
                      0,
                      100,
                    ).map((t: {
                      id: string; created_at: string; msisdn: string; bundle_code: string; status: string; amount_ngn?: number; bundle?: { carrier?: string };
                    }) => {
                      const b = catalog.find(c => c.code === t.bundle_code);
                      const amt = Number(t.amount_ngn ?? b?.price_ngn ?? 0);
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="text-sm">{new Date(t.created_at).toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{formatMobile(t.msisdn)}</TableCell>
                          <TableCell>{t.bundle_code}</TableCell>
                          <TableCell>{fmtCurrency(amt)}</TableCell>
                          <TableCell>
                            <Badge variant={t.status === "SUCCESS" ? "default" : t.status === "FAILED" ? "destructive" : "secondary"}>
                              {t.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default TransactionHistoryPage;
