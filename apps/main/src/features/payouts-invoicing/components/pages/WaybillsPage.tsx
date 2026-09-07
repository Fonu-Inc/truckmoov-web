import type { WaybillRecord } from "@/features/payouts-invoicing/utils/demoData";
import {
  formatWithPattern, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, CheckCircle2, Download, Eye, FileText, ImageIcon, Loader2, MoreHorizontal, Scan, Search, SlidersHorizontal, Upload,
} from "lucide-react";
import React, {
  useCallback, useEffect, useRef, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
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
import { TabKpiCards } from "@/features/payouts-invoicing/components/ui/TabKpiCards";
import {
  WaybillDetailView, WaybillThumbnail,
} from "@/features/payouts-invoicing/components/ui/WaybillDetailView";
import {
  useWaybillInvoice, useWaybillRealtimeEvents,
} from "@/features/payouts-invoicing/hooks/useWaybillInvoice";
import { DEMO_WAYBILLS } from "@/features/payouts-invoicing/utils/demoData";
import { statusConfig } from "@/features/payouts-invoicing/utils/statusConfig";
import {
  inferVehicleType, VEHICLE_TYPE_OPTIONS,
} from "@/features/payouts-invoicing/utils/vehicleType";

export default function WaybillsPage() {
  const {
    waybills,
    fetchWaybills,
    fetchInvoices,
    createWaybill,
    extractWaybill,
    updateWaybillFields,
    generateInvoice,
    generateInvoicePDF,
  } = useWaybillInvoice();
  const { format: formatAmount } = useCurrency();

  const displayWaybills = waybills.length > 0 ? waybills : DEMO_WAYBILLS;

  const [
    selectedWaybill,
    setSelectedWaybill,
  ] = useState<WaybillRecord | null>(null);
  const [
    showUploadDialog,
    setShowUploadDialog,
  ] = useState(false);
  const [
    extracting,
    setExtracting,
  ] = useState<string | null>(null);
  const [
    generating,
    setGenerating,
  ] = useState<string | null>(null);
  const [
    waybillSearch,
    setWaybillSearch,
  ] = useState("");
  const [
    waybillStatus,
    setWaybillStatus,
  ] = useState("all");
  const [
    wbDateEnabled,
    setWbDateEnabled,
  ] = useState(false);
  const [
    wbDateFrom,
    setWbDateFrom,
  ] = useState("");
  const [
    wbDateTo,
    setWbDateTo,
  ] = useState("");
  const [
    wbPriceEnabled,
    setWbPriceEnabled,
  ] = useState(false);
  const [
    wbPriceMin,
    setWbPriceMin,
  ] = useState("");
  const [
    wbPriceMax,
    setWbPriceMax,
  ] = useState("");
  const [
    wbVehicleEnabled,
    setWbVehicleEnabled,
  ] = useState(false);
  const [
    wbVehicleType,
    setWbVehicleType,
  ] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useWaybillRealtimeEvents({
    onWaybillChange: fetchWaybills,
    onInvoiceChange: fetchInvoices,
    showToasts: true,
  });

  useEffect(
    () => {
      fetchWaybills();
    },
    [fetchWaybills],
  );

  const filteredWaybills = displayWaybills.filter((w) => {
    const q = waybillSearch.toLowerCase();
    const matchesSearch = !q || [
      w.waybill_number,
      w.destination,
      w.vehicle_number,
      w.customer_name,
    ]
      .some(v => v?.toLowerCase().includes(q));
    const matchesStatus = waybillStatus === "all" || w.status === waybillStatus;
    const created = new Date(w.created_at);
    const matchesDateFrom = !wbDateEnabled || !wbDateFrom || created >= new Date(wbDateFrom);
    const matchesDateTo = !wbDateEnabled || !wbDateTo || created <= new Date(`${wbDateTo}T23:59:59`);
    const price = w.calculated_price_ngn ?? 0;
    const matchesPriceMin = !wbPriceEnabled || !wbPriceMin || price >= Number(wbPriceMin);
    const matchesPriceMax = !wbPriceEnabled || !wbPriceMax || price <= Number(wbPriceMax);
    const matchesVehicle = !wbVehicleEnabled || wbVehicleType === "all" || inferVehicleType(w.vehicle_number) === wbVehicleType;
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesPriceMin && matchesPriceMax && matchesVehicle;
  });

  const wbActiveFilters = [
    wbDateEnabled,
    wbPriceEnabled,
    wbVehicleEnabled,
  ].filter(Boolean).length;

  const resetWaybillFilters = () => {
    setWbDateEnabled(false);
    setWbDateFrom("");
    setWbDateTo("");
    setWbPriceEnabled(false);
    setWbPriceMin("");
    setWbPriceMax("");
    setWbVehicleEnabled(false);
    setWbVehicleType("all");
  };

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file)
        return;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const waybill = await createWaybill({
          source_type: "upload",
          image_url: URL.createObjectURL(file),
        });
        if (waybill) {
          setExtracting(waybill.id);
          await extractWaybill(
            waybill.id,
            undefined,
            base64,
          );
          setExtracting(null);
          setShowUploadDialog(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [
      createWaybill,
      extractWaybill,
    ],
  );

  const handleExtract = useCallback(
    async (waybill: WaybillRecord) => {
      setExtracting(waybill.id);
      await extractWaybill(
        waybill.id,
        waybill.image_url || undefined,
      );
      setExtracting(null);
    },
    [extractWaybill],
  );

  const handleGenerateInvoice = useCallback(
    async (waybillId: string) => {
      setGenerating(waybillId);
      const invoice = await generateInvoice(waybillId);
      if (invoice)
        await generateInvoicePDF(invoice.id);
      setGenerating(null);
    },
    [
      generateInvoice,
      generateInvoicePDF,
    ],
  );

  const totalWaybills = displayWaybills.length;
  const needsReview = displayWaybills.filter((w: any) => w.status === "needs_review").length;
  const extracted = displayWaybills.filter((w: any) => w.status === "extracted" || w.status === "approved").length;
  const invoiced = displayWaybills.filter((w: any) => w.status === "invoice_generated").length;

  return (
    <>
      <div className="flex items-center justify-end">
        <Dialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
        >
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Waybill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Waybill Image</DialogTitle>
              <DialogDescription>Upload a photo of a waybill. AI will extract the key fields automatically.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Click to upload waybill photo</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <TabKpiCards stats={[
        {
          label: "Total Waybills", value: totalWaybills, icon: FileText,
        },
        {
          label: "Extracted", value: extracted, icon: CheckCircle2,
        },
        {
          label: "Needs Review", value: needsReview, icon: AlertTriangle,
        },
        {
          label: "Invoiced", value: invoiced, icon: Download,
        },
      ]}
      />

      <Card className="mt-4">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Waybills
              </CardTitle>
              <CardDescription>All captured waybills from drivers, WhatsApp uploads and manual entries.</CardDescription>
            </div>
            <ExportButton
              filename="waybills"
              rows={filteredWaybills}
              columns={[
                {
                  header: "Status", accessor: w => w.status,
                },
                {
                  header: "Source", accessor: w => w.source_type,
                },
                {
                  header: "Waybill #", accessor: w => w.waybill_number || "",
                },
                {
                  header: "Destination", accessor: w => w.destination || "",
                },
                {
                  header: "Vehicle", accessor: w => w.vehicle_number || "",
                },
                {
                  header: "Customer", accessor: w => w.customer_name || "",
                },
                {
                  header: "Price", accessor: w => w.calculated_price_ngn ?? "",
                },
                {
                  header: "Date", accessor: w => toDateParam(w.created_at),
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by waybill #, destination, vehicle, customer..."
                value={waybillSearch}
                onChange={e => setWaybillSearch(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
            <Select
              value={waybillStatus}
              onValueChange={setWaybillStatus}
            >
              <SelectTrigger className="w-full md:w-[180px] bg-card/50 border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(statusConfig).map(([
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
                  {wbActiveFilters > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5"
                    >
                      {wbActiveFilters}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto"
                align="end"
              >
                <h4 className="text-xs font-medium text-foreground px-0.5">Only show waybills by...</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="wb-flt-date"
                        checked={wbDateEnabled}
                        onCheckedChange={c => setWbDateEnabled(c === true)}
                      />
                      <Label
                        htmlFor="wb-flt-date"
                        className="text-sm cursor-pointer"
                      >
                        Date
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        disabled={!wbDateEnabled}
                        value={wbDateFrom}
                        onChange={e => setWbDateFrom(e.target.value)}
                        className="h-9"
                      />
                      <Input
                        type="date"
                        disabled={!wbDateEnabled}
                        value={wbDateTo}
                        onChange={e => setWbDateTo(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="wb-flt-price"
                        checked={wbPriceEnabled}
                        onCheckedChange={c => setWbPriceEnabled(c === true)}
                      />
                      <Label
                        htmlFor="wb-flt-price"
                        className="text-sm cursor-pointer"
                      >
                        Price (₦)
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="From"
                        disabled={!wbPriceEnabled}
                        value={wbPriceMin}
                        onChange={e => setWbPriceMin(e.target.value)}
                        className="h-9"
                      />
                      <Input
                        type="number"
                        placeholder="To"
                        disabled={!wbPriceEnabled}
                        value={wbPriceMax}
                        onChange={e => setWbPriceMax(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="wb-flt-veh"
                        checked={wbVehicleEnabled}
                        onCheckedChange={c => setWbVehicleEnabled(c === true)}
                      />
                      <Label
                        htmlFor="wb-flt-veh"
                        className="text-sm cursor-pointer"
                      >
                        Vehicle type
                      </Label>
                    </div>
                    <Select
                      value={wbVehicleType}
                      onValueChange={setWbVehicleType}
                      disabled={!wbVehicleEnabled}
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
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button className="flex-1">Apply</Button>
                  <Button
                    variant="outline"
                    onClick={resetWaybillFilters}
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
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Waybill #</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWaybills.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No waybills found</p>
                        <p className="text-sm">Upload a waybill image or adjust filters</p>
                      </TableCell>
                    </TableRow>
                  )
                : filteredWaybills.map((wb) => {
                    const sc = statusConfig[wb.status] || statusConfig.received;
                    return (
                      <TableRow
                        key={wb.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedWaybill(wb)}
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={sc.color}
                          >
                            <sc.icon className="h-3 w-3 mr-1" />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {wb.image_url || wb.image_storage_path
                              ? (
                                  <div className="h-8 w-8 rounded border overflow-hidden bg-muted flex-shrink-0">
                                    <WaybillThumbnail waybill={wb} />
                                  </div>
                                )
                              : (
                                  <div className="h-8 w-8 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                                  </div>
                                )}
                            <span className="capitalize">{wb.source_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{wb.waybill_number || "—"}</TableCell>
                        <TableCell>{wb.destination || "—"}</TableCell>
                        <TableCell>{wb.vehicle_number || "—"}</TableCell>
                        <TableCell>{wb.customer_name || "—"}</TableCell>
                        <TableCell>{wb.calculated_price_ngn ? formatAmount(wb.calculated_price_ngn) : "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatWithPattern(
                            wb.created_at,
                            "dd MMM yyyy",
                          )}
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex gap-1 justify-end items-center">
                            {[
                              "received",
                              "extraction_failed",
                            ].includes(wb.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={extracting === wb.id}
                                onClick={() => handleExtract(wb)}
                              >
                                {extracting === wb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scan className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  aria-label="Waybill actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-52"
                              >
                                <DropdownMenuItem onClick={() => setSelectedWaybill(wb)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {[
                                  "received",
                                  "extraction_failed",
                                ].includes(wb.status) && (
                                  <DropdownMenuItem
                                    disabled={extracting === wb.id}
                                    onClick={() => handleExtract(wb)}
                                  >
                                    <Scan className="h-4 w-4 mr-2" />
                                    Extract Fields
                                  </DropdownMenuItem>
                                )}
                                {[
                                  "extracted",
                                  "needs_review",
                                  "approved",
                                ].includes(wb.status) && (
                                  <DropdownMenuItem
                                    disabled={generating === wb.id}
                                    onClick={() => handleGenerateInvoice(wb.id)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Generate Invoice
                                  </DropdownMenuItem>
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
        open={!!selectedWaybill}
        onOpenChange={open => !open && setSelectedWaybill(null)}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedWaybill && (
            <WaybillDetailView
              waybill={selectedWaybill}
              onExtract={() => handleExtract(selectedWaybill)}
              onGenerateInvoice={() => handleGenerateInvoice(selectedWaybill.id)}
              onApprove={async () => {
                const updated = await updateWaybillFields(
                  selectedWaybill.id,
                  { status: "approved" },
                );
                if (updated)
                  setSelectedWaybill(updated);
              }}
              onUpdateFields={async (updates) => {
                const updated = await updateWaybillFields(
                  selectedWaybill.id,
                  updates,
                );
                if (updated)
                  setSelectedWaybill(updated);
              }}
              extracting={extracting === selectedWaybill.id}
              generating={generating === selectedWaybill.id}
              formatAmount={formatAmount}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
