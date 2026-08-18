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
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";

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

export function WalletTransactionHistory() {
  const [transactions] = useState<WalletTransaction[]>([]);
  const [loading] = useState(false);
  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");
  const [
    typeFilter,
    setTypeFilter,
  ] = useState<string>("all");
  const [
    commTypeFilter,
    setCommTypeFilter,
  ] = useState<string>("all");

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch
      = tx.tenant_id.toLowerCase().includes(searchTerm.toLowerCase())
        || tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
        || tx.reference_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || tx.transaction_type === typeFilter;
    const matchesCommType = commTypeFilter === "all" || tx.communication_type === commTypeFilter;

    return matchesSearch && matchesType && matchesCommType;
  });

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
            className="bg-red-500/10 text-red-500 border-red-500/20"
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
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            <ArrowUpRight className="h-3 w-3 mr-1" />
            {type === "topup" ? "Top Up" : "Credit"}
          </Badge>
        );
      case "refund":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-500 border-blue-500/20"
          >
            <ArrowUpRight className="h-3 w-3 mr-1" />
            Refund
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const exportTransactions = () => {
    const csv = [
      [
        "Date",
        "Tenant",
        "Type",
        "Channel",
        "Quantity",
        "Rate",
        "Amount",
        "Balance Before",
        "Balance After",
        "Description",
      ].join(","),
      ...filteredTransactions.map(tx => [
        new Date(tx.created_at).toISOString(),
        tx.tenant_id,
        tx.transaction_type,
        tx.communication_type || "",
        tx.quantity || "",
        tx.unit_rate_ngn || "",
        tx.amount_ngn,
        tx.balance_before_ngn,
        tx.balance_after_ngn,
        `"${tx.description || ""}"`,
      ].join(",")),
    ].join("\n");

    const blob = new Blob(
      [csv],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallet-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
              onClick={exportTransactions}
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
            {
              value: "debit",
              label: "Debit",
            },
            {
              value: "credit",
              label: "Credit",
            },
            {
              value: "topup",
              label: "Top Up",
            },
            {
              value: "refund",
              label: "Refund",
            },
          ]}
          filterEntity="transactions"
          filterFields={[
            {
              type: "select",
              key: "channel",
              label: "Channel",
              options: [
                {
                  value: "call",
                  label: "Voice Call",
                },
                {
                  value: "sms",
                  label: "SMS",
                },
                {
                  value: "whatsapp",
                  label: "WhatsApp",
                },
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )
                : (
                    filteredTransactions.map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">
                          <div>{formatDate(tx.created_at)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(tx.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{tx.tenant_id}</TableCell>
                        <TableCell>{getTransactionBadge(tx.transaction_type)}</TableCell>
                        <TableCell>
                          {tx.communication_type && (
                            <div className="flex items-center gap-1 capitalize">
                              {getTypeIcon(tx.communication_type)}
                              {tx.communication_type}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.quantity && (
                            <span>
                              {tx.quantity}
                              {" "}
                              {tx.communication_type === "call" ? "min" : "msg"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.unit_rate_ngn && `₦${tx.unit_rate_ngn}`}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.transaction_type === "debit" ? "text-red-500" : "text-green-500"}`}>
                          {tx.transaction_type === "debit" ? "-" : "+"}
                          ₦
                          {tx.amount_ngn.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₦
                          {tx.balance_after_ngn.toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                          {tx.description}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing
          {" "}
          {filteredTransactions.length}
          {" "}
          of
          {" "}
          {transactions.length}
          {" "}
          transactions
        </div>
      </CardContent>
    </Card>
  );
}
