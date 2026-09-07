import type { WaybillInvoice } from "@/features/payouts-invoicing/utils/demoData";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, ArrowRight, CheckCircle2, Clock, Download, Eye, MoreHorizontal, Search, Share2, SlidersHorizontal, Trash2,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Sheet, SheetContent,
} from "@/components/shadcn/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import { InvoiceDetailView } from "@/features/payouts-invoicing/components/ui/InvoiceDetailView";
import { TabKpiCards } from "@/features/payouts-invoicing/components/ui/TabKpiCards";
import {
  useWaybillInvoice, useWaybillRealtimeEvents,
} from "@/features/payouts-invoicing/hooks/useWaybillInvoice";
import { DEMO_INVOICES } from "@/features/payouts-invoicing/utils/demoData";
import { invoiceStatusConfig } from "@/features/payouts-invoicing/utils/statusConfig";
import {
  inferVehicleType, VEHICLE_TYPE_OPTIONS,
} from "@/features/payouts-invoicing/utils/vehicleType";

export default function InvoicesPage() {
  const {
    invoices, invoiceConfig,
    fetchInvoices, fetchInvoiceConfig, fetchWaybills,
    updateInvoice, deleteInvoice, recordInvoiceShare, generateInvoicePDF, getInvoicePdfUrl,
  } = useWaybillInvoice();
  const { format: formatAmount } = useCurrency();
  const canDeleteAssets = true;

  const displayInvoices = invoices.length > 0 ? invoices : DEMO_INVOICES;

  const [
    selectedInvoice,
    setSelectedInvoice,
  ] = useState<WaybillInvoice | null>(null);
  const [
    invoiceToDelete,
    setInvoiceToDelete,
  ] = useState<WaybillInvoice | null>(null);
  const [
    invoiceSearch,
    setInvoiceSearch,
  ] = useState("");
  const [
    invoiceStatus,
    setInvoiceStatus,
  ] = useState("all");
  const [
    invVehicleEnabled,
    setInvVehicleEnabled,
  ] = useState(false);
  const [
    invVehicleType,
    setInvVehicleType,
  ] = useState("all");
  const [
    invDueEnabled,
    setInvDueEnabled,
  ] = useState(false);
  const [
    invDueFrom,
    setInvDueFrom,
  ] = useState("");
  const [
    invDueTo,
    setInvDueTo,
  ] = useState("");
  const [
    invAmountEnabled,
    setInvAmountEnabled,
  ] = useState(false);
  const [
    invAmountMin,
    setInvAmountMin,
  ] = useState("");
  const [
    invAmountMax,
    setInvAmountMax,
  ] = useState("");

  useWaybillRealtimeEvents({
    onWaybillChange: fetchWaybills,
    onInvoiceChange: fetchInvoices,
    showToasts: true,
  });

  useEffect(
    () => {
      fetchInvoices();
      fetchInvoiceConfig();
    },
    [
      fetchInvoices,
      fetchInvoiceConfig,
    ],
  );

  const filteredInvoices = displayInvoices.filter((inv) => {
    const q = invoiceSearch.toLowerCase();
    const matchesSearch = !q || [
      inv.invoice_number,
      inv.customer_name,
      inv.destination,
      inv.origin,
    ]
      .some(v => v?.toLowerCase().includes(q));
    const matchesStatus = invoiceStatus === "all" || inv.status === invoiceStatus;
    const matchesVehicle = !invVehicleEnabled || invVehicleType === "all" || inferVehicleType(inv.vehicle_number) === invVehicleType;
    const due = inv.due_date ? new Date(inv.due_date) : null;
    const matchesDueFrom = !invDueEnabled || !invDueFrom || (due && due >= new Date(invDueFrom));
    const matchesDueTo = !invDueEnabled || !invDueTo || (due && due <= new Date(`${invDueTo}T23:59:59`));
    const matchesAmtMin = !invAmountEnabled || !invAmountMin || inv.total_ngn >= Number(invAmountMin);
    const matchesAmtMax = !invAmountEnabled || !invAmountMax || inv.total_ngn <= Number(invAmountMax);
    return matchesSearch && matchesStatus && matchesVehicle && matchesDueFrom && matchesDueTo && matchesAmtMin && matchesAmtMax;
  });

  const invActiveFilters = [
    invDueEnabled,
    invAmountEnabled,
    invVehicleEnabled,
  ].filter(Boolean).length;

  const resetInvoiceFilters = () => {
    setInvDueEnabled(false);
    setInvDueFrom("");
    setInvDueTo("");
    setInvAmountEnabled(false);
    setInvAmountMin("");
    setInvAmountMax("");
    setInvVehicleEnabled(false);
    setInvVehicleType("all");
  };

  const stats = {
    totalInvoices: displayInvoices.length,
    pendingReviewInvoices: displayInvoices.filter(i => i.status === "pending_review").length,
    approvedInvoices: displayInvoices.filter(i => i.status === "approved").length,
    pendingInvoices: displayInvoices.filter(i => [
      "draft",
      "pending_review",
      "approved",
      "sent",
      "overdue",
    ].includes(i.status)).length,
  };

  return (
    <>
      <TabKpiCards stats={[
        {
          label: "Total Invoices", value: stats.totalInvoices, icon: Download,
        },
        {
          label: "Pending Invoices", value: stats.pendingInvoices, icon: Clock,
        },
        {
          label: "Pending Review", value: stats.pendingReviewInvoices, icon: AlertTriangle,
        },
        {
          label: "Approved Invoices", value: stats.approvedInvoices, icon: CheckCircle2,
        },
      ]}
      />

      <Card className="mt-4">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Invoices
              </CardTitle>
              <CardDescription>Customer invoices generated from waybills with status, amounts and due dates.</CardDescription>
            </div>
            <ExportButton
              filename="invoices"
              rows={filteredInvoices}
              columns={[
                {
                  header: "Invoice #", accessor: i => i.invoice_number,
                },
                {
                  header: "Status", accessor: i => i.status,
                },
                {
                  header: "Customer", accessor: i => i.customer_name || "",
                },
                {
                  header: "Origin", accessor: i => i.origin || "",
                },
                {
                  header: "Destination", accessor: i => i.destination || "",
                },
                {
                  header: "Vehicle", accessor: i => i.vehicle_number || "",
                },
                {
                  header: "Amount", accessor: i => i.total_ngn ?? "",
                },
                {
                  header: "Due Date", accessor: i => i.due_date || "",
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice #, customer, route..."
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
            <Select
              value={invoiceStatus}
              onValueChange={setInvoiceStatus}
            >
              <SelectTrigger className="w-full md:w-[180px] bg-card/50 border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(invoiceStatusConfig).map(([
                  k,
                  v,
                ]) => (
                  <SelectItem
                    key={k}
                    value={k}
                  >
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card/50 border-border/50 h-9 gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {" "}
                  Filter
                  {invActiveFilters > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5"
                    >
                      {invActiveFilters}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto"
                align="end"
              >
                <h4 className="text-xs font-medium text-foreground px-0.5">Only show invoices by...</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="inv-flt-veh"
                        checked={invVehicleEnabled}
                        onCheckedChange={c => setInvVehicleEnabled(c === true)}
                      />
                      <Label
                        htmlFor="inv-flt-veh"
                        className="text-sm cursor-pointer"
                      >
                        Vehicle type
                      </Label>
                    </div>
                    <Select
                      value={invVehicleType}
                      onValueChange={setInvVehicleType}
                      disabled={!invVehicleEnabled}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPE_OPTIONS.map(o => (
                          <SelectItem
                            key={o.value}
                            value={o.value}
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="inv-flt-due"
                        checked={invDueEnabled}
                        onCheckedChange={c => setInvDueEnabled(c === true)}
                      />
                      <Label
                        htmlFor="inv-flt-due"
                        className="text-sm cursor-pointer"
                      >
                        Due date
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        disabled={!invDueEnabled}
                        value={invDueFrom}
                        onChange={e => setInvDueFrom(e.target.value)}
                        className="h-9"
                      />
                      <Input
                        type="date"
                        disabled={!invDueEnabled}
                        value={invDueTo}
                        onChange={e => setInvDueTo(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="inv-flt-amt"
                        checked={invAmountEnabled}
                        onCheckedChange={c => setInvAmountEnabled(c === true)}
                      />
                      <Label
                        htmlFor="inv-flt-amt"
                        className="text-sm cursor-pointer"
                      >
                        Amount (₦)
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="From"
                        disabled={!invAmountEnabled}
                        value={invAmountMin}
                        onChange={e => setInvAmountMin(e.target.value)}
                        className="h-9"
                      />
                      <Input
                        type="number"
                        placeholder="To"
                        disabled={!invAmountEnabled}
                        value={invAmountMax}
                        onChange={e => setInvAmountMax(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button className="flex-1">Apply</Button>
                  <Button
                    variant="outline"
                    onClick={resetInvoiceFilters}
                    className="flex-1"
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Download className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No invoices found</p>
                        <p className="text-sm">Generate invoices from extracted waybills</p>
                      </TableCell>
                    </TableRow>
                  )
                : filteredInvoices.map((inv) => {
                    const ic = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
                    return (
                      <TableRow
                        key={inv.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <TableCell className="font-mono font-medium">{inv.invoice_number}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={ic.color}
                          >
                            {ic.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{inv.customer_name}</TableCell>
                        <TableCell className="text-sm">
                          {inv.origin && inv.destination
                            ? (
                                <span className="flex items-center gap-1">
                                  {inv.origin}
                                  {" "}
                                  <ArrowRight className="h-3 w-3" />
                                  {" "}
                                  {inv.destination}
                                </span>
                              )
                            : inv.destination || "—"}
                        </TableCell>
                        <TableCell>{inv.vehicle_number || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{formatAmount(inv.total_ngn)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {inv.due_date
                            ? formatWithPattern(
                                inv.due_date,
                                "dd MMM yyyy",
                              )
                            : "—"}
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex gap-1 justify-end items-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  aria-label="Invoice actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-52"
                              >
                                <DropdownMenuItem onClick={() => setSelectedInvoice(inv)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    if (inv.id.startsWith("demo-")) {
                                      toast.success("Download downloaded");
                                      return;
                                    }
                                    let path = inv.pdf_storage_path;
                                    if (!path) {
                                      const res = await generateInvoicePDF(inv.id);
                                      path = res?.storage_path ?? null;
                                    }
                                    if (!path)
                                      return;
                                    const url = await getInvoicePdfUrl(path);
                                    if (url) {
                                      window.open(
                                        url,
                                        "_blank",
                                      );
                                      toast.success("Download download started");
                                    }
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Receipt
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={![
                                    "approved",
                                    "sent",
                                    "paid",
                                  ].includes(inv.status)}
                                  onClick={() => setSelectedInvoice(inv)}
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share Receipt
                                </DropdownMenuItem>
                                {canDeleteAssets && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setInvoiceToDelete(inv)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Invoice
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet
        open={!!selectedInvoice}
        onOpenChange={open => !open && setSelectedInvoice(null)}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedInvoice && (
            <InvoiceDetailView
              invoice={selectedInvoice}
              config={invoiceConfig}
              formatAmount={formatAmount}
              onUpdate={updates => updateInvoice(
                selectedInvoice.id,
                updates,
              )}
              onRecordShare={(channel, recipient) => recordInvoiceShare(
                selectedInvoice.id,
                channel,
                recipient,
              )}
              onGeneratePDF={() => generateInvoicePDF(selectedInvoice.id)}
              onGetPdfUrl={path => getInvoicePdfUrl(path)}
              onSendEmail={async (_invoiceId, _data) => {
                toast.info("Coming soon");
                return false;
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!invoiceToDelete}
        onOpenChange={o => !o && setInvoiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete invoice
              {invoiceToDelete?.invoice_number}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The invoice will be permanently
              removed for
              {" "}
              {invoiceToDelete?.customer_name || "this customer"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (invoiceToDelete) {
                  await deleteInvoice(invoiceToDelete.id);
                  setInvoiceToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
