import {
  AlertCircle, Calendar, CheckCircle, Clock, Download, FileText,
} from "lucide-react";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Separator } from "@/components/shadcn/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatCurrency } from "@/lib/currency";
import { downloadReceiptPDF } from "@/lib/receiptPdf";

type TenantInvoice = {
  id: string;
  invoiceNumber: string;
  plan: string;
  period: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  paidDate: string | null;
  paymentMethod: "mtn_momo" | "bank_transfer" | "card" | null;
  items: {
    description: string; quantity: number; unitPrice: number; total: number;
  }[];
};

const DEMO_INVOICES: TenantInvoice[] = [
  {
    id: "inv-t-001",
    invoiceNumber: "INV-2025-0042",
    plan: "Professional",
    period: "April 2026",
    amount: 149900,
    status: "paid",
    dueDate: "2026-04-15",
    paidDate: "2026-04-10",
    paymentMethod: "mtn_momo",
    items: [
      {
        description: "Professional Plan — Monthly", quantity: 1, unitPrice: 129900, total: 129900,
      },
      {
        description: "Additional Vehicles (5)", quantity: 5, unitPrice: 4000, total: 20000,
      },
    ],
  },
  {
    id: "inv-t-002",
    invoiceNumber: "INV-2025-0031",
    plan: "Professional",
    period: "March 2026",
    amount: 129900,
    status: "paid",
    dueDate: "2026-03-15",
    paidDate: "2026-03-12",
    paymentMethod: "mtn_momo",
    items: [
      {
        description: "Professional Plan — Monthly", quantity: 1, unitPrice: 129900, total: 129900,
      },
    ],
  },
  {
    id: "inv-t-003",
    invoiceNumber: "INV-2025-0024",
    plan: "Professional",
    period: "February 2026",
    amount: 129900,
    status: "paid",
    dueDate: "2026-02-15",
    paidDate: "2026-02-14",
    paymentMethod: "bank_transfer",
    items: [
      {
        description: "Professional Plan — Monthly", quantity: 1, unitPrice: 129900, total: 129900,
      },
    ],
  },
  {
    id: "inv-t-004",
    invoiceNumber: "INV-2025-0051",
    plan: "Professional",
    period: "May 2026",
    amount: 149900,
    status: "pending",
    dueDate: "2026-05-15",
    paidDate: null,
    paymentMethod: null,
    items: [
      {
        description: "Professional Plan — Monthly", quantity: 1, unitPrice: 129900, total: 129900,
      },
      {
        description: "Additional Vehicles (5)", quantity: 5, unitPrice: 4000, total: 20000,
      },
    ],
  },
];

function statusBadge(status: TenantInvoice["status"]) {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">
          <CheckCircle className="h-3 w-3 mr-1" />
          {" "}
          Paid
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="bg-warning/10 text-warning border-warning/20"
        >
          <Clock className="h-3 w-3 mr-1" />
          {" "}
          Pending
        </Badge>
      );
    case "overdue":
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          {" "}
          Overdue
        </Badge>
      );
  }
}

type Props = { tenantName: string };

export function SubscriptionInvoicesCard({ tenantName }: Props) {
  const [
    selected,
    setSelected,
  ] = useState<TenantInvoice | null>(null);
  const [
    open,
    setOpen,
  ] = useState(false);
  const invoices = DEMO_INVOICES;

  const handleDownload = (inv: TenantInvoice) => {
    if (inv.status !== "paid" || !inv.paidDate) {
      toast.error("Download is only available after payment is confirmed");
      return;
    }
    const subtotal = inv.items.reduce(
      (s, i) => s + i.total,
      0,
    );
    downloadReceiptPDF({
      invoiceNumber: inv.invoiceNumber,
      tenantName,
      plan: inv.plan,
      period: inv.period,
      issueDate: inv.dueDate,
      paidDate: inv.paidDate,
      dueDate: inv.dueDate,
      paymentMethod: inv.paymentMethod
        ? inv.paymentMethod.replace(
            "_",
            " ",
          ).toUpperCase()
        : "—",
      paymentReference: `PAY-${inv.invoiceNumber}`,
      items: inv.items,
      subtotal,
      amount: inv.amount,
      currency: "NGN",
    });
    toast.success(`Download for ${inv.invoiceNumber} downloaded`);
  };

  const totalPaid = invoices
    .filter(i => i.status === "paid")
    .reduce(
      (sum, i) => sum + i.amount,
      0,
    );
  const pendingCount = invoices.filter(i => i.status !== "paid").length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Subscription Invoices
              </CardTitle>
              <CardDescription>
                Your subscription billing history. Download a receipt after any successful payment.
              </CardDescription>
            </div>
            <div className="hidden sm:flex gap-2">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total paid (last 12mo)</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(
                    totalPaid,
                    "NGN",
                  )}
                </p>
              </div>
              <Separator
                orientation="vertical"
                className="h-10"
              />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-lg font-bold text-foreground">{pendingCount}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due / Paid</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(inv => (
                <TableRow
                  key={inv.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelected(inv);
                    setOpen(true);
                  }}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.plan}
                        {" "}
                        Plan
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{inv.period}</TableCell>
                  <TableCell>{statusBadge(inv.status)}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {inv.paidDate ?? inv.dueDate}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(
                      inv.amount,
                      "NGN",
                    )}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={e => e.stopPropagation()}
                  >
                    {inv.status === "paid"
                      ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(inv)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Receipt
                          </Button>
                        )
                      : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled
                          >
                            Awaiting payment
                          </Button>
                        )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              {selected?.invoiceNumber}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {selected && statusBadge(selected.status)}
              <span>{selected?.period}</span>
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bill to</p>
                <p className="font-medium">{tenantName}</p>
                <p className="text-sm text-muted-foreground">
                  {selected.plan}
                  {" "}
                  Plan
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Items</p>
                {selected.items.map((it, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm p-2 rounded bg-muted/30"
                  >
                    <div>
                      <p>{it.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.quantity}
                        {" "}
                        ×
                        {formatCurrency(
                          it.unitPrice,
                          "NGN",
                        )}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(
                        it.total,
                        "NGN",
                      )}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(
                      selected.amount,
                      "NGN",
                    )}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due date</span>
                  <span>{selected.dueDate}</span>
                </div>
                {selected.paidDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid on</span>
                    <span className="text-success">{selected.paidDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="capitalize">
                    {selected.paymentMethod?.replace(
                      "_",
                      " ",
                    ) || "Not paid"}
                  </span>
                </div>
              </div>

              {selected.status === "paid"
                ? (
                    <Button
                      className="w-full bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => handleDownload(selected)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  )
                : (
                    <div className="rounded-md bg-warning/10 border border-warning/20 p-3 text-sm">
                      <p className="font-medium text-warning flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {" "}
                        Awaiting payment confirmation
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your receipt will be available here as soon as payment is confirmed by our billing team.
                      </p>
                    </div>
                  )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
