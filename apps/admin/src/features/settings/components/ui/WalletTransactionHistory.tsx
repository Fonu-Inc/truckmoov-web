import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { getPlatformWalletLedgerQueryOptions } from "@truckmoov/api/auth";
import {
  formatDate,
  formatTime,
} from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  History,
  MessageCircle,
  MessageSquare,
  Phone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";

// ponytail: response schema not shipped by spec — assumed shape mirrors legacy mock; tighten when @ApiResponse lands
type WalletTransaction = {
  id: string;
  tenant_id: string;
  transaction_type: string;
  communication_type: string | null;
  quantity: number | null;
  unit_rate_ngn: number | null;
  amount_ngn: number;
  balance_before_ngn: number;
  balance_after_ngn: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(setDebounced, delayMs, value);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);
  return debounced;
}

export function WalletTransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [commTypeFilter, setCommTypeFilter] = useState<string>("all");

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const ledgerQuery = useQuery(
    getPlatformWalletLedgerQueryOptions({
      params: {
        query: debouncedSearch || undefined,
        category: typeFilter !== "all" ? typeFilter : undefined,
      },
    }),
  );

  const responseData = ledgerQuery.data?.data as { items?: WalletTransaction[]; total?: number } | undefined;
  const transactions = useMemo<WalletTransaction[]>(
    () => responseData?.items ?? [],
    [responseData],
  );
  const total = responseData?.total ?? transactions.length;

  // ponytail: channel filter applied client-side — ledger endpoint's `direction` param
  // doesn't map cleanly to voice/sms/whatsapp; move server-side once spec clarifies
  const filteredTransactions = useMemo(
    () =>
      transactions.filter(tx =>
        commTypeFilter === "all" || tx.communication_type === commTypeFilter,
      ),
    [transactions, commTypeFilter],
  );

  const getTypeIcon = (commType: string | null) => {
    switch (commType) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "whatsapp":
        return <MessageCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "debit":
        return (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/20"
          >
            <ArrowDownRight className="h-3 w-3 mr-1" />
            Debit
          </Badge>
        );
      case "credit":
      case "topup":
        return (
          <Badge
            variant="outline"
            className="bg-success/10 text-success border-success/20"
          >
            <ArrowUpRight className="h-3 w-3 mr-1" />
            {type === "topup" ? "Top Up" : "Credit"}
          </Badge>
        );
      case "refund":
        return (
          <Badge
            variant="outline"
            className="bg-info/10 text-info border-info/20"
          >
            <ArrowUpRight className="h-3 w-3 mr-1" />
            Refund
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const txColumns: ColumnDef<WalletTransaction>[] = [
    {
      accessorKey: "created_at",
      header: "Date/Time",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{formatDate(row.original.created_at)}</div>
          <div className="text-xs text-muted-foreground">
            {formatTime(row.original.created_at)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tenant_id",
      header: "Tenant",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.tenant_id}</span>
      ),
    },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ row }) => getTransactionBadge(row.original.transaction_type),
    },
    {
      accessorKey: "communication_type",
      header: "Channel",
      cell: ({ row }) => (
        row.original.communication_type
          ? (
              <div className="flex items-center gap-1 capitalize">
                {getTypeIcon(row.original.communication_type)}
                {row.original.communication_type}
              </div>
            )
          : null
      ),
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => (
        row.original.quantity
          ? (
              <span>
                {row.original.quantity}
                {" "}
                {row.original.communication_type === "call" ? "min" : "msg"}
              </span>
            )
          : null
      ),
    },
    {
      accessorKey: "unit_rate_ngn",
      header: "Rate",
      cell: ({ row }) => (row.original.unit_rate_ngn ? `₦${row.original.unit_rate_ngn}` : null),
    },
    {
      accessorKey: "amount_ngn",
      header: () => <div className="text-right">Amount</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <span className={`font-medium ${row.original.transaction_type === "debit" ? "text-destructive" : "text-success"}`}>
          {row.original.transaction_type === "debit" ? "-" : "+"}
          ₦
          {row.original.amount_ngn.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "balance_after_ngn",
      header: () => <div className="text-right">Balance After</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <>
          ₦
          {row.original.balance_after_ngn.toLocaleString()}
        </>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      meta: { className: "max-w-[200px] truncate text-muted-foreground text-sm" },
      cell: ({ row }) => row.original.description,
    },
  ];

  const hasActiveFilters
    = !!searchTerm || typeFilter !== "all" || commTypeFilter !== "all";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Transaction History
            </CardTitle>
            <CardDescription>
              View all wallet transactions across tenants
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => toast.info("Endpoint coming soon")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TableToolbar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by tenant, description, or reference..."
          status={typeFilter}
          onStatusChange={setTypeFilter}
          statusOptions={[
            { value: "debit", label: "Debit" },
            { value: "credit", label: "Credit" },
            { value: "topup", label: "Top Up" },
            { value: "refund", label: "Refund" },
          ]}
          filterEntity="transactions"
          filterFields={[
            {
              type: "select",
              key: "channel",
              label: "Channel",
              options: [
                { value: "call", label: "Voice Call" },
                { value: "sms", label: "SMS" },
                { value: "whatsapp", label: "WhatsApp" },
              ],
            },
          ]}
          filterValues={{
            channel: {
              enabled: commTypeFilter !== "all",
              value: commTypeFilter,
            },
          }}
          onFiltersApply={values =>
            setCommTypeFilter(values.channel?.enabled ? values.channel.value ?? "all" : "all")}
        />

        <div className="rounded-md border">
          <DataTable
            columns={txColumns}
            data={filteredTransactions}
            isLoading={ledgerQuery.isLoading}
            isError={ledgerQuery.isError}
            errorMessage="Failed to load transaction history."
            onRetry={() => ledgerQuery.refetch()}
            hasActiveFilters={hasActiveFilters}
            emptyState="No transactions found"
            filteredEmptyState="No transactions match your filters."
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Showing
          {" "}
          {filteredTransactions.length}
          {" "}
          of
          {" "}
          {total}
          {" "}
          transactions
          {/* ponytail: no pagination — add pager when result set grows */}
        </div>
      </CardContent>
    </Card>
  );
}
