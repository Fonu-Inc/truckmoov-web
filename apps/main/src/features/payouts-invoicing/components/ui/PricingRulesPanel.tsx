import type { PricingRule } from "@/features/payouts-invoicing/utils/demoData";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowRight, DollarSign, MoreHorizontal, Pencil, Search, SlidersHorizontal, ToggleLeft, ToggleRight, Trash2,
} from "lucide-react";
import { useState } from "react";
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { Textarea } from "@/components/shadcn/textarea";

export function PricingRulesPanel({
  rules, onAdd, onUpdate, onDelete, formatAmount, showDialog, setShowDialog,
}: {
  rules: PricingRule[];
  onAdd: (rule: Partial<PricingRule>) => void;
  onUpdate: (ruleId: string, updates: Partial<PricingRule>) => void;
  onDelete: (ruleId: string) => void;
  formatAmount: (n: number) => string;
  showDialog: boolean;
  setShowDialog: (v: boolean) => void;
}) {
  const emptyForm: Partial<PricingRule> = {
    rule_name: "", destination: "", price_ngn: 0, origin: "", vehicle_type: "", customer_name: "", notes: "", price_per_unit_ngn: null, unit_type: "", pricing_mode: "FLAT", currency: "NGN", minimum_charge: null, destination_aliases: [],
  };
  const [
    form,
    setForm,
  ] = useState<Partial<PricingRule>>(emptyForm);
  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(null);
  const [
    deleteConfirm,
    setDeleteConfirm,
  ] = useState<string | null>(null);

  const openEdit = (rule: PricingRule) => {
    setForm({
      rule_name: rule.rule_name,
      destination: rule.destination,
      origin: rule.origin || "",
      price_ngn: rule.price_ngn,
      price_per_unit_ngn: rule.price_per_unit_ngn,
      unit_type: rule.unit_type || "",
      vehicle_type: rule.vehicle_type || "",
      customer_name: rule.customer_name || "",
      notes: rule.notes || "",
      effective_from: rule.effective_from,
      effective_to: rule.effective_to || "",
      pricing_mode: rule.pricing_mode || "FLAT",
      currency: rule.currency || "NGN",
      minimum_charge: rule.minimum_charge,
      destination_aliases: rule.destination_aliases || [],
    });
    setEditingId(rule.id);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingId) {
      onUpdate(
        editingId,
        form,
      );
    }
    else {
      onAdd(form);
    }
    setShowDialog(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleClose = () => {
    setShowDialog(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<"all" | "active" | "inactive">("all");
  const [
    vehicleTypeEnabled,
    setVehicleTypeEnabled,
  ] = useState(false);
  const [
    vehicleTypeFilter,
    setVehicleTypeFilter,
  ] = useState("all");
  const [
    pricingModeEnabled,
    setPricingModeEnabled,
  ] = useState(false);
  const [
    pricingModeFilter,
    setPricingModeFilter,
  ] = useState<"all" | PricingRule["pricing_mode"]>("all");
  const [
    perUnitOnly,
    setPerUnitOnly,
  ] = useState(false);

  const vehicleTypeOptions = Array.from(new Set(rules.map(r => r.vehicle_type).filter(Boolean))) as string[];

  const filteredRules = rules.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || [
      r.rule_name,
      r.destination,
      r.origin,
      r.customer_name,
      r.vehicle_type,
    ]
      .some(v => v?.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? r.is_active : !r.is_active);
    const matchesVehicle = !vehicleTypeEnabled || vehicleTypeFilter === "all" || r.vehicle_type === vehicleTypeFilter;
    const matchesMode = !pricingModeEnabled || pricingModeFilter === "all" || r.pricing_mode === pricingModeFilter;
    const matchesPerUnit = !perUnitOnly || (r.price_per_unit_ngn != null && r.price_per_unit_ngn > 0);
    return matchesSearch && matchesStatus && matchesVehicle && matchesMode && matchesPerUnit;
  });

  const ruleActiveFilters = [
    vehicleTypeEnabled,
    pricingModeEnabled,
    perUnitOnly,
  ].filter(Boolean).length;
  const resetRuleFilters = () => {
    setVehicleTypeEnabled(false);
    setVehicleTypeFilter("all");
    setPricingModeEnabled(false);
    setPricingModeFilter("all");
    setPerUnitOnly(false);
  };

  return (
    <div className="space-y-4">
      <Dialog
        open={showDialog}
        onOpenChange={(v) => {
          if (!v)
            handleClose();
          else
            setShowDialog(true);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Pricing Rule" : "Add Pricing Rule"}</DialogTitle>
            <DialogDescription>Define a pricing agreement for a route or customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Rule Name *</Label>
              <Input
                value={form.rule_name}
                onChange={e => setForm(f => ({
                  ...f, rule_name: e.target.value,
                }))}
                placeholder="e.g. Lagos→Abuja Dangote Cement"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Origin</Label>
                <Input
                  value={form.origin || ""}
                  onChange={e => setForm(f => ({
                    ...f, origin: e.target.value,
                  }))}
                  placeholder="e.g. Lagos"
                />
              </div>
              <div>
                <Label>Destination *</Label>
                <Input
                  value={form.destination}
                  onChange={e => setForm(f => ({
                    ...f, destination: e.target.value,
                  }))}
                  placeholder="e.g. Abuja"
                />
              </div>
            </div>
            <div>
              <Label>Destination Aliases (comma-separated)</Label>
              <Input
                value={(form.destination_aliases as string[] || []).join(", ")}
                onChange={e => setForm(f => ({
                  ...f, destination_aliases: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                }))}
                placeholder="e.g. FCT, Abuja Central"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pricing Mode</Label>
                <Select
                  value={form.pricing_mode || "FLAT"}
                  onValueChange={v => setForm(f => ({
                    ...f, pricing_mode: v as PricingRule["pricing_mode"],
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat Rate</SelectItem>
                    <SelectItem value="PER_WEIGHT">Per Weight (ton/kg)</SelectItem>
                    <SelectItem value="PER_DISTANCE">Per Distance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={form.currency || "NGN"}
                  onValueChange={v => setForm(f => ({
                    ...f, currency: v,
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Flat Price (₦)</Label>
                <Input
                  type="number"
                  value={form.price_ngn || ""}
                  onChange={e => setForm(f => ({
                    ...f, price_ngn: Number(e.target.value),
                  }))}
                  placeholder="Total trip price"
                />
              </div>
              <div>
                <Label>Vehicle Type</Label>
                <Input
                  value={form.vehicle_type || ""}
                  onChange={e => setForm(f => ({
                    ...f, vehicle_type: e.target.value,
                  }))}
                  placeholder="e.g. 30-ton trailer"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Price Per Unit (₦)</Label>
                <Input
                  type="number"
                  value={form.price_per_unit_ngn ?? ""}
                  onChange={e => setForm(f => ({
                    ...f, price_per_unit_ngn: e.target.value ? Number(e.target.value) : null,
                  }))}
                  placeholder="Optional per-unit rate"
                />
              </div>
              <div>
                <Label>Unit Type</Label>
                <Input
                  value={form.unit_type || ""}
                  onChange={e => setForm(f => ({
                    ...f, unit_type: e.target.value,
                  }))}
                  placeholder="e.g. ton, bag, trip"
                />
              </div>
              <div>
                <Label>Minimum Charge (₦)</Label>
                <Input
                  type="number"
                  value={form.minimum_charge ?? ""}
                  onChange={e => setForm(f => ({
                    ...f, minimum_charge: e.target.value ? Number(e.target.value) : null,
                  }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <Label>Customer Name</Label>
              <Input
                value={form.customer_name || ""}
                onChange={e => setForm(f => ({
                  ...f, customer_name: e.target.value,
                }))}
                placeholder="Specific customer (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Effective From</Label>
                <Input
                  type="date"
                  value={form.effective_from || ""}
                  onChange={e => setForm(f => ({
                    ...f, effective_from: e.target.value,
                  }))}
                />
              </div>
              <div>
                <Label>Effective To</Label>
                <Input
                  type="date"
                  value={(form.effective_to as string) || ""}
                  onChange={e => setForm(f => ({
                    ...f, effective_to: e.target.value || null,
                  }))}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes || ""}
                onChange={e => setForm(f => ({
                  ...f, notes: e.target.value,
                }))}
                placeholder="Agreement details, special conditions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.rule_name || !form.destination}
            >
              {editingId ? "Update Rule" : "Save Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Rules
              </CardTitle>
              <CardDescription>
                Define route, vehicle and customer pricing agreements that auto-price waybills.
              </CardDescription>
            </div>
            <ExportButton
              filename="pricing-rules"
              rows={filteredRules}
              columns={[
                {
                  header: "Rule", accessor: r => r.rule_name,
                },
                {
                  header: "Origin", accessor: r => r.origin || "",
                },
                {
                  header: "Destination", accessor: r => r.destination,
                },
                {
                  header: "Vehicle Type", accessor: r => r.vehicle_type || "",
                },
                {
                  header: "Customer", accessor: r => r.customer_name || "",
                },
                {
                  header: "Mode", accessor: r => r.pricing_mode,
                },
                {
                  header: "Flat Price (NGN)", accessor: r => r.price_ngn,
                },
                {
                  header: "Per Unit (NGN)", accessor: r => r.price_per_unit_ngn ?? "",
                },
                {
                  header: "Unit", accessor: r => r.unit_type || "",
                },
                {
                  header: "Active", accessor: r => (r.is_active ? "Yes" : "No"),
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by rule, route, customer, vehicle type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={v => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-full md:w-[150px] bg-card/50 border-border/50"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                  {ruleActiveFilters > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5"
                    >
                      {ruleActiveFilters}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto"
                align="end"
              >
                <h4 className="text-xs font-medium text-foreground px-0.5">Only show pricing rules by...</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="pr-flt-veh"
                        checked={vehicleTypeEnabled}
                        onCheckedChange={c => setVehicleTypeEnabled(c === true)}
                      />
                      <Label
                        htmlFor="pr-flt-veh"
                        className="text-sm cursor-pointer"
                      >
                        Vehicle type
                      </Label>
                    </div>
                    <Select
                      value={vehicleTypeFilter}
                      onValueChange={setVehicleTypeFilter}
                      disabled={!vehicleTypeEnabled}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All vehicle types</SelectItem>
                        {vehicleTypeOptions.map(v => (
                          <SelectItem
                            key={v}
                            value={v}
                          >
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="pr-flt-mode"
                        checked={pricingModeEnabled}
                        onCheckedChange={c => setPricingModeEnabled(c === true)}
                      />
                      <Label
                        htmlFor="pr-flt-mode"
                        className="text-sm cursor-pointer"
                      >
                        Pricing mode
                      </Label>
                    </div>
                    <Select
                      value={pricingModeFilter}
                      onValueChange={v => setPricingModeFilter(v as typeof pricingModeFilter)}
                      disabled={!pricingModeEnabled}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All modes</SelectItem>
                        <SelectItem value="FLAT">Flat Rate</SelectItem>
                        <SelectItem value="PER_WEIGHT">Per Weight</SelectItem>
                        <SelectItem value="PER_DISTANCE">Per Distance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="per-unit-only"
                      checked={perUnitOnly}
                      onCheckedChange={c => setPerUnitOnly(c === true)}
                    />
                    <Label
                      htmlFor="per-unit-only"
                      className="text-sm cursor-pointer"
                    >
                      Has per-unit pricing
                    </Label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button className="flex-1">Apply</Button>
                  <Button
                    variant="outline"
                    onClick={resetRuleFilters}
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
                <TableHead>Rule</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Flat Price</TableHead>
                <TableHead className="text-right">Per Unit</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No pricing rules match these filters</p>
                        <p className="text-sm">Adjust filters or add a new pricing agreement</p>
                      </TableCell>
                    </TableRow>
                  )
                : filteredRules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.rule_name}</TableCell>
                      <TableCell className="text-sm">
                        {rule.origin
                          ? (
                              <span className="flex items-center gap-1">
                                {rule.origin}
                                {" "}
                                <ArrowRight className="h-3 w-3" />
                                {" "}
                                {rule.destination}
                              </span>
                            )
                          : rule.destination}
                      </TableCell>
                      <TableCell>{rule.vehicle_type || "—"}</TableCell>
                      <TableCell>{rule.customer_name || <span className="text-muted-foreground">Any</span>}</TableCell>
                      <TableCell className="text-right font-medium">{formatAmount(rule.price_ngn)}</TableCell>
                      <TableCell className="text-right text-sm">
                        {rule.price_per_unit_ngn ? `${formatAmount(rule.price_per_unit_ngn)}/${rule.unit_type || "unit"}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rule.effective_from
                          ? formatWithPattern(
                              rule.effective_from,
                              "dd MMM yy",
                            )
                          : "—"}
                        {rule.effective_to
                          ? ` → ${formatWithPattern(
                            rule.effective_to,
                            "dd MMM yy",
                          )}`
                          : ""}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={rule.is_active ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}
                        >
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              aria-label="Pricing rule actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44"
                          >
                            <DropdownMenuItem onClick={() => onUpdate(
                              rule.id,
                              { is_active: !rule.is_active } as Partial<PricingRule>,
                            )}
                            >
                              {rule.is_active
                                ? (
                                    <>
                                      <ToggleRight className="h-4 w-4 mr-2 text-success" />
                                      Deactivate
                                    </>
                                  )
                                : (
                                    <>
                                      <ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" />
                                      Activate
                                    </>
                                  )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(rule)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteConfirm(rule.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {deleteConfirm === rule.id && (
                          <AlertDialog
                            open={true}
                            onOpenChange={o => !o && setDeleteConfirm(null)}
                          >
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete pricing rule?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove "
                                  {rule.rule_name}
                                  ". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => {
                                    onDelete(rule.id);
                                    setDeleteConfirm(null);
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
